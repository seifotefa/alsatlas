import { randomUUID } from 'node:crypto';
import type { Categories, ConsentRecord, Contribution, ResearchRepository, Reward } from './research-store.js';
import { faucetMessage, rewardLamportsFromEnv, type ChainStatus, type SolanaRewardGateway } from './solana.js';

const SIGNATURE = /^[1-9A-HJ-NP-Za-km-z]{64,100}$/;
const USER_REF = /^demo-[a-z0-9-]{1,40}$/;
const REVIEW_NOTE = 'Administrative demo approval. This is not clinical or research verification.';

export class ServiceError extends Error {
  readonly details: Record<string, unknown>;
  constructor(message: string, readonly code: string, readonly httpStatus: number, details: Record<string, unknown> = {}) {
    super(message);
    this.details = details;
  }
}

export type PublicReward = {
  contributionId: string;
  recipientAddress: string | null;
  amountLamports: number;
  network: 'devnet';
  txSignature: string | null;
  txStatus: Reward['txStatus'];
  createdAt: string;
  confirmedAt: string | null;
  error: string | null;
  explorerUrl: string | null;
};

export type ClaimResult = PublicReward & { status: Reward['txStatus'] };

const locks = new Map<string, Promise<unknown>>();

function serialize<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  const run = previous.then(fn, fn);
  locks.set(key, run.then(() => undefined, () => undefined));
  return run;
}

export function explorerTxUrl(signature: string | null): string | null {
  if (!signature || !SIGNATURE.test(signature)) return null;
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function toPublicReward(reward: Reward | null): PublicReward | null {
  if (!reward) return null;
  return {
    contributionId: reward.contributionId,
    recipientAddress: reward.recipientAddress,
    amountLamports: reward.amountLamports,
    network: 'devnet',
    txSignature: reward.txSignature,
    txStatus: reward.txStatus,
    createdAt: reward.createdAt,
    confirmedAt: reward.confirmedAt,
    error: reward.error,
    explorerUrl: explorerTxUrl(reward.txSignature),
  };
}

export function parseUserRef(value: unknown): string {
  if (typeof value !== 'string' || !USER_REF.test(value)) {
    throw new ServiceError('Use the demo participant id. Do not send a name, email, or clinical identifier.', 'BAD_REQUEST', 400);
  }
  return value;
}

export function parseCategories(value: unknown): Categories {
  if (!value || typeof value !== 'object') throw new ServiceError('Choose the data categories to contribute.', 'BAD_REQUEST', 400);
  const source = value as Record<string, unknown>;
  for (const key of ['questions', 'movement', 'voice']) {
    if (source[key] !== undefined && typeof source[key] !== 'boolean') {
      throw new ServiceError('Data categories must be true or false.', 'BAD_REQUEST', 400);
    }
  }
  return { questions: source.questions === true, movement: source.movement === true, voice: source.voice === true };
}

export function selectRewardLamports(env: NodeJS.ProcessEnv, _body: unknown): number {
  return rewardLamportsFromEnv(env);
}

type Clock = { now: () => Date; sleep: (ms: number) => Promise<void>; confirmTimeoutMs: number; pollIntervalMs: number };

function clockOf(options: Partial<Clock> = {}): Clock {
  return {
    now: options.now ?? (() => new Date()),
    sleep: options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))),
    confirmTimeoutMs: options.confirmTimeoutMs ?? 25_000,
    pollIntervalMs: options.pollIntervalMs ?? 1_500,
  };
}

function errorText(error: unknown) {
  return (error instanceof Error ? error.message : String(error)).slice(0, 300);
}

export async function saveConsent(repo: ResearchRepository, body: Record<string, unknown>, now = new Date()) {
  const userRef = parseUserRef(body.userRef);
  const categories = parseCategories(body.categories);
  if (body.consent !== true && body.consent !== false) {
    throw new ServiceError('Research consent must be an explicit choice.', 'BAD_REQUEST', 400);
  }
  if (body.consent === true && !Object.values(categories).some(Boolean)) {
    throw new ServiceError('Choose at least one data category before consenting.', 'BAD_REQUEST', 400);
  }
  const record: ConsentRecord = {
    id: `consent_${randomUUID()}`,
    userRef,
    status: body.consent ? 'granted' : 'withdrawn',
    categories,
    createdAt: now.toISOString(),
  };
  await repo.addConsent(record);
  return record;
}

export async function submitContribution(repo: ResearchRepository, body: Record<string, unknown>, now = new Date()) {
  const userRef = parseUserRef(body.userRef);
  const categories = parseCategories(body.categories);
  if (body.consent !== true) throw new ServiceError('Explicit research consent is required before a contribution can be submitted.', 'CONSENT_REQUIRED', 409);
  if (body.synthetic !== true) throw new ServiceError('A labeled research contribution is required.', 'BAD_REQUEST', 400);
  if (!Object.values(categories).some(Boolean)) throw new ServiceError('Choose at least one data category.', 'BAD_REQUEST', 400);
  const consent = await repo.latestConsent(userRef);
  if (!consent || consent.status !== 'granted') {
    throw new ServiceError('Save research consent before submitting a contribution. Consent is optional and separate from using Atlas.', 'CONSENT_REQUIRED', 409);
  }
  for (const key of ['questions', 'movement', 'voice'] as const) {
    if (categories[key] && !consent.categories[key]) {
      throw new ServiceError('A selected category is not covered by the saved research consent.', 'CONSENT_REQUIRED', 409);
    }
  }
  const existing = (await repo.contributionsForUser(userRef)).find((item) => item.reviewStatus === 'submitted' || item.reviewStatus === 'approved');
  if (existing) {
    throw new ServiceError('A contribution is already on file.', 'CONTRIBUTION_EXISTS', 409, { contributionId: existing.id });
  }
  const contribution: Contribution = {
    id: `contrib_${randomUUID()}`,
    userRef,
    categories,
    consentStatus: 'granted',
    consentAt: consent.createdAt,
    reviewStatus: 'submitted',
    synthetic: true,
    createdAt: now.toISOString(),
    reviewedAt: null,
    reviewNote: null,
  };
  await repo.insertContribution(contribution);
  return contribution;
}

export async function approveContribution(repo: ResearchRepository, id: string, body: Record<string, unknown>, now = new Date()) {
  if (body.administrativeDemoApproval !== true) {
    throw new ServiceError('Administrative demo approval must be explicit. This action is not clinical verification.', 'BAD_REQUEST', 400);
  }
  const contribution = await repo.getContribution(id);
  if (!contribution) throw new ServiceError('Contribution not found.', 'NOT_FOUND', 404);
  if (contribution.reviewStatus === 'approved') return contribution;
  const approved: Contribution = {
    ...contribution,
    reviewStatus: 'approved',
    reviewedAt: now.toISOString(),
    reviewNote: REVIEW_NOTE,
  };
  await repo.saveContribution(approved);
  return approved;
}

async function waitForConfirmation(gateway: SolanaRewardGateway, signature: string, clock: Clock): Promise<'confirmed' | 'failed' | 'pending'> {
  const started = Date.now();
  for (;;) {
    const state: ChainStatus = await gateway.reconcile(signature);
    if (state === 'confirmed' || state === 'failed') return state;
    if (Date.now() - started >= clock.confirmTimeoutMs) return 'pending';
    await clock.sleep(clock.pollIntervalMs);
  }
}

async function markConfirmed(repo: ResearchRepository, reward: Reward, clock: Clock) {
  const saved: Reward = { ...reward, txStatus: 'confirmed', confirmedAt: clock.now().toISOString(), error: null, updatedAt: clock.now().toISOString() };
  await repo.saveReward(saved);
  return toClaimResult(saved);
}

function toClaimResult(reward: Reward): ClaimResult {
  const pub = toPublicReward(reward)!;
  return { ...pub, status: reward.txStatus };
}

function duplicateConfirmed(reward: Reward) {
  return new ServiceError('This contribution already has a confirmed devnet reward.', 'DUPLICATE_REWARD', 409, toPublicReward(reward)!);
}

function inProgress(reward: Reward) {
  return new ServiceError('A devnet reward transaction is already submitted for this contribution. It was not sent again.', 'REWARD_IN_PROGRESS', 409, toPublicReward(reward)!);
}

export async function claimReward(
  repo: ResearchRepository,
  gateway: SolanaRewardGateway,
  body: Record<string, unknown>,
  options: Partial<Clock> & { lamports?: number } = {},
) {
  const contributionId = String(body.contributionId || '');
  return serialize(`reward:${contributionId}`, () => claimOnce(repo, gateway, body, options));
}

async function claimOnce(
  repo: ResearchRepository,
  gateway: SolanaRewardGateway,
  body: Record<string, unknown>,
  options: Partial<Clock> & { lamports?: number },
): Promise<ClaimResult> {
  const clock = clockOf(options);
  const userRef = parseUserRef(body.userRef);
  const contributionId = String(body.contributionId || '');
  const recipient = typeof body.recipientAddress === 'string' ? body.recipientAddress.trim() : '';
  const contribution = await repo.getContribution(contributionId);
  if (!contribution || contribution.userRef !== userRef) throw new ServiceError('Contribution not found.', 'NOT_FOUND', 404);
  if (contribution.synthetic !== true) throw new ServiceError('This contribution is not eligible for the reward.', 'BAD_REQUEST', 400);
  const consent = await repo.latestConsent(userRef);
  if (!consent || consent.status !== 'granted') {
    throw new ServiceError('Research consent is required before a demo reward. Withdrawing consent stops an unclaimed reward.', 'CONSENT_REQUIRED', 409);
  }
  if (contribution.reviewStatus !== 'approved') {
    throw new ServiceError('Only an administratively approved contribution can receive a demo reward.', 'NOT_APPROVED', 409);
  }
  if (!gateway.validateAddress(recipient)) throw new ServiceError('Enter a valid Solana devnet wallet address. Atlas never accepts a seed phrase or private key.', 'INVALID_ADDRESS', 400);
  if (!gateway.rewardWalletAddress()) throw new ServiceError('The demo reward wallet is not configured on the server.', 'NOT_CONFIGURED', 503);

  const lamports = options.lamports ?? rewardLamportsFromEnv();
  let reward = await repo.getReward(contributionId);
  if (reward?.txStatus === 'confirmed') throw duplicateConfirmed(reward);

  if (reward?.txStatus === 'submitted' && reward.txSignature && reward.signedTransaction) {
    const resolved = await resolveSubmitted(repo, gateway, reward, clock);
    if (resolved.kind === 'done') return resolved.result;
    if (resolved.kind === 'stop') throw resolved.error;
    reward = resolved.reward;
  }

  let balance: number;
  try {
    balance = await gateway.balanceLamports();
  } catch {
    throw new ServiceError('Solana devnet RPC is unavailable. The reward was not submitted.', 'RPC', 503);
  }
  if (balance < lamports + 10_000) {
    throw new ServiceError(faucetMessage(gateway.rewardWalletAddress()), 'INSUFFICIENT_FUNDS', 409);
  }

  const signed = await gateway.signTransfer(recipient, lamports);
  const timestamp = clock.now().toISOString();
  const next: Reward = {
    id: reward?.id ?? `reward_${randomUUID()}`,
    contributionId,
    userRef,
    recipientAddress: recipient,
    amountLamports: lamports,
    network: 'devnet',
    txSignature: signed.signature,
    signedTransaction: signed.signedTransaction,
    txStatus: 'submitted',
    blockhash: signed.blockhash,
    lastValidBlockHeight: signed.lastValidBlockHeight,
    error: null,
    createdAt: reward?.createdAt ?? timestamp,
    confirmedAt: null,
    updatedAt: timestamp,
  };
  if (!reward || reward.txStatus === 'failed') {
    if (!reward) {
      const inserted = await repo.insertReward(next);
      if (inserted === 'exists') {
        const current = await repo.getReward(contributionId);
        if (current?.txStatus === 'confirmed') throw duplicateConfirmed(current);
        throw inProgress(current ?? next);
      }
    } else {
      await repo.saveReward(next);
    }
  } else {
    await repo.saveReward(next);
  }

  try {
    await gateway.broadcast(signed.signedTransaction);
  } catch (error) {
    const message = errorText(error);
    if (!/already been processed|AlreadyProcessed/i.test(message)) {
      const state = await gateway.reconcile(signed.signature).catch(() => 'unknown' as const);
      if (state === 'confirmed') return markConfirmed(repo, next, clock);
      if (state !== 'pending') {
        const failed: Reward = { ...next, txStatus: 'failed', error: message, updatedAt: clock.now().toISOString() };
        await repo.saveReward(failed);
        if (/insufficient/i.test(message)) throw new ServiceError(faucetMessage(gateway.rewardWalletAddress()), 'INSUFFICIENT_FUNDS', 409, toPublicReward(failed)!);
        throw new ServiceError(message, 'RPC', 502, toPublicReward(failed)!);
      }
    }
  }

  const finalState = await waitForConfirmation(gateway, signed.signature, clock);
  if (finalState === 'confirmed') return markConfirmed(repo, next, clock);
  if (finalState === 'failed') {
    const failed: Reward = { ...next, txStatus: 'failed', error: 'The devnet transaction failed.', updatedAt: clock.now().toISOString() };
    await repo.saveReward(failed);
    throw new ServiceError('The devnet transaction failed.', 'RPC', 502, toPublicReward(failed)!);
  }
  return toClaimResult(next);
}

async function resolveSubmitted(
  repo: ResearchRepository,
  gateway: SolanaRewardGateway,
  reward: Reward,
  clock: Clock,
): Promise<{ kind: 'done'; result: ClaimResult } | { kind: 'stop'; error: ServiceError } | { kind: 'retry'; reward: Reward }> {
  const state = await gateway.reconcile(reward.txSignature!);
  if (state === 'confirmed') return { kind: 'done', result: await markConfirmed(repo, reward, clock) };
  if (state === 'failed') {
    return { kind: 'retry', reward: await markFailed(repo, reward, 'The previous devnet transaction failed.', clock) };
  }
  if (state === 'pending') return { kind: 'stop', error: inProgress(reward) };

  const expired = reward.lastValidBlockHeight == null || await gateway.blockhashExpired(reward.lastValidBlockHeight);
  if (expired) {
    return { kind: 'retry', reward: await markFailed(repo, reward, 'The previous transaction expired before it was confirmed.', clock) };
  }

  try {
    await gateway.broadcast(reward.signedTransaction!);
  } catch (error) {
    const message = errorText(error);
    if (!/already been processed|AlreadyProcessed/i.test(message)) {
      const again = await gateway.reconcile(reward.txSignature!).catch(() => 'unknown' as const);
      if (again === 'confirmed') return { kind: 'done', result: await markConfirmed(repo, reward, clock) };
      if (again === 'pending') return { kind: 'stop', error: inProgress(reward) };
      if (/blockhash|expired/i.test(message)) {
        return { kind: 'retry', reward: await markFailed(repo, reward, 'The previous transaction expired before confirmation.', clock) };
      }
      const insufficient = /insufficient/i.test(message);
      return {
        kind: 'stop',
        error: new ServiceError(insufficient ? faucetMessage(gateway.rewardWalletAddress()) : message, insufficient ? 'INSUFFICIENT_FUNDS' : 'RPC', insufficient ? 409 : 502, toPublicReward(reward)!),
      };
    }
  }

  const finalState = await waitForConfirmation(gateway, reward.txSignature!, clock);
  if (finalState === 'confirmed') return { kind: 'done', result: await markConfirmed(repo, reward, clock) };
  if (finalState === 'failed') {
    const failed = await markFailed(repo, reward, 'The devnet transaction failed.', clock);
    return { kind: 'stop', error: new ServiceError('The devnet transaction failed.', 'RPC', 502, toPublicReward(failed)!) };
  }
  return { kind: 'done', result: toClaimResult(reward) };
}

async function markFailed(repo: ResearchRepository, reward: Reward, message: string, clock: Clock) {
  const failed: Reward = { ...reward, txStatus: 'failed', error: message, updatedAt: clock.now().toISOString() };
  await repo.saveReward(failed);
  return failed;
}

export async function participation(repo: ResearchRepository, userRef: string, env: NodeJS.ProcessEnv = process.env) {
  const parsed = parseUserRef(userRef);
  const consent = await repo.latestConsent(parsed);
  const contribution = (await repo.contributionsForUser(parsed))[0] ?? null;
  const reward = contribution ? await repo.getReward(contribution.id) : null;
  const publicReward = toPublicReward(reward);
  const eligible = contribution?.reviewStatus === 'approved' && consent?.status === 'granted' && publicReward?.txStatus !== 'confirmed' && publicReward?.txStatus !== 'submitted';
  return {
    userRef: parsed,
    storage: repo.storage,
    consent,
    contribution,
    reward: publicReward,
    eligible,
    rewardLamports: rewardLamportsFromEnv(env),
    network: 'devnet' as const,
    disclaimer: 'A fixed Solana transfer after review.',
  };
}

import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import bs58 from 'bs58';
import { FileResearchRepository, MemoryResearchRepository, type ResearchRepository } from './research-store.js';
import { approveContribution, claimReward, participation, saveConsent, submitContribution } from './research-service.js';
import { handleResearchApi } from './research-routes.js';
import { isValidSolanaAddress, type ChainStatus, type SolanaRewardGateway } from './solana.js';

const RECIPIENT = '11111111111111111111111111111111';
const clock = { confirmTimeoutMs: 0, pollIntervalMs: 0, sleep: async () => undefined };

function fakeGateway(state: {
  reconcile?: () => ChainStatus;
  expired?: boolean;
  balance?: number;
  broadcastError?: Error | null;
}) {
  const calls = { signs: [] as number[], broadcasts: 0 };
  let signatures = 0;
  const gateway: SolanaRewardGateway = {
    validateAddress: isValidSolanaAddress,
    rewardWalletAddress: () => 'RewardWallet11111111111111111111111111111111',
    async health() {
      return { status: 'connected', network: 'devnet', rpcUrlConfigured: true, signerConfigured: true, rewardWallet: 'RewardWallet', rewardLamports: 1_000_000, faucetUrl: 'https://faucet.solana.com' };
    },
    async balanceLamports() { return state.balance ?? 1_000_000_000; },
    async signTransfer(_recipient, lamports) {
      calls.signs.push(lamports);
      signatures += 1;
      return {
        signature: bs58.encode(Uint8Array.from({ length: 64 }, () => signatures)),
        signedTransaction: Buffer.from(`signed-${signatures}`).toString('base64'),
        blockhash: `blockhash-${signatures}`,
        lastValidBlockHeight: 100,
      };
    },
    async broadcast() {
      calls.broadcasts += 1;
      if (state.broadcastError) throw state.broadcastError;
    },
    async reconcile() { return state.reconcile?.() ?? 'confirmed'; },
    async blockhashExpired() { return state.expired ?? false; },
  };
  return { gateway, calls };
}

async function approved(repo: ResearchRepository, userRef = 'demo-alex-chen') {
  await saveConsent(repo, { userRef, consent: true, categories: { questions: true, movement: false, voice: false } });
  const contribution = await submitContribution(repo, {
    userRef,
    consent: true,
    synthetic: true,
    categories: { questions: true, movement: false, voice: false },
    alsfrs: 32,
    symptoms: 'should-not-be-stored',
    patientName: 'Alex Chen',
  });
  await approveContribution(repo, contribution.id, { administrativeDemoApproval: true });
  return contribution;
}

test('validates Solana addresses and ignores client reward amounts', async () => {
  assert.equal(isValidSolanaAddress(RECIPIENT), true);
  assert.equal(isValidSolanaAddress('not an address'), false);
  assert.equal(isValidSolanaAddress('0OIl111111111111111111111111111111'), false);
  const repo = new MemoryResearchRepository();
  const contribution = await approved(repo);
  const { gateway, calls } = fakeGateway({});
  const response = await handleResearchApi({
    method: 'POST',
    pathname: `/api/research/contributions/${contribution.id}/claim`,
    query: new URLSearchParams(),
    body: { userRef: 'demo-alex-chen', recipientAddress: RECIPIENT, amountLamports: 5_000_000_000 },
    repo,
    gateway,
    env: { SOLANA_REWARD_LAMPORTS: '1000000' },
  });
  assert.equal(response?.status, 200);
  assert.equal(calls.signs[0], 1_000_000);
  assert.equal((response?.body as { amountLamports: number }).amountLamports, 1_000_000);
  const body = response?.body as { explorerUrl: string; txSignature: string };
  assert.equal(body.explorerUrl, `https://explorer.solana.com/tx/${body.txSignature}?cluster=devnet`);
});

test('rejects reward claims that are not approved and duplicate confirmed claims', async () => {
  const repo = new MemoryResearchRepository();
  await saveConsent(repo, { userRef: 'demo-alex-chen', consent: true, categories: { questions: true, movement: true, voice: false } });
  const contribution = await submitContribution(repo, { userRef: 'demo-alex-chen', consent: true, synthetic: true, categories: { questions: true, movement: false, voice: false } });
  const { gateway, calls } = fakeGateway({});
  await assert.rejects(
    claimReward(repo, gateway, { contributionId: contribution.id, userRef: 'demo-alex-chen', recipientAddress: RECIPIENT }, { lamports: 1_000_000, ...clock }),
    /administratively approved/,
  );
  assert.equal(calls.signs.length, 0);
  await approveContribution(repo, contribution.id, { administrativeDemoApproval: false }).catch(() => undefined);
  await approveContribution(repo, contribution.id, { administrativeDemoApproval: true });
  await claimReward(repo, gateway, { contributionId: contribution.id, userRef: 'demo-alex-chen', recipientAddress: RECIPIENT }, { lamports: 1_000_000, ...clock });
  await assert.rejects(
    claimReward(repo, gateway, { contributionId: contribution.id, userRef: 'demo-alex-chen', recipientAddress: RECIPIENT }, { lamports: 1_000_000, ...clock }),
    /already has a confirmed/,
  );
  assert.equal(calls.signs.length, 1);
  assert.equal(calls.broadcasts, 1);
});

test('serializes repeated clicks and reconciles a timed-out transaction before another transfer', async () => {
  const repo = new MemoryResearchRepository();
  const contribution = await approved(repo, 'demo-timeout');
  let reconciles = 0;
  const { gateway, calls } = fakeGateway({ reconcile: () => (reconciles++ === 0 ? 'unknown' : 'confirmed') });
  const first = await claimReward(repo, gateway, { contributionId: contribution.id, userRef: 'demo-timeout', recipientAddress: RECIPIENT }, { lamports: 1_000_000, ...clock });
  assert.equal(first.txStatus, 'submitted');
  const second = await claimReward(repo, gateway, { contributionId: contribution.id, userRef: 'demo-timeout', recipientAddress: RECIPIENT }, { lamports: 1_000_000, ...clock });
  assert.equal(second.txStatus, 'confirmed');
  assert.equal(second.txSignature, first.txSignature);
  assert.equal(calls.signs.length, 1);

  const pendingRepo = new MemoryResearchRepository();
  const pendingContribution = await approved(pendingRepo, 'demo-pending');
  const pending = fakeGateway({ reconcile: () => 'pending' });
  await claimReward(pendingRepo, pending.gateway, { contributionId: pendingContribution.id, userRef: 'demo-pending', recipientAddress: RECIPIENT }, { lamports: 1_000_000, ...clock });
  await assert.rejects(
    claimReward(pendingRepo, pending.gateway, { contributionId: pendingContribution.id, userRef: 'demo-pending', recipientAddress: RECIPIENT }, { lamports: 1_000_000, ...clock }),
    /was not sent again/,
  );
  assert.equal(pending.calls.signs.length, 1);

  const [left, right] = await Promise.allSettled([
    claimReward(repo, gateway, { contributionId: contribution.id, userRef: 'demo-timeout', recipientAddress: RECIPIENT }, { lamports: 1_000_000, ...clock }),
    claimReward(repo, gateway, { contributionId: contribution.id, userRef: 'demo-timeout', recipientAddress: RECIPIENT }, { lamports: 1_000_000, ...clock }),
  ]);
  assert.equal(left.status, 'rejected');
  assert.equal(right.status, 'rejected');
  assert.equal(calls.signs.length, 1);
});

test('replaces only an expired unconfirmed transaction and keeps clinical fields off the record', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'als-rewards-'));
  const repo = new FileResearchRepository(path.join(directory, 'rewards.json'));
  const contribution = await approved(repo, 'demo-file');
  const stored = JSON.parse(await readFile(path.join(directory, 'rewards.json'), 'utf8')) as { contributions: Array<Record<string, unknown>> };
  assert.equal('alsfrs' in stored.contributions[0], false);
  assert.equal('symptoms' in stored.contributions[0], false);
  assert.equal('patientName' in stored.contributions[0], false);
  const { gateway, calls } = fakeGateway({ reconcile: () => 'unknown', expired: true });
  await claimReward(repo, gateway, { contributionId: contribution.id, userRef: 'demo-file', recipientAddress: RECIPIENT }, { lamports: 1_000_000, ...clock });
  const retried = await claimReward(repo, gateway, { contributionId: contribution.id, userRef: 'demo-file', recipientAddress: RECIPIENT }, { lamports: 1_000_000, ...clock });
  assert.equal(calls.signs.length, 2);
  const reloaded = new FileResearchRepository(path.join(directory, 'rewards.json'));
  const snapshot = await participation(reloaded, 'demo-file', { SOLANA_REWARD_LAMPORTS: '1000000' });
  assert.equal(snapshot.reward?.txSignature, retried.txSignature);
  assert.equal(JSON.stringify(snapshot).includes('signedTransaction'), false);
  assert.equal(snapshot.storage, 'file');
});

test('stops before signing when funds are low, the address is invalid, or consent was withdrawn', async () => {
  const repo = new MemoryResearchRepository();
  const contribution = await approved(repo);
  const poor = fakeGateway({ balance: 1 });
  await assert.rejects(
    claimReward(repo, poor.gateway, { contributionId: contribution.id, userRef: 'demo-alex-chen', recipientAddress: RECIPIENT }, { lamports: 1_000_000, ...clock }),
    /faucet\.solana\.com/,
  );
  assert.equal(poor.calls.signs.length, 0);
  assert.equal(await repo.getReward(contribution.id), null);
  const { gateway } = fakeGateway({});
  await assert.rejects(
    claimReward(repo, gateway, { contributionId: contribution.id, userRef: 'demo-alex-chen', recipientAddress: 'seed phrase goes here' }, { lamports: 1_000_000, ...clock }),
    /seed phrase/,
  );
  await saveConsent(repo, { userRef: 'demo-alex-chen', consent: false, categories: { questions: false, movement: false, voice: false } });
  await assert.rejects(
    claimReward(repo, gateway, { contributionId: contribution.id, userRef: 'demo-alex-chen', recipientAddress: RECIPIENT }, { lamports: 1_000_000, ...clock }),
    /consent/i,
  );
});

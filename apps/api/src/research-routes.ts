import { createRepository, type ResearchRepository } from './research-store.js';
import { approveContribution, claimReward, participation, saveConsent, selectRewardLamports, ServiceError, submitContribution, toPublicReward } from './research-service.js';
import { createSolanaGateway, type SolanaRewardGateway } from './solana.js';

export type ResearchRuntime = {
  repo: ResearchRepository;
  gateway: SolanaRewardGateway;
  health: () => ReturnType<SolanaRewardGateway['health']>;
  handle: (method: string, url: URL, body: unknown) => Promise<{ status: number; body: unknown } | null>;
};

export function createResearchRuntime(env: NodeJS.ProcessEnv = process.env): ResearchRuntime {
  const repo = createRepository(env);
  const gateway = createSolanaGateway(env);
  return {
    repo,
    gateway,
    health: () => gateway.health(),
    handle: (method, url, requestBody) => handleResearchApi({ method, pathname: url.pathname, query: url.searchParams, body: requestBody, repo, gateway, env }),
  };
}

export async function handleResearchApi(args: {
  method: string;
  pathname: string;
  query: URLSearchParams;
  body: unknown;
  repo: ResearchRepository;
  gateway: SolanaRewardGateway;
  env?: NodeJS.ProcessEnv;
}): Promise<{ status: number; body: unknown } | null> {
  const { method, pathname, query, repo, gateway } = args;
  const env = args.env ?? process.env;
  const body = (args.body && typeof args.body === 'object' ? args.body : {}) as Record<string, unknown>;
  try {
    if (method === 'GET' && pathname === '/api/integrations/solana/status') {
      const health = await gateway.health();
      return { status: health.status === 'unavailable' ? 503 : 200, body: health };
    }
    if (method === 'GET' && pathname === '/api/research/participation') {
      return { status: 200, body: await participation(repo, String(query.get('userRef') || ''), env) };
    }
    if (method === 'POST' && pathname === '/api/research/consent') {
      return { status: 201, body: await saveConsent(repo, body) };
    }
    if (method === 'POST' && pathname === '/api/research/contributions') {
      return { status: 201, body: await submitContribution(repo, body) };
    }
    const match = pathname.match(/^\/api\/research\/contributions\/(contrib_[A-Za-z0-9-]{10,80})(?:\/(approve|claim))?$/);
    if (match && method === 'GET' && !match[2]) {
      const contribution = await repo.getContribution(match[1]);
      if (!contribution) return { status: 404, body: { error: 'Contribution not found.', code: 'NOT_FOUND' } };
      const reward = await repo.getReward(contribution.id);
      return { status: 200, body: { contribution, reward: toPublicReward(reward) } };
    }
    if (match && method === 'POST' && match[2] === 'approve') {
      return { status: 200, body: await approveContribution(repo, match[1], body) };
    }
    if (match && method === 'POST' && match[2] === 'claim') {
      const result = await claimReward(repo, gateway, { ...body, contributionId: match[1] }, { lamports: selectRewardLamports(env, body) });
      return { status: 200, body: result };
    }
    return null;
  } catch (error) {
    if (error instanceof ServiceError) {
      return { status: error.httpStatus, body: { error: error.message, code: error.code, ...error.details } };
    }
    console.error('research route failed');
    const message = error instanceof Error ? error.message : '';
    if (/SOLANA_REWARD_LAMPORTS|Only Solana devnet/.test(message)) {
      return { status: 500, body: { error: message, code: 'NOT_CONFIGURED' } };
    }
    if (/ECONNREFUSED|password authentication|timeout|connect/i.test(message)) {
      return { status: 503, body: { error: 'Tiger Data is unavailable.', code: 'STORAGE' } };
    }
    return { status: 500, body: { error: 'Unexpected server error.', code: 'INTERNAL' } };
  }
}

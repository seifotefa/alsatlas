import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';

export const DEFAULT_REWARD_LAMPORTS = 1_000_000;
export const FEE_BUFFER_LAMPORTS = 10_000;
export const FAUCET_URL = 'https://faucet.solana.com';

export type SolanaHealth = {
  status: 'connected' | 'unavailable' | 'unconfigured';
  network: 'devnet';
  rpcUrlConfigured: boolean;
  signerConfigured: boolean;
  rewardWallet: string | null;
  rewardLamports: number;
  slot?: number;
  solanaCore?: string;
  rewardWalletLamports?: number | null;
  needsFunding?: boolean;
  faucetUrl: string;
  fundingInstructions?: string | null;
  error?: string;
};

export type SignedTransfer = {
  signature: string;
  signedTransaction: string;
  blockhash: string;
  lastValidBlockHeight: number;
};

export type ChainStatus = 'confirmed' | 'failed' | 'pending' | 'unknown';

export interface SolanaRewardGateway {
  validateAddress(address: string): boolean;
  rewardWalletAddress(): string | null;
  health(): Promise<SolanaHealth>;
  balanceLamports(): Promise<number>;
  signTransfer(recipient: string, lamports: number): Promise<SignedTransfer>;
  broadcast(signedTransactionBase64: string): Promise<void>;
  reconcile(signature: string): Promise<ChainStatus>;
  blockhashExpired(lastValidBlockHeight: number): Promise<boolean>;
}

export function rewardLamportsFromEnv(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.SOLANA_REWARD_LAMPORTS?.trim();
  const lamports = raw ? Number(raw) : DEFAULT_REWARD_LAMPORTS;
  if (!Number.isInteger(lamports) || lamports <= 0 || lamports > 10_000_000) {
    throw new Error('SOLANA_REWARD_LAMPORTS must be a positive integer no greater than 10000000 (0.01 SOL).');
  }
  return lamports;
}

export function faucetMessage(wallet: string | null) {
  const target = wallet ? ` (${wallet})` : '';
  return `The demo reward wallet${target} needs devnet SOL. The public RPC airdrop is closed. Sign in at ${FAUCET_URL} with GitHub, choose Devnet, and request SOL for this address. Devnet SOL has no monetary value.`;
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    const key = new PublicKey(address);
    return Buffer.from(key.toBytes()).length === 32;
  } catch {
    return false;
  }
}

function assertDevnet(env: NodeJS.ProcessEnv) {
  const network = (env.SOLANA_NETWORK || 'devnet').trim().toLowerCase();
  const rpc = env.SOLANA_RPC_URL?.trim().toLowerCase() || '';
  if (network !== 'devnet' || rpc.includes('mainnet')) {
    throw new Error('Only Solana devnet is allowed for demonstration rewards.');
  }
}

function loadKeypair(secret: string | undefined): Keypair | null {
  const raw = secret?.trim();
  if (!raw) return null;
  try {
    const bytes = raw.startsWith('[') ? Uint8Array.from(JSON.parse(raw) as number[]) : bs58.decode(raw);
    return Keypair.fromSecretKey(bytes);
  } catch {
    return null;
  }
}

export function createSolanaGateway(env: NodeJS.ProcessEnv = process.env): SolanaRewardGateway {
  const rpcUrl = env.SOLANA_RPC_URL?.trim() || '';
  const keypair = loadKeypair(env.SOLANA_REWARD_SECRET_KEY);
  const secretConfigured = Boolean(env.SOLANA_REWARD_SECRET_KEY?.trim());
  let connection: Connection | null = null;

  const requireReady = () => {
    assertDevnet(env);
    if (!rpcUrl) throw new Error('SOLANA_RPC_URL is not configured.');
    if (!keypair) {
      throw new Error(secretConfigured ? 'SOLANA_REWARD_SECRET_KEY is invalid.' : 'SOLANA_REWARD_SECRET_KEY is not configured.');
    }
    connection ??= new Connection(rpcUrl, 'confirmed');
    return { connection, keypair };
  };

  return {
    validateAddress: isValidSolanaAddress,
    rewardWalletAddress() {
      return keypair?.publicKey.toBase58() ?? null;
    },
    async health() {
      let rewardLamports = DEFAULT_REWARD_LAMPORTS;
      try {
        rewardLamports = rewardLamportsFromEnv(env);
      } catch (error) {
        return {
          status: 'unavailable',
          network: 'devnet',
          rpcUrlConfigured: Boolean(rpcUrl),
          signerConfigured: Boolean(keypair),
          rewardWallet: keypair?.publicKey.toBase58() ?? null,
          rewardLamports,
          faucetUrl: FAUCET_URL,
          error: error instanceof Error ? error.message : 'Invalid reward configuration.',
        };
      }
      const base: SolanaHealth = {
        status: 'unconfigured',
        network: 'devnet',
        rpcUrlConfigured: Boolean(rpcUrl),
        signerConfigured: Boolean(keypair),
        rewardWallet: keypair?.publicKey.toBase58() ?? null,
        rewardLamports,
        faucetUrl: FAUCET_URL,
      };
      const network = (env.SOLANA_NETWORK || 'devnet').trim().toLowerCase();
      if (network !== 'devnet' || rpcUrl.toLowerCase().includes('mainnet')) {
        return { ...base, status: 'unavailable', error: 'Only Solana devnet is allowed for demonstration rewards.' };
      }
      if (!rpcUrl) return { ...base, status: 'unconfigured', error: 'Set SOLANA_RPC_URL to a devnet endpoint.' };
      if (secretConfigured && !keypair) return { ...base, status: 'unavailable', error: 'SOLANA_REWARD_SECRET_KEY is invalid.' };
      try {
        const rpc = new Connection(rpcUrl, 'confirmed');
        const [slot, version] = await Promise.all([rpc.getSlot('confirmed'), rpc.getVersion()]);
        let rewardWalletLamports: number | null = null;
        if (keypair) rewardWalletLamports = await rpc.getBalance(keypair.publicKey, 'confirmed');
        const needsFunding = rewardWalletLamports !== null && rewardWalletLamports < rewardLamports + FEE_BUFFER_LAMPORTS;
        return {
          ...base,
          status: 'connected',
          slot,
          solanaCore: version['solana-core'],
          rewardWalletLamports,
          needsFunding,
          fundingInstructions: needsFunding || !keypair ? faucetMessage(base.rewardWallet) : null,
        };
      } catch (error) {
        return { ...base, status: 'unavailable', error: error instanceof Error ? error.message : 'Solana devnet RPC request failed.' };
      }
    },
    async balanceLamports() {
      const ready = requireReady();
      return ready.connection.getBalance(ready.keypair.publicKey, 'confirmed');
    },
    async signTransfer(recipient: string, lamports: number) {
      const ready = requireReady();
      if (!isValidSolanaAddress(recipient)) throw new Error('Recipient is not a valid Solana address.');
      if (!Number.isInteger(lamports) || lamports <= 0) throw new Error('Reward amount is invalid.');
      const { blockhash, lastValidBlockHeight } = await ready.connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction({ feePayer: ready.keypair.publicKey, blockhash, lastValidBlockHeight });
      transaction.add(SystemProgram.transfer({
        fromPubkey: ready.keypair.publicKey,
        toPubkey: new PublicKey(recipient),
        lamports,
      }));
      transaction.sign(ready.keypair);
      if (!transaction.signature) throw new Error('Failed to sign the devnet reward transaction.');
      return {
        signature: bs58.encode(transaction.signature),
        signedTransaction: Buffer.from(transaction.serialize()).toString('base64'),
        blockhash,
        lastValidBlockHeight,
      };
    },
    async broadcast(signedTransactionBase64: string) {
      const ready = requireReady();
      await ready.connection.sendRawTransaction(Buffer.from(signedTransactionBase64, 'base64'), {
        skipPreflight: false,
        maxRetries: 2,
      });
    },
    async reconcile(signature: string): Promise<ChainStatus> {
      const ready = requireReady();
      const response = await ready.connection.getSignatureStatuses([signature], { searchTransactionHistory: true });
      const info = response.value[0];
      if (!info) return 'unknown';
      if (info.err) return 'failed';
      if (info.confirmationStatus === 'confirmed' || info.confirmationStatus === 'finalized') return 'confirmed';
      return 'pending';
    },
    async blockhashExpired(lastValidBlockHeight: number) {
      const ready = requireReady();
      const height = await ready.connection.getBlockHeight('confirmed');
      return height > lastValidBlockHeight;
    },
  };
}

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { loadEnvFile } from './load-env.js';
import { createSolanaGateway, FAUCET_URL, faucetMessage } from './solana.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const envPath = path.join(root, '.env');
loadEnvFile(envPath);

function upsert(key: string, value: string) {
  const current = existsSync(envPath) ? readFileSync(envPath, 'utf8') : readFileSync(path.join(root, '.env.example'), 'utf8');
  const line = `${key}=${value}`;
  const next = new RegExp(`^${key}=`, 'm').test(current)
    ? current.replace(new RegExp(`^${key}=.*$`, 'm'), line)
    : `${current.trim()}\n${line}\n`;
  writeFileSync(envPath, next.endsWith('\n') ? next : `${next}\n`);
  process.env[key] = value;
}

if (!process.env.SOLANA_RPC_URL) upsert('SOLANA_RPC_URL', 'https://api.devnet.solana.com');
if (!process.env.SOLANA_NETWORK) upsert('SOLANA_NETWORK', 'devnet');
if (!process.env.SOLANA_REWARD_LAMPORTS) upsert('SOLANA_REWARD_LAMPORTS', '1000000');
if (!process.env.SOLANA_REWARD_SECRET_KEY) {
  upsert('SOLANA_REWARD_SECRET_KEY', bs58.encode(Keypair.generate().secretKey));
  console.log('Created a server-side devnet reward wallet in .env.');
}

const gateway = createSolanaGateway(process.env);
const wallet = gateway.rewardWalletAddress();
if (!wallet) {
  console.error('The reward wallet secret could not be loaded.');
  process.exit(1);
}
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
const publicKey = new PublicKey(wallet);
console.log(`Reward wallet: ${wallet}`);
let balance = await connection.getBalance(publicKey, 'confirmed');
console.log(`Balance: ${balance} lamports`);
if (balance < 50_000_000) {
  try {
    console.log('Requesting 1 SOL from the devnet airdrop.');
    const signature = await connection.requestAirdrop(publicKey, 1_000_000_000);
    const latest = await connection.getLatestBlockhash('confirmed');
    await connection.confirmTransaction({ signature, ...latest }, 'confirmed');
    balance = await connection.getBalance(publicKey, 'confirmed');
    console.log(`Airdrop confirmed: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    console.log(`Balance: ${balance} lamports`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error('The devnet RPC airdrop is unavailable. Use the website faucet, which requires GitHub sign-in.');
    console.error(faucetMessage(wallet));
    console.error(`Faucet: ${FAUCET_URL}`);
    process.exit(1);
  }
}
const health = await gateway.health();
console.log(`RPC status: ${health.status}${health.slot ? ` at slot ${health.slot}` : ''}`);

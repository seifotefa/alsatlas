import { describe, expect, it } from 'vitest';
import { isSolanaAddress } from './solana-address';

describe('Solana address validation', () => {
  it('accepts a 32-byte base58 address and rejects private-key prompts', () => {
    expect(isSolanaAddress('11111111111111111111111111111111')).toBe(true);
    expect(isSolanaAddress('seed phrase')).toBe(false);
    expect(isSolanaAddress('0OIl111111111111111111111111111111')).toBe(false);
    expect(isSolanaAddress('')).toBe(false);
  });
});

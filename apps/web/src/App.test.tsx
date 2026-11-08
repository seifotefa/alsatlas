import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ALSense MVP', () => {
  it('shows the research disclosure', () => {
    render(<App />);
    expect(screen.getByText(/research prototype/i)).toBeInTheDocument();
    expect(screen.getByText(/does not diagnose ALS/i)).toBeInTheDocument();
  });

  it('opens the research reward disclosure', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/integrations/solana/status')) {
        return { ok: true, json: async () => ({ status: 'connected', network: 'devnet', rewardLamports: 1_000_000, slot: 42 }) };
      }
      return { ok: true, json: async () => ({ consent: null, contribution: null, reward: null, rewardLamports: 1_000_000, storage: 'file', network: 'devnet' }) };
    }));
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /view research network/i })[0]);
    expect(await screen.findByText('Solana devnet demonstration reward — no monetary value.')).toBeInTheDocument();
  });
});

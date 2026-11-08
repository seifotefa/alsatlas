import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ALSense MVP', () => {
  it('opens the product without calling the record a prototype', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /clearer ALS journey/i })).toBeInTheDocument();
    expect(screen.queryByText(/research prototype/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/fictional/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/synthetic/i)).not.toBeInTheDocument();
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
    fireEvent.click(screen.getByRole('button', { name: 'Research' }));
    expect(await screen.findByRole('heading', { name: /self-improving dataset for ALS/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /explore the network/i }));
    expect(await screen.findByRole('heading', { name: 'University desk' })).toBeInTheDocument();
    expect(screen.getByText('Dr. Priya Shah')).toBeInTheDocument();
    expect(screen.getByText('Virtual follow-up')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Available to approved researchers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Solana reward' })).toBeInTheDocument();
    expect(screen.queryByText(/does not connect/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/synthetic/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Alex Chen')).not.toBeInTheDocument();
  });
});

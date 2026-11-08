# Solana devnet research rewards

ALS Atlas can record an optional, synthetic research contribution and, after a clearly labeled administrative demo approval, send a small SOL transfer on Solana devnet. The transfer is a demonstration of a participation incentive. It is not payment for medical data and has no monetary value.

Clinical observations, names, scores, reports, and contribution identifiers stay in the off-chain Atlas record. The chain transaction is an ordinary SOL transfer with no memo.

## Architecture

1. The Research page collects category choices and a separate consent choice.
2. `POST /api/research/contributions` stores a synthetic contribution. Consent must already be saved.
3. `POST /api/research/contributions/:id/approve` with `administrativeDemoApproval: true` marks the row approved. The stored note says this is not clinical or research verification.
4. `POST /api/research/contributions/:id/claim` checks approval, current consent, and the recipient address. The server chooses the amount, signs with `SOLANA_REWARD_SECRET_KEY`, stores the signature, submits the signed transaction to devnet, and waits for confirmation.
5. A confirmed signature is saved with status `confirmed`. A timeout leaves status `submitted`. The next claim reconciles that signature before any new transfer is created. One contribution has one reward row.

Tiger Data is used when `TIGERDATA_DATABASE_URL` is set. Otherwise the same records are stored in `data/runtime/research-rewards.json`.

## Environment variables

| Name | Purpose |
| --- | --- |
| `SOLANA_RPC_URL` | Devnet RPC URL. `https://api.devnet.solana.com` is the public default. |
| `SOLANA_NETWORK` | Must be `devnet`. Mainnet RPC URLs are refused. |
| `SOLANA_REWARD_SECRET_KEY` | Server-only reward wallet. Base58 secret key or a JSON byte array. |
| `SOLANA_REWARD_LAMPORTS` | Fixed reward. Default `1000000` (0.001 SOL). Maximum `10000000`. |
| `TIGERDATA_DATABASE_URL` | Optional Postgres/Tiger Data connection string. |
| `RESEARCH_STORE_PATH` | Optional override for the file store. |
| `PORT` | API port, default `8787`. |

Copy `.env.example` to `.env`. Never commit `.env`.

## Wallet setup and devnet funding

From the repository root:

```bash
npm run dev:api
```

In another terminal:

```bash
npm --workspace @alsense/api run solana:setup
```

The setup command creates a reward wallet in `.env` when one is missing and prints its public address. It then tries the devnet RPC airdrop. As of November 2026 that airdrop returns `410 Gone`: the cluster faucet is closed. Fund the printed address at [https://faucet.solana.com](https://faucet.solana.com):

1. Sign in with GitHub.
2. Choose Devnet.
3. Paste the reward wallet address and request SOL.
4. Run `npm --workspace @alsense/api run solana:setup` again. It skips creation when a key already exists and prints the new balance.

The participant pastes their own devnet address on the Research page. Atlas does not ask for a seed phrase or private key. A browser-wallet adapter is not required.

## API endpoints

- `GET /api/health` includes `solanaDevnet`, from a live `getSlot` and `getVersion` call.
- `GET /api/integrations/solana/status` returns the same live devnet check, reward wallet, balance, and funding instructions.
- `GET /api/research/participation?userRef=demo-alex-chen`
- `POST /api/research/consent` with `{ userRef, consent, categories }`
- `POST /api/research/contributions` with `{ userRef, consent: true, synthetic: true, categories }`
- `POST /api/research/contributions/:id/approve` with `{ administrativeDemoApproval: true }`
- `POST /api/research/contributions/:id/claim` with `{ userRef, recipientAddress }`
- `GET /api/research/contributions/:id`

`userRef` must look like `demo-alex-chen`. The claim body cannot set the amount. A second claim after confirmation returns HTTP 409 `DUPLICATE_REWARD` and the existing signature. A claim while a transaction is still pending returns HTTP 409 `REWARD_IN_PROGRESS` and does not create another transfer.

Explorer links use the signature returned by devnet:

`https://explorer.solana.com/tx/{signature}?cluster=devnet`

## Run the demo

```bash
npm install
npm --workspace @alsense/api run solana:setup
npm run dev
```

Open the app, choose **View research network** or the Research tab, then:

1. Leave at least one category selected.
2. Check the research consent box and save consent.
3. Submit the synthetic contribution.
4. Choose **Administrative demo approval**.
5. Paste a devnet wallet address and choose **Claim reward**.
6. Wait until the status is confirmed and open the Solana Explorer link.
7. Refresh the page. The same signature remains.
8. Choose **Claim reward** again. Atlas rejects the duplicate.

The Research page states: “Solana devnet demonstration reward — no monetary value.”

## Verify a transaction

Use the signature saved in Atlas, not a hand-written one.

```bash
curl https://api.devnet.solana.com -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getTransaction","params":["SIGNATURE",{"encoding":"json","commitment":"confirmed","maxSupportedTransactionVersion":0}]}'
```

A confirmed reward has `txStatus: "confirmed"` in `GET /api/research/participation` and a matching Explorer page on the devnet cluster. The transaction should be a system transfer only.

Automated checks:

```bash
npm run test:api
npm run test:web
```

## Known limitations

- Devnet SOL only. There is no SPL token, NFT, DAO, or program.
- The reward wallet key is a demo secret in local `.env`, not a production custody setup.
- Approval is a manual demo button. It does not review clinical quality.
- The duplicate-claim lock is in-process, with a unique contribution-to-reward row underneath it.
- Public devnet RPC and faucet endpoints are rate-limited.
- File storage is the fallback when Tiger Data is not configured. Check-ins keep their existing Tiger Data behavior.
- No patient identifiers or contribution ids are written on-chain, so the chain by itself cannot be joined back to a medical record.

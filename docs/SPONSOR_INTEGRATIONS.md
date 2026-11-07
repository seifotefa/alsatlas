# Sponsor integrations

| Service | Purpose | Environment | Current evidence | Status / user action |
|---|---|---|---|---|
| Gemini | Grounded text response from synthetic patient facts | `GEMINI_API_KEY` | API route exists; falls back only with disclosure | Demo-ready; add key and run smoke test |
| ElevenLabs | Text-to-speech output | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | `/api/voice/tts` returns 501 without key | TTS partial; add credentials and verify playback |
| Tiger Data | Longitudinal persistence | `TIGERDATA_DATABASE_URL` | Check-in route attempts TLS PostgreSQL table creation | Partial; provision DB, migrate schema, test refresh persistence |
| Solana devnet | De-identified contribution receipts only | `SOLANA_RPC_URL` | Health check route exists | Demo-ready; configure RPC and verify connectivity |
| Vultr | Container hosting | deployment config | `Dockerfile` and `vultr-deploy.yaml` present | Deployment-ready; deploy and verify logs |

No API keys, promo codes, billing claims, or connection strings are stored in the repository. Promotional credits are not confirmed by source control and require the account owner to verify them.

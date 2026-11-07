# ALS Atlas functional audit

Audit date: 2026-11-07. The app is a Vite/React frontend with a native Node HTTP API. The demo profile is synthetic (`demo-alex-chen`).

| Area | Current implementation | Actual status | Verification / gap |
|---|---|---|---|
| Landing paths | Buttons switch to survey, care space, or research | working | Browser route smoke test |
| Shared navigation | React state switches Overview, Check-in, Progress, Referral, Research, Care | working | Browser route smoke test |
| Check-in save | POST `/api/checkins`; API stores in Tiger Data only when configured, otherwise memory response | partial | Needs GET/reload retrieval and persistent default store |
| Camera capture | Previously decorative; no media permission or preview | broken | Implement `getUserMedia`, capture, retake, cancel, upload status |
| Referral report | POST `/api/referrals` returns simulated JSON; no PDF | partial | Needs saved intake, ReferALS mapping, PDF generation |
| Research consent | Local React state only | partial | Needs consent persistence and retrieval |
| Care circle | Static members in frontend | partial | API GET/POST exists; UI does not load/add members |
| Ask Atlas | POST `/api/chat`, grounded demo facts, optional Gemini | partial | Text chat works; voice input is absent |
| ElevenLabs | `/api/voice/tts` exists and returns 501 without key | partial | TTS path exists; microphone/STT, playback controls, live smoke test needed |
| Progress | Static demo chart/table | partial | Needs GET-backed observations and chart hydration |
| File upload | Referral file input only selects a local filename | broken | No backend upload or durable metadata |
| Sponsor status | `/api/integrations` reports env-derived status | partial | Connectivity/credits need evidence and docs |
| Tests | Python data tests and a frontend test file exist | partial | No end-to-end browser suite for core workflows |

Critical P0 findings: camera and microphone controls were not implemented; several visible buttons were non-functional; referral and research state were not durable. The next implementation pass prioritizes real media capture, honest disabled states, API persistence endpoints, and evidence-based documentation.

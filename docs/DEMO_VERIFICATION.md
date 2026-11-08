# Demo verification

## Run

```bash
npm install
npm run dev
```

API-only: build `apps/api/src/server.ts` with the project build command, then run the generated Node server. Configure `.env` from `.env.example`.

| Feature | Implemented | Tested | Live integration verified | Blocker |
|---|---:|---:|---:|---|
| Landing and route navigation | Yes | Browser smoke-tested | N/A | None |
| Overview chart and records | Yes (synthetic demo) | Browser smoke-tested | No | Replace static demo values with persisted GET |
| Check-in POST | Yes | API route exists | Tiger Data only when configured | Add retrieval and schema migration |
| Camera capture | No | Not tested | No | Implement `getUserMedia` preview/capture/upload |
| Microphone/STT | No | Not tested | No | Add browser recording and speech provider |
| ElevenLabs TTS | Partial | Not live-tested | No | Requires key and audible playback test |
| Referral PDF | No | Not tested | No | Add ReferALS source mapping and PDF generation |
| Research consent persistence | No | Local state only | No | Add consent endpoint and reload flow |
| Caregiver API | Partial | Endpoint smoke test pending | No | Connect UI to GET/POST members |

Known limitation: the current application is a synthetic hackathon prototype. No clinical diagnosis, prediction, or real-patient research submission is performed.

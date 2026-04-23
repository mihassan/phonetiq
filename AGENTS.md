# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-23 (Australia/Sydney)
**Branch:** `main`

## OVERVIEW
Phonetiq is a two-app TypeScript repo: `web/` is a React 19 + Vite SPA on Cloudflare Pages; `api/` is a Hono Worker on Cloudflare Workers. Core product loop: listen to pre-generated R2 audio, record via `MediaRecorder`, transcribe with Workers AI Whisper, and track progress locally with optional signed-session cloud sync.

## STRUCTURE
```text
Phonetiq/
├── web/                  # React SPA: UI, hooks, local progress, auth client
├── api/                  # Worker API: routes, D1 schema, sessions, Whisper bridge
├── docs/                 # PRD, design rationale, screenshots
├── scripts/              # Local audio generation / local R2 upload
├── .audio-cache/         # Generated audio artifacts; not source
└── .github/workflows/    # Split deploy workflows for Pages and Worker
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| App shell / mode switching | `web/src/App.tsx` | Learn, Categories, Practice, Profile live here |
| Frontend entry | `web/src/main.tsx` | StrictMode + `App` mount |
| Frontend state hub | `web/src/hooks/usePracticeSession.ts` | Batch practice, filters, progress, weak-pair mode |
| Recording state machine | `web/src/hooks/usePracticeAttempt.ts` | idle → recording → processing → result |
| Browser mic wrapper | `web/src/hooks/useAudioRecorder.ts` | `MediaRecorder` abstraction only |
| API client / endpoints | `web/src/lib/api.ts` | `VITE_API_URL` + `/api` contract |
| Local progress engine | `web/src/lib/progressStorage.ts` | localStorage + in-memory fallback |
| Metrics / weak areas | `web/src/lib/progressMetrics.ts` | Profile/category summaries |
| Adaptive practice scoring | `web/src/lib/pairSelection.ts` | 15-item batches, weak quota, weighted scoring |
| Worker entry / middleware | `api/src/index.ts` | CORS allowlist + two-tier rate limiting |
| API routes | `api/src/routes/*.ts` | pairs, audio, recognize, auth, me, progress |
| Session auth | `api/src/lib/session.ts`, `api/src/lib/auth.ts` | Signed cookies + session lookup |
| OAuth flow | `api/src/routes/auth.ts`, `api/src/lib/googleOAuth.ts` | Google login/callback flow |
| Speech recognition backend | `api/src/routes/recognize.ts` | Whisper call + candidate matching |
| Database schema | `api/src/db/schema.ts` | `word_pairs`, `users`, `sessions`, `user_progress` |
| Infra bindings | `api/wrangler.toml` | D1, R2, AI, rate limiters, origins |
| Product / design rationale | `docs/PRD.md`, `docs/DESIGN.md`, `PROJECT.md` | Read before large product changes |

## CODE MAP
| Symbol / File | Type | Role |
|---------------|------|------|
| `usePracticeSession` | hook | Main frontend coordinator; most behavior fans out from here |
| `usePracticeAttempt` | hook | Speech practice lifecycle and result transitions |
| `buildPracticeBatch` | helper | Adaptive practice batch construction |
| `updateProgressForAttempt` | helper | Canonical local progress mutation path |
| `getProfileSummary` | helper | Profile-stage derived view model |
| `app` in `api/src/index.ts` | Worker app | Route registration + middleware chain |
| `recognizeRoutes` | route group | Worker AI transcription endpoint |
| `progressRoutes` | route group | Cloud progress sync/import/update logic |
| `authRoutes` | route group | OAuth login/callback/logout |
| `wordPairs/users/sessions/userProgress` | schema tables | Persistent backend model |

## CONVENTIONS
- Two deployable apps; root is coordination/docs only.
- Frontend keeps business logic in hooks/lib, not in components.
- Tests sit next to implementation as `*.test.ts(x)`; Vitest runs only in `web/`.
- Tailwind v4 is CSS-import driven: `web/src/index.css` imports `tokens.css`, `components.css`, `screens.css`.
- Frontend API base is `VITE_API_URL + '/api'`; local dev falls back to Vite proxy.
- Worker routes are mounted centrally in `api/src/index.ts`; route files export `*Routes` Hono instances.
- Progress is local-first; signed-session cloud sync layers on top rather than replacing local state.

## ANTI-PATTERNS (THIS PROJECT)
- Do not treat `.audio-cache/`, `.wrangler/`, or `api/.wrangler/` state as source code.
- Do not reintroduce browser `speechSynthesis` / `SpeechRecognition`; design docs explicitly reject them for compatibility reasons.
- Do not ignore dialect constraints; `dialect_filter` is product logic, not display-only metadata.
- Do not bypass `usePracticeSession` / progress helpers with ad hoc state updates.
- Do not assume `us_only` has rich seeded coverage; current data is mostly `all` plus some `uk_only`.
- Do not hardcode API origins in the web app; respect `VITE_API_URL` and Worker CORS config.

## UNIQUE STYLES
- Dark “Glacier” visual theme; tokens live in `web/src/styles/tokens.css`.
- Practice UX is batch-based, not linear lesson pagination.
- Recognition is candidate-constrained: expected words are sent to Whisper and post-matched server-side.
- Audio pipeline is pre-generated `.m4a` in R2, not on-demand TTS.

## COMMANDS
```bash
# web
cd web && npm run dev
cd web && npm run build
cd web && npm test

# api
cd api && npm run dev
cd api && npm run typecheck
cd api && npm run db:migrate:local
cd api && npm run db:seed:local
cd api && npm run deploy

# root
./scripts/generate-audio.sh
./scripts/generate-audio.sh --force
```

## NOTES
- CI is split: `.github/workflows/deploy-web.yml` triggers on `web/**`, `deploy-api.yml` on `api/**`.
- Local audio generation is macOS-only because `scripts/generate-audio.sh` uses `say`.
- Worker rate limiting is intentionally asymmetric: AI endpoint 10 req/min/IP, general API 100 req/min/IP.
- TypeScript LSP is configured but not installed in this environment; use direct reads/grep/AST search when symbol tooling is unavailable.

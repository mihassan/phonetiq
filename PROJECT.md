# Phonetiq - Project Memory

## Architecture & Stack
- **Frontend:** React 19 (SPA), Vite, Tailwind CSS v4, Lucide React.
- **Hosting:** Cloudflare Pages (Frontend) + Cloudflare Workers (Backend API via Hono).
- **Database:** Cloudflare D1 (SQLite) + Drizzle ORM. Schema in `api/src/db/schema.ts`.
- **Storage:** Cloudflare R2 (pre-generated TTS audio files, `.m4a` format).
- **AI / Speech:** Cloudflare Workers AI (`@cf/openai/whisper-large-v3-turbo`) for Speech-to-Text (STT).
- **CI/CD:** GitHub Actions for both frontend (Pages) and API (Workers) — triggers on push to `main`.

## Live URLs
- **Frontend:** https://phonetiq.mihassan.com (also https://phonetiq.pages.dev)
- **API:** https://api.phonetiq.mihassan.com (also https://phonetiq-api.mihassan.workers.dev)
- **GitHub:** https://github.com/mihassan/phonetiq

## Key Technical Decisions
1.  **API-Driven Data:** Word pairs are stored in D1, not hardcoded. The frontend fetches dynamically with optional category and dialect filters.
2.  **Audio Reliability (TTS):** Pre-generated `.m4a` audio files stored in R2. Generated locally using macOS `say` command via `scripts/generate-audio.sh`. Served by Worker via `GET /api/audio/:word`.
3.  **Speech Recognition (STT):** Frontend uses `MediaRecorder` API to capture audio blobs. Sent to `POST /api/recognize`, transcribed by `@cf/openai/whisper-large-v3-turbo` with English + VAD settings, candidate-word hints, and explicit `no_match` handling.
4.  **Robust Audio Processing:** The frontend includes mic warm-up waiting, noise detection (classifies `possible_noise` at activity ratio > 0.75), and speech window trimming (removes leading/trailing silence) for reliable recognition in real-world conditions.
5.  **Dialect Awareness:** Word pairs use `dialect_filter` (`all`, `us_only`, `uk_only`, `au_only`). The UI now requires a specific target dialect (`US`, `UK`, `AU`), and the backend includes shared `all` pairs behind the scenes. STT receives the selected target dialect and uses dialect-specific prompt context. A pilot `word_pair_dialect_metadata` layer now annotates selected `vowel_long` contrasts as `supported`, `weak`, or `unavailable` by target dialect.
6.  **Progress & Personalization:** Local progress is persisted in browser storage. Practice uses refreshable 15-pair batches (5 weak-pair quota + unseen/medium-weak fill). Profile stage shows key stats and weak areas.
7.  **CI/CD:** GitHub Actions for both deployments (not Cloudflare Pages Git integration, which requires Direct Upload projects to be recreated). Single `CLOUDFLARE_API_TOKEN` secret shared by both workflows.

## Commands Reference
### API (`api/`)
- `npm run dev` - Start Worker dev server (port 8787)
- `npm run dev:frame` - Start frame-sentence profile (port 8791)
- `npm run typecheck` - TypeScript check
- `npm test` - Run Vitest tests (64 tests)
- `npm run eval` - Frame-sentence recognition eval (34 WAV fixtures, 7 s delay)
- `npm run eval:fast` - Frame-sentence eval (no delay)
- `npm run eval:frame` - Frame-sentence eval on `dev:frame` (port 8791)
- `npm run db:generate` - Generate Drizzle migration SQL
- `npm run db:migrate:local` - Apply migrations to local D1
- `npm run db:seed:local` - Seed word pairs to local D1
- `npx wrangler deploy` - Deploy Worker to Cloudflare

### Web (`web/`)
- `npm run dev` - Start Vite dev server (port 5173, proxies /api to 8787)
- `npm run build` - Typecheck + production build (outputs to `web/dist/`)
- `npm test` - Run Vitest tests (145 tests)
- `npm run lint` - ESLint check
- `npm run preview` - Preview production build locally

### Scripts
- `./scripts/generate-audio.sh` - Generate TTS audio + upload to local R2
- `./scripts/generate-audio.sh --force` - Regenerate all audio (overwrite)

## Data Schema
- **400+ word pairs** across 9 phoneme categories
- Categories: vowel_short, vowel_long, consonant_voicing, fricative, sibilant, affricate, liquid, nasal, approximant
- Dialect filters seeded: `all`, `uk_only`, `us_only`, and an initial `au_only` starter set

## API Endpoints
- `GET /api/health` - Health check
- `GET /api/pairs?category=&dialect=&difficulty=&limit=&offset=` - List word pairs
- `GET /api/pairs/categories` - List categories with counts
- `GET /api/audio/:word` - Serve audio from R2
- `POST /api/recognize` - Candidate-constrained speech recognition via Whisper AI (`large-v3-turbo`) with dialect-aware prompt context and frame-sentence matching (`"the word is X"`). Returns detailed debug info in local dev mode including raw transcript, normalized transcript, matching details, and AI response. Automatically maps results to `exact` / `token` / `fuzzy` / `no_match` / `freeform` match types.
- `GET /api/auth/login` - Initiate Google OAuth flow
- `GET /api/auth/callback` - OAuth callback, sets signed session cookie
- `GET /api/auth/logout` - Clear session
- `GET /api/me` - Return current user from session
- `GET /api/progress` - Fetch cloud-synced progress
- `POST /api/progress` - Upload/merge local progress to cloud

## Wrangler Bindings (api/wrangler.toml)
- `DB` - D1 database `phonetiq-db`
- `AUDIO_BUCKET` - R2 bucket `phonetiq-audio`
- `AI` - Workers AI (requires Cloudflare auth for remote)
- `AI_RATE_LIMITER` - Rate limit: 10 req/min per IP (protects Whisper AI endpoint)
- `API_RATE_LIMITER` - Rate limit: 100 req/min per IP (protects all API routes)

## Recognition Decision (2026-05)
- We finalized **frame-sentence** matching as the only active recognition path.
- Findings from prior evals that led to this:
  - Frame sentence ("The word is X"): **97%** and 0 no-match.
  - Foundation-v2 strict mode: ~**35%**.
  - Repetition and two-pass paths increased complexity without outperforming frame sentence in production.
- We removed alternate experiment code paths to reduce maintenance and testing surface.

### Rollback note: restore foundation mode later
If you want to reintroduce foundation mode, restore the previous recognition branch from git history:
1. Find a commit before the experiment cleanup (for example with `git log -- api/src/routes/recognize.ts`).
2. Restore the prior files from that commit:
   - `api/src/routes/recognize.ts`
   - `api/src/index.ts`
   - `api/wrangler.toml`
   - `api/package.json`
3. Re-enable matching tests and scripts, then run `cd api && npm test && npm run typecheck`.

## Custom Domains (api/wrangler.toml)
- `api.phonetiq.mihassan.com` - Worker custom domain (auto-creates DNS record)
- `phonetiq.mihassan.com` - Pages custom domain (CNAME to `phonetiq.pages.dev`)

## Environment Variables
- `VITE_API_URL` - (Frontend, production only) Base URL for the API Worker (e.g., `https://api.phonetiq.mihassan.com`). The code appends `/api` automatically. Defaults to `/api` in local dev via Vite proxy.

## GitHub Secrets
- `CLOUDFLARE_API_TOKEN` - API token with Workers Scripts Edit + Cloudflare Pages Edit permissions
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID (`3bea2e6d6f93b5cc822b36b69958d4cd`)

## Cloudflare Worker Secrets
These must be set via `wrangler secret put <NAME>` — they are **not** in `wrangler.toml`:
- `GOOGLE_CLIENT_SECRET` - Google OAuth app secret (from Google Cloud Console)
- `SESSION_SECRET` - Random secret used to sign session cookies (min 32 chars)

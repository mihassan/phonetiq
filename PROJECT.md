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
5.  **Dialect Awareness:** Word pairs use `dialect_filter` (`all`, `us_only`, `uk_only`). UI label `Common` maps to `all`. STT receives selected dialect and uses dialect-specific prompt context.
6.  **Progress & Personalization:** Local progress is persisted in browser storage. Practice uses refreshable 15-pair batches (5 weak-pair quota + unseen/medium-weak fill). Profile stage shows key stats and weak areas.
7.  **CI/CD:** GitHub Actions for both deployments (not Cloudflare Pages Git integration, which requires Direct Upload projects to be recreated). Single `CLOUDFLARE_API_TOKEN` secret shared by both workflows.

## Commands Reference
### API (`api/`)
- `npm run dev` - Start Worker dev server (port 8787)
- `npm run typecheck` - TypeScript check
- `npm run db:generate` - Generate Drizzle migration SQL
- `npm run db:migrate:local` - Apply migrations to local D1
- `npm run db:seed:local` - Seed word pairs to local D1
- `npx wrangler deploy` - Deploy Worker to Cloudflare

### Web (`web/`)
- `npm run dev` - Start Vite dev server (port 5173, proxies /api to 8787)
- `npm run build` - Typecheck + production build (outputs to `web/dist/`)
- `npm test` - Run Vitest tests

### Scripts
- `./scripts/generate-audio.sh` - Generate TTS audio + upload to local R2
- `./scripts/generate-audio.sh --force` - Regenerate all audio (overwrite)

## Data Schema
- **186 word pairs** across 9 phoneme categories
- Categories: vowel_short, vowel_long, consonant_voicing, fricative, sibilant, affricate, liquid, nasal, approximant
- Dialect filters currently seeded: `all` (170 pairs), `uk_only` (16 pairs)
- `us_only` is supported by schema/query path but has limited/no exclusive seeded rows at present

## API Endpoints
- `GET /api/health` - Health check
- `GET /api/pairs?category=&dialect=&difficulty=&limit=&offset=` - List word pairs
- `GET /api/pairs/categories` - List categories with counts
- `GET /api/audio/:word` - Serve audio from R2
- `POST /api/recognize` - Candidate-constrained speech recognition via Whisper AI (`large-v3-turbo`) with dialect-aware prompt context. Returns detailed debug info in local dev mode including raw transcript, normalized transcript, matching details, and AI response. Automatically maps results to `exact` / `token` / `fuzzy` / `no_match` / `freeform` match types.

## Wrangler Bindings (api/wrangler.toml)
- `DB` - D1 database `phonetiq-db`
- `AUDIO_BUCKET` - R2 bucket `phonetiq-audio`
- `AI` - Workers AI (requires Cloudflare auth for remote)
- `AI_RATE_LIMITER` - Rate limit: 10 req/min per IP (protects Whisper AI endpoint)
- `API_RATE_LIMITER` - Rate limit: 100 req/min per IP (protects all API routes)

## Custom Domains (api/wrangler.toml)
- `api.phonetiq.mihassan.com` - Worker custom domain (auto-creates DNS record)
- `phonetiq.mihassan.com` - Pages custom domain (CNAME to `phonetiq.pages.dev`)

## Environment Variables
- `VITE_API_URL` - (Frontend, production only) Base URL for the API Worker (e.g., `https://api.phonetiq.mihassan.com`). The code appends `/api` automatically. Defaults to `/api` in local dev via Vite proxy.

## GitHub Secrets
- `CLOUDFLARE_API_TOKEN` - API token with Workers Scripts Edit + Cloudflare Pages Edit permissions
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID (`3bea2e6d6f93b5cc822b36b69958d4cd`)

# Phonetiq

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-173%20passing-42b883?logo=vitest)](https://vitest.dev/)

**Live:** [phonetiq.mihassan.com](https://phonetiq.mihassan.com) | **API:** [api.phonetiq.mihassan.com](https://api.phonetiq.mihassan.com)

A web app for practicing English **minimal pair pronunciation** — words that differ by only one sound, like *ship* vs *sheep*. Built entirely on the Cloudflare stack.

## Why Phonetiq?

Most pronunciation apps use browser-native speech recognition which is flaky across browsers (no Firefox support, buggy Safari). Phonetiq solves this with:

- **Universal compatibility** — Uses HTML5 `MediaRecorder` + Cloudflare Workers AI (Whisper) instead of browser APIs
- **Smart audio processing** — Handles mic startup delay, environmental noise, and trailing silence automatically
- **Candidate-constrained recognition** — Whisper knows exactly which words to expect, dramatically improving accuracy

**Learn Mode** — hear the correct pronunciation of each word via pre-generated TTS audio.  
**Practice Mode** — get instant AI feedback with adaptive sessions that focus on your weak pairs.  
**Profile Mode** — track your progress and target areas that need work.

## Cool Features

### 🎯 Intelligent Speech Recognition
- **Arming state** — UI shows "Starting mic..." while waiting for microphone to warm up
- **Noise detection** — Automatically skips recordings that sound like environmental noise (fan, AC, background chatter)
- **Speech window trimming** — Strips leading/trailing silence to send only the actual speech to Whisper
- **Robust mic handling** — Waits for first audio chunk before starting capture, with timeout fallback
- **Audio DSP** — 16 kHz resample, 80 Hz high-pass filter, and −18 dBFS loudness normalisation applied before upload
- **Frame-sentence mode** — Production uses "The word is X" framing, lifting recognition accuracy from 76 % to 97 %

### 📊 Adaptive Learning
- **Weak-pair prioritization** — Each session includes 5 pairs you're struggling with
- **Smart batching** — 15-pair sessions with unseen and medium-weak pair fill
- **Progress tracking** — Accuracy, streaks, completions, and weak-area analysis

### 🌐 Dialect-Aware
- Choose a target dialect (`US`, `UK`, `AU`)
- Whisper receives dialect-specific prompts for better recognition
- Pilot `vowel_long` recognition now accepts a few dialect-specific transcript spellings for supported contrasts and exposes rule tags in local debug output
- Audio available in three dialects: US English, British English, Australian English
- Pilot `vowel_long` metadata now marks some dialect-specific contrasts as `supported`, `weak`, or unavailable for selection/filtering, including a shared non-rhotic `hut`/`heart` family that is taught for UK/AU but filtered for US
- Learn and Practice now surface pilot dialect notes so users can see when a contrast is subtle or being treated specially for the selected dialect
- Local and cloud progress now keep separate mastery records per target dialect for the same pair
- Dataset now includes 400+ seeded pairs with `all`, `uk_only`, `us_only`, and an initial `au_only` starter set

### 🔒 Production-Ready
- **Two-tier rate limiting** — 10 req/min for AI (protects costs), 100 req/min for general API
- **Google OAuth** — Optional account sync for cross-device progress
- **Dark "Glacier" theme** — Beautiful, accessible dark mode UI

## Screenshots

### Mobile

| Learn | Practice | Categories | Profile |
| --- | --- | --- | --- |
| ![Learn mode mobile](docs/screenshots/learn-mobile.png) | ![Practice mode mobile](docs/screenshots/practice-mobile.png) | ![Categories mode mobile](docs/screenshots/categories-mobile.png) | ![Profile mode mobile](docs/screenshots/profile-mobile.png) |

## Features

- 400+ curated word pairs across 9 phoneme categories (vowels, consonants, fricatives, affricates, liquids, nasals, sibilants, approximants)
- Dialect-aware practice targets: `us_only`, `uk_only`, `au_only` with shared `all` pairs included behind the scenes
- Audio support for three dialects: `en-US`, `en-GB`, `en-AU` with one default voice per dialect
- **Smart speech recognition** with mic warm-up, noise detection, and silence trimming
- Adaptive Practice sessions: 15-pair batches with 5 weak-pair quota + unseen/medium-weak filler
- Local-first progress tracking with dialect-partitioned pair mastery and cloud sync
- Profile stage with key stats + weak-pair practice action
- Cross-platform speech recognition using `MediaRecorder` + Workers AI (`@cf/openai/whisper-large-v3-turbo`)
- Candidate-constrained recognition (2 target words) with explicit `no_match` fallback
- Frame-sentence miss tip that reminds users to say the full "The word is X" prompt
- Expanded practice feedback with success microcopy, transcript preview, and reason-specific miss guidance
- Development debug panel gated by a local dev toggle, showing recording metrics, audio levels, and AI responses
- Two-tier rate limiting to protect the AI endpoint from abuse
- Optional Google OAuth for cloud progress sync

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS v4, Lucide React |
| Backend API | Cloudflare Workers + Hono |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| Audio Storage | Cloudflare R2 (pre-generated `.m4a` files) |
| Speech Recognition | Cloudflare Workers AI (`@cf/openai/whisper-large-v3-turbo`) |
| Hosting | Cloudflare Pages (frontend) + Cloudflare Workers (API) |
| Custom Domains | `phonetiq.mihassan.com` (frontend), `api.phonetiq.mihassan.com` (API) |
| CI/CD | GitHub Actions (`cloudflare/wrangler-action`) for both frontend and API |

## Project Structure

```
Phonetiq/
  api/                        # Cloudflare Worker (Hono)
    src/
      index.ts                # Worker entrypoint + rate limiting middleware
      routes/
        pairs.ts              # GET /api/pairs, GET /api/pairs/categories
        audio.ts              # GET /api/audio/:word (serves from R2)
        recognize.ts          # POST /api/recognize (dialect-aware Whisper STT + frame-sentence matching)
        auth.ts               # GET /api/auth/login, /callback, /logout (Google OAuth)
        me.ts                 # GET /api/me (current user from session)
        progress.ts           # GET/POST /api/progress (cloud progress sync)
      lib/
        auth.ts               # Session auth primitive
        session.ts            # Signed-cookie helpers
        googleOAuth.ts        # OAuth URL, token exchange, profile fetch
      db/
        schema.ts             # Drizzle ORM schema
        seed.sql              # 400+ word pairs seed data
    scripts/
      run-eval.ts             # Dialect-tagged eval harness (+ JSON output, strict guardrails, family rollups)
      run-eval-experiment.ts  # Frame eval variant (+ JSON output, strict guardrails, family rollups)
      wrangler-with-env.mjs   # Wrangler wrapper that injects local env
    drizzle/                  # Generated SQL migrations
    wrangler.toml             # Bindings: D1, R2, AI, Rate Limiters
  web/                        # React SPA (Vite)
    src/
      App.tsx                 # Main app with Learn/Categories/Practice/Profile modes
      components/
        AppShell.tsx          # Top-level layout shell
        ModeTabBar.tsx        # Bottom tab bar (Learn/Practice/Categories/Profile)
        PairCard.tsx          # Learn mode: word display + audio playback
        PracticeCard.tsx      # Practice mode: record + STT + feedback
        LearnStage.tsx        # Learn stage container
        CategoriesStage.tsx   # Categories stage with progress summaries
        ProfileStage.tsx      # Profile mode: key stats + weak areas/actions
        Navigation.tsx        # Prev/Next navigation
        CategoryFilter.tsx    # Category filter pills
        DialectFilter.tsx     # Dialect selector pills
      hooks/
        useAudioRecorder.ts   # MediaRecorder wrapper (with DSP pipeline)
        usePracticeSession.ts # Session state (batch practice + progress)
        usePracticeAttempt.ts # Recording lifecycle: idle→recording→processing→result
        useAuth.ts            # Login/logout/current-user state
      lib/
        api.ts                # API client functions
        authApi.ts            # Auth + cloud-sync API calls
        pairSelection.ts      # Adaptive batch selection helpers
        progressStorage.ts    # Local progress persistence
        progressMetrics.ts    # Derived stats (profile/categories)
        audioPlayback.ts      # Audio playback sequencing helpers
        wordSizing.ts         # Word display sizing helpers
        types.ts              # Shared TypeScript types
  scripts/
    generate-audio.sh         # Shell wrapper for portable dialect-aware generator
    generate-audio.ts         # Google TTS batch generation + optional R2 upload
  docs/
    PRD.md                    # Product requirements
    DESIGN.md                 # Architecture & design decisions
  .github/workflows/
    deploy-api.yml            # CI/CD for Worker deployment
    deploy-web.yml            # CI/CD for Pages deployment
```

## Local Development

### Prerequisites

- Node.js >= 20
- `ffmpeg` on your `PATH` (for MP3 → `.m4a` transcoding during audio generation)
- Cloudflare account (for Workers AI; D1 and R2 work locally without auth)
- Google Cloud service account credentials for Text-to-Speech generation

### 1. Install dependencies

```bash
cd api && npm install
cd ../web && npm install
```

### 2. Set up the database

```bash
cd api

# Apply migration to local D1
npm run db:migrate:local

# Seed word pairs
npm run db:seed:local
```

### 3. Generate and upload audio files

```bash
# From project root — preview the full dialect-aware asset set without calling Google TTS
./scripts/generate-audio.sh --dry-run

# Generate all missing assets for en-US, en-GB, and en-AU into .audio-cache/
./scripts/generate-audio.sh

# Regenerate everything from scratch
./scripts/generate-audio.sh --force

# Upload generated assets to local R2 after generation
./scripts/generate-audio.sh --upload

# Upload to remote R2 instead of local emulation
./scripts/generate-audio.sh --upload --remote
```

**Generator prerequisites:**

- `ffmpeg` installed and available on `PATH` (used to transcode Google TTS MP3 output into `.m4a`)
- A Google Cloud service account with Text-to-Speech access
- Authentication configured via either:
  - `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json`, or
  - `GOOGLE_CREDENTIALS_JSON='{"type":"service_account",...}'`

The portable generator uses Google Cloud Text-to-Speech, renders one default voice per dialect (`en-US`, `en-GB`, `en-AU`), writes files under `.audio-cache/<dialect>/default/<word>.m4a`, and preserves the app's pre-generated R2 audio serving model.

### 4. Run the app

Start both the API worker and the frontend dev server:

```bash
# Terminal 1: API (port 8787)
cd api && npm run dev

# Terminal 2: Frontend (port 5173, proxies /api to 8787)
cd web && npm run dev
```

Open http://localhost:5173 in your browser.

### Running tests

```bash
# Web (145 tests)
cd web && npm test

# API (64 tests)
cd api && npm test
```

## Deployment

### 1. Provision Cloudflare infrastructure

```bash
cd api

# Create production D1 database (copy the database_id into wrangler.toml)
npx wrangler d1 create phonetiq-db

# Apply migrations and seed data
npx wrangler d1 migrations apply phonetiq-db --remote
npx wrangler d1 execute phonetiq-db --file=src/db/seed.sql --remote

# Create production R2 bucket
npx wrangler r2 bucket create phonetiq-audio

# Create Pages project
npx wrangler pages project create phonetiq --production-branch main
```

### 2. Upload audio files to R2

Generate and upload the dialect-aware assets from the project root:

```bash
./scripts/generate-audio.sh --upload --remote
```

Asset keys are written as `<dialect>/default/<word>.m4a` with a legacy flat-key fallback still supported by the API.

### 3. Deploy manually (first time)

```bash
# Deploy API Worker
cd api && npm run deploy

# Build and deploy frontend
cd web && VITE_API_URL=https://api.phonetiq.mihassan.com npm run build
npx wrangler pages deploy dist --project-name phonetiq
```

### 4. CI/CD (automatic on push)

Both the API Worker and frontend are auto-deployed via GitHub Actions on push to `main`:

- `.github/workflows/deploy-api.yml` — triggers on changes to `api/`
- `.github/workflows/deploy-web.yml` — triggers on changes to `web/`

**Required GitHub secrets:**

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | API token with Workers Scripts Edit + Cloudflare Pages Edit permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

### 5. Custom domains

- **Frontend:** Add `phonetiq.mihassan.com` via Pages > Custom domains (requires a CNAME record pointing to `phonetiq.pages.dev`)
- **API:** Configured in `api/wrangler.toml` via `routes` with `custom_domain = true` (auto-creates DNS record)

## Documentation

- [Product Requirements (PRD)](docs/PRD.md)
- [Design Document](docs/DESIGN.md)
- [Project Memory](PROJECT.md)

## License

This project is licensed under the [MIT License](LICENSE).

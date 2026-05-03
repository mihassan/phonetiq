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
- Filter pairs by dialect (`Common`, `UK`, `US`)
- Whisper receives dialect-specific prompts for better recognition
- Currently: 170 "common" pairs + 16 UK-exclusive pairs

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

- 186 curated word pairs across 9 phoneme categories (vowels, consonants, fricatives, affricates, liquids, nasals, sibilants, approximants)
- Dialect-aware pair filtering (`Common`=`all`, `UK`=`uk_only`, `US`=`us_only` support in schema)
- **Smart speech recognition** with mic warm-up, noise detection, and silence trimming
- Adaptive Practice sessions: 15-pair batches with 5 weak-pair quota + unseen/medium-weak filler
- Local progress tracking (attempts, accuracy, completions, streaks, weak-pair signals)
- Profile stage with key stats + weak-pair practice action
- Cross-platform speech recognition using `MediaRecorder` + Workers AI (`@cf/openai/whisper-large-v3-turbo`)
- Candidate-constrained recognition (2 target words) with explicit `no_match` fallback
- Development debug panel showing recording metrics, audio levels, and AI responses
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
        recognize.ts          # POST /api/recognize (dialect-aware Whisper STT + experiments)
        auth.ts               # GET /api/auth/login, /callback, /logout (Google OAuth)
        me.ts                 # GET /api/me (current user from session)
        progress.ts           # GET/POST /api/progress (cloud progress sync)
      lib/
        auth.ts               # Session auth primitive
        session.ts            # Signed-cookie helpers
        googleOAuth.ts        # OAuth URL, token exchange, profile fetch
      db/
        schema.ts             # Drizzle ORM schema
        seed.sql              # 186 word pairs seed data
    scripts/
      run-eval.ts             # Baseline recognition eval harness (34 WAV fixtures)
      run-eval-experiment.ts  # E1/E2 experiment eval harness
      wrangler-with-env.mjs   # Wrangler wrapper that injects local env
    drizzle/                  # Generated SQL migrations
    wrangler.toml             # Bindings: D1, R2, AI, Rate Limiters, feature flags
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
    generate-audio.sh         # TTS audio generation + R2 upload
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
- macOS (for audio generation via `say` command)
- Cloudflare account (for Workers AI; D1 and R2 work locally without auth)

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
# From project root — generates 338 .m4a files and uploads to local R2
./scripts/generate-audio.sh

# To regenerate all (overwrite existing):
./scripts/generate-audio.sh --force
```

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
# Web (123 tests)
cd web && npm test

# API (50 tests)
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

Upload the 338 `.m4a` files from `.audio-cache/` to the `phonetiq-audio` R2 bucket via the Cloudflare Dashboard (R2 > phonetiq-audio > Upload Files).

### 3. Deploy manually (first time)

```bash
# Deploy API Worker
cd api && npm run deploy

# Build and deploy frontend
cd web && VITE_API_URL=https://api.phonetiq.mihassan.com VITE_EXPERIMENT_MODE=frame_sentence npm run build
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

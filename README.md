# Phonetiq

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)

A web app for practicing English **minimal pair pronunciation** — words that differ by only one sound, like *ship* vs *sheep*. Built entirely on the Cloudflare stack.

**Learn Mode** — hear the correct pronunciation of each word via pre-generated TTS audio.
**Practice Mode** — speak into your microphone and get instant AI feedback via Cloudflare Workers AI (Whisper).

## Features

- 186 curated word pairs across 9 phoneme categories (vowels, consonants, fricatives, affricates, liquids, nasals, sibilants, approximants)
- Dialect-aware pairs tagged with `all`, `us_only`, or `uk_only` to handle accent-dependent contrasts (cot–caught merger, rhoticity)
- Cross-platform speech recognition using `MediaRecorder` API + server-side Whisper AI (no fragmented browser `SpeechRecognition`)
- Category filtering, progress ring countdown, and responsive mobile-friendly UI
- Two-tier rate limiting to protect the AI endpoint from abuse

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS v4, Lucide React |
| Backend API | Cloudflare Workers + Hono |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| Audio Storage | Cloudflare R2 (pre-generated `.m4a` files) |
| Speech Recognition | Cloudflare Workers AI (`@cf/openai/whisper`) |
| Hosting | Cloudflare Pages (frontend) + Cloudflare Workers (API) |
| CI/CD | GitHub Actions (`cloudflare/wrangler-action`) |

## Project Structure

```
Phonetiq/
  api/                        # Cloudflare Worker (Hono)
    src/
      index.ts                # Worker entrypoint + rate limiting middleware
      routes/
        pairs.ts              # GET /api/pairs, GET /api/pairs/categories
        audio.ts              # GET /api/audio/:word (serves from R2)
        recognize.ts          # POST /api/recognize (Whisper STT)
      db/
        schema.ts             # Drizzle ORM schema
        seed.sql              # 186 word pairs seed data
    drizzle/                  # Generated SQL migrations
    wrangler.toml             # Bindings: D1, R2, AI, Rate Limiters
  web/                        # React SPA (Vite)
    src/
      App.tsx                 # Main app with mode toggle + category filter
      components/
        PairCard.tsx          # Learn mode: word display + audio playback
        PracticeCard.tsx      # Practice mode: record + STT + feedback
        Navigation.tsx        # Prev/Next navigation
        CategoryFilter.tsx    # Category filter pills
      hooks/
        useAudioRecorder.ts   # MediaRecorder wrapper
      lib/
        api.ts                # API client functions
        types.ts              # Shared TypeScript types
  scripts/
    generate-audio.sh         # TTS audio generation + R2 upload
  docs/
    PRD.md                    # Product requirements
    DESIGN.md                 # Architecture & design decisions
  .github/workflows/
    deploy-api.yml            # CI/CD for Worker deployment
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
cd api && npx wrangler dev

# Terminal 2: Frontend (port 5173, proxies /api to 8787)
cd web && npm run dev
```

Open http://localhost:5173 in your browser.

### Running tests

```bash
cd web && npm test
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
```

### 2. Deploy the API Worker

```bash
cd api && npx wrangler deploy
```

### 3. Deploy the frontend

Connect [Cloudflare Pages](https://pages.cloudflare.com/) to your GitHub repository:

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `web`
- **Environment variable:** `VITE_API_URL` = `https://your-worker.workers.dev/api`

### 4. CI/CD

The included GitHub Action (`.github/workflows/deploy-api.yml`) automatically deploys the Worker API when changes are pushed to the `api/` directory on `main`. Add your `CLOUDFLARE_API_TOKEN` as a GitHub repository secret.

## Documentation

- [Product Requirements (PRD)](docs/PRD.md)
- [Design Document](docs/DESIGN.md)
- [Project Memory](PROJECT.md)

## License

This project is licensed under the [MIT License](LICENSE).

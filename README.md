# Phonetiq

Phonetiq is a web application designed to help English language learners, speech therapy patients, and linguistics enthusiasts practice minimal pair pronunciation (words that differ by only one phonological element, like "ship" vs. "sheep").

## Features
- **Learn Mode:** Hear the correct pronunciation of word pairs using high-quality TTS audio stored in R2.
- **Practice Mode:** Speak into your microphone and receive instant feedback via Cloudflare Workers AI (Whisper STT).
- **Dynamic Content:** 186 curated, categorized, and dialect-aware word pairs across 9 phoneme categories.
- **Category Filtering:** Filter by vowels, consonants, fricatives, affricates, liquids, nasals, sibilants, and approximants.
- **Cross-Platform:** Uses `MediaRecorder` API + server-side Whisper AI instead of fragmented browser `SpeechRecognition`.

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS v4, Lucide React (deployed to Cloudflare Pages)
- **Backend API:** Cloudflare Workers + Hono
- **Database:** Cloudflare D1 (SQLite) + Drizzle ORM
- **Audio Storage:** Cloudflare R2 (pre-generated .m4a files)
- **Speech Recognition:** Cloudflare Workers AI (`@cf/openai/whisper`)

## Project Structure
```
Phonetiq/
  api/                    # Cloudflare Worker (Hono)
    src/
      index.ts            # Worker entrypoint
      routes/
        pairs.ts          # GET /api/pairs, GET /api/pairs/categories
        audio.ts          # GET /api/audio/:word (serves from R2)
        recognize.ts      # POST /api/recognize (Whisper STT)
      db/
        schema.ts         # Drizzle ORM schema
        seed.sql          # 186 word pairs seed data
    drizzle/              # Generated SQL migrations
    wrangler.toml         # Bindings: D1, R2, AI
  web/                    # React SPA (Vite)
    src/
      App.tsx             # Main app with mode toggle + category filter
      components/
        PairCard.tsx      # Learn mode: word display + audio playback
        PracticeCard.tsx  # Practice mode: record + STT + feedback
        Navigation.tsx    # Prev/Next + Play Pair
        CategoryFilter.tsx
      hooks/
        useAudioRecorder.ts  # MediaRecorder wrapper
      lib/
        api.ts            # API client functions
        types.ts          # Shared TypeScript types
  scripts/
    generate-audio.sh    # TTS audio generation + R2 upload script
  docs/
    PRD.md
    DESIGN.md
  PROJECT.md             # Project memory / decisions
```

## Quick Start (Local Development)

### Prerequisites
- Node.js >= 20
- macOS (for audio generation via `say` command)
- Cloudflare account (for Workers AI binding, optional for local D1/R2)

### 1. Install dependencies
```bash
cd api && npm install
cd ../web && npm install
```

### 2. Set up the database
```bash
cd api

# Generate migration (already done, but for reference)
npm run db:generate

# Apply migration to local D1
npm run db:migrate:local

# Seed word pairs
npm run db:seed:local
```

### 3. Generate and upload audio files
```bash
# From project root - generates 338 .m4a files and uploads to local R2
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

### Build for production
```bash
# Frontend
cd web && npm run build   # outputs to web/dist/

# API
cd api && npx wrangler deploy
```

### Typecheck
```bash
cd api && npm run typecheck
cd web && npm run build   # tsc -b runs as part of build
```

## Documentation
- [Product Requirements Document (PRD)](docs/PRD.md)
- [Design Document](docs/DESIGN.md)
- [Project Memory](PROJECT.md)

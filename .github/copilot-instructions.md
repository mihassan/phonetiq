# Phonetiq — Copilot Instructions

Monorepo for a minimal-pair pronunciation trainer with two deployable apps:

```text
api/  Cloudflare Worker (Hono + Drizzle + D1 + R2 + Workers AI Whisper)
web/  React 19 SPA (Vite + Tailwind v4 + Vitest)
```

**Live:** https://phonetiq.mihassan.com  
**API:** https://api.phonetiq.mihassan.com

## Build, Test, and Lint Commands

### API (`api/`)
```sh
cd api
npm run dev                 # Worker dev server on 8787
npm run dev:v2              # Foundation-v2 experiment on 8788
npm run dev:twopass         # Two-pass experiment on 8789
npm run dev:repetition      # Repetition experiment on 8790
npm run dev:frame           # Frame-sentence experiment on 8791
npm run typecheck           # TypeScript type-check
npm test                    # Full API test suite (Vitest)
npx vitest run test/recognize.test.ts  # Single API test file
npm run eval:fast           # Fast recognition eval harness
```

### Web (`web/`)
```sh
cd web
npm run dev                 # Vite dev server on 5173
npm run build               # TypeScript build + production bundle
npm run lint                # ESLint
npm test                    # Full web test suite (Vitest)
npx vitest run src/lib/pairSelection.test.ts  # Single web test file
```

### Root utilities
```sh
./scripts/generate-audio.sh
./scripts/generate-audio.sh --force
```

## High-Level Architecture

- `web/src/App.tsx` is the shell/orchestrator for Learn, Practice, Categories, and Profile modes.
- `web/src/hooks/usePracticeSession.ts` is the frontend state hub (pair loading, practice batches, weak-pair mode, progress wiring).
- `web/src/hooks/usePracticeAttempt.ts` and `web/src/hooks/useAudioRecorder.ts` own recording lifecycle and mic capture behavior.
- Progress is local-first in `web/src/lib/progressStorage.ts`; authenticated cloud sync overlays on the same store shape via `web/src/lib/authApi.ts`.
- API routes are mounted centrally in `api/src/index.ts` (`pairs`, `audio`, `recognize`, `auth`, `me`, `progress`) with two-tier rate limiting middleware.
- `api/src/routes/recognize.ts` handles candidate-constrained Whisper matching and experiment modes (`repetition`, `frame_sentence`, `two-pass` fallback).
- `api/src/db/schema.ts` + D1 hold canonical word-pair data; audio is pre-generated `.m4a` assets served from R2 by `GET /api/audio/:word`.

## Key Conventions (Project-Specific)

- Run Wrangler through `npm run wrangler -- <args>` in `api/` (wrapper script injects local env correctly); do not call `npx wrangler` directly for normal repo workflows.
- Keep web API calls centralized through `API_BASE` in `web/src/lib/api.ts` (`VITE_API_URL + '/api'`), not hardcoded endpoint strings inside components.
- Keep frontend logic in hooks/lib; components should stay mostly presentational and callback-driven.
- Treat `web/src/lib/types.ts` as the canonical frontend type source; update it before threading new fields across UI/hooks.
- Keep route registration centralized in `api/src/index.ts`; route modules export `*Routes` Hono instances and are mounted there.
- Frame-sentence recognition (`matchFrameSentence` / `extractFrameWord`) is production-critical in `api/src/routes/recognize.ts`; do not remove when changing recognition flow.
- CSS layering is intentional: `web/src/index.css` imports `styles/tokens.css` → `styles/components.css` → `styles/screens.css`.
- CI deploys are split by path: `.github/workflows/deploy-api.yml` triggers on `api/**`, and `.github/workflows/deploy-web.yml` on `web/**`.

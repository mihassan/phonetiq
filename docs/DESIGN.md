# Design Document: Phonetiq

## Architecture Overview
Phonetiq is built as a single-page application (SPA) using React 19 (via Vite) deployed to **Cloudflare Pages**. It relies on a backend API powered by **Cloudflare Workers** with the Hono framework.

The initial prototype (`index.html`) relied on browser-native `SpeechSynthesis` and `SpeechRecognition` APIs, but due to browser fragmentation, poor Safari support, and dialect issues, the architecture was redesigned to rely on Cloudflare's ecosystem for 100% compatibility.

## Tech Stack
*   **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React (Cloudflare Pages).
*   **Backend:** Cloudflare Workers (Hono framework for routing).
*   **Database:** Cloudflare D1 (SQLite) via Drizzle ORM.
*   **Storage (TTS Audio):** Cloudflare R2 bucket (pre-generated `.m4a` files).
*   **AI (Speech-to-Text):** Cloudflare Workers AI (`@cf/openai/whisper`).
*   **CI/CD:** GitHub Actions with `cloudflare/wrangler-action` for both frontend and API.

## Visual Theme (Glacier / Dark)
The app uses a dark "Glacier" theme focused on high contrast readability and cool accent colors.

### Core tokens
* **Background:** `#0a0e1a`
* **Surface:** `#0f1524`
* **Surface Variant:** `#1a2438`
* **Primary:** `#7dd3fc`
* **Secondary:** `#88b4cc`
* **Tertiary:** `#c8a0f0`
* **Text:** `#e0e8f0`
* **Muted Text:** `#a0b4c4`
* **Outline:** `#4a6070`
* **Error:** `#ff6b6b`

### Typography and shape
* **Color mode:** Dark
* **Font family:** Inter (headline/body/label)
* **Roundness:** 12px baseline (`ROUND_TWELVE`)
* **Theme seed color:** `#7dd3fc`

## Data Model (D1 Schema - `schema.sql`)
The word pairs are no longer a hardcoded array. They live in D1, allowing the app to filter by dialect (e.g., US vs UK) and phonetic category (e.g., vowels, fricatives, voicing).

```sql
CREATE TABLE word_pairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word1 TEXT NOT NULL,
  word2 TEXT NOT NULL,
  phoneme_type TEXT NOT NULL, -- e.g., 'vowel_short', 'consonant_voicing', 'fricative'
  target_sounds TEXT,         -- e.g., '/ɪ/ vs /iː/'
  dialect_filter TEXT,        -- e.g., 'all', 'us_only', 'uk_only'
  difficulty_level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Addressing the "Dialect Trap"
Minimal pairs are highly dependent on the speaker's accent. For example:
- `["hut", "heart"]` is a minimal pair in non-rhotic accents (UK/Aus) but not General American.
- `["cot", "caught"]` is distinct in the UK, but identical for most North Americans due to the cot-caught merger.
The `dialect_filter` column ensures the app only presents relevant pairs based on the user's selected dialect (default: General American).

## Audio Pipelines
### 1. Text-to-Speech (TTS) Pipeline
*   **Problem:** Browser `speechSynthesis` voices vary in quality/accent across platforms; Google Translate URLs are undocumented and rate-limited.
*   **Solution:** Pre-generated `.m4a` audio files stored in a **Cloudflare R2** bucket. Audio is generated locally using macOS `say` command via `scripts/generate-audio.sh` and cached in `.audio-cache/`.
*   **Workflow:** Frontend requests `GET /api/audio/:word` → Worker fetches the `.m4a` file from R2 → returns it with proper `Content-Type: audio/mp4` header. All 338 audio files (for 186 word pairs) are pre-generated and uploaded to R2 during initial setup.

### 2. Speech-to-Text (STT) Pipeline
*   **Problem:** `SpeechRecognition` is unsupported in Firefox and buggy in Safari.
*   **Solution:** The universally supported HTML5 `MediaRecorder` API captures audio on the frontend.
*   **Workflow:** User taps the mic button → 3-second recording with visual countdown (SVG progress ring) → audio blob sent to `POST /api/recognize` → Worker passes audio to **Cloudflare Workers AI (`@cf/openai/whisper`)** → transcription returned to frontend for validation against the target word.

### 3. Mic Interaction Design
*   **Option chosen:** Tap once to start, auto-stop after 3 seconds.
*   **Visual feedback:** SVG progress ring + countdown text during recording, prominent transcript display after processing.
*   **Architecture:** The `useAudioRecorder` hook is a "dumb" wrapper — it only starts/stops when told. `usePracticeAttempt` orchestrates the 3s timing and status transitions.

## Rate Limiting
Two-tier native Cloudflare rate limiting (configured in `wrangler.toml`):
*   **AI endpoint:** 10 requests/minute per IP (protects the expensive Whisper AI call)
*   **All API routes:** 100 requests/minute per IP (general protection)

## Deployment
*   **Frontend:** Cloudflare Pages (Direct Upload via `wrangler pages deploy`), auto-deployed by GitHub Actions on push to `web/`.
*   **API:** Cloudflare Workers (via `wrangler deploy`), auto-deployed by GitHub Actions on push to `api/`.
*   **Custom Domains:** `phonetiq.mihassan.com` (Pages) and `api.phonetiq.mihassan.com` (Worker custom domain).

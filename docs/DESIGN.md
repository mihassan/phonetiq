# Design Document: Phonetiq

## Architecture Overview
Phonetiq is built as a single-page application (SPA) using React 19 (via Vite) deployed to **Cloudflare Pages**. It relies on a backend API powered by **Cloudflare Workers** with the Hono framework.

The initial prototype (`index.html`) relied on browser-native `SpeechSynthesis` and `SpeechRecognition` APIs, but due to browser fragmentation, poor Safari support, and dialect issues, the architecture was redesigned to rely on Cloudflare's ecosystem for 100% compatibility.

## Tech Stack
*   **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React (Cloudflare Pages).
*   **Backend:** Cloudflare Workers (Hono framework for routing).
*   **Database:** Cloudflare D1 (SQLite) via Drizzle ORM.
*   **Storage (TTS Audio):** Cloudflare R2 bucket (pre-generated `.m4a` files).
*   **AI (Speech-to-Text):** Cloudflare Workers AI (`@cf/openai/whisper-large-v3-turbo`).
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
  dialect_filter TEXT,        -- e.g., 'all', 'us_only', 'uk_only', 'au_only'
  difficulty_level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Addressing the "Dialect Trap"
Minimal pairs are highly dependent on the speaker's accent. For example:
- `["hut", "heart"]` is a minimal pair in non-rhotic accents (UK/Aus) but not in many rhotic American accents.
- `["cot", "caught"]` is distinct in the UK, but identical for most North Americans due to the cot-caught merger.
The `dialect_filter` column ensures the app only presents relevant pairs based on selected dialect. In the UI, `Common` maps to `all` (shared/cross-dialect pairs), while `UK`, `US`, and `AU` each request `all` plus their dialect-specific additions (`uk_only`, `us_only`, `au_only`).

## Audio Pipelines
### 1. Text-to-Speech (TTS) Pipeline
*   **Problem:** Browser `speechSynthesis` voices vary in quality/accent across platforms; Google Translate URLs are undocumented and rate-limited.
*   **Solution:** Pre-generated `.m4a` audio files stored in a **Cloudflare R2** bucket. Audio is generated via a portable Google Cloud Text-to-Speech batch script (`scripts/generate-audio.ts`, wrapped by `scripts/generate-audio.sh`) and cached in `.audio-cache/`.
*   **Audio Dialects:** Phonetiq supports three audio dialects with one default voice per dialect in v1:
    - `en-US` — General American English
    - `en-GB` — Received Pronunciation (British English)
    - `en-AU` — Australian English
*   **Asset Key Structure:** Audio files are organized as `<dialect>/<voice>/<word>.m4a` (e.g., `en-us/default/ship.m4a`). The generator emits one default voice per dialect, and the API attempts to locate assets in order: exact match → dialect-only → legacy flat key fallback.
*   **Workflow:** Frontend requests `GET /api/audio/:word?dialect=en-AU&voice=default` → Worker attempts R2 keys in fallback order → returns the `.m4a` file with proper `Content-Type: audio/mp4` header. All audio files are pre-generated and uploaded to R2 during initial setup.

### 2. Speech-to-Text (STT) Pipeline
*   **Problem:** `SpeechRecognition` is unsupported in Firefox and buggy in Safari.
*   **Solution:** The universally supported HTML5 `MediaRecorder` API captures audio on the frontend.
*   **Workflow:** User taps the mic button → 3-second recording with visual countdown (SVG progress ring) → audio blob sent to `POST /api/recognize` with the two candidate words and selected dialect → Worker sends base64 audio to **Cloudflare Workers AI (`@cf/openai/whisper-large-v3-turbo`)** with `language=en`, `vad_filter=true`, and dialect-aware prompt context → backend maps transcript to candidate 1 / candidate 2 / `no_match` → structured result returned to frontend.

#### Robust Audio Processing (New)
To handle real-world recording conditions, the frontend now includes:

1.  **Arming State:** Shows "Starting mic..." while waiting for the microphone to warm up and capture the first audio chunk
2.  **Wait for Recorder Readiness:** 500ms warm-up delay + waits for first non-empty data chunk before considering the recorder "ready" (with 1500ms timeout fallback)
3.  **Noise Detection:** Analyzes recording metrics to detect flat, high-activity captures (likely environmental noise like fans/AC). Classifies as `possible_noise` when activity ratio > 0.75 with low peak-to-average ratio.
4.  **Speech Window Trimming:** Uses audio level sampling to detect the actual speech region, then trims leading/trailing silence before sending to Whisper
5.  **Analyser Fallback:** If Web Audio API analyser is unavailable, gracefully continues with reduced metrics

#### Audio DSP Pipeline
Applied in `encodeWavSegment` (always-on, no flag required):

1.  **16 kHz resample** — Whisper is trained on 16 kHz; downsampling before upload reduces payload size and removes content above Nyquist for the model
2.  **80 Hz high-pass filter** — Removes low-frequency rumble (desk vibration, HVAC) that can confuse VAD
3.  **−18 dBFS loudness normalisation** — Brings quiet recordings up to a consistent level, reducing no-match from soft speech

#### Frame-Sentence Recognition (Production)
Users are prompted to say *"The word is X"* instead of just *X*. The backend extracts the target word from the sentence context before matching. Eval result: **97% correct** (+21 pp vs 76% baseline), 0 no-match. This is now the single production recognition path.

This dramatically improves recognition reliability in non-ideal recording environments.

The Practice screen also surfaces a short contextual tip when a user misses the frame phrase, and the debug transcript/response panel stays behind a local-only dev toggle so production remains clean.

Practice feedback now includes a small success cue, a transcript preview chip, and reason-specific miss guidance for frame misses, noisy captures, and weak recordings.

## Practice Session Personalization
*   **Local Progress Store:** Practice outcomes are persisted in browser storage (attempts, correctness, completions, streaks, weak-pair signals, timestamps).
*   **Adaptive Batch Sessions:** Practice mode runs refreshable batches instead of global index jumps. Default batch size is 15 with a fixed weak-pair quota of 5; remaining items are filled from unseen then medium-weak pairs.
*   **Profile & Weak Review:** Profile stage shows aggregate stats (accuracy, attempts, streaks, completions) plus weak pairs/categories and supports a weak-pair practice entry action.

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

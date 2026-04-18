# Design Document: Phonetiq

## Architecture Overview
Phonetiq is built as a single-page application (SPA) using React (via Vite) deployed to **Cloudflare Pages**. It relies heavily on a backend API powered by **Cloudflare Workers**. 

The initial prototype (`index.html`) relied on browser-native `SpeechSynthesis` and `SpeechRecognition` APIs, but due to browser fragmentation, poor Safari support, and dialect issues, the architecture was redesigned to rely on Cloudflare's ecosystem for 100% compatibility.

## Tech Stack
*   **Frontend:** React 18, Vite, Tailwind CSS, Lucide React (Cloudflare Pages).
*   **Backend:** Cloudflare Workers (Hono framework recommended for routing).
*   **Database:** Cloudflare D1 (SQLite) via Drizzle ORM.
*   **Storage (TTS Audio):** Cloudflare R2 bucket.
*   **AI (Speech-to-Text):** Cloudflare Workers AI (`@cf/openai/whisper`).

## Data Model (D1 Schema - `schema.sql`)
The word pairs are no longer a hardcoded array. They live in D1, allowing the app to filter by dialect (e.g., US vs UK) and phonetic category (e.g., vowels, fricatives, voicing).

```sql
CREATE TABLE word_pairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word1 TEXT NOT NULL,
  word2 TEXT NOT NULL,
  phoneme_type TEXT NOT NULL, -- e.g., 'vowels', 'consonants', 'fricatives'
  target_sounds TEXT,         -- e.g., '/ɪ/ vs /i:/'
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
*   **Problem:** Browser `speechSynthesis` voices vary in quality/accent; Google Translate URLs are undocumented and rate-limited.
*   **Solution:** We use pre-generated high-quality audio files (.mp3) stored in a **Cloudflare R2** bucket.
*   **Workflow:** Frontend requests `https://audio.phonetiq.app/word.mp3`. If the file is missing in R2, a Worker intercepts the request, calls a premium TTS service (e.g., OpenAI/ElevenLabs), saves the `.mp3` to R2 for future requests, and serves it back to the user.

### 2. Speech-to-Text (STT) Pipeline
*   **Problem:** `SpeechRecognition` is unsupported in Firefox and buggy in Safari.
*   **Solution:** We use the universally supported HTML5 `MediaRecorder` API on the frontend to capture a short audio blob of the user speaking.
*   **Workflow:** The frontend sends the blob to a Cloudflare Worker via `POST /api/recognize`. The Worker passes the audio to **Cloudflare Workers AI (`@cf/openai/whisper`)**, transcribes it, and returns the recognized text to the frontend for validation.

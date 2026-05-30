# Word Pair Expansion and AU-Ready Audio Specification

## Overview

This document defines the product contract for Phonetiq's curriculum expansion and audio dialect support. It establishes the content filtering model, audio asset variants, voice policy, and curriculum growth targets.

## Content Dialect Filter Values

The `dialect_filter` column in the `word_pairs` table accepts the following values:

- **`all`** — Pairs that are relevant across all major English dialects (General American, Received Pronunciation, Australian English). These pairs form the core curriculum.
- **`uk_only`** — Pairs that are phonologically distinct in UK English but not in other major dialects. Example: `hut` vs `heart` (non-rhotic distinction).
- **`us_only`** — Pairs that are phonologically distinct in US English but not in other major dialects. Example: `cot` vs `caught` (cot-caught merger in many US accents).
- **`au_only`** — Pairs that are phonologically distinct in Australian English but not in other major dialects. This category is seeded with an initial starter set and should keep expanding with research-backed additions.

Users select a content dialect via the UI (`Common`, `UK`, `US`, `AU`), which filters the available pairs to `all` plus the selected dialect-specific subset.

## Audio Dialect Values

Audio assets are tagged with a dialect code that maps to a specific accent and voice:

- **`en-US`** — General American English accent
- **`en-GB`** — Received Pronunciation (British English) accent
- **`en-AU`** — Australian English accent

These values are used in audio asset keys and query parameters to request dialect-specific pronunciations.

## Voice Policy (v1)

In the first release, Phonetiq supports **one default voice per audio dialect**:

- `en-US` → default voice (e.g., US English TTS voice)
- `en-GB` → default voice (e.g., British English TTS voice)
- `en-AU` → default voice (e.g., Australian English TTS voice)

There is no user-facing voice picker in v1. All users within a dialect hear the same voice. Future releases may add multiple voices per dialect, but the current contract is intentionally minimal to reduce asset generation and storage overhead.

## Audio Asset Key Structure

Pre-generated audio files are stored in Cloudflare R2 under a hierarchical key structure:

```
<dialect>/<voice>/<word>.m4a
```

Example keys:
- `en-us/default/ship.m4a`
- `en-gb/default/ship.m4a`
- `en-au/default/ship.m4a`

### Fallback Order

When a frontend client requests audio for a word with a specific dialect and voice, the API attempts to locate the asset in this order:

1. `<dialect>/<voice>/<word>.m4a` (exact match)
2. `<dialect>/<word>.m4a` (dialect without voice)
3. `<word>.m4a` (legacy flat key, for backward compatibility)

If no asset is found, the API returns a 404 error.

## Curriculum Expansion Targets

### Pair Count

- **Current state:** 186 pairs (170 common + 16 UK-exclusive)
- **Target state:** 400–600 pairs

This expansion increases coverage of phonetic categories and dialect-specific distinctions.

### Dialect Coverage

- **`all` (common):** Expanded to cover more cross-dialect minimal pairs
- **`uk_only`:** Preserved and expanded with additional UK-specific distinctions
- **`us_only`:** Significantly expanded to cover US-specific phonological features (e.g., cot-caught, pin-pen mergers, r-coloring)
- **`au_only`:** Seeded with an initial starter set in v1 and intended to expand with additional research-backed pairs

### Difficulty Levels

Current pairs use difficulty levels 1–2. The expanded curriculum introduces:

- **Level 1:** Easy pairs with clear, distinct phonetic differences (e.g., `ship` vs `sheep`)
- **Level 2:** Medium pairs with moderate phonetic similarity (e.g., `bit` vs `beat`)
- **Level 3:** Hard pairs with subtle phonetic differences (e.g., `caught` vs `cot` in rhotic accents)
- **Level 4:** Expert pairs with very subtle distinctions or dialect-dependent relevance

Difficulty assignment is pedagogically motivated and may vary by dialect.

## AU Curriculum Policy

### Seeded AU-Exclusive Content

The `au_only` dialect filter is supported in the schema and frontend UI, and now includes an initial AU-exclusive starter dataset. This allows:

- AU content filtering to be exercised in production, not just schema/UI plumbing
- AU audio assets to be generated and served without breaking existing deployments
- Future curriculum expansion to add more AU-specific pairs without schema or type changes

### Research-Backed Requirement

Any `au_only` pairs added to the curriculum must be:

1. **Phonologically justified** — Backed by linguistic research or native speaker consensus that the distinction is relevant in Australian English
2. **Pedagogically sound** — Useful for learners targeting Australian pronunciation
3. **Distinct from other dialects** — Not already covered by `all`, `uk_only`, or `us_only` categories

This prevents junk filler pairs and ensures the curriculum remains high-quality.

## Implementation Notes

- **Pre-generated audio remains the serving model.** No runtime TTS is introduced in this specification.
- **Content dialect and audio dialect are separate concerns.** A user selecting `uk_only` content receives pairs filtered by `dialect_filter = 'all' OR 'uk_only'`, but the audio is served in the `en-GB` dialect.
- **Backward compatibility is maintained.** Existing flat-key audio assets (e.g., `ship.m4a`) continue to work as a fallback.
- **Word sanitization is consistent.** The frontend, API, and audio generation script all use identical sanitization rules (lowercase, remove apostrophes, replace spaces with hyphens).

## Verification Checklist

- [ ] Dialect content filter values are documented: `all`, `uk_only`, `us_only`, `au_only`
- [ ] Audio dialect values are documented: `en-US`, `en-GB`, `en-AU`
- [ ] Voice policy is documented: one default voice per dialect in v1
- [ ] Curriculum expansion target is documented: 400–600 total pairs
- [ ] Difficulty expansion target is documented: move from 2 levels to 3–4 levels
- [ ] AU-only content is documented as seeded and research-backed
- [ ] Audio asset key structure and fallback order are documented
- [ ] Pre-generated audio model is reaffirmed (no runtime TTS)

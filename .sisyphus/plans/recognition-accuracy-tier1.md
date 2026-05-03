# Recognition Accuracy — Tier 1 Plan

**Status:** Proposed
**Date:** 2026-05-03 (Australia/Sydney)
**Owner:** TBD
**Branch:** `main`

---

## 1. Context

Phonetiq's product loop is minimal-pair pronunciation practice (`ship`/`sheep`, `desert`/`dessert`, `cot`/`caught`, `sin`/`sing`). The current recognition pipeline (`api/src/routes/recognize.ts`) does **orthographic-only** matching against Whisper's transcript and frequently confuses near-homophones — exactly the words the product is designed to teach.

A full investigation produced three tiers of solutions:

1. **Tier 1 — Cheap fixes** (this doc): Tune the existing Whisper pipeline. ~1–3 days. No new vendor.
2. **Tier 2 — Azure Pronunciation Assessment**: Real phoneme-level scoring with IPA. ~1–2 weeks. New vendor + cost. **Deferred — see [Tier 2 deferral](#5-tier-2-deferral) below.**
3. **Tier 3 — LLM-as-phonetic-judge over Deepgram phonemes**: **Rejected.** Deepgram's STT API does not return IPA phonemes; the original premise was incorrect. See `docs/PRD.md` history if revisiting.

**This plan covers Tier 1 only.**

---

## 2. Why Tier 1 Before Tier 2

The current pipeline is leaving easy wins on the table. Before paying for a new vendor, fix the obvious bugs and try cheap UX changes that exploit Whisper's existing capabilities. Specifically:

- The current `initial_prompt` (`api/src/routes/recognize.ts:206`) **actively biases Whisper toward both candidates equally**, then we accept fuzzy matches at edit-distance ≤ 1. For a pair like `desert`/`dessert` (edit distance = 1), this means Whisper's language-model prior dominates and acoustic detail is discarded.
- Audio preprocessing in `web/src/hooks/useAudioRecorder.ts` already does silence trimming and speech-window detection (lines 95–174, 241–265), but does **not** loudness-normalize and re-encodes WAV at the **original** sample rate (line 219). Both leave accuracy and bandwidth on the table.
- We have not tried any UX-side disambiguation (repetition, framing) that is cheap to ship and known to work in pronunciation training products.

If Tier 1 lifts pair-level accuracy by, say, 15+ percentage points on minimal pairs, Tier 2 may not be needed. If not, we have a clean baseline to measure Tier 2 against.

---

## 3. Goals & Non-Goals

### Goals
- Materially reduce false positives on minimal pairs (target: ≥15pp reduction in incorrect "correct" verdicts on minimal-pair categories).
- Avoid increasing false negatives by more than 5pp.
- Keep p95 round-trip latency ≤ 1.5× current baseline.
- No new external vendor. No schema migration that blocks rollback.
- Keep cost per recognition ≤ 2× current (i.e., we may run Whisper twice per attempt at most).

### Non-Goals
- Phoneme-level scoring or IPA output (that's Tier 2).
- Stress/syllable analysis.
- Per-user pronunciation profile / adaptation.
- Dialect detection (we keep the existing dialect filter as input, no auto-detection).

---

## 4. Decision Summary

**Adopted approach:**

1. **Foundation fixes** — drop biasing prompt, tighten matcher, add bandpass + loudness norm + 16kHz resample.
2. **UX cheap trick: 3× repetition** for minimal-pair categories (gated by a `requires_repetition` flag on `word_pairs`).
3. **UX cheap trick: "The word is X" frame** as a fallback if 3× repetition is rejected by users.
4. **Two-pass recognition** as a fallback only when matcher returns `no_match` and acoustics are sufficient (gated to stay under cost cap).

**Explicitly rejected:**

- Carrier sentences with semantic context (`I love dessert`) — leaks language-model priors and measures the sentence frame, not pronunciation.
- Aggressive noise reduction beyond browser defaults — destroys fricative discrimination (/s/ /z/ /ʃ/ /θ/), exactly the sounds we need.
- Compressor / dynamic-range compression on top of `autoGainControl` — masks stress patterns.

---

## 5. Tier 2 Deferral

**Decision:** Defer Azure Pronunciation Assessment integration. Revisit if Tier 1 metrics (Section 9) fail to hit the ≥15pp target.

**What Tier 2 would deliver (for future reference):**
- Per-phoneme accuracy scores (0–100) using IPA alphabet.
- Stress and syllable scoring (relevant for `desert`/`dessert` style pairs).
- `PronunciationAssessmentResult` with `accuracy_score`, `fluency_score`, `completeness_score`, `phoneme[]`.
- Direct fit for "your /z/ was strong but stress was on the wrong syllable" UI feedback.

**Why deferred, not killed:**
- Cost: Azure pricing per minute, adds a billing relationship.
- Schema change: needs `phonetic_target_ipa` column on `word_pairs` plus seed regeneration for 186 pairs.
- Worker change: new vendor SDK / REST integration + secret management.
- Tier 1 may be sufficient. Don't pay until we know.

**Trigger conditions to revisit Tier 2:**
- Tier 1 lifts minimal-pair accuracy by < 15pp on the eval set (Section 9).
- User feedback explicitly asks for "what specifically was wrong with my pronunciation" beyond binary correct/incorrect.
- Product roadmap adds stress/intonation lessons.

---

## 6. Foundation Fixes

These are not optional and not experiments — they are bugfixes that should ship together as Phase A.

### F1 — Drop biasing prompt

**File:** `api/src/routes/recognize.ts:204–207`

**Current:**
```ts
prompt =
  candidate1 && candidate2
    ? `${dialectPrompt} The expected options are: ${candidate1} or ${candidate2}.`
    : dialectPrompt;
```

**Change:** Remove the `The expected options are: ...` clause. Keep only the dialect prompt. Whisper will transcribe what it actually hears instead of being primed to pick from two equally-weighted options.

**Why:** When both candidates are mentioned in the prompt, Whisper's language model treats them as equiprobable and falls back to acoustics. Acoustics for minimal pairs are subtle, so it picks one essentially at random with slight bias from training data. Removing the candidate hint forces Whisper to commit to what it hears.

**Risk:** Whisper may produce out-of-vocabulary transcripts (e.g., proper nouns, homophones not in our pair set). Mitigated by F2 (strict matcher).

### F2 — Tighten the matcher

**File:** `api/src/routes/recognize.ts:147–151`

**Current:**
```ts
if (bestDistance <= 1 && distanceGap >= 1) {
  return distance1 < distance2
    ? { matchedWord: candidate1, matchType: 'fuzzy', debug }
    : { matchedWord: candidate2, matchType: 'fuzzy', debug };
}
```

**Change:** Drop the fuzzy-match branch. Require exact match or token match only. Return `no_match` otherwise so the user can retry.

**Implementation (per DB-C decision, 2026-05-03):**
- **No schema change.** Strict matching becomes the server-side default for all pairs. All 186 currently seeded pairs are minimal pairs by product definition; they all want strict matching.
- The matcher function `matchTranscriptToCandidates` still takes a `strict: boolean` parameter so that:
  - The legacy fuzzy path is preserved as dead-but-tested code (Vitest covers it).
  - If/when non-minimal pairs are added, we can flip the parameter without re-implementing the branch.
- The recognize route passes `strict: true` unconditionally.
- Adding a `word_pairs.requires_strict_match` column is deferred until a non-minimal-pair category is introduced — at which point the column + Pair type field + frontend forward becomes warranted. Documented as a follow-up, not a blocker.

**Why:** `desert` ↔ `dessert` is edit distance 1. Fuzzy matching at distance ≤ 1 makes them mutually substitutable. The `distanceGap >= 1` guard does not help because both candidates are typically at distance 0 or 1 from the transcript.

**Risk:** Increases `no_match` rate. This is acceptable — we'd rather ask the user to retry than confirm a wrong answer. Mitigated by E1 (3× repetition) and E2 (frame sentence).

### F3 — Loudness normalization

**File:** `web/src/hooks/useAudioRecorder.ts:192–239` (`encodeWavSegment`)

**Change:** Before writing PCM samples, compute RMS over the speech window and scale samples to target -16 LUFS (or simpler: target peak of -3 dBFS, which is cheaper to compute and good enough).

**Why:** `autoGainControl: true` (line 308) helps but is conservative and varies by browser. Whisper accuracy degrades on quiet recordings. Normalizing client-side before upload is free and deterministic.

**Risk:** Clipping if normalization is too aggressive. Mitigate with peak-target rather than RMS-target.

### F4 — Bandpass / high-pass filter

**File:** `web/src/hooks/useAudioRecorder.ts` (new helper, applied during `encodeWavSegment`)

**Change:** Apply a single-pole high-pass at 80 Hz before quantization. (Optional: low-pass at 8 kHz, but Whisper handles that internally.)

**Why:** Strips room rumble, AC hum, mic handling noise. None of these carry phonemic information. Implementation: ~10 lines of biquad-like filtering on the Float32 channel data inside `encodeWavSegment`.

**Risk:** None significant. 80 Hz is well below F0 of any human voice.

### F5 — Resample to 16 kHz mono

**File:** `web/src/hooks/useAudioRecorder.ts:192–239`

**Change:** During WAV encoding, resample to 16 kHz (Whisper's native rate) instead of preserving the AudioContext default (typically 44.1 or 48 kHz). Already mono in current code.

**Why:**
- Cuts upload bytes by ~3× — relevant given the 1MB limit at `recognize.ts:188`.
- Whisper internally resamples to 16 kHz anyway. Doing it client-side avoids quality loss from server-side downsampling and reduces Worker CPU.
- Faster network = lower latency.

**Risk:** Resampling artifacts if done badly. Use simple linear-interpolation resampling — phonemic content survives this cleanly.

---

## 7. Experiments (Cheap UX Tricks)

Each experiment is gated behind a feature flag and scoped to a specific phase. Run sequentially, not in parallel — we need to attribute lift to a specific change.

### Experiment E1 — 3× Repetition

**Hypothesis:** Asking the user to say the target word 3 times with pauses produces 3 independent acoustic samples. Requiring ≥2 of 3 transcribed tokens to match the target reduces false positives by exploiting Whisper's per-utterance noise.

**UX:**
- For minimal-pair pairs (flagged by `requires_repetition`), the practice card prompts: *"Say the word 3 times with a short pause: **desert** ... **desert** ... **desert**."*
- Single recording, single recognize call.
- Server-side: count occurrences of each candidate as whole tokens in the transcript. Pass if dominant candidate appears ≥2 times AND dominates the other by ≥2 occurrences.

**Risk to test for:** Whisper may collapse repetitions ("desert desert desert" → "desert"). The `vad_filter: true` setting in `recognize.ts:213` may exacerbate this. If collapse happens, fall back to splitting audio into 3 segments client-side and recognizing each.

**Metrics:**
- Primary: false-positive rate on `desert`/`dessert`, `ship`/`sheep`, `cot`/`caught` eval set.
- Secondary: false-negative rate on same set.
- UX: completion rate (do users finish 3 reps or abandon?). Target: ≥85% of started attempts complete.

**Sample size:** Manual eval set of 30 recordings per minimal pair (10 clear-correct, 10 clear-incorrect, 10 ambiguous). Recorded by 3 different speakers (1 native, 2 non-native).

**Acceptance criteria:**
- ≥10pp reduction in false-positive rate vs Phase-A-only baseline.
- ≤5pp increase in false-negative rate.
- ≥85% completion rate.

**Rollout flag:** `EXPERIMENT_REPETITION` (env var, default off). Per-pair via `requires_repetition` column.

### Experiment E2 — "The word is X" Frame

**Hypothesis:** A neutral carrier phrase ("The word is dessert") forces clearer articulation, gives Whisper acoustic context for VAD/segmentation, and avoids the silence-edge issues that affect single-word recordings — without leaking semantic priors toward either candidate.

**UX:**
- Practice card prompts: *"Say: **'The word is dessert.'**"*
- Server-side: extract the target word from the transcript using a simple template match (`/the word is (\S+)/i`). Run the existing matcher on just that captured group.

**Risk to test for:** Some users may speak the carrier with strong sentence intonation that obscures the target word's stress. Test with non-native speakers especially.

**Why neutral, not semantic:** "The word is X" does **not** disambiguate `desert` vs `dessert` semantically. Compare with the rejected idea "I love X" (biases to `dessert`) or "I travelled in a X" (biases to `desert`). Whisper has no semantic reason to prefer one form in "The word is X."

**Metrics:** Same as E1.

**Sample size:** Same eval set as E1 (30 per pair × 3 pairs × 3 speakers).

**Acceptance criteria:**
- ≥8pp reduction in false-positive rate vs Phase-A-only baseline.
- ≤3pp increase in false-negative rate.
- ≥90% completion rate (this is easier UX than E1).

**Rollout flag:** `EXPERIMENT_FRAME_SENTENCE`. Per-pair via `requires_frame_sentence`.

### Experiment E3 — E1 + E2 Combined

**Hypothesis:** Combining 3× repetition with the frame sentence ("The word is desert. Desert. Desert.") stacks the acoustic robustness of E1 with the articulation effect of E2. Run this only if neither E1 nor E2 alone hits the target.

**UX:** *"Say: **'The word is desert.'** Then say **desert** two more times."*

**Metrics:** Same as E1.

**Acceptance criteria:**
- ≥15pp reduction in false-positive rate vs Phase-A-only baseline.
- ≤5pp increase in false-negative rate.
- ≥75% completion rate (longer, harder UX).

**Rollout flag:** `EXPERIMENT_FRAME_PLUS_REPETITION`.

### Experiment E4 — Two-pass Recognition (server-side fallback)

**Hypothesis:** When the strict matcher returns `no_match` but audio metrics indicate clear speech, run Whisper twice — once with `initial_prompt` strongly biased to candidate1, once strongly biased to candidate2. If both passes return the same word, the acoustics genuinely support that word. If they disagree, acoustics are ambiguous and we correctly stay at `no_match`.

**Why fallback only:** Doubles AI cost on triggered attempts. The 10 req/min/IP rate limit on the AI endpoint (set in `wrangler.toml`) means a user can hit ~5 two-pass attempts per minute, which is fine for the practice loop but worth gating.

**UX:** Invisible to user. Just delivers more accurate verdict on edge cases.

**Trigger condition (server-side):**
- F1+F2 matcher returned `no_match`.
- Audio bytes ≥ 8 KB (i.e., not low-signal).
- The `requires_two_pass` flag is set on the pair OR the `two_pass_global` env var is on.

**Algorithm:**
- Pass A: `initial_prompt = "${dialectPrompt} The speaker said the word ${candidate1}."`
- Pass B: `initial_prompt = "${dialectPrompt} The speaker said the word ${candidate2}."`
- Tokenize each transcript. If pass A's first content word == candidate1 AND pass B's first content word == candidate1 → match candidate1. Symmetric for candidate2. Otherwise stay at `no_match`.

**Metrics:**
- Coverage: % of `no_match` results that get resolved to a confident match.
- Precision of resolved matches (manually graded).
- Cost: AI calls per attempt (target: ≤ 1.3 average, i.e., two-pass triggered on ≤30% of attempts).

**Sample size:** 100 attempts that hit `no_match` after Phase A+B.

**Acceptance criteria:**
- Precision ≥90% on resolved matches.
- Triggered ≤30% of attempts.

**Rollout flag:** `EXPERIMENT_TWO_PASS`.

---

## 8. Phasing & Rollout

| Phase | Scope | Ship gate | Estimated effort |
|---|---|---|---|
| **A1 — Server foundation** | F1 + F2 (drop biasing prompt + strict matcher) | A1 eval shows directionally correct lift on synthetic fixtures; no regression on clear-correct | 0.5 day |
| **A2 — Audio foundation** | F3 + F4 + F5 (loudness norm + HPF + 16kHz resample) | A2 eval shows additional lift OR neutral effect; manual ear check confirms audio sounds clean | 0.5 day |
| **B — Repetition experiment** | E1 behind flag | E1 acceptance criteria | 1 day |
| **C — Frame experiment** | E2 behind flag | E2 acceptance criteria | 0.5 day |
| **D — Combination** | E3 behind flag (only if A+B+C insufficient) | E3 acceptance criteria | 0.5 day |
| **E — Two-pass fallback** | E4 server-side fallback | E4 acceptance criteria | 1 day |

**Phase A is split into A1 (server) and A2 (audio DSP)** so we can attribute lift to specific changes. They share the same flag (`RECOGNITION_FOUNDATION_V2`) but A2's audio code lives in `web/` and A1's in `api/`, so they can ship in separate PRs.

**Phase A eval method (decided 2026-05-03):** synthetic fixtures generated via macOS `say` command. Sanity check only, not ground-truth quality. Real-speaker eval is post-Phase-A work if we proceed to Phase B+.

Total budget: ~4.5 working days. Stop early if Phase A alone meets goals.

---

## 9. Measurement

### Eval set construction

- 3 minimal-pair targets: `desert/dessert`, `ship/sheep`, `cot/caught`.
- 3 speakers: 1 native (US or UK), 2 non-native (different L1s, e.g., Spanish, Mandarin).
- 30 recordings per pair: 10 clear-correct, 10 clear-incorrect (intentionally said the wrong word), 10 ambiguous (mid-quality, accent-influenced).
- Stored as fixtures in `api/test/fixtures/recognition-eval/` (gitignored if large; checked in if small).
- Manually labeled ground truth.

### Metrics computed per phase

- **False positive rate** (FPR): user said word A, system marked correct as A but actually said B or unintelligible.
- **False negative rate** (FNR): user said word A clearly, system returned `no_match` or marked as B.
- **No-match rate** (NMR): % of attempts returning `no_match`.
- **Avg AI calls per attempt**: cost proxy.
- **p95 round-trip latency**: from frontend perspective.

### Baseline (current `main`)

Establish baseline by running the current pipeline against the eval set before Phase A. Record FPR/FNR/NMR per pair. All deltas in this plan are relative to that baseline.

### Reporting

After each phase, append a short results section to this doc with:
- Date
- Eval set version
- Per-pair FPR/FNR/NMR before and after
- Decision: ship, iterate, or skip remaining phases

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| F1 (no candidate hint) causes Whisper to produce wildly wrong transcripts on accented speech | Medium | High FNR | F2 returns `no_match`; user retries. Falls back to E4 if enabled. |
| F3 loudness norm clips on already-loud recordings | Low | Distortion → wrong transcript | Use peak-target (-3 dBFS) not RMS-target. Skip if peak already > -3 dBFS. |
| F5 resample artifacts | Low | Slight accuracy loss | Linear interpolation is sufficient for speech band. |
| E1 Whisper collapses repetitions to single word | Medium | E1 doesn't work as designed | Detect by running on 3-rep eval samples first. If collapse happens, split audio client-side and submit 3 separate calls (more cost). |
| E2 carrier sentence biases users to mumble target word | Low | FPR worsens on E2 | Sample E2 recordings during dev; if mumbling visible, drop E2. |
| E4 two-pass doubles cost beyond budget | Low (gated) | Hits rate limit | Per-pair gating; global rate-limit aware. |
| Eval set too small to detect 5pp differences | High | Wrong conclusions | Acknowledged; eval is directional, not statistical. Larger eval is post-Tier-1 work. |

---

## 10b. QA Verification Scenarios

Each item below has a specific tool, concrete steps, and expected outputs. Run before considering the phase shippable.

### F1 — Drop biasing prompt

**Tool:** `wrangler dev` + `curl` against local Worker.

**Steps:**
1. `cd api && npx wrangler dev` (port 8787).
2. Submit a known recording with debug enabled:
   ```bash
   curl -X POST http://localhost:8787/api/recognize \
     -H "Origin: http://localhost:5173" \
     -F "audio=@api/test/fixtures/recognition-eval/desert-clear-01.wav" \
     -F "candidate1=desert" \
     -F "candidate2=dessert" \
     -F "dialect=all" \
     -F "debug=1"
   ```
3. Inspect `debug.prompt` field in JSON response.

**Expected:** `debug.prompt` contains the dialect sentence ONLY, with no `"The expected options are: ... or ..."` clause.

**Fail signal:** Prompt still mentions both candidates.

### F2 — Tighten matcher

**Prerequisite:** API package currently has no test runner. Two options, decide before Phase A starts:

- **Option 2a (recommended):** Add `vitest` + `"test": "vitest run"` to `api/package.json` as a one-time tooling change, then write tests as below.
- **Option 2b:** Skip unit tests; verify F2 entirely via the live `curl` script in F1 plus the Phase A integration check. Acceptable for Tier 1 scope but loses regression coverage.

**Tool:** Vitest unit test in `api/test/recognize.test.ts` (new file). Vitest is being added to `api/` as a one-time tooling change (see §13 Q5).

**Steps:**
1. (One-time) Install Vitest and add `"test": "vitest run"` script:
   ```bash
   cd api && npm install --save-dev vitest @vitest/runner
   ```
   Then add `"test": "vitest run"` to `api/package.json` scripts.
2. Export `matchTranscriptToCandidates` from `recognize.ts` (currently a module-local function).
3. Add unit tests covering both branches of the new `strict` parameter:
   - `matchTranscriptToCandidates("desert", "desert", "dessert", true)` → `matchType: "exact"`, `matchedWord: "desert"`.
   - `matchTranscriptToCandidates("desert", "dessert", "desert", true)` → `matchType: "exact"`, `matchedWord: "desert"`.
   - `matchTranscriptToCandidates("deserts", "desert", "dessert", true)` → `matchType: "no_match"` (strict mode disables fuzzy).
   - `matchTranscriptToCandidates("deserts", "desert", "dessert", false)` → `matchType: "fuzzy"`, `matchedWord: "desert"` (legacy behavior preserved for future non-minimal pairs).
   - Token match still works in strict mode: `matchTranscriptToCandidates("the desert", "desert", "dessert", true)` → `matchType: "token"`.
4. `cd api && npm test`.

**Expected:** All five assertions pass.

**Fail signal:** Strict-mode test still returns `fuzzy` match.

### F3 — Loudness normalization

**Tool:** `vitest` unit test in `web/src/hooks/useAudioRecorder.test.ts` + manual ear check. (Web already has Vitest configured: `web/package.json` has `"test": "vitest run"`.)

**Steps:**
1. Add a unit test that calls `encodeWavSegment` (export it from `useAudioRecorder.ts` if not already exported) with a synthetic AudioBuffer at -20 dBFS peak. Assert output WAV peak is between -4 and -2 dBFS.
2. `cd web && npm test`.
3. Manual: record a deliberately quiet utterance in dev. Open the resulting WAV in Audacity (or play back); confirm it is audibly louder than a pre-fix recording of similar volume.

**Expected:** Unit test passes. Manual recording is audibly normalized.

**Fail signal:** Output peak still matches input peak (no normalization), or peak exceeds 0 dBFS (clipping).

### F4 — Bandpass filter

**Tool:** `vitest` unit test + spectrum check. (Same Vitest setup as F3.)

**Steps:**
1. Unit test: feed a 50 Hz sine wave (synthesized as a Float32Array) through the new high-pass helper; assert output amplitude < 5% of input.
2. Unit test: feed a 1 kHz sine wave through; assert output amplitude > 95% of input.
3. `cd web && npm test`.

**Expected:** Both assertions pass.

**Fail signal:** 50 Hz tone passes through unattenuated, OR 1 kHz tone is attenuated.

### F5 — Resample to 16 kHz mono

**Tool:** WAV header inspection via `xxd` or Node script.

**Steps:**
1. Make a recording in dev mode; capture the uploaded WAV by adding a temporary `console.log(blob.size)` in `usePracticeAttempt.ts` and downloading the blob via the dev debug panel.
2. Run:
   ```bash
   xxd -l 44 /tmp/recorded.wav | head
   ```
   The sample rate is bytes 24–27 (little-endian uint32).
3. Confirm sample rate is `0x80 0x3E 0x00 0x00` = 16000.
4. Confirm channels (bytes 22–23) = `0x01 0x00` = 1.
5. Verify upload size is < 33% of pre-fix recording of same duration.

**Expected:** Sample rate = 16000, channels = 1, byte size dropped ≥66%.

**Fail signal:** Sample rate is 44100 or 48000.

### Phase A integration check

**Tool:** Manual eval against fixture set.

**Steps:**
1. With all of F1–F5 enabled and `RECOGNITION_FOUNDATION_V2=true`:
2. Run an eval script (`api/scripts/run-eval.ts`, to be written as part of Phase A):
   ```bash
   cd api && npx tsx scripts/run-eval.ts --fixtures test/fixtures/recognition-eval --candidates desert,dessert
   ```
3. Script outputs FPR/FNR/NMR per pair plus comparison vs baseline JSON.

**Expected:** FPR drops by ≥10pp on the minimal-pair eval set; FNR rises by ≤5pp.

**Fail signal:** FPR change < 10pp, or FNR change > 5pp.

### E1 — 3× repetition

**Tool:** Manual eval against repetition-specific fixtures + UX completion check.

**Steps:**
1. Record 30 fixtures per pair where speaker says target word 3 times with pauses. Store in `api/test/fixtures/recognition-eval/repetition/`.
2. Set `EXPERIMENT_REPETITION=true` and `requires_repetition=true` for eval pair.
3. Run `npx tsx scripts/run-eval.ts --mode repetition`.
4. Inspect output: did Whisper return 3 tokens or did it collapse?
5. Manual UX: open `localhost:5173`, practice the flagged pair, confirm prompt copy reads "Say the word 3 times..." and that recording works end-to-end.

**Expected:** Eval shows ≥10pp FPR reduction vs Phase A. UX prompt visible and recording succeeds.

**Fail signal:** Whisper consistently collapses to 1 token (then we need client-side splitting — see Risk table).

### E2 — Frame sentence

**Tool:** Manual eval + UX check.

**Steps:**
1. Record 30 fixtures per pair of speakers saying "The word is X." Store in `recognition-eval/frame/`.
2. Set `EXPERIMENT_FRAME_SENTENCE=true` and `requires_frame_sentence=true` for eval pair.
3. Run eval script in `--mode frame`.
4. Server-side regex must extract the target word; verify by inspecting `debug.matching.normalizedTranscript` and confirming the captured group matches one of the candidates in ≥95% of fixtures.
5. Manual UX: confirm practice card prompt reads "Say: 'The word is X.'"

**Expected:** ≥95% extraction rate. ≥8pp FPR reduction vs Phase A. UX prompt visible.

**Fail signal:** Extraction rate < 95% (Whisper drops "the word is" preamble) — fall back to last-token extraction.

### E3 — Combined

**Tool:** Same as E1+E2.

**Steps:** Re-record 30 fixtures saying "The word is X. X. X." for each pair. Run eval. Confirm ≥15pp FPR reduction.

**Expected:** ≥15pp FPR reduction vs Phase A. ≥75% completion rate in dev manual test.

### E4 — Two-pass fallback

**Tool:** `wrangler dev` + ambiguous fixture + log inspection.

**Steps:**
1. Set `EXPERIMENT_TWO_PASS=true`.
2. Submit an ambiguous recording (one Phase A returned `no_match` for):
   ```bash
   curl -X POST http://localhost:8787/api/recognize \
     -F "audio=@api/test/fixtures/recognition-eval/ambiguous-01.wav" \
     -F "candidate1=desert" \
     -F "candidate2=dessert" \
     -F "dialect=all" \
     -F "debug=1"
   ```
3. Inspect Worker logs for two `AI.run` calls.
4. Inspect response: if both passes converge, `matchType` should be `exact` or `token`; if they diverge, `matchType` stays `no_match`.
5. Run on 100 `no_match` fixtures from Phase A; manually grade the resolved subset.

**Expected:** Two AI calls visible in logs. Resolved-match precision ≥90%. Triggered on ≤30% of attempts.

**Fail signal:** Resolved precision < 90% (means two-pass is being too generous; tighten the convergence rule).

### Cross-cutting checks (every phase)

Before claiming phase complete, run these commands as defined in the current `package.json` files:

```bash
# api typecheck (script exists: "tsc --noEmit")
cd api && npm run typecheck

# api tests — only if Option 2a (Vitest added) was chosen for F2
cd api && npm test

# web typecheck via the existing build script ("tsc -b && vite build")
# Web has no separate typecheck script; build runs tsc -b first, so this is the equivalent gate.
cd web && npm run build

# web unit tests (script exists: "vitest run")
cd web && npm test

# web lint (script exists: "eslint .")
cd web && npm run lint
```

**Manual cross-browser smoke test:**

```bash
# Build with the production API base
cd web && VITE_API_URL=https://api.phonetiq.mihassan.com npm run build
# Deploy to a Pages preview branch via GitHub Actions (push to a non-main branch) OR locally:
npx wrangler pages deploy dist --project-name phonetiq --branch tier1-preview
```

Then load the preview URL on:
- Chrome desktop (latest).
- Firefox desktop (latest).
- Safari macOS (latest).
- Safari iOS (latest, real device — `MediaRecorder` behavior differs).
- Chrome Android (latest).

Practice 5 non-flagged pairs per browser. Expected: no regressions vs `main` (same accept/reject decisions on those pairs). Record any deltas in the phase results section.

---

## 11. Rollback Plan

Each foundation fix and experiment is behind a feature flag. Rollback granularity:

- **F1–F5 (Phase A):** Single env var `RECOGNITION_FOUNDATION_V2`. Defaults off in prod until eval passes. Set to `true` to enable all five together. Setting back to `false` reverts the entire Phase A.
- **E1–E4:** Each has its own env var (`EXPERIMENT_*`). Per-pair flags in `word_pairs` schema.
- **Schema:** `requires_strict_match`, `requires_repetition`, `requires_frame_sentence`, `requires_two_pass` columns are additive and nullable. Removing them is safe migration.

If a phase regresses production accuracy:
1. Flip its flag off (config change, no redeploy needed if using Worker secrets/vars).
2. Regenerate baseline numbers to confirm rollback worked.
3. Document the regression in this doc's results section.
4. Schema columns can be left in place (defaults handle missing data).

---

## 12. Out of Scope (for this plan)

- Database migration tooling changes (use existing Drizzle workflow).
- Changes to `wrangler.toml` rate limits (current limits handle two-pass within budget).
- Frontend visual redesign of the practice card (text changes only for E1/E2/E3).
- New telemetry pipeline (use existing dev-only `debug` payload to inspect during eval).
- Cross-device user-level adaptation (per-user accent calibration, etc).
- Tier 2 (Azure Pronunciation Assessment) integration.

---

## 13. Open Questions

_Resolved 2026-05-03 before Phase A kickoff:_

1. **`requires_strict_match` default:** TRUE for all 186 existing pairs. They are all minimal pairs by product definition. Future non-minimal pairs opt out explicitly.
2. **Per-pair experiment flags location:** Columns on `word_pairs`. Revisit only if flag count exceeds ~5.
3. **Per-user A/B rollout:** Out of scope for Tier 1. Per-pair gating is sufficient at current scale.
4. **Eval fixtures location:** `api/test/fixtures/recognition-eval/` in git. WAVs at 16kHz mono are ~30KB each → ~3MB for 90 clips, well within git tolerance. Gitignored only if total exceeds 5MB.
5. **API test runner:** Adding Vitest to `api/` as a one-time tooling change. Matcher tests live in `api/test/recognize.test.ts`. (Decided 2026-05-03; supersedes Option 2a/2b in §10b F2.)
6. **Phase A eval speaker count:** 1 speaker (you) for baseline measurement. 30 clips × 3 pairs = 90 clips. Multi-speaker eval deferred to post-Phase-A when Tier 1 viability is known.

---

## 14. References

- `api/src/routes/recognize.ts` — current recognition pipeline
- `web/src/hooks/useAudioRecorder.ts` — current preprocessing
- `api/src/db/schema.ts` — `word_pairs` schema (no IPA columns currently)
- `api/src/db/seed.sql` — current pair dataset (186 pairs)
- `docs/PRD.md`, `docs/DESIGN.md` — product context
- Whisper model card: `@cf/openai/whisper-large-v3-turbo` (Cloudflare Workers AI)

---

## 15. Results Log

_To be appended after each phase completes._

### Phase A (Foundation)
- [ ] Date:
- [ ] Eval baseline numbers:
- [ ] Post-Phase-A numbers:
- [ ] Decision:

### Phase B (E1 Repetition)
- [ ] Date:
- [ ] Numbers:
- [ ] Decision:

### Phase C (E2 Frame)
- [ ] Date:
- [ ] Numbers:
- [ ] Decision:

### Phase D (E3 Combined)
- [ ] Date:
- [ ] Numbers:
- [ ] Decision:

### Phase E (E4 Two-pass)
- [ ] Date:
- [ ] Numbers:
- [ ] Decision:

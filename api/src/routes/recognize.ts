import { Hono } from 'hono';
import type { Env } from '../index';

export const recognizeRoutes = new Hono<{ Bindings: Env }>();

type MatchType = 'exact' | 'token' | 'fuzzy' | 'no_match' | 'freeform';

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string) {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
}

function matchTranscriptToCandidates(
  transcript: string,
  candidate1?: string,
  candidate2?: string,
): {
  matchedWord: string | null;
  matchType: MatchType;
  debug: Record<string, unknown>;
} {
  if (!candidate1 || !candidate2) {
    return {
      matchedWord: null,
      matchType: 'freeform',
      debug: {
        normalizedTranscript: normalizeText(transcript),
        candidate1: candidate1 ?? null,
        candidate2: candidate2 ?? null,
      },
    };
  }

  const c1 = normalizeText(candidate1);
  const c2 = normalizeText(candidate2);
  const normalized = normalizeText(transcript);
  const tokens = normalized.split(' ').filter(Boolean);
  const hasC1Token = tokens.includes(c1);
  const hasC2Token = tokens.includes(c2);
  const distance1 = levenshtein(normalized, c1);
  const distance2 = levenshtein(normalized, c2);
  const bestDistance = Math.min(distance1, distance2);
  const distanceGap = Math.abs(distance1 - distance2);

  const debug = {
    normalizedTranscript: normalized,
    tokens,
    candidate1: c1,
    candidate2: c2,
    hasCandidate1Token: hasC1Token,
    hasCandidate2Token: hasC2Token,
    distance1,
    distance2,
    bestDistance,
    distanceGap,
  };

  if (!normalized) {
    return { matchedWord: null, matchType: 'no_match', debug };
  }

  if (normalized === c1) return { matchedWord: candidate1, matchType: 'exact', debug };
  if (normalized === c2) return { matchedWord: candidate2, matchType: 'exact', debug };

  if (hasC1Token && !hasC2Token) return { matchedWord: candidate1, matchType: 'token', debug };
  if (hasC2Token && !hasC1Token) return { matchedWord: candidate2, matchType: 'token', debug };

  if (bestDistance <= 1 && distanceGap >= 1) {
    return distance1 < distance2
      ? { matchedWord: candidate1, matchType: 'fuzzy', debug }
      : { matchedWord: candidate2, matchType: 'fuzzy', debug };
  }

  return { matchedWord: null, matchType: 'no_match', debug };
}

// POST /api/recognize - Transcribe audio blob using Workers AI (Whisper)
recognizeRoutes.post('/', async (c) => {
  const contentType = c.req.header('content-type') || '';
  const origin = c.req.header('origin') || '';
  let candidate1: string | undefined;
  let candidate2: string | undefined;
  let dialect: string | undefined;
  let shouldDebug = false;

  let audioBytes: ArrayBuffer;

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData();
    const file = formData.get('audio');
    candidate1 = String(formData.get('candidate1') || '').trim() || undefined;
    candidate2 = String(formData.get('candidate2') || '').trim() || undefined;
    dialect = String(formData.get('dialect') || '').trim() || undefined;
    shouldDebug = String(formData.get('debug') || '').trim() === '1';

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'Missing "audio" file in form data' }, 400);
    }
    audioBytes = await file.arrayBuffer();
  } else {
    audioBytes = await c.req.arrayBuffer();
  }

  if (audioBytes.byteLength === 0) {
    return c.json({ error: 'Empty audio payload' }, 400);
  }

  if (audioBytes.byteLength > 1_048_576) {
    return c.json({ error: 'Audio too large (max 1MB)' }, 413);
  }

  try {
    const base64Audio = arrayBufferToBase64(audioBytes);

    const dialectPrompt =
      dialect === 'uk_only'
        ? 'The speaker will say one short English word in British English.'
        : dialect === 'us_only'
          ? 'The speaker will say one short English word in American English.'
          : dialect === 'au_only'
            ? 'The speaker will say one short English word in Australian English.'
            : 'The speaker will say one short English word in common international English.';

    const prompt =
      candidate1 && candidate2
        ? `${dialectPrompt} The expected options are: ${candidate1} or ${candidate2}.`
        : dialectPrompt;

    const result = await c.env.AI.run('@cf/openai/whisper-large-v3-turbo', {
      audio: base64Audio,
      task: 'transcribe',
      language: 'en',
      vad_filter: true,
      initial_prompt: prompt,
    } as Record<string, unknown>);

    const rawResult = result as Record<string, unknown>;
    const rawTranscript = (rawResult.text as string || '').trim();
    const transcript = rawTranscript.toLowerCase().trim();
    const { matchedWord, matchType, debug } = matchTranscriptToCandidates(
      rawTranscript,
      candidate1,
      candidate2,
    );

    return c.json({
      transcript,
      matchedWord,
      matchType,
      debug: shouldDebug && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
        ? {
            rawTranscript,
            normalizedTranscript: normalizeText(rawTranscript),
            audioBytes: audioBytes.byteLength,
            prompt,
            matching: debug,
            rawResult,
          }
        : null,
    });
  } catch (err) {
    console.error('Whisper AI error:', err);
    return c.json({ error: 'Speech recognition failed' }, 500);
  }
});

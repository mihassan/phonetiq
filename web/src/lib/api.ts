import type { AudioDialect, AudioVoice } from './types';

export const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export async function fetchPairs(params?: {
  category?: string;
  dialect?: string;
  limit?: number;
  offset?: number;
}) {
  const url = new URL(`${API_BASE}/pairs`, window.location.origin);
  if (params?.category) url.searchParams.set('category', params.category);
  if (params?.dialect) url.searchParams.set('dialect', params.dialect);
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.offset) url.searchParams.set('offset', String(params.offset));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch pairs');
  return res.json();
}

export async function fetchCategories(params?: { dialect?: string }) {
  const url = new URL(`${API_BASE}/pairs/categories`, window.location.origin);
  if (params?.dialect) url.searchParams.set('dialect', params.dialect);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export function audioUrl(
  word: string,
  options?: { dialect?: AudioDialect; voice?: AudioVoice },
): string {
  const sanitized = word.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-');
  const url = new URL(`${API_BASE}/audio/${encodeURIComponent(sanitized)}`, window.location.origin);
  if (options?.dialect) url.searchParams.set('dialect', options.dialect);
  if (options?.voice) url.searchParams.set('voice', options.voice);
  return url.toString();
}

export interface RecognizeSpeechResult {
  transcript: string;
  matchedWord: string | null;
  matchType: 'exact' | 'token' | 'fuzzy' | 'no_match' | 'freeform';
  debug?: {
    rawTranscript: string;
    normalizedTranscript: string;
    audioBytes?: number;
    prompt?: string;
    rawResult?: Record<string, unknown>;
    matching?: Record<string, unknown>;
  } | null;
}

type SpeechRecognitionFailure = Error & {
  status?: number;
  debug?: RecognizeSpeechResult['debug'];
  body?: unknown;
};

async function readErrorBody(res: Response) {
  const text = await res.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return text;
  }
}

export async function recognizeSpeech(
  audioBlob: Blob,
  options?: { candidate1?: string; candidate2?: string; dialect?: string; debug?: boolean },
): Promise<RecognizeSpeechResult> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  if (options?.candidate1) formData.append('candidate1', options.candidate1);
  if (options?.candidate2) formData.append('candidate2', options.candidate2);
  if (options?.dialect) formData.append('dialect', options.dialect);
  if (options?.debug) formData.append('debug', '1');

  const res = await fetch(`${API_BASE}/recognize`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const body = await readErrorBody(res);
    const errorMessage =
      body && typeof body === 'object' && typeof body.error === 'string'
        ? body.error
        : 'Speech recognition failed';
    const error = new Error(errorMessage) as SpeechRecognitionFailure;
    error.status = res.status;
    error.body = body;
    if (body && typeof body === 'object' && 'debug' in body) {
      error.debug = (body.debug as RecognizeSpeechResult['debug']) ?? null;
    }
    throw error;
  }

  const data = await res.json();

  return {
    transcript: data.transcript || '',
    matchedWord: data.matchedWord ?? null,
    matchType: data.matchType ?? 'freeform',
    debug: data.debug ?? null,
  };
}

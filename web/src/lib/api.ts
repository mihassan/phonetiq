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

export function audioUrl(word: string): string {
  const sanitized = word.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-');
  return `${API_BASE}/audio/${encodeURIComponent(sanitized)}`;
}

export interface RecognizeSpeechResult {
  transcript: string;
  matchedWord: string | null;
  matchType: 'exact' | 'token' | 'fuzzy' | 'no_match' | 'freeform';
}

export async function recognizeSpeech(
  audioBlob: Blob,
  options?: { candidate1?: string; candidate2?: string; dialect?: string },
): Promise<RecognizeSpeechResult> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  if (options?.candidate1) formData.append('candidate1', options.candidate1);
  if (options?.candidate2) formData.append('candidate2', options.candidate2);
  if (options?.dialect) formData.append('dialect', options.dialect);

  const res = await fetch(`${API_BASE}/recognize`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Speech recognition failed');
  const data = await res.json();

  return {
    transcript: data.transcript || '',
    matchedWord: data.matchedWord ?? null,
    matchType: data.matchType ?? 'freeform',
  };
}

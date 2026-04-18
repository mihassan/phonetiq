const API_BASE = '/api';

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

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/pairs/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export function audioUrl(word: string): string {
  const sanitized = word.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-');
  return `${API_BASE}/audio/${encodeURIComponent(sanitized)}`;
}

export async function recognizeSpeech(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const res = await fetch(`${API_BASE}/recognize`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Speech recognition failed');
  const data = await res.json();
  return data.transcript || '';
}

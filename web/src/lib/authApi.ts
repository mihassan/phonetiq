import { API_BASE } from './api';
import type { AuthUser, ProgressStore } from './types';

export function getLoginUrl() {
  return `${API_BASE}/auth/login`;
}

export async function fetchCurrentUser(): Promise<{ user: AuthUser | null }> {
  const res = await fetch(`${API_BASE}/me`, {
    credentials: 'include',
  });

  if (!res.ok) throw new Error('Failed to fetch current user');
  return res.json();
}

export async function logoutUser(): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) throw new Error('Failed to logout');
  return res.json();
}

export async function fetchCloudProgress(): Promise<{ store: ProgressStore | null }> {
  const res = await fetch(`${API_BASE}/progress`, {
    credentials: 'include',
  });

  if (res.status === 401) return { store: null };
  if (!res.ok) throw new Error('Failed to fetch cloud progress');
  return res.json();
}

export async function importCloudProgress(
  store: ProgressStore,
  mode: 'merge' | 'replace' = 'merge',
): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/progress/import`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ store, mode }),
  });

  if (!res.ok) throw new Error('Failed to import cloud progress');
  return res.json();
}

export async function updateCloudProgressAttempt(attempt: {
  pairId: number;
  category: string;
  dialect: string;
  targetWord: 1 | 2;
  isCorrect: boolean;
  timestamp?: string;
}): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/progress/update`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ attempt }),
  });

  if (!res.ok) throw new Error('Failed to update cloud progress');
  return res.json();
}

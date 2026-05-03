import type { PairProgress, ProgressAttemptEvent, ProgressStore } from './types';

export const PROGRESS_STORAGE_KEY = 'phonetiq.progress.v1';

const memoryStorageData = new Map<string, string>();

const memoryStorage: Storage = {
  get length() {
    return memoryStorageData.size;
  },
  clear() {
    memoryStorageData.clear();
  },
  getItem(key: string) {
    return memoryStorageData.has(key) ? memoryStorageData.get(key)! : null;
  },
  key(index: number) {
    return Array.from(memoryStorageData.keys())[index] ?? null;
  },
  removeItem(key: string) {
    memoryStorageData.delete(key);
  },
  setItem(key: string, value: string) {
    memoryStorageData.set(key, value);
  },
};

function getStorage(): Storage {
  if (
    typeof window !== 'undefined' &&
    window.localStorage &&
    typeof window.localStorage.getItem === 'function' &&
    typeof window.localStorage.setItem === 'function' &&
    typeof window.localStorage.removeItem === 'function'
  ) {
    return window.localStorage;
  }

  return memoryStorage;
}

function createEmptyProgressStore(): ProgressStore {
  return {
    totalAttempts: 0,
    totalCorrect: 0,
    currentStreak: 0,
    bestStreak: 0,
    sessionsCount: 0,
    completedPairIds: [],
    lastPracticedAt: null,
    pairs: {},
  };
}

function createPairProgress(event: ProgressAttemptEvent): PairProgress {
  return {
    pairId: event.pairId,
    category: event.category,
    dialect: event.dialect,
    word1Attempts: 0,
    word1Correct: 0,
    word2Attempts: 0,
    word2Correct: 0,
    pairCompletions: 0,
    exposureCount: 0,
    recentIncorrectCount: 0,
    successStreak: 0,
    lastSeenAt: event.timestamp,
    lastCorrectAt: null,
  };
}

function persistProgressStore(store: ProgressStore) {
  getStorage().setItem(PROGRESS_STORAGE_KEY, JSON.stringify(store));
}

export function saveProgressStore(store: ProgressStore) {
  persistProgressStore(store);
}

export function setRawProgressStore(raw: string) {
  getStorage().setItem(PROGRESS_STORAGE_KEY, raw);
}

export function loadProgressStore(): ProgressStore {
  const raw = getStorage().getItem(PROGRESS_STORAGE_KEY);
  if (!raw) return createEmptyProgressStore();

  try {
    const parsed = JSON.parse(raw) as ProgressStore;
    if (!parsed || typeof parsed !== 'object' || !parsed.pairs) {
      return createEmptyProgressStore();
    }

    return {
      ...createEmptyProgressStore(),
      ...parsed,
      completedPairIds: Array.isArray(parsed.completedPairIds) ? parsed.completedPairIds : [],
      pairs: parsed.pairs ?? {},
    };
  } catch {
    return createEmptyProgressStore();
  }
}

export function resetProgressStore() {
  getStorage().removeItem(PROGRESS_STORAGE_KEY);
}

export function updateProgressForAttempt(event: ProgressAttemptEvent): ProgressStore {
  const store = loadProgressStore();
  const key = String(event.pairId);
  const pair = store.pairs[key] ?? createPairProgress(event);

  if (pair.exposureCount === 0) {
    store.sessionsCount += 1;
  }

  store.totalAttempts += 1;
  if (event.isCorrect) {
    store.totalCorrect += 1;
    store.currentStreak += 1;
    store.bestStreak = Math.max(store.bestStreak, store.currentStreak);
  } else {
    store.currentStreak = 0;
  }

  pair.exposureCount += 1;
  pair.lastSeenAt = event.timestamp;
  pair.category = event.category;
  pair.dialect = event.dialect;

  if (event.targetWord === 1) {
    pair.word1Attempts += 1;
    if (event.isCorrect) pair.word1Correct += 1;
  } else {
    pair.word2Attempts += 1;
    if (event.isCorrect) pair.word2Correct += 1;
  }

  if (event.isCorrect) {
    pair.lastCorrectAt = event.timestamp;
    pair.successStreak += 1;
    pair.recentIncorrectCount = Math.max(0, pair.recentIncorrectCount - 1);
  } else {
    pair.successStreak = 0;
    pair.recentIncorrectCount += 1;
  }

  if (pair.word1Correct > 0 && pair.word2Correct > 0 && pair.successStreak >= 3) {
    if (pair.pairCompletions === 0) {
      store.completedPairIds = Array.from(new Set([...store.completedPairIds, event.pairId]));
    }
    pair.pairCompletions = 1;
  }

  store.pairs[key] = pair;
  store.lastPracticedAt = event.timestamp;

  persistProgressStore(store);
  return store;
}

export function exportProgressStore() {
  return JSON.stringify(loadProgressStore(), null, 2);
}

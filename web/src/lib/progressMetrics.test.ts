import { describe, expect, it } from 'vitest';
import {
  buildCategoryProgress,
  buildWeakPairs,
  getOverallAccuracy,
  getProfileSummary,
} from './progressMetrics';
import { scorePairForPractice } from './pairSelection';
import type { Category, ProgressStore, WordPair } from './types';

const pairs: WordPair[] = [
  {
    id: 1,
    word1: 'ship',
    word2: 'sheep',
    phoneme_type: 'vowel_short',
    target_sounds: '/ɪ/ vs /iː/',
    dialect_filter: 'all',
    difficulty_level: 1,
  },
  {
    id: 2,
    word1: 'thin',
    word2: 'tin',
    phoneme_type: 'fricative',
    target_sounds: '/θ/ vs /t/',
    dialect_filter: 'all',
    difficulty_level: 1,
  },
];

const categories: Category[] = [
  { phoneme_type: 'vowel_short', count: 1 },
  { phoneme_type: 'fricative', count: 1 },
];

const store: ProgressStore = {
  totalAttempts: 10,
  totalCorrect: 6,
  currentStreak: 2,
  bestStreak: 4,
  sessionsCount: 3,
  completedPairIds: [1],
  lastPracticedAt: '2026-04-20T12:00:00.000Z',
  pairs: {
    '1': {
      pairId: 1,
      category: 'vowel_short',
      dialect: 'us_only',
      word1Attempts: 3,
      word1Correct: 2,
      word2Attempts: 2,
      word2Correct: 2,
      pairCompletions: 1,
      exposureCount: 3,
      recentIncorrectCount: 1,
      successStreak: 2,
      lastSeenAt: '2026-04-20T11:59:00.000Z',
      lastCorrectAt: '2026-04-20T11:59:00.000Z',
    },
    '2': {
      pairId: 2,
      category: 'fricative',
      dialect: 'us_only',
      word1Attempts: 3,
      word1Correct: 1,
      word2Attempts: 2,
      word2Correct: 1,
      pairCompletions: 0,
      exposureCount: 5,
      recentIncorrectCount: 3,
      successStreak: 0,
      lastSeenAt: '2026-04-20T12:00:00.000Z',
      lastCorrectAt: '2026-04-20T11:58:00.000Z',
    },
  },
};

describe('progressMetrics', () => {
  it('calculates overall accuracy', () => {
    expect(getOverallAccuracy(store)).toBe(60);
  });

  it('builds category progress from real pair stats', () => {
    const progress = buildCategoryProgress(categories, pairs, store);

    expect(progress.vowel_short.completedPairs).toBe(1);
    expect(progress.vowel_short.accuracy).toBe(80);
    expect(progress.fricative.completedPairs).toBe(0);
    expect(progress.fricative.accuracy).toBe(40);
  });

  it('returns weak pairs sorted by weakness score', () => {
    const weakPairs = buildWeakPairs(pairs, store, 2);

    expect(weakPairs[0].pair.id).toBe(2);
    expect(weakPairs[1].pair.id).toBe(1);
  });

  it('builds profile summary stats', () => {
    const summary = getProfileSummary(pairs, categories, store);

    expect(summary.totalAttempts).toBe(10);
    expect(summary.accuracy).toBe(60);
    expect(summary.completedPairs).toBe(1);
    expect(summary.currentStreak).toBe(2);
    expect(summary.bestStreak).toBe(4);
    expect(summary.weakPairs[0].pair.id).toBe(2);
    expect(summary.weakCategories[0].category).toBe('fricative');
  });

  it('buildWeakPairs ranks pairs in the same order as scorePairForPractice', () => {
    const weakPairs = buildWeakPairs(pairs, store, 2);

    expect(weakPairs[0].pair.id).toBe(2);
    expect(weakPairs[1].pair.id).toBe(1);

    expect(weakPairs[0].weaknessScore).toBe(scorePairForPractice(pairs[1], store));
    expect(weakPairs[1].weaknessScore).toBe(scorePairForPractice(pairs[0], store));
  });
});

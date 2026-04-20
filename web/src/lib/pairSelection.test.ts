import { describe, expect, it } from 'vitest';
import { buildWeakPairQueue, pickAdaptiveNextIndex, scorePairForPractice } from './pairSelection';
import type { ProgressStore, WordPair } from './types';

const pairs: WordPair[] = [
  {
    id: 1,
    word1: 'ship',
    word2: 'sheep',
    phoneme_type: 'vowel_short',
    target_sounds: null,
    dialect_filter: 'all',
    difficulty_level: 1,
  },
  {
    id: 2,
    word1: 'thin',
    word2: 'tin',
    phoneme_type: 'fricative',
    target_sounds: null,
    dialect_filter: 'all',
    difficulty_level: 1,
  },
  {
    id: 3,
    word1: 'rice',
    word2: 'lice',
    phoneme_type: 'liquid',
    target_sounds: null,
    dialect_filter: 'all',
    difficulty_level: 1,
  },
];

const progress: ProgressStore = {
  totalAttempts: 20,
  totalCorrect: 13,
  currentStreak: 0,
  bestStreak: 5,
  sessionsCount: 4,
  completedPairIds: [1],
  lastPracticedAt: '2026-04-20T13:00:00.000Z',
  pairs: {
    '1': {
      pairId: 1,
      category: 'vowel_short',
      dialect: 'all',
      word1Attempts: 5,
      word1Correct: 4,
      word2Attempts: 5,
      word2Correct: 4,
      pairCompletions: 1,
      exposureCount: 8,
      recentIncorrectCount: 0,
      successStreak: 4,
      lastSeenAt: '2026-04-20T12:00:00.000Z',
      lastCorrectAt: '2026-04-20T12:00:00.000Z',
    },
    '2': {
      pairId: 2,
      category: 'fricative',
      dialect: 'all',
      word1Attempts: 3,
      word1Correct: 1,
      word2Attempts: 2,
      word2Correct: 1,
      pairCompletions: 0,
      exposureCount: 5,
      recentIncorrectCount: 3,
      successStreak: 0,
      lastSeenAt: '2026-04-20T13:00:00.000Z',
      lastCorrectAt: '2026-04-20T11:55:00.000Z',
    },
  },
};

describe('pairSelection', () => {
  it('scores weak pairs higher than mastered ones', () => {
    const weakScore = scorePairForPractice(pairs[1], progress);
    const masteredScore = scorePairForPractice(pairs[0], progress);

    expect(weakScore).toBeGreaterThan(masteredScore);
  });

  it('prioritizes unseen pairs above mastered pairs', () => {
    const unseenScore = scorePairForPractice(pairs[2], progress);
    const masteredScore = scorePairForPractice(pairs[0], progress);

    expect(unseenScore).toBeGreaterThan(masteredScore);
  });

  it('builds weak pair queue ordered by weakness', () => {
    const queue = buildWeakPairQueue(pairs, progress, 2);

    expect(queue).toHaveLength(2);
    expect(queue[0].id).toBe(2);
  });

  it('chooses next practice index using weighted randomness', () => {
    const next = pickAdaptiveNextIndex(pairs, progress, 0, () => 0);

    expect(next).toBe(1);
  });
});

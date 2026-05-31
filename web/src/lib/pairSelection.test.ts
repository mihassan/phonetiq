import { describe, expect, it } from 'vitest';
import {
  buildPracticeBatch,
  buildWeakPairQueue,
  pickAdaptiveNextIndex,
  scorePairForPractice,
} from './pairSelection';
import { getPairProgressKey } from './progressKeys';
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
    [getPairProgressKey(1, 'us_only')]: {
      pairId: 1,
      category: 'vowel_short',
      dialect: 'us_only',
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
    [getPairProgressKey(2, 'us_only')]: {
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
      lastSeenAt: '2026-04-20T13:00:00.000Z',
      lastCorrectAt: '2026-04-20T11:55:00.000Z',
    },
  },
};

describe('pairSelection', () => {
  it('scores weak pairs higher than mastered ones', () => {
    const weakScore = scorePairForPractice(pairs[1], progress, 'us_only');
    const masteredScore = scorePairForPractice(pairs[0], progress, 'us_only');

    expect(weakScore).toBeGreaterThan(masteredScore);
  });

  it('prioritizes unseen pairs above mastered pairs', () => {
    const unseenScore = scorePairForPractice(pairs[2], progress, 'us_only');
    const masteredScore = scorePairForPractice(pairs[0], progress, 'us_only');

    expect(unseenScore).toBeGreaterThan(masteredScore);
  });

  it('builds weak pair queue ordered by weakness', () => {
    const queue = buildWeakPairQueue(pairs, progress, 'us_only', 2);

    expect(queue).toHaveLength(2);
    expect(queue[0].id).toBe(2);
  });

  it('deprioritizes weak pilot contrasts when learning scores are otherwise equal', () => {
    const pilotPairs: WordPair[] = [
      {
        id: 10,
        word1: 'coat',
        word2: 'cot',
        phoneme_type: 'vowel_long',
        target_sounds: '/oʊ/ vs /ɔ/',
        dialect_filter: 'us_only',
        difficulty_level: 2,
        contrast_strength: 'weak',
      },
      {
        id: 11,
        word1: 'card',
        word2: 'cord',
        phoneme_type: 'vowel_long',
        target_sounds: '/ɑr/ vs /ɔr/',
        dialect_filter: 'us_only',
        difficulty_level: 2,
        contrast_strength: 'supported',
      },
    ];

    const pilotProgress: ProgressStore = {
      ...progress,
      pairs: {
        [getPairProgressKey(10, 'us_only')]: {
          pairId: 10,
          category: 'vowel_long',
          dialect: 'us_only',
          word1Attempts: 2,
          word1Correct: 1,
          word2Attempts: 2,
          word2Correct: 1,
          pairCompletions: 0,
          exposureCount: 4,
          recentIncorrectCount: 2,
          successStreak: 0,
          lastSeenAt: '2026-04-20T13:00:00.000Z',
          lastCorrectAt: null,
        },
        [getPairProgressKey(11, 'us_only')]: {
          pairId: 11,
          category: 'vowel_long',
          dialect: 'us_only',
          word1Attempts: 2,
          word1Correct: 1,
          word2Attempts: 2,
          word2Correct: 1,
          pairCompletions: 0,
          exposureCount: 4,
          recentIncorrectCount: 2,
          successStreak: 0,
          lastSeenAt: '2026-04-20T13:00:00.000Z',
          lastCorrectAt: null,
        },
      },
    };

    const queue = buildWeakPairQueue(pilotPairs, pilotProgress, 'us_only', 2);

    expect(queue.map((pair) => pair.id)).toEqual([11, 10]);
  });

  it('excludes unavailable pilot contrasts from the batch entirely', () => {
    const pilotPairs: WordPair[] = [
      {
        id: 20,
        word1: 'cot',
        word2: 'caught',
        phoneme_type: 'vowel_long',
        target_sounds: '/ɒ/ vs /ɔː/',
        dialect_filter: 'uk_only',
        difficulty_level: 2,
        contrast_strength: 'unavailable',
      },
      {
        id: 21,
        word1: 'card',
        word2: 'cord',
        phoneme_type: 'vowel_long',
        target_sounds: '/ɑr/ vs /ɔr/',
        dialect_filter: 'us_only',
        difficulty_level: 2,
      },
      {
        id: 22,
        word1: 'peer',
        word2: 'pear',
        phoneme_type: 'vowel_long',
        target_sounds: '/ɪə/ vs /eː/',
        dialect_filter: 'au_only',
        difficulty_level: 3,
      },
    ];

    const batch = buildPracticeBatch(pilotPairs, progress, 'us_only', {
      batchSize: 3,
      random: () => 0.5,
    });

    expect(batch.map((pair) => pair.id)).toEqual(expect.arrayContaining([21, 22]));
    expect(batch.map((pair) => pair.id)).not.toContain(20);
  });

  it('chooses next practice index using weighted randomness', () => {
    const next = pickAdaptiveNextIndex(pairs, progress, 'us_only', 0, () => 0);

    expect(next).toBe(1);
  });

  it('builds a mixed practice batch with fixed weak quota and unseen fill', () => {
    const manyPairs: WordPair[] = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      word1: `word-${i + 1}`,
      word2: `word-${i + 1}-b`,
      phoneme_type: 'vowel_short',
      target_sounds: null,
      dialect_filter: 'all',
      difficulty_level: 1,
    }));

    const seededProgress: ProgressStore = {
      ...progress,
      pairs: {
        ...progress.pairs,
        [getPairProgressKey(4, 'us_only')]: {
          pairId: 4,
          category: 'vowel_short',
          dialect: 'us_only',
          word1Attempts: 6,
          word1Correct: 1,
          word2Attempts: 6,
          word2Correct: 1,
          pairCompletions: 0,
          exposureCount: 6,
          recentIncorrectCount: 4,
          successStreak: 0,
          lastSeenAt: '2026-04-20T13:00:00.000Z',
          lastCorrectAt: null,
        },
        [getPairProgressKey(5, 'us_only')]: {
          pairId: 5,
          category: 'vowel_short',
          dialect: 'us_only',
          word1Attempts: 5,
          word1Correct: 1,
          word2Attempts: 5,
          word2Correct: 1,
          pairCompletions: 0,
          exposureCount: 5,
          recentIncorrectCount: 3,
          successStreak: 0,
          lastSeenAt: '2026-04-20T13:00:00.000Z',
          lastCorrectAt: null,
        },
      },
    };

    const batch = buildPracticeBatch(manyPairs, seededProgress, 'us_only', {
      batchSize: 15,
      weakCount: 5,
      random: () => 0.42,
    });

    expect(batch).toHaveLength(15);
    expect(new Set(batch.map((pair) => pair.id)).size).toBe(15);

    const weakIds = new Set([2, 3, 4, 5]);
    const weakIncluded = batch.filter((pair) => weakIds.has(pair.id));
    expect(weakIncluded.length).toBeGreaterThanOrEqual(3);
  });
});

describe('time-based decay in scorePairForPractice', () => {
  const staleDate = '2026-04-01T00:00:00.000Z';
  const recentDate = '2026-04-28T00:00:00.000Z';
  const now = '2026-05-03T00:00:00.000Z';

  const staleProgress: ProgressStore = {
    ...progress,
    pairs: {
      [getPairProgressKey(2, 'us_only')]: {
        ...progress.pairs[getPairProgressKey(2, 'us_only')],
        recentIncorrectCount: 4,
        lastSeenAt: staleDate,
      },
    },
  };

  const recentProgress: ProgressStore = {
    ...progress,
    pairs: {
      [getPairProgressKey(2, 'us_only')]: {
        ...progress.pairs[getPairProgressKey(2, 'us_only')],
        recentIncorrectCount: 4,
        lastSeenAt: recentDate,
      },
    },
  };

  it('decays recentIncorrectCount when lastSeenAt is >7 days ago', () => {
    const staleScore = scorePairForPractice(pairs[1], staleProgress, 'us_only', now);
    const recentScore = scorePairForPractice(pairs[1], recentProgress, 'us_only', now);

    expect(staleScore).toBeLessThan(recentScore);
  });

  it('does not decay when lastSeenAt is within 7 days', () => {
    const score = scorePairForPractice(pairs[1], recentProgress, 'us_only', now);
    const expectedScoreWithoutDecay = 72;

    expect(score).toBe(expectedScoreWithoutDecay);
  });

  it('halves recentIncorrectCount (floor) for stale pairs — difference is exactly mistakeBoost delta', () => {
    const staleScore = scorePairForPractice(pairs[1], staleProgress, 'us_only', now);
    const recentScore = scorePairForPractice(pairs[1], recentProgress, 'us_only', now);

    // recentIncorrect=4: mistakeBoost(4)=min(30,32)=30, mistakeBoost(2)=min(30,16)=16 → delta=14
    expect(recentScore - staleScore).toBe(14);
  });
});

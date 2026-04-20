import { describe, expect, it, beforeEach } from 'vitest';
import {
  loadProgressStore,
  resetProgressStore,
  saveProgressStore,
  setRawProgressStore,
  updateProgressForAttempt,
} from './progressStorage';
import type { ProgressAttemptEvent, ProgressStore } from './types';

function makeEvent(overrides: Partial<ProgressAttemptEvent> = {}): ProgressAttemptEvent {
  return {
    pairId: 1,
    dialect: 'all',
    category: 'vowel_short',
    targetWord: 1,
    isCorrect: true,
    timestamp: '2026-04-20T12:00:00.000Z',
    ...overrides,
  };
}

describe('progressStorage', () => {
  beforeEach(() => {
    resetProgressStore();
  });

  it('initializes an empty store when storage is missing', () => {
    const store = loadProgressStore();

    expect(store.totalAttempts).toBe(0);
    expect(store.pairs).toEqual({});
  });

  it('records attempts and per-word correctness', () => {
    const afterCorrect = updateProgressForAttempt(makeEvent());

    expect(afterCorrect.totalAttempts).toBe(1);
    expect(afterCorrect.totalCorrect).toBe(1);
    expect(afterCorrect.pairs['1'].word1Attempts).toBe(1);
    expect(afterCorrect.pairs['1'].word1Correct).toBe(1);
    expect(afterCorrect.currentStreak).toBe(1);
    expect(afterCorrect.bestStreak).toBe(1);

    const afterIncorrect = updateProgressForAttempt(
      makeEvent({
        targetWord: 2,
        isCorrect: false,
        timestamp: '2026-04-20T12:00:05.000Z',
      }),
    );

    expect(afterIncorrect.totalAttempts).toBe(2);
    expect(afterIncorrect.totalCorrect).toBe(1);
    expect(afterIncorrect.pairs['1'].word2Attempts).toBe(1);
    expect(afterIncorrect.pairs['1'].word2Correct).toBe(0);
    expect(afterIncorrect.pairs['1'].recentIncorrectCount).toBe(1);
    expect(afterIncorrect.currentStreak).toBe(0);
  });

  it('increments pair completion when both words are correct', () => {
    updateProgressForAttempt(makeEvent({ targetWord: 1, isCorrect: true }));
    const store = updateProgressForAttempt(
      makeEvent({
        targetWord: 2,
        isCorrect: true,
        timestamp: '2026-04-20T12:00:03.000Z',
      }),
    );

    expect(store.pairs['1'].pairCompletions).toBe(1);
    expect(store.completedPairIds).toContain(1);
  });

  it('resets persisted progress', () => {
    updateProgressForAttempt(makeEvent());
    resetProgressStore();

    const reset = loadProgressStore();
    expect(reset.totalAttempts).toBe(0);
  });

  it('recovers from malformed localStorage payload', () => {
    setRawProgressStore('{not-json');

    const store = loadProgressStore();
    expect(store.totalAttempts).toBe(0);
  });

  it('loads a previously saved store', () => {
    const existing: ProgressStore = {
      totalAttempts: 8,
      totalCorrect: 5,
      currentStreak: 2,
      bestStreak: 4,
      sessionsCount: 2,
      completedPairIds: [1, 2],
      lastPracticedAt: '2026-04-20T12:00:00.000Z',
      pairs: {},
    };
    saveProgressStore(existing);

    const loaded = loadProgressStore();
    expect(loaded.totalAttempts).toBe(8);
    expect(loaded.completedPairIds).toEqual([1, 2]);
  });
});

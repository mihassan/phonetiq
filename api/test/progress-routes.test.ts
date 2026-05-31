import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/auth', () => ({
  requireSessionUser: vi.fn().mockResolvedValue({ id: 'user-1' }),
}));

import { progressRoutes } from '../src/routes/progress';

type PreparedCall = {
  query: string;
  args: unknown[];
};

function createDbMock(options: {
  allResults?: unknown[];
  firstResolver?: (query: string, args: unknown[]) => unknown;
}) {
  const preparedCalls: PreparedCall[] = [];
  const runCalls: PreparedCall[] = [];

  const prepare = vi.fn((query: string) => ({
    bind: (...args: unknown[]) => {
      preparedCalls.push({ query, args });
      return {
        all: vi.fn().mockResolvedValue({ results: options.allResults ?? [] }),
        first: vi.fn().mockResolvedValue(options.firstResolver?.(query, args) ?? null),
        run: vi.fn().mockImplementation(async () => {
          runCalls.push({ query, args });
          return { success: true };
        }),
      };
    },
  }));

  return {
    db: { prepare } as unknown as D1Database,
    prepare,
    preparedCalls,
    runCalls,
  };
}

describe('progressRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns separate cloud progress entries for the same pair across dialects', async () => {
    const { db } = createDbMock({
      allResults: [
        {
          pairId: 1,
          category: 'vowel_short',
          dialect: 'us_only',
          word1Attempts: 1,
          word1Correct: 1,
          word2Attempts: 0,
          word2Correct: 0,
          pairCompletions: 0,
          exposureCount: 1,
          recentIncorrectCount: 0,
          successStreak: 1,
          lastSeenAt: '2026-04-20T12:00:00.000Z',
          lastCorrectAt: '2026-04-20T12:00:00.000Z',
        },
        {
          pairId: 1,
          category: 'vowel_short',
          dialect: 'uk_only',
          word1Attempts: 2,
          word1Correct: 1,
          word2Attempts: 1,
          word2Correct: 0,
          pairCompletions: 0,
          exposureCount: 2,
          recentIncorrectCount: 1,
          successStreak: 0,
          lastSeenAt: '2026-04-20T12:01:00.000Z',
          lastCorrectAt: '2026-04-20T12:00:30.000Z',
        },
      ],
    });

    const res = await progressRoutes.request('http://localhost/', { method: 'GET' }, { DB: db });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      store: {
        totalAttempts: 4,
        totalCorrect: 2,
        currentStreak: 0,
        bestStreak: 1,
        sessionsCount: 2,
        completedPairIds: [],
        lastPracticedAt: '2026-04-20T12:01:00.000Z',
        pairs: {
          '1:us_only': {
            pairId: 1,
            category: 'vowel_short',
            dialect: 'us_only',
            word1Attempts: 1,
            word1Correct: 1,
            word2Attempts: 0,
            word2Correct: 0,
            pairCompletions: 0,
            exposureCount: 1,
            recentIncorrectCount: 0,
            successStreak: 1,
            lastSeenAt: '2026-04-20T12:00:00.000Z',
            lastCorrectAt: '2026-04-20T12:00:00.000Z',
          },
          '1:uk_only': {
            pairId: 1,
            category: 'vowel_short',
            dialect: 'uk_only',
            word1Attempts: 2,
            word1Correct: 1,
            word2Attempts: 1,
            word2Correct: 0,
            pairCompletions: 0,
            exposureCount: 2,
            recentIncorrectCount: 1,
            successStreak: 0,
            lastSeenAt: '2026-04-20T12:01:00.000Z',
            lastCorrectAt: '2026-04-20T12:00:30.000Z',
          },
        },
      },
    });
  });

  it('normalizes legacy dialects on update and upserts by pair plus dialect', async () => {
    const { prepare, preparedCalls, runCalls, db } = createDbMock({});

    const res = await progressRoutes.request(
      'http://localhost/update',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          attempt: {
            pairId: 7,
            category: 'vowel_short',
            dialect: 'all',
            targetWord: 1,
            isCorrect: true,
            timestamp: '2026-04-20T12:00:00.000Z',
          },
        }),
      },
      { DB: db },
    );

    expect(res.status).toBe(200);
    expect(prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE user_id = ? AND pair_id = ? AND dialect = ?'));
    expect(preparedCalls[0]?.args).toEqual(['user-1', 7, 'us_only']);
    expect(runCalls[0]?.query).toContain('ON CONFLICT(user_id, pair_id, dialect) DO UPDATE SET');
    expect(runCalls[0]?.args).toEqual([
      'user-1',
      7,
      'vowel_short',
      'us_only',
      1,
      1,
      0,
      0,
      0,
      1,
      0,
      1,
      '2026-04-20T12:00:00.000Z',
      '2026-04-20T12:00:00.000Z',
    ]);
  });

  it('imports same-pair progress without merging across dialects', async () => {
    const { preparedCalls, runCalls, db } = createDbMock({
      firstResolver: (_query, args) => (args[2] === 'us_only'
        ? {
            category: 'vowel_short',
            dialect: 'us_only',
            word1Attempts: 4,
            word1Correct: 3,
            word2Attempts: 1,
            word2Correct: 1,
            pairCompletions: 1,
            exposureCount: 3,
            recentIncorrectCount: 0,
            successStreak: 2,
            lastSeenAt: '2026-04-19T12:00:00.000Z',
            lastCorrectAt: '2026-04-19T12:00:00.000Z',
          }
        : null),
    });

    const res = await progressRoutes.request(
      'http://localhost/import',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'merge',
          store: {
            totalAttempts: 1,
            totalCorrect: 1,
            currentStreak: 1,
            bestStreak: 1,
            sessionsCount: 1,
            completedPairIds: [],
            lastPracticedAt: '2026-04-20T12:00:00.000Z',
            pairs: {
              '7:uk_only': {
                pairId: 7,
                category: 'vowel_short',
                dialect: 'uk_only',
                word1Attempts: 1,
                word1Correct: 1,
                word2Attempts: 0,
                word2Correct: 0,
                pairCompletions: 0,
                exposureCount: 1,
                recentIncorrectCount: 0,
                successStreak: 1,
                lastSeenAt: '2026-04-20T12:00:00.000Z',
                lastCorrectAt: '2026-04-20T12:00:00.000Z',
              },
            },
          },
        }),
      },
      { DB: db },
    );

    expect(res.status).toBe(200);
    expect(preparedCalls[0]?.args).toEqual(['user-1', 7, 'uk_only']);
    expect(runCalls[0]?.args).toEqual([
      'user-1',
      7,
      'vowel_short',
      'uk_only',
      1,
      1,
      0,
      0,
      0,
      1,
      0,
      1,
      '2026-04-20T12:00:00.000Z',
      '2026-04-20T12:00:00.000Z',
    ]);
  });
});

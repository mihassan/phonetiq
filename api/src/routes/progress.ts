import { Hono } from 'hono';
import type { Env } from '../index';
import { requireSessionUser } from '../lib/auth';

type ProgressPair = {
  pairId: number;
  category: string;
  dialect: string;
  word1Attempts: number;
  word1Correct: number;
  word2Attempts: number;
  word2Correct: number;
  pairCompletions: number;
  exposureCount: number;
  recentIncorrectCount: number;
  successStreak: number;
  lastSeenAt: string;
  lastCorrectAt: string | null;
};

type ProgressStorePayload = {
  totalAttempts: number;
  totalCorrect: number;
  currentStreak: number;
  bestStreak: number;
  sessionsCount: number;
  completedPairIds: number[];
  lastPracticedAt: string | null;
  pairs: Record<string, ProgressPair>;
};

function buildStoreFromRows(rows: ProgressPair[]): ProgressStorePayload {
  const pairs = rows.reduce<Record<string, ProgressPair>>((acc, row) => {
    acc[String(row.pairId)] = row;
    return acc;
  }, {});

  const totalAttempts = rows.reduce((sum, row) => sum + row.word1Attempts + row.word2Attempts, 0);
  const totalCorrect = rows.reduce((sum, row) => sum + row.word1Correct + row.word2Correct, 0);
  const completedPairIds = rows.filter((row) => row.pairCompletions > 0).map((row) => row.pairId);
  const lastPracticedAt = rows
    .map((row) => row.lastSeenAt)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;

  return {
    totalAttempts,
    totalCorrect,
    currentStreak: 0,
    bestStreak: rows.reduce((max, row) => Math.max(max, row.successStreak), 0),
    sessionsCount: rows.length,
    completedPairIds,
    lastPracticedAt,
    pairs,
  };
}

export const progressRoutes = new Hono<{ Bindings: Env }>();

progressRoutes.get('/', async (c) => {
  const user = await requireSessionUser(c).catch(() => null);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT
      pair_id as pairId,
      category,
      dialect,
      word1_attempts as word1Attempts,
      word1_correct as word1Correct,
      word2_attempts as word2Attempts,
      word2_correct as word2Correct,
      pair_completions as pairCompletions,
      exposure_count as exposureCount,
      recent_incorrect_count as recentIncorrectCount,
      success_streak as successStreak,
      COALESCE(last_seen_at, '') as lastSeenAt,
      last_correct_at as lastCorrectAt
     FROM user_progress
     WHERE user_id = ?`,
  )
    .bind(user.id)
    .all<ProgressPair>();

  if (!results || results.length === 0) {
    return c.json({ store: null });
  }

  return c.json({ store: buildStoreFromRows(results) });
});

progressRoutes.post('/update', async (c) => {
  const user = await requireSessionUser(c).catch(() => null);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = (await c.req.json()) as {
    attempt?: {
      pairId: number;
      category: string;
      dialect: string;
      targetWord: 1 | 2;
      isCorrect: boolean;
      timestamp?: string;
    };
  };

  const attempt = body.attempt;
  if (!attempt) {
    return c.json({ error: 'Missing attempt payload' }, 400);
  }

  const now = attempt.timestamp ?? new Date().toISOString();
  const existing = await c.env.DB.prepare(
    `SELECT
      pair_id as pairId,
      category,
      dialect,
      word1_attempts as word1Attempts,
      word1_correct as word1Correct,
      word2_attempts as word2Attempts,
      word2_correct as word2Correct,
      pair_completions as pairCompletions,
      exposure_count as exposureCount,
      recent_incorrect_count as recentIncorrectCount,
      success_streak as successStreak,
      COALESCE(last_seen_at, '') as lastSeenAt,
      last_correct_at as lastCorrectAt
     FROM user_progress
     WHERE user_id = ? AND pair_id = ?
     LIMIT 1`,
  )
    .bind(user.id, attempt.pairId)
    .first<ProgressPair>();

  const row: ProgressPair = existing ?? {
    pairId: attempt.pairId,
    category: attempt.category,
    dialect: attempt.dialect,
    word1Attempts: 0,
    word1Correct: 0,
    word2Attempts: 0,
    word2Correct: 0,
    pairCompletions: 0,
    exposureCount: 0,
    recentIncorrectCount: 0,
    successStreak: 0,
    lastSeenAt: now,
    lastCorrectAt: null,
  };

  row.category = attempt.category;
  row.dialect = attempt.dialect;
  row.exposureCount += 1;
  row.lastSeenAt = now;

  if (attempt.targetWord === 1) {
    row.word1Attempts += 1;
    if (attempt.isCorrect) row.word1Correct += 1;
  } else {
    row.word2Attempts += 1;
    if (attempt.isCorrect) row.word2Correct += 1;
  }

  if (attempt.isCorrect) {
    row.successStreak += 1;
    row.recentIncorrectCount = Math.max(0, row.recentIncorrectCount - 1);
    row.lastCorrectAt = now;
  } else {
    row.successStreak = 0;
    row.recentIncorrectCount += 1;
  }

  row.pairCompletions = row.word1Correct > 0 && row.word2Correct > 0 ? 1 : 0;

  await c.env.DB.prepare(
    `INSERT INTO user_progress (
      user_id, pair_id, category, dialect,
      word1_attempts, word1_correct,
      word2_attempts, word2_correct,
      pair_completions, exposure_count,
      recent_incorrect_count, success_streak,
      last_seen_at, last_correct_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, pair_id) DO UPDATE SET
      category=excluded.category,
      dialect=excluded.dialect,
      word1_attempts=excluded.word1_attempts,
      word1_correct=excluded.word1_correct,
      word2_attempts=excluded.word2_attempts,
      word2_correct=excluded.word2_correct,
      pair_completions=excluded.pair_completions,
      exposure_count=excluded.exposure_count,
      recent_incorrect_count=excluded.recent_incorrect_count,
      success_streak=excluded.success_streak,
      last_seen_at=excluded.last_seen_at,
      last_correct_at=excluded.last_correct_at`,
  )
    .bind(
      user.id,
      row.pairId,
      row.category,
      row.dialect,
      row.word1Attempts,
      row.word1Correct,
      row.word2Attempts,
      row.word2Correct,
      row.pairCompletions,
      row.exposureCount,
      row.recentIncorrectCount,
      row.successStreak,
      row.lastSeenAt,
      row.lastCorrectAt,
    )
    .run();

  return c.json({ ok: true });
});

progressRoutes.post('/import', async (c) => {
  const user = await requireSessionUser(c).catch(() => null);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = (await c.req.json()) as {
    store?: ProgressStorePayload;
    mode?: 'merge' | 'replace';
  };

  if (!body.store || !body.store.pairs) {
    return c.json({ error: 'Missing store payload' }, 400);
  }

  if (body.mode === 'replace') {
    await c.env.DB.prepare(`DELETE FROM user_progress WHERE user_id = ?`).bind(user.id).run();
  }

  const importedPairs = Object.values(body.store.pairs);

  for (const pair of importedPairs) {
    const existing = await c.env.DB.prepare(
      `SELECT
        word1_attempts as word1Attempts,
        word1_correct as word1Correct,
        word2_attempts as word2Attempts,
        word2_correct as word2Correct,
        pair_completions as pairCompletions,
        exposure_count as exposureCount,
        recent_incorrect_count as recentIncorrectCount,
        success_streak as successStreak,
        last_seen_at as lastSeenAt,
        last_correct_at as lastCorrectAt
      FROM user_progress
      WHERE user_id = ? AND pair_id = ?
      LIMIT 1`,
    )
      .bind(user.id, pair.pairId)
      .first<ProgressPair>();

    const merged = existing && body.mode !== 'replace'
      ? {
          ...pair,
          word1Attempts: pair.word1Attempts + existing.word1Attempts,
          word1Correct: pair.word1Correct + existing.word1Correct,
          word2Attempts: pair.word2Attempts + existing.word2Attempts,
          word2Correct: pair.word2Correct + existing.word2Correct,
          exposureCount: pair.exposureCount + existing.exposureCount,
          recentIncorrectCount: pair.recentIncorrectCount + existing.recentIncorrectCount,
          successStreak: Math.max(pair.successStreak, existing.successStreak),
          pairCompletions: Math.max(pair.pairCompletions, existing.pairCompletions),
          lastSeenAt: [pair.lastSeenAt, existing.lastSeenAt].filter(Boolean).sort().at(-1) ?? pair.lastSeenAt,
          lastCorrectAt: [pair.lastCorrectAt, existing.lastCorrectAt]
            .filter(Boolean)
            .sort()
            .at(-1) ?? null,
        }
      : pair;

    await c.env.DB.prepare(
      `INSERT INTO user_progress (
        user_id, pair_id, category, dialect,
        word1_attempts, word1_correct,
        word2_attempts, word2_correct,
        pair_completions, exposure_count,
        recent_incorrect_count, success_streak,
        last_seen_at, last_correct_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, pair_id) DO UPDATE SET
        category=excluded.category,
        dialect=excluded.dialect,
        word1_attempts=excluded.word1_attempts,
        word1_correct=excluded.word1_correct,
        word2_attempts=excluded.word2_attempts,
        word2_correct=excluded.word2_correct,
        pair_completions=excluded.pair_completions,
        exposure_count=excluded.exposure_count,
        recent_incorrect_count=excluded.recent_incorrect_count,
        success_streak=excluded.success_streak,
        last_seen_at=excluded.last_seen_at,
        last_correct_at=excluded.last_correct_at`,
    )
      .bind(
        user.id,
        merged.pairId,
        merged.category,
        merged.dialect,
        merged.word1Attempts,
        merged.word1Correct,
        merged.word2Attempts,
        merged.word2Correct,
        merged.pairCompletions,
        merged.exposureCount,
        merged.recentIncorrectCount,
        merged.successStreak,
        merged.lastSeenAt,
        merged.lastCorrectAt,
      )
      .run();
  }

  return c.json({ ok: true });
});

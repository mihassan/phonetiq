import { getPairProgress } from './progressKeys';
import type {
  Category,
  Dialect,
  CategoryProgressSummary,
  ProfileSummary,
  ProgressStore,
  WeakCategorySummary,
  WeakPairSummary,
  WordPair,
} from './types';
import { scorePairForPractice } from './pairSelection';

function safePercent(correct: number, attempts: number) {
  if (attempts <= 0) return 0;
  return Math.round((correct / attempts) * 100);
}

function getPairAttempts(store: ProgressStore, pairId: number, dialect: Dialect) {
  const pair = getPairProgress(store, pairId, dialect);
  if (!pair) return 0;
  return pair.word1Attempts + pair.word2Attempts;
}

function getPairCorrect(store: ProgressStore, pairId: number, dialect: Dialect) {
  const pair = getPairProgress(store, pairId, dialect);
  if (!pair) return 0;
  return pair.word1Correct + pair.word2Correct;
}

function getDialectProgressPairs(store: ProgressStore, dialect: Dialect) {
  return Object.values(store.pairs).filter((pair) => pair.dialect === dialect);
}

function getDialectAggregateTotals(store: ProgressStore, dialect: Dialect) {
  const progressPairs = getDialectProgressPairs(store, dialect);
  const totalAttempts = progressPairs.reduce(
    (sum, pair) => sum + pair.word1Attempts + pair.word2Attempts,
    0,
  );
  const totalCorrect = progressPairs.reduce(
    (sum, pair) => sum + pair.word1Correct + pair.word2Correct,
    0,
  );

  return {
    totalAttempts,
    totalCorrect,
    completedPairs: progressPairs.filter((pair) => pair.pairCompletions > 0).length,
    sessionsCount: progressPairs.filter((pair) => pair.exposureCount > 0).length,
    lastPracticedAt:
      progressPairs
        .map((pair) => pair.lastSeenAt)
        .filter(Boolean)
        .sort()
        .at(-1) ?? null,
  };
}

export function getOverallAccuracy(store: ProgressStore, dialect?: Dialect) {
  if (!dialect) {
    return safePercent(store.totalCorrect, store.totalAttempts);
  }

  const totals = getDialectAggregateTotals(store, dialect);
  return safePercent(totals.totalCorrect, totals.totalAttempts);
}

export function buildCategoryProgress(
  categories: Category[],
  pairs: WordPair[],
  store: ProgressStore,
  dialect: Dialect,
): Record<string, CategoryProgressSummary> {
  return categories.reduce<Record<string, CategoryProgressSummary>>((acc, category) => {
    const categoryPairs = pairs.filter((pair) => pair.phoneme_type === category.phoneme_type);
    const attemptedPairs = categoryPairs.filter((pair) => getPairAttempts(store, pair.id, dialect) > 0).length;
    const completedPairs = categoryPairs.filter(
      (pair) => (getPairProgress(store, pair.id, dialect)?.pairCompletions ?? 0) > 0,
    ).length;
    const totalAttempts = categoryPairs.reduce(
      (sum, pair) => sum + getPairAttempts(store, pair.id, dialect),
      0,
    );
    const totalCorrect = categoryPairs.reduce(
      (sum, pair) => sum + getPairCorrect(store, pair.id, dialect),
      0,
    );

    acc[category.phoneme_type] = {
      totalPairs: categoryPairs.length,
      completedPairs,
      attemptedPairs,
      totalAttempts,
      totalCorrect,
      accuracy: safePercent(totalCorrect, totalAttempts),
    };

    return acc;
  }, {});
}

export function buildWeakPairs(
  pairs: WordPair[],
  store: ProgressStore,
  dialect: Dialect,
  limit = 5,
): WeakPairSummary[] {
  return pairs
    .map((pair) => {
      const attempts = getPairAttempts(store, pair.id, dialect);
      const correct = getPairCorrect(store, pair.id, dialect);
      const accuracy = safePercent(correct, attempts);
      const weaknessScore = scorePairForPractice(pair, store, dialect);

      return {
        pair,
        attempts,
        accuracy,
        weaknessScore,
      };
    })
    .sort((a, b) => b.weaknessScore - a.weaknessScore)
    .slice(0, limit);
}

export function buildWeakCategories(
  categories: Category[],
  pairs: WordPair[],
  store: ProgressStore,
  dialect: Dialect,
  limit = 5,
): WeakCategorySummary[] {
  const progress = buildCategoryProgress(categories, pairs, store, dialect);

  return Object.entries(progress)
    .map(([category, value]) => ({
      category,
      attempts: value.totalAttempts,
      accuracy: value.accuracy,
    }))
    .sort((a, b) => {
      if (a.attempts === 0 && b.attempts > 0) return 1;
      if (b.attempts === 0 && a.attempts > 0) return -1;
      return a.accuracy - b.accuracy;
    })
    .slice(0, limit);
}

export function getProfileSummary(
  pairs: WordPair[],
  categories: Category[],
  store: ProgressStore,
  dialect: Dialect,
): ProfileSummary {
  const totals = getDialectAggregateTotals(store, dialect);

  return {
    totalAttempts: totals.totalAttempts,
    totalCorrect: totals.totalCorrect,
    accuracy: safePercent(totals.totalCorrect, totals.totalAttempts),
    completedPairs: totals.completedPairs,
    currentStreak: totals.totalAttempts > 0 ? store.currentStreak : 0,
    bestStreak: totals.totalAttempts > 0 ? store.bestStreak : 0,
    sessionsCount: totals.sessionsCount,
    weakPairs: buildWeakPairs(pairs, store, dialect, 5),
    weakCategories: buildWeakCategories(categories, pairs, store, dialect, 5),
    lastPracticedAt: totals.lastPracticedAt,
  };
}

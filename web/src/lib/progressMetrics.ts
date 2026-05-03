import type {
  Category,
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

function getPairAttempts(store: ProgressStore, pairId: number) {
  const pair = store.pairs[String(pairId)];
  if (!pair) return 0;
  return pair.word1Attempts + pair.word2Attempts;
}

function getPairCorrect(store: ProgressStore, pairId: number) {
  const pair = store.pairs[String(pairId)];
  if (!pair) return 0;
  return pair.word1Correct + pair.word2Correct;
}

export function getOverallAccuracy(store: ProgressStore) {
  return safePercent(store.totalCorrect, store.totalAttempts);
}

export function buildCategoryProgress(
  categories: Category[],
  pairs: WordPair[],
  store: ProgressStore,
): Record<string, CategoryProgressSummary> {
  return categories.reduce<Record<string, CategoryProgressSummary>>((acc, category) => {
    const categoryPairs = pairs.filter((pair) => pair.phoneme_type === category.phoneme_type);
    const attemptedPairs = categoryPairs.filter((pair) => getPairAttempts(store, pair.id) > 0).length;
    const completedPairs = categoryPairs.filter((pair) => store.completedPairIds.includes(pair.id)).length;
    const totalAttempts = categoryPairs.reduce((sum, pair) => sum + getPairAttempts(store, pair.id), 0);
    const totalCorrect = categoryPairs.reduce((sum, pair) => sum + getPairCorrect(store, pair.id), 0);

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
  limit = 5,
): WeakPairSummary[] {
  return pairs
    .map((pair) => {
      const attempts = getPairAttempts(store, pair.id);
      const correct = getPairCorrect(store, pair.id);
      const accuracy = safePercent(correct, attempts);
      const weaknessScore = scorePairForPractice(pair, store);

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
  limit = 5,
): WeakCategorySummary[] {
  const progress = buildCategoryProgress(categories, pairs, store);

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
): ProfileSummary {
  return {
    totalAttempts: store.totalAttempts,
    totalCorrect: store.totalCorrect,
    accuracy: getOverallAccuracy(store),
    completedPairs: store.completedPairIds.length,
    currentStreak: store.currentStreak,
    bestStreak: store.bestStreak,
    sessionsCount: store.sessionsCount,
    weakPairs: buildWeakPairs(pairs, store, 5),
    weakCategories: buildWeakCategories(categories, pairs, store, 5),
    lastPracticedAt: store.lastPracticedAt,
  };
}

import { getPairProgress } from './progressKeys';
import type { Dialect, ProgressStore, WordPair } from './types';

interface BuildPracticeBatchOptions {
  batchSize?: number;
  weakCount?: number;
  random?: () => number;
}

function getAttemptsAndCorrect(pairId: number, dialect: Dialect, store: ProgressStore) {
  const progress = getPairProgress(store, pairId, dialect);
  if (!progress) return { attempts: 0, correct: 0, recentIncorrect: 0, successStreak: 0, lastSeenAt: null };

  const attempts = progress.word1Attempts + progress.word2Attempts;
  const correct = progress.word1Correct + progress.word2Correct;

  return {
    attempts,
    correct,
    recentIncorrect: progress.recentIncorrectCount,
    successStreak: progress.successStreak,
    lastSeenAt: progress.lastSeenAt ?? null,
  };
}

function getContrastStrength(pair: WordPair) {
  return pair.contrast_strength ?? 'supported';
}

function isUnavailableContrast(pair: WordPair) {
  return getContrastStrength(pair) === 'unavailable';
}

function getSelectionScore(pair: WordPair, store: ProgressStore, dialect: Dialect, now?: string) {
  const baseScore = scorePairForPractice(pair, store, dialect, now);
  return getContrastStrength(pair) === 'weak'
    ? Math.max(2, baseScore - 10)
    : baseScore;
}

const DECAY_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export function scorePairForPractice(
  pair: WordPair,
  store: ProgressStore,
  dialect: Dialect,
  now?: string,
) {
  const { attempts, correct, recentIncorrect, successStreak, lastSeenAt } =
    getAttemptsAndCorrect(pair.id, dialect, store);

  if (attempts === 0) {
    return 48;
  }

  const nowMs = now ? new Date(now).getTime() : Date.now();
  const isStale = lastSeenAt
    ? nowMs - new Date(lastSeenAt).getTime() > DECAY_THRESHOLD_MS
    : false;
  const effectiveRecentIncorrect = isStale ? Math.floor(recentIncorrect / 2) : recentIncorrect;

  const accuracy = correct / attempts;
  const accuracyPenalty = (1 - accuracy) * 60;
  const mistakeBoost = Math.min(30, effectiveRecentIncorrect * 8);
  const freshnessBoost = Math.max(0, 16 - attempts * 2);
  const masteryPenalty = successStreak >= 3 ? 18 : 0;

  return Math.max(2, accuracyPenalty + mistakeBoost + freshnessBoost - masteryPenalty);
}

export function buildWeakPairQueue(
  pairs: WordPair[],
  store: ProgressStore,
  dialect: Dialect,
  limit = 10,
): WordPair[] {
  return pairs
    .filter((pair) => !isUnavailableContrast(pair))
    .map((pair) => ({ pair, score: getSelectionScore(pair, store, dialect) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.pair);
}

export function pickAdaptiveNextIndex(
  pairs: WordPair[],
  store: ProgressStore,
  dialect: Dialect,
  currentIndex: number,
  random: () => number = Math.random,
) {
  if (pairs.length <= 1) return 0;

  const weightedCandidates = pairs
    .map((pair, index) => ({
      index,
      score: isUnavailableContrast(pair) ? 0 : getSelectionScore(pair, store, dialect),
    }))
    .filter((entry) => entry.index !== currentIndex)
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const totalWeight = weightedCandidates.reduce((sum, entry) => sum + entry.score, 0);
  if (totalWeight <= 0) {
    return (currentIndex + 1) % pairs.length;
  }

  const target = random() * totalWeight;
  let running = 0;

  for (const candidate of weightedCandidates) {
    running += candidate.score;
    if (target <= running) {
      return candidate.index;
    }
  }

  return weightedCandidates[weightedCandidates.length - 1].index;
}

function shuffle<T>(items: T[], random: () => number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildPracticeBatch(
  pairs: WordPair[],
  store: ProgressStore,
  dialect: Dialect,
  options: BuildPracticeBatchOptions = {},
) {
  const batchSize = options.batchSize ?? 15;
  const weakCount = options.weakCount ?? 5;
  const random = options.random ?? Math.random;

  const eligiblePairs = pairs.filter((pair) => !isUnavailableContrast(pair));

  if (eligiblePairs.length <= batchSize) {
    return shuffle(eligiblePairs, random);
  }

  const scored = eligiblePairs
    .map((pair) => {
      const pairProgress = getPairProgress(store, pair.id, dialect);
      const attempts = pairProgress ? pairProgress.word1Attempts + pairProgress.word2Attempts : 0;
      return {
        pair,
        attempts,
        score: getSelectionScore(pair, store, dialect),
      };
    })
    .sort((a, b) => b.score - a.score);

  const weakPool = scored.filter((item) => item.attempts > 0);
  const unseenPool = scored.filter((item) => item.attempts === 0);

  const selected = new Map<number, WordPair>();

  weakPool.slice(0, weakCount).forEach((item) => {
    selected.set(item.pair.id, item.pair);
  });

  for (const item of shuffle(unseenPool, random)) {
    if (selected.size >= batchSize) break;
    selected.set(item.pair.id, item.pair);
  }

  for (const item of scored) {
    if (selected.size >= batchSize) break;
    selected.set(item.pair.id, item.pair);
  }

  return shuffle(Array.from(selected.values()), random);
}

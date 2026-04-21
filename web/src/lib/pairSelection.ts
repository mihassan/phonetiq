import type { ProgressStore, WordPair } from './types';

interface BuildPracticeBatchOptions {
  batchSize?: number;
  weakCount?: number;
  random?: () => number;
}

function getAttemptsAndCorrect(pairId: number, store: ProgressStore) {
  const progress = store.pairs[String(pairId)];
  if (!progress) return { attempts: 0, correct: 0, recentIncorrect: 0, successStreak: 0 };

  const attempts = progress.word1Attempts + progress.word2Attempts;
  const correct = progress.word1Correct + progress.word2Correct;

  return {
    attempts,
    correct,
    recentIncorrect: progress.recentIncorrectCount,
    successStreak: progress.successStreak,
  };
}

export function scorePairForPractice(pair: WordPair, store: ProgressStore) {
  const { attempts, correct, recentIncorrect, successStreak } = getAttemptsAndCorrect(pair.id, store);

  if (attempts === 0) {
    return 48;
  }

  const accuracy = correct / attempts;
  const accuracyPenalty = (1 - accuracy) * 60;
  const mistakeBoost = Math.min(30, recentIncorrect * 8);
  const freshnessBoost = Math.max(0, 16 - attempts * 2);
  const masteryPenalty = successStreak >= 3 ? 18 : 0;

  return Math.max(2, accuracyPenalty + mistakeBoost + freshnessBoost - masteryPenalty);
}

export function buildWeakPairQueue(
  pairs: WordPair[],
  store: ProgressStore,
  limit = 10,
): WordPair[] {
  return pairs
    .map((pair) => ({ pair, score: scorePairForPractice(pair, store) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.pair);
}

export function pickAdaptiveNextIndex(
  pairs: WordPair[],
  store: ProgressStore,
  currentIndex: number,
  random: () => number = Math.random,
) {
  if (pairs.length <= 1) return 0;

  const weightedCandidates = pairs
    .map((pair, index) => ({
      index,
      score: scorePairForPractice(pair, store),
    }))
    .filter((entry) => entry.index !== currentIndex)
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
  options: BuildPracticeBatchOptions = {},
) {
  const batchSize = options.batchSize ?? 15;
  const weakCount = options.weakCount ?? 5;
  const random = options.random ?? Math.random;

  if (pairs.length <= batchSize) {
    return shuffle(pairs, random);
  }

  const scored = pairs
    .map((pair) => {
      const pairProgress = store.pairs[String(pair.id)];
      const attempts = pairProgress ? pairProgress.word1Attempts + pairProgress.word2Attempts : 0;
      return {
        pair,
        attempts,
        score: scorePairForPractice(pair, store),
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

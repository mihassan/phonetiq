import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCategories, fetchPairs } from '../lib/api';
import { buildCategoryProgress, getProfileSummary } from '../lib/progressMetrics';
import { buildWeakPairQueue, pickAdaptiveNextIndex } from '../lib/pairSelection';
import {
  loadProgressStore,
  resetProgressStore,
  updateProgressForAttempt,
} from '../lib/progressStorage';
import type {
  Category,
  Dialect,
  Mode,
  ProgressStore,
  TargetWord,
  WordPair,
} from '../lib/types';

export function usePracticeSession() {
  const [mode, setMode] = useState<Mode>('LEARN');
  const [pairs, setPairs] = useState<WordPair[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialect, setDialect] = useState<Dialect>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [targetNum, setTargetNum] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [progressStore, setProgressStore] = useState<ProgressStore>(() => loadProgressStore());
  const [isWeakPracticeMode, setIsWeakPracticeMode] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setIndex(0);
    setTargetNum(1);

    fetchCategories({ dialect }).then((data) => setCategories(data.categories));

    fetchPairs({
      category: selectedCategory || undefined,
      dialect,
      limit: 200,
    })
      .then((data) => setPairs(data.pairs))
      .finally(() => setIsLoading(false));
  }, [selectedCategory, dialect]);

  const currentPair = pairs[index];
  const weakPairQueue = useMemo(
    () => buildWeakPairQueue(pairs, progressStore, 12),
    [pairs, progressStore],
  );
  const weakPairQueueIds = useMemo(() => new Set(weakPairQueue.map((pair) => pair.id)), [weakPairQueue]);

  const categoryProgress = useMemo(
    () => buildCategoryProgress(categories, pairs, progressStore),
    [categories, pairs, progressStore],
  );

  const profileSummary = useMemo(
    () => getProfileSummary(pairs, categories, progressStore),
    [pairs, categories, progressStore],
  );

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (mode === 'PRACTICE') {
        if (isWeakPracticeMode && weakPairQueueIds.size > 0) {
          const weakPairs = pairs.filter((pair) => weakPairQueueIds.has(pair.id));
          if (weakPairs.length > 0) {
            const currentId = pairs[i]?.id;
            const currentWeakIndex = Math.max(
              0,
              weakPairs.findIndex((pair) => pair.id === currentId),
            );
            const nextWeakIndex = pickAdaptiveNextIndex(weakPairs, progressStore, currentWeakIndex);
            const nextPairId = weakPairs[nextWeakIndex].id;
            const mappedIndex = pairs.findIndex((pair) => pair.id === nextPairId);

            if (mappedIndex >= 0) return mappedIndex;
          }
        }

        return pickAdaptiveNextIndex(pairs, progressStore, i);
      }

      return (i + 1) % pairs.length;
    });
    setTargetNum(1);
  }, [pairs, mode, progressStore, isWeakPracticeMode, weakPairQueueIds]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + pairs.length) % pairs.length);
    setTargetNum(1);
  }, [pairs.length]);

  const handlePracticeSuccess = useCallback(() => {
    if (targetNum === 1) {
      setTargetNum(2);
      return;
    }

    goNext();
  }, [targetNum, goNext]);

  const recordPracticeAttempt = useCallback(
    (attempt: {
      pairId: number;
      category: string;
      targetWord: TargetWord;
      isCorrect: boolean;
    }) => {
      const updated = updateProgressForAttempt({
        ...attempt,
        dialect,
        timestamp: new Date().toISOString(),
      });

      setProgressStore(updated);
    },
    [dialect],
  );

  const startWeakPairPractice = useCallback(() => {
    if (weakPairQueue.length === 0) return;

    const firstPairId = weakPairQueue[0].id;
    const firstIndex = pairs.findIndex((pair) => pair.id === firstPairId);
    if (firstIndex < 0) return;

    setIsWeakPracticeMode(true);
    setMode('PRACTICE');
    setTargetNum(1);
    setIndex(firstIndex);
  }, [weakPairQueue, pairs]);

  const resetProgress = useCallback(() => {
    resetProgressStore();
    setProgressStore(loadProgressStore());
    setIsWeakPracticeMode(false);
  }, []);

  const progress = useMemo(() => {
    if (pairs.length === 0) return 5;
    return Math.max(5, ((index + 1) / pairs.length) * 100);
  }, [index, pairs.length]);

  return {
    mode,
    setMode,
    pairs,
    categories,
    dialect,
    setDialect,
    selectedCategory,
    setSelectedCategory,
    index,
    targetNum,
    isLoading,
    currentPair,
    progress,
    progressStore,
    categoryProgress,
    profileSummary,
    weakPairQueue,
    isWeakPracticeMode,
    goNext,
    goPrev,
    handlePracticeSuccess,
    recordPracticeAttempt,
    startWeakPairPractice,
    resetProgress,
  };
}

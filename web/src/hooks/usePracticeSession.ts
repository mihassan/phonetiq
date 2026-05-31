import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchCategories, fetchPairs } from '../lib/api';
import { DEFAULT_TARGET_DIALECT, getDialectProfile } from '../lib/dialects';
import { buildCategoryProgress, getProfileSummary } from '../lib/progressMetrics';
import { buildPracticeBatch, buildWeakPairQueue } from '../lib/pairSelection';
import {
  loadProgressStore,
  normalizeProgressStore,
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
  const [mode, setModeState] = useState<Mode>('LEARN');
  const [pairs, setPairs] = useState<WordPair[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialect, setDialectState] = useState<Dialect>(DEFAULT_TARGET_DIALECT);
  const [selectedCategory, setSelectedCategoryState] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [targetNum, setTargetNum] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [progressStore, setProgressStore] = useState<ProgressStore>(() => loadProgressStore());
  const [isWeakPracticeMode, setIsWeakPracticeMode] = useState(false);
  const [practiceBatch, setPracticeBatch] = useState<WordPair[]>([]);
  const [practiceBatchIndex, setPracticeBatchIndex] = useState(0);
  const modeRef = useRef(mode);
  const audioDialect = useMemo(() => getDialectProfile(dialect).audioDialect, [dialect]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const resetNavigationState = useCallback(() => {
    setIndex(0);
    setTargetNum(1);
    setPracticeBatch([]);
    setPracticeBatchIndex(0);
  }, []);

  const setDialect = useCallback((nextDialect: Dialect) => {
    setIsLoading(true);
    setIsWeakPracticeMode(false);
    setSelectedCategoryState(null);
    resetNavigationState();
    setDialectState(nextDialect);
  }, [resetNavigationState]);

  const setSelectedCategory = useCallback((nextCategory: string | null) => {
    setIsLoading(true);
    setIsWeakPracticeMode(false);
    resetNavigationState();
    setSelectedCategoryState(nextCategory);
  }, [resetNavigationState]);

  useEffect(() => {
    let cancelled = false;

    const loadSessionData = async () => {
      try {
        const [categoryData, pairData] = await Promise.all([
          fetchCategories({ dialect }),
          fetchPairs({
            category: selectedCategory || undefined,
            dialect,
            limit: 200,
          }),
        ]);

        if (cancelled) return;
        setCategories(categoryData.categories);
        setPairs(pairData.pairs);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSessionData();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, dialect]);

  const currentPair = pairs[index];
  const currentPracticePair = practiceBatch[practiceBatchIndex] ?? pairs[0];
  const weakPairQueue = useMemo(
    () => buildWeakPairQueue(pairs, progressStore, dialect, 12),
    [dialect, pairs, progressStore],
  );

  const categoryProgress = useMemo(
    () => buildCategoryProgress(categories, pairs, progressStore, dialect),
    [categories, dialect, pairs, progressStore],
  );

  const profileSummary = useMemo(
    () => getProfileSummary(pairs, categories, progressStore, dialect),
    [pairs, categories, dialect, progressStore],
  );

  const startStandardPracticeSession = useCallback(() => {
    if (pairs.length === 0) {
      setPracticeBatch([]);
      setPracticeBatchIndex(0);
      setTargetNum(1);
      return;
    }

    const nextBatch = buildPracticeBatch(pairs, progressStore, dialect, {
      batchSize: 15,
      weakCount: 5,
    });
    setPracticeBatch(nextBatch);
    setPracticeBatchIndex(0);
    setTargetNum(1);
  }, [dialect, pairs, progressStore]);

  const enterPracticeMode = useCallback(() => {
    setIsWeakPracticeMode(false);
    setModeState('PRACTICE');
    startStandardPracticeSession();
  }, [startStandardPracticeSession]);

  const setMode = useCallback((nextMode: Mode) => {
    const isEnteringPractice = nextMode === 'PRACTICE' && modeRef.current !== 'PRACTICE';

    if (isEnteringPractice) {
      enterPracticeMode();
      return;
    }

    setModeState(nextMode);
  }, [enterPracticeMode]);

  const refreshPracticeBatch = useCallback(() => {
    if (pairs.length === 0) {
      setPracticeBatch([]);
      setPracticeBatchIndex(0);
      setTargetNum(1);
      return;
    }

    if (isWeakPracticeMode && weakPairQueue.length > 0) {
      setPracticeBatch(weakPairQueue.slice(0, Math.min(5, weakPairQueue.length)));
      setPracticeBatchIndex(0);
      setTargetNum(1);
      return;
    }

    startStandardPracticeSession();
  }, [pairs.length, isWeakPracticeMode, weakPairQueue, startStandardPracticeSession]);

  const goNext = useCallback(() => {
    if (mode === 'PRACTICE') {
      setPracticeBatchIndex((i) => {
        if (practiceBatch.length === 0) return 0;
        return (i + 1) % practiceBatch.length;
      });
      setTargetNum(1);
      return;
    }

    setIndex((i) => (i + 1) % pairs.length);
    setTargetNum(1);
  }, [mode, practiceBatch.length, pairs.length]);

  const goPrev = useCallback(() => {
    if (mode === 'PRACTICE') {
      setPracticeBatchIndex((i) => {
        if (practiceBatch.length === 0) return 0;
        return (i - 1 + practiceBatch.length) % practiceBatch.length;
      });
      setTargetNum(1);
      return;
    }

    setIndex((i) => (i - 1 + pairs.length) % pairs.length);
    setTargetNum(1);
  }, [mode, practiceBatch.length, pairs.length]);

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
      return updated;
    },
    [dialect],
  );

  const applyProgressStore = useCallback((store: ProgressStore) => {
    setProgressStore(normalizeProgressStore(store));
  }, []);

  const startWeakPairPractice = useCallback(() => {
    if (weakPairQueue.length === 0) return;

    setIsWeakPracticeMode(true);
    setPracticeBatch(weakPairQueue.slice(0, Math.min(5, weakPairQueue.length)));
    setPracticeBatchIndex(0);
    setModeState('PRACTICE');
    setTargetNum(1);
  }, [weakPairQueue]);

  const resetProgress = useCallback(() => {
    resetProgressStore();
    setProgressStore(loadProgressStore());
    setIsWeakPracticeMode(false);
  }, []);

  const progress = useMemo(() => {
    if (mode === 'PRACTICE') {
      if (practiceBatch.length === 0) return 5;
      return Math.max(5, ((practiceBatchIndex + 1) / practiceBatch.length) * 100);
    }

    if (pairs.length === 0) return 5;
    return Math.max(5, ((index + 1) / pairs.length) * 100);
  }, [mode, practiceBatchIndex, practiceBatch.length, index, pairs.length]);

  const practicePairNumber = practiceBatch.length === 0 ? 0 : practiceBatchIndex + 1;
  const practicePairTotal = practiceBatch.length;

  return {
    mode,
    setMode,
    enterPracticeMode,
    pairs,
    categories,
    dialect,
    audioDialect,
    setDialect,
    selectedCategory,
    setSelectedCategory,
    index,
    targetNum,
    isLoading,
    currentPair,
    currentPracticePair,
    progress,
    progressStore,
    categoryProgress,
    profileSummary,
    weakPairQueue,
    isWeakPracticeMode,
    practiceBatch,
    practicePairNumber,
    practicePairTotal,
    goNext,
    goPrev,
    handlePracticeSuccess,
    recordPracticeAttempt,
    applyProgressStore,
    startWeakPairPractice,
    refreshPracticeBatch,
    resetProgress,
  };
}

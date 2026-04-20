import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCategories, fetchPairs } from '../lib/api';
import type { Category, Dialect, Mode, WordPair } from '../lib/types';

export function usePracticeSession() {
  const [mode, setMode] = useState<Mode>('LEARN');
  const [pairs, setPairs] = useState<WordPair[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialect, setDialect] = useState<Dialect>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [targetNum, setTargetNum] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(true);

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

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % pairs.length);
    setTargetNum(1);
  }, [pairs.length]);

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
    goNext,
    goPrev,
    handlePracticeSuccess,
  };
}

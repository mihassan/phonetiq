import { useState, useEffect, useCallback } from 'react';
import { Mic2 } from 'lucide-react';
import { PairCard } from './components/PairCard';
import { PracticeCard } from './components/PracticeCard';
import { Navigation } from './components/Navigation';
import { CategoryFilter } from './components/CategoryFilter';
import { fetchPairs, fetchCategories } from './lib/api';
import type { WordPair, Category, Mode } from './lib/types';

function App() {
  const [mode, setMode] = useState<Mode>('LEARN');
  const [pairs, setPairs] = useState<WordPair[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [targetNum, setTargetNum] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(true);

  // Load categories on mount
  useEffect(() => {
    fetchCategories().then((data) => setCategories(data.categories));
  }, []);

  // Load pairs when category changes
  useEffect(() => {
    setIsLoading(true);
    setIndex(0);
    setTargetNum(1);
    fetchPairs({
      category: selectedCategory || undefined,
      limit: 200,
    })
      .then((data) => setPairs(data.pairs))
      .finally(() => setIsLoading(false));
  }, [selectedCategory]);

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
    } else {
      goNext();
    }
  }, [targetNum, goNext]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm font-bold animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (pairs.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm font-bold">
          No word pairs found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 selection:bg-indigo-100">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center py-6 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Mic2 size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Phonetiq</h1>
          </div>
          <div className="flex bg-slate-200/50 p-1 rounded-full border border-slate-200">
            <button
              onClick={() => setMode('LEARN')}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                mode === 'LEARN'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              LEARN
            </button>
            <button
              onClick={() => setMode('PRACTICE')}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                mode === 'PRACTICE'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              PRACTICE
            </button>
          </div>
        </header>

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Pair counter + target sounds */}
        <div className="mb-4 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Pair {index + 1} / {pairs.length}
          </span>
          {currentPair.target_sounds && (
            <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded border border-indigo-100">
              {currentPair.target_sounds}
            </span>
          )}
        </div>

        {/* Word Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {mode === 'LEARN' ? (
            <>
              <PairCard word={currentPair.word1} isActive={true} />
              <PairCard word={currentPair.word2} isActive={true} />
            </>
          ) : (
            <>
              <PracticeCard
                word={currentPair.word1}
                isActive={targetNum === 1}
                onSuccess={handlePracticeSuccess}
              />
              <PracticeCard
                word={currentPair.word2}
                isActive={targetNum === 2}
                onSuccess={handlePracticeSuccess}
              />
            </>
          )}
        </div>

        {/* Navigation */}
        <Navigation
          onPrev={goPrev}
          onNext={goNext}
          word1={currentPair.word1}
          word2={currentPair.word2}
        />
      </div>
    </div>
  );
}

export default App;

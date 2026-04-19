import { useState, useEffect, useCallback } from 'react';
import { Mic2, Loader2 } from 'lucide-react';
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <div className="text-slate-500 text-sm font-bold tracking-widest uppercase animate-pulse">
          Loading pairs
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

  // Calculate progress percentage
  const progress = Math.max(5, ((index + 1) / pairs.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans md:p-12 pb-12 selection:bg-indigo-100 flex flex-col items-center">
      
      {/* Header Nav / Dynamic Island */}
      <header className="flex justify-between items-center bg-white p-2 md:p-3 pr-2 md:pr-4 pl-4 md:pl-8 rounded-full shadow-lg shadow-slate-200/50 w-[92%] md:w-[680px] max-w-3xl mt-6 md:mt-0 mb-8 md:mb-12">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-7 h-7 md:w-9 md:h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Mic2 size={16} className="md:w-5 md:h-5" />
          </div>
          <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900">Phonetiq</h1>
        </div>
        <div className="flex bg-slate-100 p-1 md:p-1.5 rounded-full">
          <button
            onClick={() => setMode('LEARN')}
            className={`px-5 md:px-7 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all ${
              mode === 'LEARN'
                ? 'bg-white shadow-md text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Learn
          </button>
          <button
            onClick={() => setMode('PRACTICE')}
            className={`px-5 md:px-7 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all ${
              mode === 'PRACTICE'
                ? 'bg-white shadow-md text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Practice
          </button>
        </div>
      </header>

      {/* Category Filter */}
      <div className="w-full max-w-5xl">
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* Main Stage */}
      <main className="w-[92%] md:w-full max-w-5xl bg-white rounded-[32px] md:rounded-[48px] shadow-2xl shadow-slate-200/50 flex flex-col overflow-hidden relative min-h-[500px] md:min-h-[600px] mt-4 md:mt-8">
        
        {/* Progress Bar Header */}
        <div className="flex flex-col">
          <div className="w-full h-1 md:h-1.5 bg-slate-100">
            <div 
              className="h-full bg-indigo-600 rounded-r-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center px-6 md:px-12 pt-6 md:pt-8 pb-4">
            <div className="text-[10px] md:text-xs font-extrabold text-slate-500 uppercase tracking-widest">
              Pair {index + 1} of {pairs.length}
            </div>
            {currentPair.target_sounds && (
              <div className="text-[10px] md:text-sm font-extrabold text-indigo-600 bg-indigo-50 px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg tracking-wider">
                {currentPair.target_sounds}
              </div>
            )}
          </div>
        </div>

        {/* The Minimal Pair Container */}
        <div className="flex flex-col md:flex-row flex-1 pb-8 md:pb-0">
          {mode === 'LEARN' ? (
            <>
              <PairCard word={currentPair.word1} isActive={true} isFirstWord={true} />
              <PairCard word={currentPair.word2} isActive={true} isFirstWord={false} />
            </>
          ) : (
            <>
              <PracticeCard
                word={currentPair.word1}
                isActive={targetNum === 1}
                isFirstWord={true}
                partnerWord={currentPair.word2}
                onSuccess={handlePracticeSuccess}
              />
              <PracticeCard
                word={currentPair.word2}
                isActive={targetNum === 2}
                isFirstWord={false}
                partnerWord={currentPair.word1}
                onSuccess={handlePracticeSuccess}
              />
            </>
          )}
        </div>
      </main>

      {/* Navigation */}
      <Navigation
        onPrev={goPrev}
        onNext={goNext}
        word1={currentPair.word1}
        word2={currentPair.word2}
      />

    </div>
  );
}

export default App;

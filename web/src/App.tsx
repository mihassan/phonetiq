import { Mic2, Loader2 } from 'lucide-react';
import { PracticeCard } from './components/PracticeCard';
import { Navigation } from './components/Navigation';
import { CategoryFilter } from './components/CategoryFilter';
import { DialectFilter } from './components/DialectFilter';
import { AppShell } from './components/AppShell';
import { LearnStage } from './components/LearnStage';
import { CategoriesStage } from './components/CategoriesStage';
import { usePracticeSession } from './hooks/usePracticeSession';

function App() {
  const {
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
  } = usePracticeSession();

  if (isLoading) {
    return (
      <div data-testid="loading-state" className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[#7dd3fc] animate-spin" />
        <div className="text-[#a0b4c4] text-sm font-bold tracking-widest uppercase animate-pulse">
          Loading pairs
        </div>
      </div>
    );
  }

  if (pairs.length === 0) {
    return (
      <div data-testid="empty-state" className="min-h-screen bg-[#0a0e1a] text-[#a0b4c4] flex items-center justify-center">
        <div className="text-sm font-bold">
          No word pairs found.
        </div>
      </div>
    );
  }

  return (
    <AppShell
      header={
        <header
          data-testid="app-header"
          className="ui-topbar flex justify-between items-center bg-[#0f1524]/75 border border-[#7dd3fc]/10 p-2 md:p-3 pr-2 md:pr-4 pl-4 md:pl-8 rounded-full shadow-lg shadow-[#7dd3fc]/10 backdrop-blur-sm w-[92%] md:w-[680px] max-w-3xl mt-6 md:mt-0 mb-8 md:mb-12"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-7 h-7 md:w-9 md:h-9 bg-[#7dd3fc] rounded-lg flex items-center justify-center text-[#001f2e]">
              <Mic2 size={16} className="md:w-5 md:h-5" />
            </div>
            <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-[#e0e8f0]">Phonetiq</h1>
          </div>
          <div data-testid="mode-toggle" className="flex bg-[#1a2438]/80 p-1 md:p-1.5 rounded-full border border-[#7dd3fc]/10">
            <button
              onClick={() => setMode('LEARN')}
              className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all ${
                mode === 'LEARN'
                  ? 'bg-[#0f1524] shadow-md shadow-[#7dd3fc]/10 text-[#e0e8f0]'
                  : 'text-[#a0b4c4] hover:text-[#e0e8f0]'
              }`}
            >
              Learn
            </button>
            <button
              onClick={() => setMode('CATEGORIES')}
              className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all ${
                mode === 'CATEGORIES'
                  ? 'bg-[#0f1524] shadow-md shadow-[#7dd3fc]/10 text-[#e0e8f0]'
                  : 'text-[#a0b4c4] hover:text-[#e0e8f0]'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setMode('PRACTICE')}
              className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all ${
                mode === 'PRACTICE'
                  ? 'bg-[#0f1524] shadow-md shadow-[#7dd3fc]/10 text-[#e0e8f0]'
                  : 'text-[#a0b4c4] hover:text-[#e0e8f0]'
              }`}
            >
              Practice
            </button>
          </div>
        </header>
      }
      filters={
        <>
          <DialectFilter selected={dialect} onSelect={setDialect} />
          {mode === 'CATEGORIES' ? null : (
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          )}
        </>
      }
      stage={
        mode === 'LEARN' ? (
          <LearnStage
            pair={currentPair}
            index={index}
            totalPairs={pairs.length}
            progress={progress}
          />
        ) : mode === 'CATEGORIES' ? (
          <CategoriesStage
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(category) => {
              setSelectedCategory(category);
              setMode('LEARN');
            }}
          />
        ) : (
          <main
            data-testid="practice-stage"
            className="practice-stage ui-stage-panel w-[92%] md:w-full max-w-5xl bg-[#0f1524]/90 border border-[#7dd3fc]/10 rounded-[32px] md:rounded-[48px] shadow-2xl shadow-[#7dd3fc]/10 backdrop-blur-sm flex flex-col overflow-hidden relative min-h-[560px] md:min-h-[700px] mt-4 md:mt-8"
          >
            <div className="flex flex-col">
              <div data-testid="practice-progress-track" className="ui-progress-track w-full h-1 md:h-1.5 bg-[#1a2438]">
                <div
                  data-testid="practice-progress-fill"
                  className="ui-progress-fill h-full bg-[#7dd3fc] rounded-r-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex justify-between items-center px-8 md:px-12 pt-6 md:pt-8 pb-5">
                <div
                  data-testid="practice-pair-meta"
                  className="ui-meta-label text-[10px] md:text-xs font-extrabold text-[#a0b4c4] uppercase tracking-widest"
                >
                  Pair {index + 1} of {pairs.length}
                </div>
                {currentPair.target_sounds && (
                  <div
                    data-testid="practice-target-sounds"
                    className="ui-sound-chip text-[10px] md:text-sm font-extrabold text-[#7dd3fc] bg-[#1a3a4e]/60 px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg tracking-wider"
                  >
                    {currentPair.target_sounds}
                  </div>
                )}
              </div>
            </div>

            <div
              data-testid="practice-stage-body"
              className="practice-stage-columns grid grid-cols-1 md:grid-cols-2 items-stretch flex-1 pb-8 md:pb-0 py-8 md:py-6 gap-4 md:gap-0"
            >
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
            </div>
          </main>
        )
      }
      navigation={
        mode === 'CATEGORIES' ? null : (
          <Navigation
            onPrev={goPrev}
            onNext={goNext}
            word1={currentPair.word1}
            word2={currentPair.word2}
          />
        )
      }
    />
  );
}

export default App;

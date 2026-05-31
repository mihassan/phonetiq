import { Mic2, Loader2, LogIn, LogOut } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { PracticeCard } from './components/PracticeCard';
import { Navigation } from './components/Navigation';
import { CategoryFilter } from './components/CategoryFilter';
import { DialectFilter } from './components/DialectFilter';
import { AppShell } from './components/AppShell';
import { LearnStage } from './components/LearnStage';
import { CategoriesStage } from './components/CategoriesStage';
import { ProfileStage } from './components/ProfileStage';
import { ModeTabBar } from './components/ModeTabBar';
import { DialectContrastNotice } from './components/DialectContrastNotice';
import { useAuth } from './hooks/useAuth';
import { useDevDebugMode } from './hooks/useDevDebugMode';
import { usePracticeSession } from './hooks/usePracticeSession';
import {
  fetchCloudProgress,
  importCloudProgress,
  updateCloudProgressAttempt,
} from './lib/authApi';
import { getDialectContrastCopy } from './lib/dialectFeedback';

function App() {
  const { user, isAuthenticated, isLoading: isAuthLoading, login, logout } = useAuth();
  const experimentMode = 'frame_sentence' as const;
  const { debugEnabled, setDebugEnabled } = useDevDebugMode();

  const {
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
    goNext,
    goPrev,
    handlePracticeSuccess,
    recordPracticeAttempt,
    applyProgressStore,
    startWeakPairPractice,
    refreshPracticeBatch,
    resetProgress,
    practicePairNumber,
    practicePairTotal,
  } = usePracticeSession();
  const hasHandledCloudSyncRef = useRef(false);

  const practicePair = currentPracticePair ?? currentPair;
  const practiceDialectNotice = getDialectContrastCopy(practicePair, dialect);

  useEffect(() => {
    if (!isAuthenticated || hasHandledCloudSyncRef.current) return;
    hasHandledCloudSyncRef.current = true;

    void (async () => {
      try {
        const cloud = await fetchCloudProgress();

        if (cloud.store) {
          applyProgressStore(cloud.store);
          return;
        }

        if (progressStore.totalAttempts > 0) {
          const shouldImport = window.confirm(
            'Import your local progress to your cloud profile?',
          );
          if (shouldImport) {
            await importCloudProgress(progressStore, 'merge');
          }
        }
      } catch {
        // Non-blocking: local mode still works.
      }
    })();
  }, [
    isAuthenticated,
    applyProgressStore,
    progressStore,
  ]);

  if (isLoading) {
    return (
      <div data-testid="loading-state" className="ui-shell min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[color:var(--color-primary)] animate-spin" />
        <div className="ui-muted text-sm font-bold tracking-widest uppercase animate-pulse">
          Loading pairs
        </div>
      </div>
    );
  }

  if (pairs.length === 0) {
    return (
      <div data-testid="empty-state" className="ui-shell min-h-screen ui-muted flex items-center justify-center">
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
          className="ui-topbar flex flex-col p-2 md:p-3 pr-2 md:pr-4 pl-4 md:pl-8 rounded-3xl md:rounded-[28px] w-[92%] md:w-[680px] max-w-3xl mt-4 md:mt-0 mb-4 md:mb-12 gap-2 md:gap-3"
        >
          <div className="flex items-center justify-between w-full gap-3">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="ui-icon-badge w-7 h-7 md:w-9 md:h-9 rounded-lg flex items-center justify-center">
                <Mic2 size={16} className="md:w-5 md:h-5" />
              </div>
              <h1 className="ui-heading-md">Phonetiq</h1>
            </div>

            <div className="flex items-center gap-2">
              {import.meta.env.DEV && (
                <button
                  type="button"
                  onClick={() => setDebugEnabled(!debugEnabled)}
                  className="ui-card-muted h-11 px-3 md:px-4 rounded-full text-xs md:text-sm font-bold inline-flex items-center gap-2 text-[color:var(--color-text)] shrink-0"
                  aria-pressed={debugEnabled}
                  aria-label={debugEnabled ? 'Disable debug mode' : 'Enable debug mode'}
                  data-testid="dev-debug-toggle"
                >
                  Debug {debugEnabled ? 'on' : 'off'}
                </button>
              )}
              <button
                onClick={isAuthenticated ? logout : login}
                disabled={isAuthLoading}
                className="ui-card-muted ml-2 md:ml-3 h-11 px-3 md:px-4 rounded-full text-xs md:text-sm font-bold disabled:opacity-60 inline-flex items-center gap-2 text-[color:var(--color-text)] shrink-0"
                aria-label={isAuthenticated ? 'Sign out' : 'Sign in'}
              >
                {isAuthenticated ? <LogOut size={16} /> : <LogIn size={16} />}
                <span className="hidden md:inline">{isAuthenticated ? 'Sign out' : 'Sign in'}</span>
              </button>
            </div>
          </div>
        </header>
      }
      filters={
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-md md:mb-8">
            <ModeTabBar mode={mode} setMode={setMode} enterPracticeMode={enterPracticeMode} />
          </div>
          <DialectFilter selected={dialect} onSelect={setDialect} />
          {mode === 'CATEGORIES' || mode === 'PROFILE' ? null : (
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          )}
        </div>
      }
      stage={
        mode === 'LEARN' ? (
          <LearnStage
            pair={currentPair}
            dialect={dialect}
            audioDialect={audioDialect}
            index={index}
            totalPairs={pairs.length}
            progress={progress}
          />
        ) : mode === 'CATEGORIES' ? (
          <CategoriesStage
            categories={categories}
            progressByCategory={categoryProgress}
            selectedCategory={selectedCategory}
            onSelectCategory={(category) => {
              setSelectedCategory(category);
              setMode('LEARN');
            }}
          />
        ) : mode === 'PROFILE' ? (
          <ProfileStage
            summary={profileSummary}
            onPracticeWeakPairs={startWeakPairPractice}
            onResetProgress={resetProgress}
            authUser={user}
            onLogin={login}
            onLogout={logout}
          />
        ) : (
            <main
              data-testid="practice-stage"
              className="practice-stage ui-stage-panel w-[92%] md:w-full max-w-5xl rounded-[32px] md:rounded-[48px] flex flex-col overflow-hidden relative min-h-[380px] md:min-h-[700px] mt-3 md:mt-8"
            >
              <div className="flex flex-col">
                <div data-testid="practice-progress-track" className="ui-progress-track w-full h-1 md:h-1.5">
                  <div
                    data-testid="practice-progress-fill"
                    className="ui-progress-fill h-full rounded-r-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>

              <div className="flex justify-between items-center px-8 md:px-12 pt-6 md:pt-8 pb-5">
                <div
                  data-testid="practice-pair-meta"
                  className="ui-meta-label ui-eyebrow"
                >
                  Pair {practicePairNumber} of {practicePairTotal}
                </div>
                <button
                  onClick={refreshPracticeBatch}
                  className="ui-btn-secondary h-11 px-4 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider"
                >
                  Refresh batch
                </button>
                {practicePair.target_sounds && (
                  <div
                    data-testid="practice-target-sounds"
                    className="ui-sound-chip text-[10px] md:text-sm font-extrabold px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg tracking-wider"
                  >
                    {practicePair.target_sounds}
                  </div>
                )}
              </div>
             {practiceDialectNotice && (
               <div className="px-8 md:px-12 pb-5">
                 <DialectContrastNotice
                   notice={practiceDialectNotice}
                   testId="practice-dialect-notice"
                 />
               </div>
             )}
            </div>

            <div
              data-testid="practice-stage-body"
              className="practice-stage-columns grid grid-cols-1 md:grid-cols-2 items-stretch flex-1 pb-8 md:pb-0 py-8 md:py-6 gap-4 md:gap-0"
            >
              <PracticeCard
                key={`${practicePair.id}-1`}
                word={practicePair.word1}
                isActive={targetNum === 1}
                isFirstWord={true}
                partnerWord={practicePair.word2}
                dialect={dialect}
                audioDialect={audioDialect}
                experimentMode={experimentMode}
                debugEnabled={debugEnabled}
                onSuccess={handlePracticeSuccess}
                onAttemptEvaluated={({ isCorrect, matchType }) => {
                  if (matchType === 'no_match') return;
                  const updated = recordPracticeAttempt({
                    pairId: practicePair.id,
                    category: practicePair.phoneme_type,
                    targetWord: 1,
                    isCorrect,
                  });

                  if (isAuthenticated) {
                    void updateCloudProgressAttempt({
                      pairId: practicePair.id,
                      category: practicePair.phoneme_type,
                      dialect,
                      targetWord: 1,
                      isCorrect,
                      timestamp: updated.lastPracticedAt ?? undefined,
                    }).catch(() => {
                      // Non-blocking cloud sync.
                    });
                  }
                }}
              />
              <PracticeCard
                key={`${practicePair.id}-2`}
                word={practicePair.word2}
                isActive={targetNum === 2}
                isFirstWord={false}
                partnerWord={practicePair.word1}
                dialect={dialect}
                audioDialect={audioDialect}
                experimentMode={experimentMode}
                debugEnabled={debugEnabled}
                onSuccess={handlePracticeSuccess}
                onAttemptEvaluated={({ isCorrect, matchType }) => {
                  if (matchType === 'no_match') return;
                  const updated = recordPracticeAttempt({
                    pairId: practicePair.id,
                    category: practicePair.phoneme_type,
                    targetWord: 2,
                    isCorrect,
                  });

                  if (isAuthenticated) {
                    void updateCloudProgressAttempt({
                      pairId: practicePair.id,
                      category: practicePair.phoneme_type,
                      dialect,
                      targetWord: 2,
                      isCorrect,
                      timestamp: updated.lastPracticedAt ?? undefined,
                    }).catch(() => {
                      // Non-blocking cloud sync.
                    });
                  }
                }}
              />
            </div>
          </main>
        )
      }
      navigation={
        mode === 'CATEGORIES' || mode === 'PROFILE' ? null : (
          <Navigation
            onPrev={goPrev}
            onNext={goNext}
            word1={mode === 'PRACTICE' ? practicePair.word1 : currentPair.word1}
            word2={mode === 'PRACTICE' ? practicePair.word2 : currentPair.word2}
          />
        )
      }
    />
  );
}

export default App;

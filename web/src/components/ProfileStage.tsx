import type { AuthUser, ProfileSummary } from '../lib/types';

interface ProfileStageProps {
  summary: ProfileSummary;
  onPracticeWeakPairs: () => void;
  onResetProgress: () => void;
  authUser?: AuthUser | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export function ProfileStage({
  summary,
  onPracticeWeakPairs,
  onResetProgress,
  authUser,
  onLogin,
  onLogout,
}: ProfileStageProps) {
  return (
    <main
      data-testid="profile-stage"
      className="w-[92%] md:w-full max-w-5xl ui-stage-panel rounded-[32px] md:rounded-[48px] flex flex-col overflow-hidden relative min-h-[500px] md:min-h-[600px] mt-4 md:mt-8 px-8 md:px-12 py-8 md:py-10"
    >
      <div className="ui-stack-6">
        <h2 className="ui-heading-lg">Profile</h2>

        <section className="ui-card rounded-2xl px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="ui-eyebrow">Account</h3>
            {authUser ? (
              <p className="text-sm mt-2">
                Signed in as <span className="font-bold">{authUser.email}</span>
              </p>
            ) : (
              <p className="ui-muted text-sm mt-2">Guest mode active (progress is local only).</p>
            )}
          </div>

          {authUser ? (
            <button
              onClick={onLogout}
              className="ui-btn-secondary h-11 px-4 rounded-full font-bold transition-colors"
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="ui-btn-primary h-11 px-4 rounded-full font-bold transition-colors"
            >
              Sign in
            </button>
          )}
        </section>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="ui-card rounded-2xl px-4 py-4">
            <p className="ui-eyebrow">Overall accuracy</p>
            <p className="text-2xl md:text-3xl font-black text-[color:var(--color-primary)] mt-2">{summary.accuracy}%</p>
          </div>
          <div className="ui-card rounded-2xl px-4 py-4">
            <p className="ui-eyebrow">Attempts</p>
            <p className="text-2xl md:text-3xl font-black mt-2">{summary.totalAttempts}</p>
          </div>
          <div className="ui-card rounded-2xl px-4 py-4">
            <p className="ui-eyebrow">Completed pairs</p>
            <p className="text-2xl md:text-3xl font-black mt-2">{summary.completedPairs}</p>
          </div>
          <div className="ui-card rounded-2xl px-4 py-4">
            <p className="ui-eyebrow">Current streak</p>
            <p className="text-2xl md:text-3xl font-black mt-2">{summary.currentStreak}</p>
          </div>
          <div className="ui-card rounded-2xl px-4 py-4">
            <p className="ui-eyebrow">Best streak</p>
            <p className="text-2xl md:text-3xl font-black mt-2">{summary.bestStreak}</p>
          </div>
          <div className="ui-card rounded-2xl px-4 py-4">
            <p className="ui-eyebrow">Sessions</p>
            <p className="text-2xl md:text-3xl font-black mt-2">{summary.sessionsCount}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <section className="ui-card rounded-2xl px-5 py-4">
            <h3 className="ui-eyebrow">Weak pairs</h3>
            <ul className="mt-3 space-y-2">
              {summary.weakPairs.length === 0 ? (
                <li className="ui-muted text-sm">No weak pairs yet.</li>
              ) : (
                summary.weakPairs.map((entry) => (
                  <li key={entry.pair.id} className="text-sm">
                    {entry.pair.word1} vs {entry.pair.word2} · {entry.accuracy}%
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="ui-card rounded-2xl px-5 py-4">
            <h3 className="ui-eyebrow">Weak categories</h3>
            <ul className="mt-3 space-y-2">
              {summary.weakCategories.length === 0 ? (
                <li className="ui-muted text-sm">No category data yet.</li>
              ) : (
                summary.weakCategories.map((entry) => (
                  <li key={entry.category} className="text-sm capitalize">
                    {entry.category.replace(/_/g, ' ')} · {entry.accuracy}%
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onPracticeWeakPairs}
            className="ui-btn-primary h-12 px-6 rounded-full font-bold transition-colors"
          >
            Practice weak pairs
          </button>

          <button
            onClick={onResetProgress}
            className="ui-btn-danger h-12 px-6 rounded-full font-bold transition-colors"
          >
            Reset progress
          </button>

          <p className="ui-muted text-xs">
            {authUser
              ? 'Signed-in progress can be synced to cloud profile storage.'
              : 'Progress is stored locally on this device until you sign in.'}
          </p>
        </div>
      </div>
    </main>
  );
}

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
      className="w-[92%] md:w-full max-w-5xl ui-stage-panel bg-[#0f1524]/90 border border-[#7dd3fc]/10 rounded-[32px] md:rounded-[48px] shadow-2xl shadow-[#7dd3fc]/10 backdrop-blur-sm flex flex-col overflow-hidden relative min-h-[500px] md:min-h-[600px] mt-4 md:mt-8 px-8 md:px-12 py-8 md:py-10"
    >
      <div className="flex flex-col gap-6">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#e0e8f0]">Profile</h2>

        <section className="bg-[#141c2e] border border-[#7dd3fc]/10 rounded-2xl px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#a0b4c4]">Account</h3>
            {authUser ? (
              <p className="text-sm text-[#e0e8f0] mt-2">
                Signed in as <span className="font-bold">{authUser.email}</span>
              </p>
            ) : (
              <p className="text-sm text-[#a0b4c4] mt-2">Guest mode active (progress is local only).</p>
            )}
          </div>

          {authUser ? (
            <button
              onClick={onLogout}
              className="h-10 px-4 bg-[#1a2438] text-[#e0e8f0] rounded-full font-bold border border-[#7dd3fc]/10 hover:bg-[#202c42] transition-colors"
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="h-10 px-4 bg-[#7dd3fc] text-[#001f2e] rounded-full font-bold hover:bg-[#9bddff] transition-colors"
            >
              Sign in
            </button>
          )}
        </section>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-[#141c2e] border border-[#7dd3fc]/10 rounded-2xl px-4 py-4">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#a0b4c4]">Overall accuracy</p>
            <p className="text-2xl md:text-3xl font-black text-[#7dd3fc] mt-2">{summary.accuracy}%</p>
          </div>
          <div className="bg-[#141c2e] border border-[#7dd3fc]/10 rounded-2xl px-4 py-4">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#a0b4c4]">Attempts</p>
            <p className="text-2xl md:text-3xl font-black text-[#e0e8f0] mt-2">{summary.totalAttempts}</p>
          </div>
          <div className="bg-[#141c2e] border border-[#7dd3fc]/10 rounded-2xl px-4 py-4">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#a0b4c4]">Completed pairs</p>
            <p className="text-2xl md:text-3xl font-black text-[#e0e8f0] mt-2">{summary.completedPairs}</p>
          </div>
          <div className="bg-[#141c2e] border border-[#7dd3fc]/10 rounded-2xl px-4 py-4">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#a0b4c4]">Current streak</p>
            <p className="text-2xl md:text-3xl font-black text-[#e0e8f0] mt-2">{summary.currentStreak}</p>
          </div>
          <div className="bg-[#141c2e] border border-[#7dd3fc]/10 rounded-2xl px-4 py-4">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#a0b4c4]">Best streak</p>
            <p className="text-2xl md:text-3xl font-black text-[#e0e8f0] mt-2">{summary.bestStreak}</p>
          </div>
          <div className="bg-[#141c2e] border border-[#7dd3fc]/10 rounded-2xl px-4 py-4">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#a0b4c4]">Sessions</p>
            <p className="text-2xl md:text-3xl font-black text-[#e0e8f0] mt-2">{summary.sessionsCount}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <section className="bg-[#141c2e] border border-[#7dd3fc]/10 rounded-2xl px-5 py-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#a0b4c4]">Weak pairs</h3>
            <ul className="mt-3 space-y-2">
              {summary.weakPairs.length === 0 ? (
                <li className="text-sm text-[#a0b4c4]">No weak pairs yet.</li>
              ) : (
                summary.weakPairs.map((entry) => (
                  <li key={entry.pair.id} className="text-sm text-[#e0e8f0]">
                    {entry.pair.word1} vs {entry.pair.word2} · {entry.accuracy}%
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="bg-[#141c2e] border border-[#7dd3fc]/10 rounded-2xl px-5 py-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#a0b4c4]">Weak categories</h3>
            <ul className="mt-3 space-y-2">
              {summary.weakCategories.length === 0 ? (
                <li className="text-sm text-[#a0b4c4]">No category data yet.</li>
              ) : (
                summary.weakCategories.map((entry) => (
                  <li key={entry.category} className="text-sm text-[#e0e8f0] capitalize">
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
            className="h-12 px-6 bg-[#7dd3fc] text-[#001f2e] rounded-full font-bold hover:bg-[#9bddff] transition-colors"
          >
            Practice weak pairs
          </button>

          <button
            onClick={onResetProgress}
            className="h-12 px-6 bg-[#1a2438] text-[#e0e8f0] rounded-full font-bold border border-[#7dd3fc]/10 hover:bg-[#202c42] transition-colors"
          >
            Reset progress
          </button>

          <p className="text-xs text-[#a0b4c4]">
            {authUser
              ? 'Signed-in progress can be synced to cloud profile storage.'
              : 'Progress is stored locally on this device until you sign in.'}
          </p>
        </div>
      </div>
    </main>
  );
}

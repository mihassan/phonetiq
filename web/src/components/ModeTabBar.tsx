import { BookOpen, Grid, Mic2, User } from 'lucide-react';
import type { Mode } from '../lib/types';

interface Props {
  mode: Mode;
  setMode: (mode: Mode) => void;
  enterPracticeMode: () => void;
}

export function ModeTabBar({ mode, setMode, enterPracticeMode }: Props) {
  const tabs = [
    { id: 'LEARN', label: 'Learn', icon: BookOpen, action: () => setMode('LEARN') },
    { id: 'CATEGORIES', label: 'Categories', icon: Grid, action: () => setMode('CATEGORIES') },
    { id: 'PRACTICE', label: 'Practice', icon: Mic2, action: enterPracticeMode },
    { id: 'PROFILE', label: 'Profile', icon: User, action: () => setMode('PROFILE') },
  ] as const;

  return (
    <div data-testid="mode-toggle" className="fixed inset-x-0 bottom-0 z-50 ui-bottom-nav">
      <div className="mx-auto flex w-full max-w-5xl justify-center px-4 pt-2">
        <div className="ui-card-muted flex w-full items-stretch justify-between gap-1 overflow-x-auto rounded-full p-1.5">
          {tabs.map((tab) => {
            const isActive = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={tab.action}
                className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition-all md:text-sm ${
                  isActive
                    ? 'ui-btn-primary shadow-md'
                    : 'ui-muted hover:text-[color:var(--color-text)]'
                }`}
              >
                <tab.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
    <>
      <div data-testid="mode-toggle" className="hidden md:flex ui-card-muted w-full overflow-x-auto p-1.5 rounded-full scrollbar-hide">
        <div className="flex min-w-max justify-center w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={tab.action}
              className={`flex-1 min-h-11 px-6 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                mode === tab.id
                  ? 'ui-btn-primary shadow-md'
                  : 'ui-muted hover:text-[color:var(--color-text)]'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 ui-bottom-nav z-50 flex justify-around items-center px-2 pt-1.5 pb-3">
        {tabs.map((tab) => {
          const isActive = mode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={tab.action}
              className={`flex flex-col items-center justify-center w-[3.75rem] h-12 gap-0.5 transition-colors ${
                isActive ? 'text-[color:var(--color-primary)]' : 'ui-muted'
              }`}
            >
              <div className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${isActive ? 'bg-[color:var(--color-surface-variant)]' : ''}`}>
                <tab.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[9px] font-bold tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

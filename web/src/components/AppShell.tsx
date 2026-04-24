import type { ReactNode } from 'react';

interface AppShellProps {
  header: ReactNode;
  filters: ReactNode;
  stage: ReactNode;
  navigation: ReactNode;
}

export function AppShell({ header, filters, stage, navigation }: AppShellProps) {
  return (
    <div
      data-testid="app-shell-root"
      className="ui-shell min-h-screen font-sans md:p-12 pb-[5.5rem] md:pb-12 selection:bg-[color:var(--overlay-soft)] flex flex-col items-center"
    >
      <div className="w-full flex justify-center sticky top-0 z-40 md:relative md:z-auto pt-4 md:pt-0 bg-gradient-to-b from-[color:var(--color-bg)] to-transparent md:bg-none" data-testid="app-shell-header">{header}</div>

      <div className="w-full max-w-5xl px-4 md:px-0" data-testid="app-shell-filters">
        {filters}
      </div>

      <div className="w-full flex justify-center px-4 md:px-0" data-testid="app-shell-stage">
        {stage}
      </div>

      <div className="w-full flex justify-center px-4 md:px-0" data-testid="app-shell-navigation">
        {navigation}
      </div>
    </div>
  );
}

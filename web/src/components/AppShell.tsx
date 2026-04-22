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
      className="ui-shell min-h-screen font-sans md:p-12 pb-12 selection:bg-[color:var(--overlay-soft)] flex flex-col items-center"
    >
      <div className="w-full flex justify-center" data-testid="app-shell-header">{header}</div>

      <div className="w-full max-w-5xl" data-testid="app-shell-filters">
        {filters}
      </div>

      <div className="w-full flex justify-center" data-testid="app-shell-stage">
        {stage}
      </div>

      <div className="w-full flex justify-center" data-testid="app-shell-navigation">
        {navigation}
      </div>
    </div>
  );
}

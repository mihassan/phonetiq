import type { ReactNode } from 'react';

interface AppShellProps {
  header: ReactNode;
  filters: ReactNode;
  stage: ReactNode;
  navigation: ReactNode;
}

export function AppShell({ header, filters, stage, navigation }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans md:p-12 pb-12 selection:bg-indigo-100 flex flex-col items-center">
      <div data-testid="app-shell-header">{header}</div>

      <div className="w-full max-w-5xl" data-testid="app-shell-filters">
        {filters}
      </div>

      <div data-testid="app-shell-stage">{stage}</div>

      <div data-testid="app-shell-navigation">{navigation}</div>
    </div>
  );
}

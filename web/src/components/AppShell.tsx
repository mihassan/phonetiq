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
      className="min-h-screen bg-[#0a0e1a] text-[#e0e8f0] font-sans md:p-12 pb-12 selection:bg-[#1a3a4e] flex flex-col items-center"
    >
      <div data-testid="app-shell-header">{header}</div>

      <div className="w-full max-w-5xl" data-testid="app-shell-filters">
        {filters}
      </div>

      <div data-testid="app-shell-stage">{stage}</div>

      <div data-testid="app-shell-navigation">{navigation}</div>
    </div>
  );
}

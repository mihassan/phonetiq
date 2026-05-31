import type { ReactNode } from 'react';
import type { DialectContrastCopy } from '../lib/dialectFeedback';

interface Props {
  notice: DialectContrastCopy;
  testId?: string;
  children?: ReactNode;
}

const TONE_CLASS_MAP: Record<DialectContrastCopy['tone'], string> = {
  supported: 'border-[color:var(--color-primary)]/15',
  weak: 'border-[color:var(--color-primary)]/30',
  unavailable: 'border-[color:var(--color-outline)]',
};

export function DialectContrastNotice({ notice, testId, children }: Props) {
  return (
    <div
      data-testid={testId}
      className={`ui-card rounded-2xl border px-4 py-3 text-left ${TONE_CLASS_MAP[notice.tone]}`}
    >
      <p className="ui-eyebrow text-[color:var(--color-primary)]">{notice.eyebrow}</p>
      <p className="mt-1 text-sm md:text-base font-black">{notice.title}</p>
      <p className="mt-1 text-xs md:text-sm font-medium ui-muted">{notice.detail}</p>
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

import type { Dialect } from '../lib/types';

interface DialectFilterProps {
  selected: Dialect;
  onSelect: (dialect: Dialect) => void;
}

const DIALECT_OPTIONS: Array<{ value: Dialect; label: string }> = [
  { value: 'all', label: 'Common' },
  { value: 'uk_only', label: 'UK' },
  { value: 'us_only', label: 'US' },
];

export function DialectFilter({ selected, onSelect }: DialectFilterProps) {
  return (
    <div
      data-testid="dialect-filter"
      className="ui-filter-shell flex items-center justify-center gap-3 mb-4 md:mb-6 rounded-2xl py-2.5 px-3"
    >
      <span className="ui-muted text-[10px] md:text-xs font-extrabold uppercase tracking-widest">
        Dialect
      </span>

      {DIALECT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={selected === option.value}
          onClick={() => onSelect(option.value)}
          className="ui-filter-chip min-h-11 px-4 rounded-full text-xs md:text-sm font-bold transition-all"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

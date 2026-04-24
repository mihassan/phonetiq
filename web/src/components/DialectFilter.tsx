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
      className="flex items-center justify-center gap-2 mb-3 md:mb-6 w-full px-1 md:px-0"
    >
      <span className="ui-muted text-[10px] md:text-xs font-extrabold uppercase tracking-widest mr-2">
        Dialect
      </span>

      {DIALECT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={selected === option.value}
          onClick={() => onSelect(option.value)}
          className={`min-h-9 px-4 rounded-full text-xs md:text-sm font-bold transition-all border ${
            selected === option.value
              ? 'ui-btn-primary border-transparent'
              : 'ui-card-muted border-[color:var(--color-outline)] hover:border-[color:var(--color-primary)]'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

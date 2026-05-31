import { TARGET_DIALECT_OPTIONS } from '../lib/dialects';
import type { Dialect } from '../lib/types';

interface DialectFilterProps {
  selected: Dialect;
  onSelect: (dialect: Dialect) => void;
}

export function DialectFilter({ selected, onSelect }: DialectFilterProps) {
  return (
    <div
      data-testid="dialect-filter"
      className="flex items-center justify-center gap-2 mb-3 md:mb-6 w-full px-1 md:px-0"
    >
      <span className="ui-muted text-[10px] md:text-xs font-extrabold uppercase tracking-widest mr-2">
        Dialect
      </span>

      {TARGET_DIALECT_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={selected === option.id}
          onClick={() => onSelect(option.id)}
          className={`min-h-9 px-4 rounded-full text-xs md:text-sm font-bold transition-all border ${
            selected === option.id
              ? 'ui-btn-primary border-transparent'
              : 'ui-card-muted border-[color:var(--color-outline)] hover:border-[color:var(--color-primary)]'
          }`}
        >
          {option.shortLabel}
        </button>
      ))}
    </div>
  );
}

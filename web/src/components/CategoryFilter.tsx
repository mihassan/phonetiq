import type { Category } from '../lib/types';

interface Props {
  categories: Category[];
  selected: string | null;
  onSelect: (cat: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: Props) {
  const total = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <div className="mb-4 md:mb-8 w-full">
      <div
        data-testid="category-filter"
        className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-proximity [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)] md:flex-wrap md:justify-center md:px-0 md:[mask-image:none]"
      >
        <button
          onClick={() => onSelect(null)}
          aria-pressed={selected === null}
            className={`shrink-0 min-h-10 px-4 rounded-full text-[11px] md:text-sm font-bold whitespace-nowrap transition-all border snap-start ${
              selected === null
                ? 'ui-btn-primary border-transparent'
                : 'ui-card-muted border-[color:var(--color-outline)] hover:border-[color:var(--color-primary)]'
          }`}
        >
          All ({total})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.phoneme_type}
            onClick={() => onSelect(cat.phoneme_type)}
            aria-pressed={selected === cat.phoneme_type}
              className={`shrink-0 min-h-10 px-4 rounded-full text-[11px] md:text-sm font-bold whitespace-nowrap transition-all border snap-start ${
                selected === cat.phoneme_type
                  ? 'ui-btn-primary border-transparent'
                  : 'ui-card-muted border-[color:var(--color-outline)] hover:border-[color:var(--color-primary)]'
            }`}
          >
            {cat.phoneme_type.replace(/_/g, ' ')} ({cat.count})
          </button>
        ))}
      </div>
    </div>
  );
}

import type { Category } from '../lib/types';

interface Props {
  categories: Category[];
  selected: string | null;
  onSelect: (cat: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: Props) {
  const total = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <div className="mb-8 md:mb-12">
      <div
        data-testid="category-filter"
        className="ui-filter-shell flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-2 md:px-0 md:flex-wrap md:justify-center rounded-2xl py-3"
      >
        <button
          onClick={() => onSelect(null)}
          aria-pressed={selected === null}
          className="ui-filter-chip min-h-11 px-5 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all bg-transparent"
        >
          All ({total})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.phoneme_type}
            onClick={() => onSelect(cat.phoneme_type)}
            aria-pressed={selected === cat.phoneme_type}
            className="ui-filter-chip min-h-11 px-5 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all bg-transparent"
          >
            {cat.phoneme_type.replace(/_/g, ' ')} ({cat.count})
          </button>
        ))}
      </div>

      <p className="ui-muted ui-body-sm md:hidden mt-2 px-2">Swipe to see more categories</p>
    </div>
  );
}

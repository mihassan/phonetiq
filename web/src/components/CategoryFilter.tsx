import type { Category } from '../lib/types';

interface Props {
  categories: Category[];
  selected: string | null;
  onSelect: (cat: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: Props) {
  const total = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <div
      data-testid="category-filter"
      className="flex gap-2 mb-8 md:mb-12 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:justify-center bg-[#0f1524]/60 border border-[#7dd3fc]/10 rounded-2xl py-2"
    >
      <button
        onClick={() => onSelect(null)}
        className={`px-5 py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
          selected === null
            ? 'bg-[#7dd3fc] text-[#001f2e]'
            : 'bg-transparent text-[#a0b4c4] hover:text-[#e0e8f0]'
        }`}
      >
        All ({total})
      </button>

      {categories.map((cat) => (
        <button
          key={cat.phoneme_type}
          onClick={() => onSelect(cat.phoneme_type)}
          className={`px-5 py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
            selected === cat.phoneme_type
              ? 'bg-[#7dd3fc] text-[#001f2e]'
              : 'bg-transparent text-[#a0b4c4] hover:text-[#e0e8f0]'
          }`}
        >
          {cat.phoneme_type.replace(/_/g, ' ')} ({cat.count})
        </button>
      ))}
    </div>
  );
}

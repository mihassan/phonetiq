import type { Category } from '../lib/types';

interface Props {
  categories: Category[];
  selected: string | null;
  onSelect: (cat: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: Props) {
  const total = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <div className="flex gap-2 mb-8 md:mb-12 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:justify-center">
      <button
        onClick={() => onSelect(null)}
        className={`px-5 py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
          selected === null
            ? 'bg-slate-900 text-white'
            : 'bg-transparent text-slate-500 hover:text-slate-900'
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
              ? 'bg-slate-900 text-white'
              : 'bg-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          {cat.phoneme_type.replace('_', ' ')} ({cat.count})
        </button>
      ))}
    </div>
  );
}

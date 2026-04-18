import type { Category } from '../lib/types';

interface Props {
  categories: Category[];
  selected: string | null;
  onSelect: (cat: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
          selected === null
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
        }`}
      >
        All ({categories.reduce((s, c) => s + c.count, 0)})
      </button>
      {categories.map((cat) => (
        <button
          key={cat.phoneme_type}
          onClick={() => onSelect(cat.phoneme_type)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
            selected === cat.phoneme_type
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
          }`}
        >
          {cat.phoneme_type.replace(/_/g, ' ')} ({cat.count})
        </button>
      ))}
    </div>
  );
}

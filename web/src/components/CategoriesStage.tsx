import { useMemo, useState } from 'react';
import type { Category } from '../lib/types';

interface CategoriesStageProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function CategoriesStage({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoriesStageProps) {
  const [query, setQuery] = useState('');

  const visibleCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;

    return categories.filter((cat) =>
      cat.phoneme_type.replace(/_/g, ' ').toLowerCase().includes(q),
    );
  }, [categories, query]);

  const maxCount = useMemo(() => {
    if (categories.length === 0) return 1;
    return Math.max(...categories.map((c) => c.count), 1);
  }, [categories]);

  return (
    <main
      data-testid="categories-stage"
      className="w-[92%] md:w-full max-w-5xl bg-[#0f1524]/90 border border-[#7dd3fc]/10 rounded-[32px] md:rounded-[48px] shadow-2xl shadow-[#7dd3fc]/10 backdrop-blur-sm flex flex-col overflow-hidden relative min-h-[500px] md:min-h-[600px] mt-4 md:mt-8 px-6 md:px-10 py-6 md:py-8"
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#e0e8f0]">
          Categories
        </h2>

        <input
          aria-label="Search categories"
          type="text"
          placeholder="Search phonemes or pairs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#141c2e] border border-[#7dd3fc]/10 rounded-xl px-4 py-3 text-sm text-[#e0e8f0] placeholder:text-[#a0b4c4] outline-none focus:border-[#7dd3fc]/40"
        />

        <div data-testid="categories-grid" className="grid grid-cols-2 gap-4">
          {visibleCategories.map((cat) => {
            const label = cat.phoneme_type.replace(/_/g, ' ');
            const selected = selectedCategory === cat.phoneme_type;
            const percent = Math.round((cat.count / maxCount) * 100);
            const completedPairs = Math.round((percent / 100) * cat.count);
            const radius = 20;
            const circumference = 2 * Math.PI * radius;
            const strokeOffset = circumference * (1 - percent / 100);

            return (
              <button
                key={cat.phoneme_type}
                onClick={() => onSelectCategory(cat.phoneme_type)}
                className={`text-left rounded-2xl border px-4 py-4 transition-all ${
                  selected
                    ? 'bg-[#1a3a4e]/70 border-[#7dd3fc]/40'
                    : 'bg-[#141c2e] border-[#7dd3fc]/10 hover:border-[#7dd3fc]/25'
                }`}
              >
                <div
                  data-testid="category-chip"
                  className="inline-flex text-xs uppercase tracking-wider text-[#a0b4c4] bg-[#1a2438] border border-[#7dd3fc]/10 rounded-full px-2.5 py-1 mb-2"
                >
                  {selected ? 'Selected' : 'Category'}
                </div>
                <div className="text-xl font-extrabold capitalize text-[#e0e8f0]">
                  {label}
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
                      <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        fill="none"
                        stroke="rgba(125, 211, 252, 0.2)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        fill="none"
                        stroke="#7dd3fc"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeOffset}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#e0e8f0]">
                      {percent}%
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="text-sm text-[#7dd3fc]">{cat.count} pairs</div>
                    <div className="text-xs text-[#a0b4c4]">
                      {completedPairs} of {cat.count}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onSelectCategory(null)}
          className="self-start text-sm font-bold text-[#7dd3fc] hover:text-[#9bddff]"
        >
          Show all pairs
        </button>
      </div>
    </main>
  );
}

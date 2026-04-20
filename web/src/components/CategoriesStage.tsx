import { useMemo, useState } from 'react';
import type { Category, CategoryProgressSummary } from '../lib/types';

interface CategoriesStageProps {
  categories: Category[];
  progressByCategory: Record<string, CategoryProgressSummary>;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function CategoriesStage({
  categories,
  progressByCategory,
  selectedCategory,
  onSelectCategory,
}: CategoriesStageProps) {
  const [query, setQuery] = useState('');

  const cardPalette = [
    { surface: 'bg-[#141c2e] border-[#7dd3fc]/15', ring: '#7dd3fc', chip: 'bg-[#1a2438]' },
    { surface: 'bg-[#172136] border-[#88b4cc]/20', ring: '#88b4cc', chip: 'bg-[#1e2940]' },
    { surface: 'bg-[#1b2440] border-[#c8a0f0]/20', ring: '#c8a0f0', chip: 'bg-[#252f4f]' },
    { surface: 'bg-[#151f33] border-[#7dd3fc]/15', ring: '#7dd3fc', chip: 'bg-[#1d2940]' },
  ] as const;

  const visibleCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;

    return categories.filter((cat) =>
      cat.phoneme_type.replace(/_/g, ' ').toLowerCase().includes(q),
    );
  }, [categories, query]);

  return (
    <main
      data-testid="categories-stage"
      className="categories-stage categories-stage-surface ui-stage-panel w-[92%] md:w-full max-w-5xl bg-[#11192a]/92 border border-[#7dd3fc]/12 rounded-[32px] md:rounded-[48px] shadow-2xl shadow-[#7dd3fc]/12 backdrop-blur-sm flex flex-col overflow-hidden relative min-h-[500px] md:min-h-[600px] mt-4 md:mt-8 px-8 md:px-12 py-8 md:py-10"
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#e0e8f0]">
          Categories
        </h2>

        <input
          aria-label="Search categories"
          type="text"
          placeholder="Search phonemes or pairs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#1a2438] border border-[#7dd3fc]/12 rounded-xl px-4 py-3 text-sm text-[#e0e8f0] placeholder:text-[#a0b4c4] outline-none focus:border-[#7dd3fc]/45"
        />

        <div data-testid="categories-grid" className="categories-grid grid grid-cols-2 gap-6">
          {visibleCategories.map((cat, idx) => {
            const label = cat.phoneme_type.replace(/_/g, ' ');
            const selected = selectedCategory === cat.phoneme_type;
            const categoryProgress = progressByCategory[cat.phoneme_type];
            const completedPairs = categoryProgress?.completedPairs ?? 0;
            const percent = cat.count > 0 ? Math.round((completedPairs / cat.count) * 100) : 0;
            const radius = 20;
            const circumference = 2 * Math.PI * radius;
            const strokeOffset = circumference * (1 - percent / 100);
            const isOddLast = visibleCategories.length % 2 === 1 && idx === visibleCategories.length - 1;
            const palette = cardPalette[idx % cardPalette.length];

            return (
              <button
                data-testid="category-card"
                key={cat.phoneme_type}
                onClick={() => onSelectCategory(cat.phoneme_type)}
                className={`categories-card text-left rounded-2xl border px-5 py-5 min-h-[190px] transition-all ${
                  isOddLast ? 'col-span-2 justify-self-center w-[calc(50%-0.75rem)]' : ''
                } ${
                  selected
                    ? 'bg-[#1a3a4e]/65 border-[#7dd3fc]/40 shadow-md shadow-[#7dd3fc]/20'
                    : `${palette.surface} hover:border-[#7dd3fc]/35`
                }`}
              >
                <div
                  data-testid="category-chip"
                  className={`inline-flex text-xs uppercase tracking-wider text-[#a0b4c4] border border-[#7dd3fc]/12 rounded-full px-2.5 py-1 mb-3 ${palette.chip}`}
                >
                  {selected ? 'Selected' : 'Category'}
                </div>
                <div className="text-[30px] leading-[1.05] font-black capitalize text-[#e0e8f0] min-h-[64px]">
                  {label}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
                      <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        fill="none"
                        stroke="rgba(125, 211, 252, 0.18)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        fill="none"
                        stroke={palette.ring}
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

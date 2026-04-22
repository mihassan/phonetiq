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
    { ring: '#7dd3fc' },
    { ring: '#88b4cc' },
    { ring: '#c8a0f0' },
    { ring: '#7dd3fc' },
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
      className="categories-stage categories-stage-surface ui-stage-panel w-[92%] md:w-full max-w-5xl rounded-[32px] md:rounded-[48px] flex flex-col overflow-hidden relative min-h-[500px] md:min-h-[600px] mt-4 md:mt-8 px-8 md:px-12 py-8 md:py-10"
    >
      <div className="ui-stack-6">
        <h2 className="ui-heading-lg">
          Categories
        </h2>

        <input
          aria-label="Search categories"
          type="text"
          placeholder="Search phonemes or pairs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="ui-input w-full min-h-11 rounded-xl px-4 py-3 text-sm outline-none"
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
                    ? 'categories-card--selected'
                    : ''
                }`}
              >
                <div
                  data-testid="category-chip"
                  className="ui-card-muted ui-eyebrow inline-flex rounded-full px-2.5 py-1 mb-3"
                >
                  {selected ? 'Selected' : 'Category'}
                </div>
                <div className="text-[30px] leading-[1.05] font-black capitalize min-h-[64px]">
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
                        className="category-ring-track"
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
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                      {percent}%
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="text-sm text-[color:var(--color-primary)]">{cat.count} pairs</div>
                    <div className="ui-muted text-xs">
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
          className="ui-link self-start min-h-11 px-3 rounded-full text-sm font-bold"
        >
          Show all pairs
        </button>
      </div>
    </main>
  );
}

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

  const cardPalette = [
    { surface: 'bg-[#dbe9f8]/70 border-[#9db8d6]/60', ring: '#5f88d6', chip: 'bg-[#e9f0fb]' },
    { surface: 'bg-[#e8dcf4]/70 border-[#b79acb]/60', ring: '#8f62bb', chip: 'bg-[#f2e9fa]' },
    { surface: 'bg-[#d8ecde]/70 border-[#8ab399]/60', ring: '#4f9b68', chip: 'bg-[#e7f5eb]' },
    { surface: 'bg-[#f1decc]/70 border-[#caa889]/60', ring: '#ce7b4d', chip: 'bg-[#f8ede3]' },
  ] as const;

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
      className="w-[92%] md:w-full max-w-5xl bg-[radial-gradient(circle_at_20%_0%,_rgba(232,242,255,0.98),_rgba(219,228,247,0.95)_45%,_rgba(203,220,236,0.92))] border border-white/40 rounded-[32px] md:rounded-[48px] shadow-2xl shadow-[#7dd3fc]/15 backdrop-blur-sm flex flex-col overflow-hidden relative min-h-[500px] md:min-h-[600px] mt-4 md:mt-8 px-8 md:px-12 py-8 md:py-10"
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#0f1e33]">
          Categories
        </h2>

        <input
          aria-label="Search categories"
          type="text"
          placeholder="Search phonemes or pairs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-white/55 border border-white/60 rounded-xl px-4 py-3 text-sm text-[#1a2a40] placeholder:text-[#6d7f95] outline-none focus:border-[#7aa3d8]"
        />

        <div data-testid="categories-grid" className="grid grid-cols-2 gap-6">
          {visibleCategories.map((cat, idx) => {
            const label = cat.phoneme_type.replace(/_/g, ' ');
            const selected = selectedCategory === cat.phoneme_type;
            const percent = Math.round((cat.count / maxCount) * 100);
            const completedPairs = Math.round((percent / 100) * cat.count);
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
                className={`text-left rounded-2xl border px-5 py-5 min-h-[190px] transition-all ${
                  isOddLast ? 'col-span-2 justify-self-center w-[calc(50%-0.75rem)]' : ''
                } ${
                  selected
                    ? 'bg-white/75 border-[#5f88d6]/65 shadow-md shadow-[#7aa3d8]/25'
                    : `${palette.surface} hover:border-[#7aa3d8]/60`
                }`}
              >
                <div
                  data-testid="category-chip"
                  className={`inline-flex text-xs uppercase tracking-wider text-[#4b5e76] border border-white/70 rounded-full px-2.5 py-1 mb-3 ${palette.chip}`}
                >
                  {selected ? 'Selected' : 'Category'}
                </div>
                <div className="text-[32px] leading-[1.05] font-black capitalize text-[#12253d] min-h-[64px]">
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
                        stroke="rgba(125, 211, 252, 0.2)"
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
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#223a59]">
                      {percent}%
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="text-sm text-[#365a86]">{cat.count} pairs</div>
                    <div className="text-xs text-[#5f7693]">
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
          className="self-start text-sm font-bold text-[#365a86] hover:text-[#28496f]"
        >
          Show all pairs
        </button>
      </div>
    </main>
  );
}

import { fireEvent, render, screen } from '@testing-library/react';
import { CategoriesStage } from './CategoriesStage';
import type { CategoryProgressSummary } from '../lib/types';

describe('CategoriesStage', () => {
  const categories = [
    { phoneme_type: 'consonant_voicing', count: 48 },
    { phoneme_type: 'vowel_short', count: 36 },
    { phoneme_type: 'nasal', count: 12 },
  ];

  const progressByCategory: Record<string, CategoryProgressSummary> = {
    consonant_voicing: {
      totalPairs: 48,
      completedPairs: 10,
      attemptedPairs: 22,
      totalAttempts: 120,
      totalCorrect: 90,
      accuracy: 75,
    },
    vowel_short: {
      totalPairs: 36,
      completedPairs: 36,
      attemptedPairs: 36,
      totalAttempts: 200,
      totalCorrect: 200,
      accuracy: 100,
    },
    nasal: {
      totalPairs: 12,
      completedPairs: 3,
      attemptedPairs: 8,
      totalAttempts: 20,
      totalCorrect: 5,
      accuracy: 25,
    },
  };

  it('shows real tracked progress (percent + completed pairs) on category cards', () => {
    render(
      <CategoriesStage
        categories={categories}
        progressByCategory={progressByCategory}
        selectedCategory={null}
        onSelectCategory={vi.fn()}
      />,
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('36 completed')).toBeInTheDocument();

    expect(screen.getByText('21%')).toBeInTheDocument();
    expect(screen.getByText('10 completed')).toBeInTheDocument();

    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('3 completed')).toBeInTheDocument();
  });

  it('filters categories by search query', () => {
    render(
      <CategoriesStage
        categories={categories}
        progressByCategory={progressByCategory}
        selectedCategory={null}
        onSelectCategory={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: /search categories/i }), {
      target: { value: 'nas' },
    });

    expect(screen.getByRole('button', { name: /nasal/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /consonant voicing/i }),
    ).not.toBeInTheDocument();
  });

  it('calls onSelectCategory for category card and show-all action', () => {
    const onSelectCategory = vi.fn();

    render(
      <CategoriesStage
        categories={categories}
        progressByCategory={progressByCategory}
        selectedCategory={null}
        onSelectCategory={onSelectCategory}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /nasal/i }));
    fireEvent.click(screen.getByRole('button', { name: /show all pairs/i }));

    expect(onSelectCategory).toHaveBeenNthCalledWith(1, 'nasal');
    expect(onSelectCategory).toHaveBeenNthCalledWith(2, null);
  });

  it('uses responsive grid layout and renders category chips', () => {
    render(
      <CategoriesStage
        categories={categories}
        progressByCategory={progressByCategory}
        selectedCategory={null}
        onSelectCategory={vi.fn()}
      />,
    );

    const grid = screen.getByTestId('categories-grid');
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('md:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-3');

    const chips = screen.getAllByTestId('category-chip');
    expect(chips).toHaveLength(3);
    expect(chips[0]).toHaveTextContent(/category/i);
  });

  it('uses roomier spacing and balanced layout', () => {
    render(
      <CategoriesStage
        categories={categories}
        progressByCategory={progressByCategory}
        selectedCategory={null}
        onSelectCategory={vi.fn()}
      />,
    );

    const stage = screen.getByTestId('categories-stage');
    const grid = screen.getByTestId('categories-grid');
    const cards = screen.getAllByTestId('category-card');

    expect(stage.className).toContain('px-5');
    expect(stage.className).toContain('py-6');
    expect(grid.className).toContain('gap-4');

    cards.forEach((card) => {
      expect(card.className).toContain('min-h-[160px]');
    });
  });
});

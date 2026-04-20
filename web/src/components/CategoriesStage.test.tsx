import { fireEvent, render, screen } from '@testing-library/react';
import { CategoriesStage } from './CategoriesStage';

describe('CategoriesStage', () => {
  const categories = [
    { phoneme_type: 'consonant_voicing', count: 48 },
    { phoneme_type: 'vowel_short', count: 36 },
    { phoneme_type: 'nasal', count: 12 },
  ];

  it('shows progress placeholders (percent + completed pairs) on category cards', () => {
    render(
      <CategoriesStage
        categories={categories}
        selectedCategory={null}
        onSelectCategory={vi.fn()}
      />,
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('48 of 48')).toBeInTheDocument();

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('27 of 36')).toBeInTheDocument();

    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('3 of 12')).toBeInTheDocument();
  });

  it('filters categories by search query', () => {
    render(
      <CategoriesStage
        categories={categories}
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
        selectedCategory={null}
        onSelectCategory={onSelectCategory}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /nasal/i }));
    fireEvent.click(screen.getByRole('button', { name: /show all pairs/i }));

    expect(onSelectCategory).toHaveBeenNthCalledWith(1, 'nasal');
    expect(onSelectCategory).toHaveBeenNthCalledWith(2, null);
  });

  it('uses two-column card layout and renders category chips', () => {
    render(
      <CategoriesStage
        categories={categories}
        selectedCategory={null}
        onSelectCategory={vi.fn()}
      />,
    );

    const grid = screen.getByTestId('categories-grid');
    expect(grid.className).toContain('grid-cols-2');

    const chips = screen.getAllByTestId('category-chip');
    expect(chips).toHaveLength(3);
    expect(chips[0]).toHaveTextContent(/category/i);
  });

  it('uses roomier spacing and balanced odd-card layout', () => {
    render(
      <CategoriesStage
        categories={categories}
        selectedCategory={null}
        onSelectCategory={vi.fn()}
      />,
    );

    const stage = screen.getByTestId('categories-stage');
    const grid = screen.getByTestId('categories-grid');
    const cards = screen.getAllByTestId('category-card');

    expect(stage.className).toContain('px-8');
    expect(stage.className).toContain('py-8');
    expect(grid.className).toContain('gap-6');

    cards.forEach((card) => {
      expect(card.className).toContain('min-h-[190px]');
    });

    expect(cards[cards.length - 1].className).toContain('col-span-2');
    expect(cards[cards.length - 1].className).toContain('justify-self-center');
  });
});

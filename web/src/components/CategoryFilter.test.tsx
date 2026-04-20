import { fireEvent, render, screen } from '@testing-library/react';
import { CategoryFilter } from './CategoryFilter';

describe('CategoryFilter', () => {
  const categories = [
    { phoneme_type: 'vowel_short', count: 2 },
    { phoneme_type: 'consonant_voicing_long', count: 3 },
  ];

  it('formats category names for display by replacing all underscores with spaces', () => {
    render(
      <CategoryFilter categories={categories} selected={null} onSelect={vi.fn()} />,
    );

    expect(
      screen.getByRole('button', { name: /consonant voicing long \(3\)/i }),
    ).toBeInTheDocument();
  });

  it('calls onSelect with null for All and category key for specific category', () => {
    const onSelect = vi.fn();
    render(
      <CategoryFilter categories={categories} selected={null} onSelect={onSelect} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /all \(5\)/i }));
    fireEvent.click(screen.getByRole('button', { name: /vowel short \(2\)/i }));

    expect(onSelect).toHaveBeenNthCalledWith(1, null);
    expect(onSelect).toHaveBeenNthCalledWith(2, 'vowel_short');
  });

  it('uses themed container and selected-chip styling aligned with design direction', () => {
    render(
      <CategoryFilter categories={categories} selected="vowel_short" onSelect={vi.fn()} />,
    );

    const container = screen.getByTestId('category-filter');
    const selected = screen.getByRole('button', { name: /vowel short \(2\)/i });

    expect(container.className).toContain('bg-[#0f1524]/60');
    expect(container.className).toContain('border-[#7dd3fc]/10');
    expect(selected.className).toContain('bg-[#7dd3fc]');
    expect(selected.className).toContain('text-[#001f2e]');
  });
});

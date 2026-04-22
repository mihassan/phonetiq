import { fireEvent, render, screen } from '@testing-library/react';
import { Navigation } from './Navigation';

describe('Navigation', () => {
  it('calls previous and next handlers when arrow buttons are clicked', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();

    render(
      <Navigation onPrev={onPrev} onNext={onNext} word1="ship" word2="sheep" />,
    );

    fireEvent.click(screen.getByRole('button', { name: /previous pair/i }));
    fireEvent.click(screen.getByRole('button', { name: /next pair/i }));

    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('exposes an explicit accessible name for the autoplay action', () => {
    render(
      <Navigation onPrev={vi.fn()} onNext={vi.fn()} word1="ship" word2="sheep" />,
    );

    expect(
      screen.getByRole('button', { name: /play pair audio/i }),
    ).toBeInTheDocument();
  });

  it('uses themed navigation container and control styles', () => {
    render(
      <Navigation onPrev={vi.fn()} onNext={vi.fn()} word1="ship" word2="sheep" />,
    );

    const container = screen.getByTestId('navigation-controls');
    const prev = screen.getByRole('button', { name: /previous pair/i });
    const auto = screen.getByRole('button', { name: /play pair audio/i });

    expect(container.className).toContain('ui-filter-shell');
    expect(prev.className).toContain('ui-btn-secondary');
    expect(auto.className).toContain('ui-btn-primary');
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { DialectFilter } from './DialectFilter';

describe('DialectFilter', () => {
  it('renders dialect options and toggles aria-pressed', () => {
    render(<DialectFilter selected="all" onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: /general/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /uk/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /us/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onSelect with chosen dialect', () => {
    const onSelect = vi.fn();
    render(<DialectFilter selected="all" onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /uk/i }));

    expect(onSelect).toHaveBeenCalledWith('uk_only');
  });
});

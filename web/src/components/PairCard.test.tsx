import { fireEvent, render, screen } from '@testing-library/react';
import { PairCard } from './PairCard';

const playWordAudioMock = vi.fn();

vi.mock('../lib/api', () => ({
  audioUrl: (word: string) => `/api/audio/${word}`,
}));

vi.mock('../lib/audioPlayback', () => ({
  playWordAudio: (...args: unknown[]) => playWordAudioMock(...args),
}));

describe('PairCard', () => {
  it('uses themed card, heading, and action styles', () => {
    render(<PairCard word="ship" isActive={true} isFirstWord={true} />);

    const card = screen.getByTestId('pair-card');
    const heading = screen.getByTestId('pair-card-heading');
    const button = screen.getByRole('button', { name: /play pronunciation/i });
    const helper = screen.getByTestId('pair-card-helper-text');

    expect(card.className).toContain('border-[#7dd3fc]/10');
    expect(heading.className).toContain('text-[#e0e8f0]');
    expect(heading.className).toContain('w-full');
    expect(heading.className).toContain('text-center');
    expect(heading.className).toContain('min-h-[104px]');
    expect(button.className).toContain('bg-[#7dd3fc]');
    expect(button.className).toContain('text-[#001f2e]');
    expect(helper.className).toContain('text-[#a0b4c4]');
  });

  it('plays audio when action button is clicked', () => {
    render(<PairCard word="ship" isActive={true} isFirstWord={false} />);

    fireEvent.click(screen.getByRole('button', { name: /play pronunciation/i }));

    expect(playWordAudioMock).toHaveBeenCalledTimes(1);
    expect(playWordAudioMock).toHaveBeenCalledWith('/api/audio/ship', expect.any(Object));
  });

  it('uses adaptive heading size for long words to keep visual symmetry', () => {
    render(<PairCard word="internationalization" isActive={true} isFirstWord={true} />);

    const heading = screen.getByTestId('pair-card-heading');
    expect(heading.className).toContain('text-[48px]');
    expect(heading.className).toContain('md:text-[72px]');
  });

  it('reduces heading size for medium words common in real data', () => {
    render(<PairCard word="tongue" isActive={true} isFirstWord={true} />);

    const heading = screen.getByTestId('pair-card-heading');
    expect(heading.className).toContain('text-[56px]');
    expect(heading.className).toContain('md:text-[88px]');
  });
});

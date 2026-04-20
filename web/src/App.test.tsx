import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const fetchPairsMock = vi.fn();
const fetchCategoriesMock = vi.fn();

vi.mock('./lib/api', () => ({
  fetchPairs: (...args: unknown[]) => fetchPairsMock(...args),
  fetchCategories: (...args: unknown[]) => fetchCategoriesMock(...args),
  audioUrl: (word: string) => `/api/audio/${word}`,
  recognizeSpeech: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    fetchCategoriesMock.mockResolvedValue({
      categories: [
        { phoneme_type: 'vowel_short', count: 2 },
        { phoneme_type: 'nasal', count: 1 },
      ],
    });

    fetchPairsMock.mockImplementation(async (params?: { category?: string }) => {
      if (params?.category === 'nasal') {
        return {
          pairs: [
            {
              id: 10,
              word1: 'thin',
              word2: 'tin',
              phoneme_type: 'nasal',
              target_sounds: 'θ/t',
              dialect_filter: 'all',
              difficulty_level: 1,
            },
          ],
        };
      }

      return {
        pairs: [
          {
            id: 1,
            word1: 'ship',
            word2: 'sheep',
            phoneme_type: 'vowel_short',
            target_sounds: 'ɪ/iː',
            dialect_filter: 'all',
            difficulty_level: 1,
          },
          {
            id: 2,
            word1: 'bit',
            word2: 'beet',
            phoneme_type: 'vowel_short',
            target_sounds: 'ɪ/iː',
            dialect_filter: 'all',
            difficulty_level: 1,
          },
        ],
      };
    });
  });

  it('shows loading first, then renders the first pair', async () => {
    render(<App />);

    expect(screen.getByText(/loading pairs/i)).toBeInTheDocument();

    expect(await screen.findByText(/pair 1 of 2/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /ship/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /sheep/i })).toBeInTheDocument();
  });

  it('renders the new shell regions for header, filters, stage, and navigation', async () => {
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);

    expect(screen.getByTestId('app-shell-header')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell-filters')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell-stage')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell-navigation')).toBeInTheDocument();
  });

  it('shows Learn stage structure by default and swaps it out in Practice mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);

    expect(screen.getByTestId('learn-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('practice-stage')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /practice/i }));

    expect(screen.getByTestId('practice-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('learn-stage')).not.toBeInTheDocument();
  });

  it('uses themed header and mode-toggle styling aligned with the design direction', async () => {
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);

    const header = screen.getByTestId('app-header');
    const toggle = screen.getByTestId('mode-toggle');

    expect(header.className).toContain('bg-[#0f1524]/75');
    expect(header.className).toContain('border-[#7dd3fc]/10');
    expect(toggle.className).toContain('bg-[#1a2438]/80');
  });

  it('applies themed container styling to the Practice stage', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);
    await user.click(screen.getByRole('button', { name: /practice/i }));

    const practiceStage = screen.getByTestId('practice-stage');
    expect(practiceStage.className).toContain('bg-[#0f1524]/90');
    expect(practiceStage.className).toContain('border-[#7dd3fc]/10');
    expect(practiceStage.className).toContain('backdrop-blur-sm');
  });

  it('applies themed progress and header colors in Practice stage', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);
    await user.click(screen.getByRole('button', { name: /practice/i }));

    const progressTrack = screen.getByTestId('practice-progress-track');
    const progressFill = screen.getByTestId('practice-progress-fill');
    const pairMeta = screen.getByTestId('practice-pair-meta');
    const targetSounds = screen.getByTestId('practice-target-sounds');

    expect(progressTrack.className).toContain('bg-[#1a2438]');
    expect(progressFill.className).toContain('bg-[#7dd3fc]');
    expect(pairMeta.className).toContain('text-[#a0b4c4]');
    expect(targetSounds.className).toContain('text-[#7dd3fc]');
  });

  it('goes next, wraps around, and previous wraps back', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);

    await user.click(screen.getByRole('button', { name: /next pair/i }));
    expect(screen.getByText(/pair 2 of 2/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next pair/i }));
    expect(screen.getByText(/pair 1 of 2/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /previous pair/i }));
    expect(screen.getByText(/pair 2 of 2/i)).toBeInTheDocument();
  });

  it('resets to first item when category changes', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);
    await user.click(screen.getByRole('button', { name: /next pair/i }));
    expect(screen.getByText(/pair 2 of 2/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /nasal \(1\)/i }));

    await waitFor(() => {
      expect(screen.getByText(/pair 1 of 1/i)).toBeInTheDocument();
    });
  });

  it('shows an empty-state message when no pairs are returned', async () => {
    fetchPairsMock.mockResolvedValueOnce({ pairs: [] });

    render(<App />);

    expect(await screen.findByText(/no word pairs found/i)).toBeInTheDocument();
  });
});

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

const useAuthMock = vi.fn();

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

describe('App', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    fetchCategoriesMock.mockImplementation(async (params?: { dialect?: string }) => {
      if (params?.dialect === 'uk_only') {
        return {
          categories: [{ phoneme_type: 'vowel_short', count: 1 }],
        };
      }

      return {
        categories: [
          { phoneme_type: 'vowel_short', count: 2 },
          { phoneme_type: 'nasal', count: 1 },
        ],
      };
    });

    fetchPairsMock.mockImplementation(async (params?: { category?: string; dialect?: string }) => {
      if (params?.dialect === 'uk_only') {
        return {
          pairs: [
            {
              id: 11,
              word1: 'paw',
              word2: 'pour',
              phoneme_type: 'vowel_short',
              target_sounds: 'ɔː/ɔə',
              dialect_filter: 'uk_only',
              difficulty_level: 2,
            },
          ],
        };
      }

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

  it('shows sign-in action in header for guests', async () => {
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
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

    await user.click(screen.getAllByRole('button', { name: /practice/i })[0]);

    expect(screen.getByTestId('practice-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('learn-stage')).not.toBeInTheDocument();
  });

  it('uses strict equal-width column grids for Learn and Practice stages', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);

    const learnColumns = screen.getByTestId('learn-stage-columns');
    expect(learnColumns.className).toContain('grid');
    expect(learnColumns.className).toContain('md:grid-cols-2');

    await user.click(screen.getAllByRole('button', { name: /practice/i })[0]);

    const practiceColumns = screen.getByTestId('practice-stage-body');
    expect(practiceColumns.className).toContain('grid');
    expect(practiceColumns.className).toContain('md:grid-cols-2');
  });

  it('renders categories stage when Categories mode is selected', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);

    await user.click(screen.getAllByRole('button', { name: /categories/i })[0]);

    expect(screen.getByTestId('categories-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('learn-stage')).not.toBeInTheDocument();
    expect(screen.queryByTestId('practice-stage')).not.toBeInTheDocument();
    expect(screen.queryByTestId('category-filter')).not.toBeInTheDocument();
  });

  it('renders profile stage when Profile mode is selected', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);

    await user.click(screen.getAllByRole('button', { name: /profile/i })[0]);

    expect(screen.getByTestId('profile-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('learn-stage')).not.toBeInTheDocument();
    expect(screen.queryByTestId('practice-stage')).not.toBeInTheDocument();
    expect(screen.queryByTestId('categories-stage')).not.toBeInTheDocument();
  });

  it('starts weak-pairs practice from profile action', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);
    await user.click(screen.getAllByRole('button', { name: /profile/i })[0]);
    await user.click(screen.getByRole('button', { name: /practice weak pairs/i }));

    expect(screen.getByTestId('practice-stage')).toBeInTheDocument();
  });

  it('renders a single responsive mode tab bar across breakpoints', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);

    const header = screen.getByTestId('app-header');
    const toggle = screen.getByTestId('mode-toggle');
    const debugToggle = screen.getByTestId('dev-debug-toggle');

    expect(header.className).toContain('ui-topbar');
    expect(toggle.className).toContain('ui-bottom-nav');
    expect(toggle.className).toContain('fixed');
    expect(toggle).toHaveTextContent(/learn/i);
    expect(toggle).toHaveTextContent(/categories/i);
    expect(toggle).toHaveTextContent(/practice/i);
    expect(toggle).toHaveTextContent(/profile/i);
    expect(debugToggle).toHaveTextContent(/debug on/i);

    await user.click(debugToggle);
    expect(debugToggle).toHaveTextContent(/debug off/i);
  });

  it('uses themed shell root background and text colors', async () => {
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);

    const shellRoot = screen.getByTestId('app-shell-root');
    expect(shellRoot.className).toContain('ui-shell');
  });

  it('applies themed container styling to the Practice stage', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);
    await user.click(screen.getAllByRole('button', { name: /practice/i })[0]);

    const practiceStage = screen.getByTestId('practice-stage');
    expect(practiceStage.className).toContain('ui-stage-panel');
  });

  it('applies themed progress and header colors in Practice stage', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);
    await user.click(screen.getAllByRole('button', { name: /practice/i })[0]);

    const progressTrack = screen.getByTestId('practice-progress-track');
    const progressFill = screen.getByTestId('practice-progress-fill');
    const pairMeta = screen.getByTestId('practice-pair-meta');
    const targetSounds = screen.getByTestId('practice-target-sounds');

    expect(progressTrack.className).toContain('ui-progress-track');
    expect(progressFill.className).toContain('ui-progress-fill');
    expect(pairMeta.className).toContain('ui-meta-label');
    expect(targetSounds.className).toContain('ui-sound-chip');
  });

  it('uses roomier practice-stage body spacing for card balance', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);
    await user.click(screen.getAllByRole('button', { name: /practice/i })[0]);

    const body = screen.getByTestId('practice-stage-body');
    expect(body.className).toContain('practice-stage-columns');
    expect(body.className).toContain('py-8');
    expect(body.className).toContain('gap-4');
  });

  it('shows refresh batch control and resets to first pair in practice session', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);
    await user.click(screen.getAllByRole('button', { name: /practice/i })[0]);

    expect(screen.getByRole('button', { name: /refresh batch/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next pair/i }));
    expect(screen.getByText(/pair 2 of 2/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /refresh batch/i }));
    expect(screen.getByText(/pair 1 of 2/i)).toBeInTheDocument();
  });

  it('shows dialect controls and updates totals for selected dialect', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/pair 1 of 2/i);
    expect(screen.getByRole('button', { name: /common/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /all \(3\)/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /uk/i }));

    await waitFor(() => {
      expect(screen.getByText(/pair 1 of 1/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /all \(1\)/i })).toBeInTheDocument();
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

    const emptyState = await screen.findByTestId('empty-state');
    expect(emptyState.className).toContain('ui-shell');
    expect(emptyState.className).toContain('ui-muted');

    expect(await screen.findByText(/no word pairs found/i)).toBeInTheDocument();
  });
});

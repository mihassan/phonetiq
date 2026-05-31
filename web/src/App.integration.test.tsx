import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const useAuthMock = vi.fn();

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('App integration: dialect-aware practice', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  it('switches to AU content, then uses en-AU audio URLs in Learn and Practice', async () => {
    const fetchMock = vi.fn(async (input: string | URL) => {
      const requestUrl = new URL(String(input), 'http://localhost');
      const dialect = requestUrl.searchParams.get('dialect');

      if (requestUrl.pathname.endsWith('/api/pairs/categories')) {
        if (dialect === 'au_only') {
          return jsonResponse({
            categories: [{ phoneme_type: 'vowel_long', count: 1 }],
          });
        }

        return jsonResponse({
          categories: [{ phoneme_type: 'vowel_short', count: 1 }],
        });
      }

      if (requestUrl.pathname.endsWith('/api/pairs')) {
        if (dialect === 'au_only') {
          return jsonResponse({
            pairs: [
              {
                id: 901,
                word1: 'ferry',
                word2: 'fairy',
                phoneme_type: 'vowel_long',
                target_sounds: '/e/ vs /eː/',
                dialect_filter: 'au_only',
                difficulty_level: 3,
                contrast_strength: 'supported',
                contrast_note: 'AU pilot contrast set for /e/ vs /æ/ and /ɪə/ vs /eː/.',
              },
            ],
          });
        }

        return jsonResponse({
          pairs: [
            {
              id: 1,
              word1: 'ship',
              word2: 'sheep',
              phoneme_type: 'vowel_short',
              target_sounds: '/ɪ/ vs /iː/',
              dialect_filter: 'all',
              difficulty_level: 1,
            },
          ],
        });
      }

      return jsonResponse({ error: 'Unexpected endpoint' }, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    const createdAudio: Array<{ src: string }> = [];
    class MockAudio {
      src = '';
      currentTime = 0;
      onplay: (() => void) | null = null;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(src?: string) {
        if (src) this.src = src;
        createdAudio.push(this);
      }

      play() {
        this.onplay?.();
        return Promise.resolve();
      }

      pause() {}
    }
    vi.stubGlobal('Audio', MockAudio);

    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/pair 1 of 1/i);
    await user.click(screen.getByRole('button', { name: /^au$/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /ferry/i })).toBeInTheDocument();
    });
    expect(screen.getByTestId('learn-dialect-notice')).toHaveTextContent(
      /supported in australian english/i,
    );
    expect(screen.getByTestId('learn-dialect-notice')).toHaveTextContent(
      /au pilot contrast set/i,
    );

    await user.click(screen.getAllByRole('button', { name: /play pronunciation/i })[0]);
    expect(createdAudio.at(-1)?.src).toContain('/api/audio/ferry');
    expect(createdAudio.at(-1)?.src).toContain('dialect=en-AU');
    expect(createdAudio.at(-1)?.src).toContain('voice=default');

    await user.click(screen.getAllByRole('button', { name: /^practice$/i })[0]);
    await screen.findByTestId('practice-stage');
    expect(screen.getByTestId('practice-dialect-notice')).toHaveTextContent(
      /supported in australian english/i,
    );
    await user.click(screen.getByTestId('practice-listen-button'));

    expect(createdAudio.at(-1)?.src).toContain('/api/audio/ferry');
    expect(createdAudio.at(-1)?.src).toContain('dialect=en-AU');
    expect(createdAudio.at(-1)?.src).toContain('voice=default');

    const pairRequests = fetchMock.mock.calls
      .map(([input]) => String(input))
      .filter((url) => url.includes('/api/pairs?'));
    expect(pairRequests.some((url) => url.includes('dialect=au_only'))).toBe(true);
  });
});

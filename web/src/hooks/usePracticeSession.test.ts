import { renderHook, act, waitFor } from '@testing-library/react';
import { usePracticeSession } from './usePracticeSession';

const fetchPairsMock = vi.fn();
const fetchCategoriesMock = vi.fn();

vi.mock('../lib/api', () => ({
  fetchPairs: (...args: unknown[]) => fetchPairsMock(...args),
  fetchCategories: (...args: unknown[]) => fetchCategoriesMock(...args),
}));

describe('usePracticeSession', () => {
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads categories and initial pairs on mount', async () => {
    const { result } = renderHook(() => usePracticeSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchCategoriesMock).toHaveBeenCalledTimes(1);
    expect(fetchPairsMock).toHaveBeenCalledWith({ category: undefined, limit: 200 });
    expect(result.current.categories).toHaveLength(2);
    expect(result.current.pairs).toHaveLength(2);
    expect(result.current.index).toBe(0);
    expect(result.current.targetNum).toBe(1);
  });

  it('wraps next/previous navigation and resets target word to first', async () => {
    const { result } = renderHook(() => usePracticeSession());

    await waitFor(() => {
      expect(result.current.pairs).toHaveLength(2);
    });

    act(() => {
      result.current.goNext();
    });
    expect(result.current.index).toBe(1);

    act(() => {
      result.current.goNext();
    });
    expect(result.current.index).toBe(0);

    act(() => {
      result.current.handlePracticeSuccess();
      result.current.goPrev();
    });
    expect(result.current.index).toBe(1);
    expect(result.current.targetNum).toBe(1);
  });

  it('advances target word first, then advances pair on second success', async () => {
    const { result } = renderHook(() => usePracticeSession());

    await waitFor(() => {
      expect(result.current.pairs).toHaveLength(2);
    });

    act(() => {
      result.current.handlePracticeSuccess();
    });
    expect(result.current.targetNum).toBe(2);
    expect(result.current.index).toBe(0);

    act(() => {
      result.current.handlePracticeSuccess();
    });
    expect(result.current.targetNum).toBe(1);
    expect(result.current.index).toBe(1);
  });

  it('resets index and target word when category changes', async () => {
    const { result } = renderHook(() => usePracticeSession());

    await waitFor(() => {
      expect(result.current.pairs).toHaveLength(2);
    });

    act(() => {
      result.current.goNext();
      result.current.handlePracticeSuccess();
    });
    expect(result.current.index).toBe(1);

    act(() => {
      result.current.setSelectedCategory('nasal');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.index).toBe(0);
    expect(result.current.targetNum).toBe(1);
    expect(result.current.pairs).toHaveLength(1);
    expect(fetchPairsMock).toHaveBeenLastCalledWith({ category: 'nasal', limit: 200 });
  });
});

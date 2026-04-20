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

    fetchPairsMock.mockImplementation(async (params?: { category?: string; dialect?: string }) => {
      if (params?.dialect === 'uk_only') {
        return {
          pairs: [
            {
              id: 50,
              word1: 'paw',
              word2: 'pour',
              phoneme_type: 'vowel_long',
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads categories and initial pairs on mount', async () => {
    const { result } = renderHook(() => usePracticeSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchCategoriesMock).toHaveBeenCalledTimes(1);
    expect(fetchCategoriesMock).toHaveBeenCalledWith({ dialect: 'all' });
    expect(fetchPairsMock).toHaveBeenCalledWith({ category: undefined, dialect: 'all', limit: 200 });
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
    expect(fetchPairsMock).toHaveBeenLastCalledWith({ category: 'nasal', dialect: 'all', limit: 200 });
  });

  it('refetches pairs and categories when dialect changes', async () => {
    const { result } = renderHook(() => usePracticeSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setDialect('uk_only');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchCategoriesMock).toHaveBeenLastCalledWith({ dialect: 'uk_only' });
    expect(fetchPairsMock).toHaveBeenLastCalledWith({
      category: undefined,
      dialect: 'uk_only',
      limit: 200,
    });
    expect(result.current.pairs).toHaveLength(1);
    expect(result.current.index).toBe(0);
    expect(result.current.targetNum).toBe(1);
  });

  it('records practice attempt outcomes to local progress state', async () => {
    const { result } = renderHook(() => usePracticeSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.recordPracticeAttempt({
        pairId: 1,
        category: 'vowel_short',
        targetWord: 1,
        isCorrect: true,
      });
    });

    expect(result.current.progressStore.totalAttempts).toBe(1);
    expect(result.current.progressStore.totalCorrect).toBe(1);
    expect(result.current.progressStore.pairs['1'].word1Attempts).toBe(1);
    expect(result.current.progressStore.pairs['1'].word1Correct).toBe(1);
  });

  it('uses adaptive next selection in practice mode based on weakness', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const { result } = renderHook(() => usePracticeSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.recordPracticeAttempt({
        pairId: 2,
        category: 'vowel_short',
        targetWord: 1,
        isCorrect: false,
      });
      result.current.setMode('PRACTICE');
      result.current.goNext();
    });

    expect(result.current.index).toBe(1);
    randomSpy.mockRestore();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { pairsRoutes } from '../src/routes/pairs';

describe('pairsRoutes', () => {
  it('includes all plus the selected dialect when filtering pairs for au_only', async () => {
    const all = vi.fn().mockResolvedValue({
      results: [
        {
          id: 201,
          word1: 'bar',
          word2: 'bore',
          phoneme_type: 'vowel_long',
          target_sounds: '/ɑr/ vs /ɔr/',
          dialect_filter: 'all',
          difficulty_level: 2,
        },
      ],
    });
    const bind = vi.fn().mockReturnValue({ all });
    const prepare = vi.fn().mockReturnValue({ bind });

    const res = await pairsRoutes.request('http://localhost/?dialect=au_only&limit=20&offset=0', {
      method: 'GET',
    }, {
      DB: { prepare } as unknown as D1Database,
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      pairs: [
        {
          id: 201,
          word1: 'bar',
          word2: 'bore',
          phoneme_type: 'vowel_long',
          target_sounds: '/ɑr/ vs /ɔr/',
          dialect_filter: 'all',
          difficulty_level: 2,
        },
      ],
      count: 1,
    });

    expect(prepare).toHaveBeenCalledWith("SELECT * FROM word_pairs WHERE dialect_filter IN ('all', ?) ORDER BY id LIMIT ? OFFSET ?");
    expect(bind).toHaveBeenCalledWith('au_only', 20, 0);
  });

  it('returns category counts using the same all plus selected dialect rule for au_only', async () => {
    const all = vi.fn().mockResolvedValue({
      results: [
        { phoneme_type: 'vowel_short', count: 42 },
        { phoneme_type: 'liquid', count: 18 },
      ],
    });
    const bind = vi.fn().mockReturnValue({ all });
    const prepare = vi.fn().mockReturnValue({ bind });

    const res = await pairsRoutes.request('http://localhost/categories?dialect=au_only', {
      method: 'GET',
    }, {
      DB: { prepare } as unknown as D1Database,
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      categories: [
        { phoneme_type: 'vowel_short', count: 42 },
        { phoneme_type: 'liquid', count: 18 },
      ],
    });

    expect(prepare).toHaveBeenCalledWith(
      `SELECT phoneme_type, COUNT(*) as count
     FROM word_pairs
     WHERE dialect_filter IN ('all', ?)
     GROUP BY phoneme_type
     ORDER BY phoneme_type`,
    );
    expect(bind).toHaveBeenCalledWith('au_only');
  });
});

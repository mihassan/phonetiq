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
          contrast_strength: 'supported',
          contrast_note: null,
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
          contrast_strength: 'supported',
          contrast_note: null,
        },
      ],
      count: 1,
    });

    expect(prepare).toHaveBeenCalledWith(`SELECT
    word_pairs.*,
    COALESCE(word_pair_dialect_metadata.contrast_strength, 'supported') as contrast_strength,
    word_pair_dialect_metadata.note as contrast_note
  FROM word_pairs
  LEFT JOIN word_pair_dialect_metadata
    ON word_pair_dialect_metadata.pair_id = word_pairs.id
    AND word_pair_dialect_metadata.target_dialect = ?
  WHERE word_pairs.dialect_filter IN ('all', ?)
    AND COALESCE(word_pair_dialect_metadata.contrast_strength, 'supported') != 'unavailable' ORDER BY word_pairs.id LIMIT ? OFFSET ?`);
    expect(bind).toHaveBeenCalledWith('au_only', 'au_only', 20, 0);
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
     LEFT JOIN word_pair_dialect_metadata
       ON word_pair_dialect_metadata.pair_id = word_pairs.id
       AND word_pair_dialect_metadata.target_dialect = ?
     WHERE word_pairs.dialect_filter IN ('all', ?)
       AND COALESCE(word_pair_dialect_metadata.contrast_strength, 'supported') != 'unavailable'
     GROUP BY phoneme_type
     ORDER BY phoneme_type`,
    );
    expect(bind).toHaveBeenCalledWith('au_only', 'au_only');
  });
});

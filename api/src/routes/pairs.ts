import { Hono } from 'hono';
import type { Env } from '../index';
import { coerceTargetDialect } from '../lib/dialects';

export const pairsRoutes = new Hono<{ Bindings: Env }>();

// GET /api/pairs - List word pairs with optional filters
pairsRoutes.get('/', async (c) => {
  const category = c.req.query('category');
  const dialect = coerceTargetDialect(c.req.query('dialect'));
  const difficulty = c.req.query('difficulty');
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  let query = `SELECT
    word_pairs.*,
    COALESCE(word_pair_dialect_metadata.contrast_strength, 'supported') as contrast_strength,
    word_pair_dialect_metadata.note as contrast_note
  FROM word_pairs
  LEFT JOIN word_pair_dialect_metadata
    ON word_pair_dialect_metadata.pair_id = word_pairs.id
    AND word_pair_dialect_metadata.target_dialect = ?
  WHERE word_pairs.dialect_filter IN ('all', ?)
    AND COALESCE(word_pair_dialect_metadata.contrast_strength, 'supported') != 'unavailable'`;
  const params: (string | number)[] = [dialect, dialect];

  if (category) {
    query += ` AND word_pairs.phoneme_type = ?`;
    params.push(category);
  }
  if (difficulty) {
    query += ` AND word_pairs.difficulty_level = ?`;
    params.push(parseInt(difficulty, 10));
  }

  query += ` ORDER BY word_pairs.id LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ pairs: results, count: results.length });
});

// GET /api/pairs/categories - List all available categories
pairsRoutes.get('/categories', async (c) => {
  const dialect = coerceTargetDialect(c.req.query('dialect'));

  const { results } = await c.env.DB.prepare(
    `SELECT phoneme_type, COUNT(*) as count
     FROM word_pairs
     LEFT JOIN word_pair_dialect_metadata
       ON word_pair_dialect_metadata.pair_id = word_pairs.id
       AND word_pair_dialect_metadata.target_dialect = ?
     WHERE word_pairs.dialect_filter IN ('all', ?)
       AND COALESCE(word_pair_dialect_metadata.contrast_strength, 'supported') != 'unavailable'
     GROUP BY phoneme_type
     ORDER BY phoneme_type`
  ).bind(dialect, dialect).all();
  return c.json({ categories: results });
});

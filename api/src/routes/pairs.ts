import { Hono } from 'hono';
import type { Env } from '../index';

export const pairsRoutes = new Hono<{ Bindings: Env }>();

// GET /api/pairs - List word pairs with optional filters
pairsRoutes.get('/', async (c) => {
  const category = c.req.query('category');
  const dialect = c.req.query('dialect') || 'all';
  const difficulty = c.req.query('difficulty');
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  let query = `SELECT * FROM word_pairs WHERE dialect_filter IN ('all', ?)`;
  const params: (string | number)[] = [dialect];

  if (category) {
    query += ` AND phoneme_type = ?`;
    params.push(category);
  }
  if (difficulty) {
    query += ` AND difficulty_level = ?`;
    params.push(parseInt(difficulty, 10));
  }

  query += ` ORDER BY id LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ pairs: results, count: results.length });
});

// GET /api/pairs/categories - List all available categories
pairsRoutes.get('/categories', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT phoneme_type, COUNT(*) as count FROM word_pairs GROUP BY phoneme_type ORDER BY phoneme_type`
  ).all();
  return c.json({ categories: results });
});

import { Hono } from 'hono';
import type { Env } from '../index';
import { getCurrentSessionUser } from '../lib/auth';

export const meRoutes = new Hono<{ Bindings: Env }>();

meRoutes.get('/', async (c) => {
  const user = await getCurrentSessionUser(c);
  return c.json({ user });
});

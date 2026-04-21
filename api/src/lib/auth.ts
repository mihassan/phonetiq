import type { Context } from 'hono';
import { getSessionIdFromCookie } from './session';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export async function getCurrentSessionUser(c: Context): Promise<SessionUser | null> {
  const sessionId = await getSessionIdFromCookie(c);
  if (!sessionId) return null;

  const db = (c.env as { DB: D1Database }).DB;

  const nowIso = new Date().toISOString();
  const result = await db.prepare(
    `SELECT u.id, u.email, u.name, u.avatar_url
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > ?
     LIMIT 1`,
  )
    .bind(sessionId, nowIso)
    .first<{
      id: string;
      email: string;
      name: string | null;
      avatar_url: string | null;
    }>();

  if (!result) return null;

  return {
    id: result.id,
    email: result.email,
    name: result.name ?? null,
    avatarUrl: result.avatar_url ?? null,
  };
}

export async function requireSessionUser(c: Context): Promise<SessionUser> {
  const user = await getCurrentSessionUser(c);
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

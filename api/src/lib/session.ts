import type { Context } from 'hono';
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie';

export const SESSION_COOKIE = 'phonetiq_session';
export const OAUTH_STATE_COOKIE = 'phonetiq_oauth_state';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function setSessionCookie(c: Context, sessionId: string) {
  const secret = (c.env as { SESSION_SECRET: string }).SESSION_SECRET;
  await setSignedCookie(c, SESSION_COOKIE, sessionId, secret, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function getSessionIdFromCookie(c: Context): Promise<string | null> {
  const secret = (c.env as { SESSION_SECRET: string }).SESSION_SECRET;
  const sessionId = await getSignedCookie(c, secret, SESSION_COOKIE);
  if (!sessionId || typeof sessionId !== 'string') return null;
  return sessionId;
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, SESSION_COOKIE, {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'Lax',
  });
}

export async function setOAuthStateCookie(c: Context, state: string) {
  const secret = (c.env as { SESSION_SECRET: string }).SESSION_SECRET;
  await setSignedCookie(c, OAUTH_STATE_COOKIE, state, secret, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 600,
  });
}

export async function getOAuthStateFromCookie(c: Context): Promise<string | null> {
  const secret = (c.env as { SESSION_SECRET: string }).SESSION_SECRET;
  const state = await getSignedCookie(c, secret, OAUTH_STATE_COOKIE);
  if (!state || typeof state !== 'string') return null;
  return state;
}

export function clearOAuthStateCookie(c: Context) {
  deleteCookie(c, OAUTH_STATE_COOKIE, {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'Lax',
  });
}

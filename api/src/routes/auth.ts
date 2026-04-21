import { Hono } from 'hono';
import type { Env } from '../index';
import {
  buildGoogleOAuthUrl,
  exchangeCodeForGoogleAccessToken,
  fetchGoogleUserProfile,
} from '../lib/googleOAuth';
import {
  clearOAuthStateCookie,
  clearSessionCookie,
  getOAuthStateFromCookie,
  getSessionIdFromCookie,
  setOAuthStateCookie,
  setSessionCookie,
} from '../lib/session';

export const authRoutes = new Hono<{ Bindings: Env }>();

function getOAuthRedirectUri(requestUrl: string) {
  const url = new URL(requestUrl);
  return `${url.origin}/api/auth/callback`;
}

function resolveOAuthRedirectUri(c: { env: Env; req: { url: string } }) {
  const configured = c.env.OAUTH_REDIRECT_URI?.trim();
  if (configured) return configured;
  return getOAuthRedirectUri(c.req.url);
}

authRoutes.get('/login', async (c) => {
  const state = crypto.randomUUID();
  await setOAuthStateCookie(c, state);

  const oauthUrl = buildGoogleOAuthUrl({
    clientId: c.env.GOOGLE_CLIENT_ID,
    redirectUri: resolveOAuthRedirectUri(c),
    state,
  });

  return c.redirect(oauthUrl, 302);
});

authRoutes.get('/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  if (!code || !state) {
    return c.json({ error: 'Missing OAuth callback parameters' }, 400);
  }

  const cookieState = await getOAuthStateFromCookie(c);
  if (!cookieState || cookieState !== state) {
    return c.json({ error: 'Invalid OAuth state' }, 400);
  }

  clearOAuthStateCookie(c);

  try {
    const redirectUri = resolveOAuthRedirectUri(c);
    const accessToken = await exchangeCodeForGoogleAccessToken({
      code,
      clientId: c.env.GOOGLE_CLIENT_ID,
      clientSecret: c.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    });

    const profile = await fetchGoogleUserProfile(accessToken);

    let user = await c.env.DB.prepare(
      `SELECT id FROM users WHERE provider = 'google' AND provider_user_id = ? LIMIT 1`,
    )
      .bind(profile.providerUserId)
      .first<{ id: string }>();

    if (!user) {
      const userId = `usr_${crypto.randomUUID()}`;
      await c.env.DB.prepare(
        `INSERT INTO users (id, email, name, avatar_url, provider, provider_user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'google', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      )
        .bind(userId, profile.email, profile.name, profile.avatarUrl, profile.providerUserId)
        .run();
      user = { id: userId };
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

    await c.env.DB.prepare(
      `INSERT INTO sessions (id, user_id, expires_at, created_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
    )
      .bind(sessionId, user.id, expiresAt)
      .run();

    await setSessionCookie(c, sessionId);

    return c.redirect(`${c.env.WEB_ORIGIN}/?auth=success`, 302);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

authRoutes.post('/logout', async (c) => {
  const sessionId = await getSessionIdFromCookie(c);
  if (sessionId) {
    await c.env.DB.prepare(`DELETE FROM sessions WHERE id = ?`).bind(sessionId).run();
  }

  clearSessionCookie(c);
  return c.json({ ok: true });
});

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { pairsRoutes } from './routes/pairs';
import { audioRoutes } from './routes/audio';
import { recognizeRoutes } from './routes/recognize';
import { authRoutes } from './routes/auth';
import { meRoutes } from './routes/me';
import { progressRoutes } from './routes/progress';

export type Env = {
  DB: D1Database;
  AI: Ai;
  AUDIO_BUCKET: R2Bucket;
  AI_RATE_LIMITER: RateLimit;
  API_RATE_LIMITER: RateLimit;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  WEB_ORIGIN: string;
  OAUTH_REDIRECT_URI?: string;
  CORS_ALLOWED_ORIGINS?: string;
  RECOGNITION_FOUNDATION_V2?: string;
  EXPERIMENT_TWO_PASS?: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use('/*', (c, next) => {
  const configured = c.env.CORS_ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

  const allowlist = new Set([c.env.WEB_ORIGIN, ...configured]);

  return cors({
    origin: (origin) => {
      if (!origin) return c.env.WEB_ORIGIN;
      return allowlist.has(origin) ? origin : '';
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })(c, next);
});

// Tier 1: Strict rate limit for the AI endpoint (10 req/min per IP)
app.use('/api/recognize/*', async (c, next) => {
  const ip = c.req.header('cf-connecting-ip') ?? 'unknown';
  const { success } = await c.env.AI_RATE_LIMITER.limit({ key: ip });
  if (!success) {
    return c.json({ error: 'Too many practice attempts. Please wait a minute.' }, 429);
  }
  await next();
});

// Tier 2: Standard rate limit for all API endpoints (100 req/min per IP)
app.use('/api/*', async (c, next) => {
  const ip = c.req.header('cf-connecting-ip') ?? 'unknown';
  const { success } = await c.env.API_RATE_LIMITER.limit({ key: ip });
  if (!success) {
    return c.json({ error: 'Too many requests. Please wait a minute.' }, 429);
  }
  await next();
});

app.get('/api/health', (c) => c.json({ status: 'ok' }));

app.route('/api/pairs', pairsRoutes);
app.route('/api/audio', audioRoutes);
app.route('/api/recognize', recognizeRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/me', meRoutes);
app.route('/api/progress', progressRoutes);

export default app;

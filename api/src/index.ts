import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { pairsRoutes } from './routes/pairs';
import { audioRoutes } from './routes/audio';
import { recognizeRoutes } from './routes/recognize';

export type Env = {
  DB: D1Database;
  AI: Ai;
  AUDIO_BUCKET: R2Bucket;
  AI_RATE_LIMITER: RateLimit;
  API_RATE_LIMITER: RateLimit;
};

const app = new Hono<{ Bindings: Env }>();

app.use('/*', cors());

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

export default app;

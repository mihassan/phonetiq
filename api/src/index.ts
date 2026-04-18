import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { pairsRoutes } from './routes/pairs';
import { audioRoutes } from './routes/audio';
import { recognizeRoutes } from './routes/recognize';

export type Env = {
  DB: D1Database;
  AI: Ai;
  AUDIO_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Env }>();

app.use('/*', cors());

app.get('/api/health', (c) => c.json({ status: 'ok' }));

app.route('/api/pairs', pairsRoutes);
app.route('/api/audio', audioRoutes);
app.route('/api/recognize', recognizeRoutes);

export default app;

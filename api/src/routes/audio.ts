import { Hono } from 'hono';
import type { Env } from '../index';

export const audioRoutes = new Hono<{ Bindings: Env }>();

// GET /api/audio/:word - Serve pre-generated audio from R2
audioRoutes.get('/:word', async (c) => {
  const word = c.req.param('word').toLowerCase().trim();
  const key = `${word}.m4a`;

  const object = await c.env.AUDIO_BUCKET.get(key);

  if (!object) {
    return c.json({ error: `Audio not found for "${word}"` }, 404);
  }

  const headers = new Headers();
  headers.set('Content-Type', 'audio/mp4');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  object.writeHttpMetadata(headers);

  return new Response(object.body, { headers });
});

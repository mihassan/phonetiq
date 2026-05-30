import { Hono } from 'hono';
import type { Env } from '../index';

export const audioRoutes = new Hono<{ Bindings: Env }>();

function sanitizeWord(value: string) {
  return value.toLowerCase().trim().replace(/'/g, '').replace(/\s+/g, '-');
}

function normalizeAssetSegment(value: string) {
  return value.trim().toLowerCase();
}

// GET /api/audio/:word - Serve pre-generated audio from R2
audioRoutes.get('/:word', async (c) => {
  const word = sanitizeWord(c.req.param('word'));
  const dialect = c.req.query('dialect');
  const voice = c.req.query('voice');

  const candidateKeys = dialect
    ? [
        voice ? `${normalizeAssetSegment(dialect)}/${normalizeAssetSegment(voice)}/${word}.m4a` : null,
        `${normalizeAssetSegment(dialect)}/${word}.m4a`,
        `${word}.m4a`,
      ].filter((key): key is string => key !== null)
    : [`${word}.m4a`];

  let object: R2ObjectBody | null = null;
  for (const key of candidateKeys) {
    object = await c.env.AUDIO_BUCKET.get(key);
    if (object) break;
  }

  if (!object) {
    return c.json({ error: `Audio not found for "${word}"` }, 404);
  }

  const headers = new Headers();
  headers.set('Content-Type', 'audio/mp4');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  object.writeHttpMetadata(headers);

  return new Response(object.body, { headers });
});

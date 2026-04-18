import { Hono } from 'hono';
import type { Env } from '../index';

export const recognizeRoutes = new Hono<{ Bindings: Env }>();

// POST /api/recognize - Transcribe audio blob using Workers AI (Whisper)
recognizeRoutes.post('/', async (c) => {
  const contentType = c.req.header('content-type') || '';

  let audioBytes: ArrayBuffer;

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData();
    const file = formData.get('audio');
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'Missing "audio" file in form data' }, 400);
    }
    audioBytes = await file.arrayBuffer();
  } else {
    audioBytes = await c.req.arrayBuffer();
  }

  if (audioBytes.byteLength === 0) {
    return c.json({ error: 'Empty audio payload' }, 400);
  }

  // Max 1MB audio
  if (audioBytes.byteLength > 1_048_576) {
    return c.json({ error: 'Audio too large (max 1MB)' }, 413);
  }

  try {
    const result = await c.env.AI.run('@cf/openai/whisper', {
      audio: [...new Uint8Array(audioBytes)],
    } as Record<string, unknown>);

    const transcript = ((result as Record<string, unknown>).text as string || '').toLowerCase().trim();

    return c.json({ transcript });
  } catch (err) {
    console.error('Whisper AI error:', err);
    return c.json({ error: 'Speech recognition failed' }, 500);
  }
});

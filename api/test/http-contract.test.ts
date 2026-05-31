import { describe, expect, it, vi } from 'vitest';
import app from '../src/index';
import type { Env } from '../src/index';

type QueryResult = { results: Array<Record<string, unknown>> };

function createEnv(overrides?: Partial<Env>) {
  const all = vi.fn(async (...params: unknown[]): Promise<QueryResult> => {
    const dialect = params[1] as string;
    if (dialect !== 'us_only') {
      return { results: [] };
    }

    return {
      results: [
        {
          id: 1,
          word1: 'ship',
          word2: 'sheep',
          phoneme_type: 'vowel_short',
          target_sounds: '/ɪ/ vs /iː/',
          dialect_filter: 'all',
          difficulty_level: 1,
          contrast_strength: 'supported',
          contrast_note: null,
        },
      ],
    };
  });
  const bind = vi.fn((...params: unknown[]) => ({ all: () => all(...params) }));
  const prepare = vi.fn(() => ({ bind }));

  return {
    DB: { prepare } as unknown as D1Database,
    AUDIO_BUCKET: { get: vi.fn() } as unknown as R2Bucket,
    API_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) } as unknown as RateLimit,
    AI_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) } as unknown as RateLimit,
    AI: {
      run: vi.fn().mockResolvedValue({ text: 'the word is ship' }),
    } as unknown as Ai,
    WEB_ORIGIN: 'http://localhost:5173',
    GOOGLE_CLIENT_ID: 'test',
    GOOGLE_CLIENT_SECRET: 'test',
    SESSION_SECRET: 'test',
    OAUTH_REDIRECT_URI: 'http://localhost/callback',
    CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
    ...overrides,
  };
}

describe('http response contracts', () => {
  it('keeps /api/health response shape stable', async () => {
    const res = await app.request('http://localhost/api/health', { method: 'GET' }, createEnv());
    const body = await res.json() as { status: string };

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'ok' });
  });

  it('keeps /api/pairs response keys stable', async () => {
    const res = await app.request(
      'http://localhost/api/pairs?dialect=us_only&limit=20&offset=0',
      { method: 'GET', headers: { Origin: 'http://localhost:5173' } },
      createEnv(),
    );
    const body = await res.json() as { count: number; pairs: Array<Record<string, unknown>> };

    expect(res.status).toBe(200);
    expect(body.count).toBe(1);
    expect(Array.isArray(body.pairs)).toBe(true);
    expect(body.pairs[0]).toMatchObject({
      id: expect.any(Number),
      word1: expect.any(String),
      word2: expect.any(String),
      phoneme_type: expect.any(String),
      target_sounds: expect.any(String),
      dialect_filter: expect.any(String),
      difficulty_level: expect.any(Number),
      contrast_strength: expect.any(String),
      contrast_note: null,
    });
  });

  it('keeps /api/recognize success response keys stable', async () => {
    const audioBody = new Uint8Array([1, 2, 3, 4]);
    const res = await app.request(
      'http://localhost/api/recognize',
      {
        method: 'POST',
        headers: {
          'content-type': 'audio/wav',
          Origin: 'http://localhost:5173',
        },
        body: audioBody,
      },
      createEnv(),
    );
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      transcript: expect.any(String),
      matchedWord: null,
      matchType: 'freeform',
      debug: null,
    });
  });

  it('keeps /api/recognize error response key stable for empty payload', async () => {
    const res = await app.request(
      'http://localhost/api/recognize',
      {
        method: 'POST',
        headers: {
          'content-type': 'audio/wav',
          Origin: 'http://localhost:5173',
        },
        body: new Uint8Array(),
      },
      createEnv(),
    );
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Empty audio payload' });
  });
});

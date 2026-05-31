import { describe, expect, it, vi } from 'vitest';
import app from '../src/index';

type QueryResult = { results: Array<Record<string, unknown>> };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('app integration', () => {
  it('serves AU-filtered pairs through /api/pairs and en-AU audio through /api/audio', async () => {
    const all = vi.fn(async (...params: unknown[]): Promise<QueryResult> => {
      const [, dialect] = params as [string, string];
      if (dialect !== 'au_only') {
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
      }

      return {
        results: [
          {
            id: 501,
            word1: 'ferry',
            word2: 'fairy',
            phoneme_type: 'vowel_long',
            target_sounds: '/e/ vs /eː/',
            dialect_filter: 'au_only',
            difficulty_level: 3,
            contrast_strength: 'supported',
            contrast_note: 'AU pilot contrast set for /e/ vs /æ/ and /ɪə/ vs /eː/.',
          },
        ],
      };
    });
    const bind = vi.fn((...params: unknown[]) => ({ all: () => all(...params) }));
    const prepare = vi.fn(() => ({ bind }));

    const r2Object = {
      body: 'au-audio',
      writeHttpMetadata: vi.fn(),
    } as unknown as R2ObjectBody;
    const get = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(r2Object);

    const env = {
      DB: { prepare } as unknown as D1Database,
      AUDIO_BUCKET: { get } as unknown as R2Bucket,
      API_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) } as unknown as RateLimit,
      AI_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) } as unknown as RateLimit,
      AI: {} as Ai,
      WEB_ORIGIN: 'http://localhost:5173',
      GOOGLE_CLIENT_ID: 'test',
      GOOGLE_CLIENT_SECRET: 'test',
      SESSION_SECRET: 'test',
      OAUTH_REDIRECT_URI: 'http://localhost/callback',
      CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
    };

    const pairsRes = await app.request(
      'http://localhost/api/pairs?dialect=au_only&limit=20&offset=0',
      { method: 'GET', headers: { Origin: 'http://localhost:5173' } },
      env,
    );

    expect(pairsRes.status).toBe(200);
    await expect(pairsRes.json()).resolves.toEqual({
      pairs: [
        {
          id: 501,
          word1: 'ferry',
          word2: 'fairy',
          phoneme_type: 'vowel_long',
          target_sounds: '/e/ vs /eː/',
          dialect_filter: 'au_only',
          difficulty_level: 3,
          contrast_strength: 'supported',
          contrast_note: 'AU pilot contrast set for /e/ vs /æ/ and /ɪə/ vs /eː/.',
        },
      ],
      count: 1,
    });

    const audioRes = await app.request(
      'http://localhost/api/audio/who%27d?dialect=en-AU&voice=default',
      { method: 'GET', headers: { Origin: 'http://localhost:5173' } },
      env,
    );

    expect(audioRes.status).toBe(200);
    expect(get.mock.calls).toEqual([
      ['en-au/default/whod.m4a'],
      ['en-au/whod.m4a'],
    ]);
  });

  it('returns 429 for /api/pairs when the general API limiter is exceeded', async () => {
    const env = {
      DB: { prepare: vi.fn() } as unknown as D1Database,
      AUDIO_BUCKET: { get: vi.fn() } as unknown as R2Bucket,
      API_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: false }) } as unknown as RateLimit,
      AI_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) } as unknown as RateLimit,
      AI: {} as Ai,
      WEB_ORIGIN: 'http://localhost:5173',
      GOOGLE_CLIENT_ID: 'test',
      GOOGLE_CLIENT_SECRET: 'test',
      SESSION_SECRET: 'test',
      OAUTH_REDIRECT_URI: 'http://localhost/callback',
      CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
    };

    const res = await app.request(
      'http://localhost/api/pairs?dialect=au_only',
      { method: 'GET', headers: { Origin: 'http://localhost:5173' } },
      env,
    );

    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toEqual({
      error: 'Too many requests. Please wait a minute.',
    });
  });
});

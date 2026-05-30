import { describe, expect, it, vi } from 'vitest';
import { audioRoutes } from '../src/routes/audio';

function makeObject(body = 'audio-body') {
  return {
    body,
    writeHttpMetadata: vi.fn(),
  } as unknown as R2ObjectBody;
}

describe('audioRoutes', () => {
  it('looks up dialect-aware audio keys before the legacy flat key', async () => {
    const exact = makeObject();
    const get = vi.fn().mockResolvedValue(exact);

    const res = await audioRoutes.request('http://localhost/whod?dialect=en-AU&voice=default', {
      method: 'GET',
    }, {
      AUDIO_BUCKET: { get } as unknown as R2Bucket,
    });

    expect(res.status).toBe(200);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('en-au/default/whod.m4a');
  });

  it('falls back from dialect+voice to dialect-only to legacy flat key', async () => {
    const legacy = makeObject();
    const get = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(legacy);

    const res = await audioRoutes.request('http://localhost/who%27d?dialect=en-AU&voice=default', {
      method: 'GET',
    }, {
      AUDIO_BUCKET: { get } as unknown as R2Bucket,
    });

    expect(res.status).toBe(200);
    expect(get.mock.calls).toEqual([
      ['en-au/default/whod.m4a'],
      ['en-au/whod.m4a'],
      ['whod.m4a'],
    ]);
  });

  it('returns 404 when no matching audio asset exists', async () => {
    const get = vi.fn().mockResolvedValue(null);

    const res = await audioRoutes.request('http://localhost/ship?dialect=en-GB&voice=default', {
      method: 'GET',
    }, {
      AUDIO_BUCKET: { get } as unknown as R2Bucket,
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Audio not found for "ship"' });
    expect(get.mock.calls).toEqual([
      ['en-gb/default/ship.m4a'],
      ['en-gb/ship.m4a'],
      ['ship.m4a'],
    ]);
  });
});

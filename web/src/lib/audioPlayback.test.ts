import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { playPairAudio, playWordAudio } from './audioPlayback';

type MockAudio = {
  src: string;
  onplay: (() => void) | null;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  play: ReturnType<typeof vi.fn>;
};

function createMockAudio(): MockAudio {
  return {
    src: '',
    onplay: null,
    onended: null,
    onerror: null,
    play: vi.fn().mockResolvedValue(undefined),
  };
}

describe('audioPlayback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('reuses existing audio element and updates playing state callbacks', async () => {
    const audio = createMockAudio();
    const onPlayStateChange = vi.fn();

    const returned = playWordAudio('/api/audio/ship', {
      reuseAudio: audio as unknown as HTMLAudioElement,
      onPlayStateChange,
    });

    expect(returned).toBe(audio);
    expect(audio.src).toBe('/api/audio/ship');
    expect(audio.play).toHaveBeenCalledTimes(1);

    audio.onplay?.();
    audio.onended?.();

    expect(onPlayStateChange).toHaveBeenNthCalledWith(1, true);
    expect(onPlayStateChange).toHaveBeenNthCalledWith(2, false);
  });

  it('sets playing state false when playback promise rejects', async () => {
    const audio = createMockAudio();
    audio.play.mockRejectedValueOnce(new Error('play failed'));
    const onPlayStateChange = vi.fn();

    playWordAudio('/api/audio/ship', {
      reuseAudio: audio as unknown as HTMLAudioElement,
      onPlayStateChange,
    });

    await Promise.resolve();

    expect(onPlayStateChange).toHaveBeenCalledWith(false);
  });

  it('plays second audio after first ends with configured gap', async () => {
    const first = createMockAudio();
    const second = createMockAudio();
    const factory = vi
      .fn()
      .mockReturnValueOnce(first as unknown as HTMLAudioElement)
      .mockReturnValueOnce(second as unknown as HTMLAudioElement);

    await playPairAudio('/api/audio/ship', '/api/audio/sheep', {
      factory,
      gapMs: 600,
    });

    expect(factory).toHaveBeenNthCalledWith(1, '/api/audio/ship');
    expect(factory).toHaveBeenNthCalledWith(2, '/api/audio/sheep');
    expect(first.play).toHaveBeenCalledTimes(1);
    expect(second.play).toHaveBeenCalledTimes(0);

    first.onended?.();
    vi.advanceTimersByTime(599);
    expect(second.play).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1);
    expect(second.play).toHaveBeenCalledTimes(1);
  });
});

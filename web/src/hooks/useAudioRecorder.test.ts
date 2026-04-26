import {
  buildRecordingMetrics,
  getSpeechWindow,
  trimBlobToSpeechWindow,
  trimChunksToWindow,
  waitForRecorderReadiness,
} from './useAudioRecorder';

// Mock MediaRecorder
let instances: MockMediaRecorder[] = [];

class MockMediaRecorder {
  state: string = 'inactive';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  stream: MediaStream;

  constructor(stream: MediaStream) {
    this.stream = stream;
    instances.push(this);
  }

  start() {
    this.state = 'recording';
    // Simulate data chunk immediately
    queueMicrotask(() => {
      this.ondataavailable?.({ data: new Blob(['audio-data'], { type: 'audio/webm' }) });
    });
  }

  stop() {
    this.state = 'inactive';
    queueMicrotask(() => this.onstop?.());
  }

  static isTypeSupported() {
    return true;
  }
}

class MockAnalyserNode {
  fftSize = 2048;
  smoothingTimeConstant = 0.2;

  connect() {}
  disconnect() {}
  getByteTimeDomainData(buffer: Uint8Array) {
    buffer.fill(128);
  }
}

class MockAudioContext {
  sampleRate = 16000;

  createAnalyser() {
    return new MockAnalyserNode();
  }

  createMediaStreamSource() {
    return { connect() {} };
  }

  resume() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }

  decodeAudioData() {
    const channel = new Float32Array(16000);
    channel.fill(0.5, 3200, 11200);
    return Promise.resolve({
      sampleRate: 16000,
      numberOfChannels: 1,
      length: 16000,
      getChannelData: () => channel,
    } as unknown as AudioBuffer);
  }
}

// @ts-expect-error mock
globalThis.MediaRecorder = MockMediaRecorder;
// @ts-expect-error mock
globalThis.AudioContext = MockAudioContext;

const mockGetUserMedia = vi.fn().mockResolvedValue({
  getTracks: () => [{ stop: vi.fn() }],
} as unknown as MediaStream);

Object.defineProperty(globalThis.navigator, 'mediaDevices', {
  value: { getUserMedia: mockGetUserMedia },
  writable: true,
});

describe('useAudioRecorder', () => {
  beforeEach(() => {
    instances = [];
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('detects speech against a noisy baseline instead of treating the whole clip as active', () => {
    const samples = [
      ...Array.from({ length: 8 }, (_, index) => ({ elapsedMs: index * 100, level: 0.042 })),
      ...Array.from({ length: 6 }, (_, index) => ({ elapsedMs: 800 + index * 100, level: 0.12 })),
      ...Array.from({ length: 6 }, (_, index) => ({ elapsedMs: 1400 + index * 100, level: 0.042 })),
    ];

    const metrics = buildRecordingMetrics(samples, 2000);

    expect(metrics.speechStartMs).toBe(800);
    expect(metrics.speechEndMs).toBe(1300);
    expect(metrics.leadingSilenceMs).toBe(800);
    expect(metrics.trailingSilenceMs).toBe(700);
  });

  it('classifies flat high-activity captures as possible noise', () => {
    const samples = [
      ...Array.from({ length: 4 }, (_, index) => ({ elapsedMs: index * 100, level: 0.02 })),
      ...Array.from({ length: 16 }, (_, index) => ({
        elapsedMs: 400 + index * 100,
        level: 0.08 + (index % 2) * 0.005,
      })),
    ];

    const metrics = buildRecordingMetrics(samples, 2000);

    expect(metrics.likelyIssue).toBe('possible_noise');
  });

  it('returns a padded speech window that trims long leading and trailing silence', () => {
    const window = getSpeechWindow({
      durationMs: 3000,
      averageLevel: 0.08,
      peakLevel: 0.18,
      activityRatio: 0.22,
      speechStartMs: 900,
      speechEndMs: 1600,
      leadingSilenceMs: 900,
      trailingSilenceMs: 1400,
      likelyIssue: 'long_trailing_silence',
    });

    expect(window).toEqual({
      startMs: 700,
      endMs: 1900,
    });
  });

  it('keeps only the chunk range around the detected speech window', () => {
    const trimmed = trimChunksToWindow(
      Array.from({ length: 10 }, (_, index) => new Blob([`chunk-${index}`], { type: 'audio/webm' })),
      { startMs: 700, endMs: 1900 },
      3000,
    );

    expect(trimmed).toHaveLength(5);
  });

  it('trims decoded audio down to the detected speech window', async () => {
    const trimmed = await trimBlobToSpeechWindow(
      new Blob(['audio-data'], { type: 'audio/webm' }),
      { startMs: 200, endMs: 700 },
    );

    expect(trimmed?.type).toBe('audio/wav');
    expect(trimmed?.size).toBeGreaterThan(44);
  });

  it('waits for warm-up and recorder readiness before resolving', async () => {
    let resolveReady!: () => void;
    const readyPromise = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });
    let resolved = false;

    const pending = waitForRecorderReadiness(readyPromise, {
      warmupMs: 500,
      readyTimeoutMs: 1500,
    }).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(499);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(resolved).toBe(false);

    resolveReady();
    await pending;
    expect(resolved).toBe(true);
  });

  it('falls back after the recorder readiness timeout', async () => {
    let resolved = false;

    const pending = waitForRecorderReadiness(new Promise<void>(() => {}), {
      warmupMs: 500,
      readyTimeoutMs: 1500,
    }).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(1999);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(resolved).toBe(true);
  });

});

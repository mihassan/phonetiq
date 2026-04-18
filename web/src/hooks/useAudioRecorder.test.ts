import { renderHook, act } from '@testing-library/react';
import { useAudioRecorder } from './useAudioRecorder';

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

// @ts-expect-error mock
globalThis.MediaRecorder = MockMediaRecorder;

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

  it('returns a non-empty blob when stopRecording is called while still recording', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);

    let blob: Blob = new Blob();
    await act(async () => {
      blob = await result.current.stopRecording();
    });

    expect(blob.size).toBeGreaterThan(0);
  });

  it('should NOT have an internal auto-stop timer (hook should be dumb)', () => {
    // The hook currently has a setTimeout(3000) that auto-stops.
    // This is the root cause of the race condition.
    // After fix: no internal timer, caller controls timing.

    // We can verify by checking the source: start recording, advance 3100ms,
    // and the recorder should still be in 'recording' state.
    // But since we can't easily test source, we test behavior:

    const { result } = renderHook(() => useAudioRecorder());

    let startPromise: Promise<void>;
    act(() => {
      startPromise = result.current.startRecording();
    });

    return startPromise!.then(() => {
      const recorder = instances[0];
      expect(recorder.state).toBe('recording');

      // Advance past the buggy 3000ms auto-stop
      act(() => {
        vi.advanceTimersByTime(3100);
      });

      // After fix, recorder should STILL be recording (caller hasn't stopped it)
      // BUG: the internal setTimeout stops it
      expect(recorder.state).toBe('recording');
    });
  });
});

import { act, renderHook } from '@testing-library/react';
import { usePracticeAttempt } from './usePracticeAttempt';

const startRecordingMock = vi.fn();
const stopRecordingMock = vi.fn();
const recognizeSpeechMock = vi.fn();

vi.mock('./useAudioRecorder', () => ({
  useAudioRecorder: () => ({
    startRecording: startRecordingMock,
    stopRecording: stopRecordingMock,
  }),
}));

vi.mock('../lib/api', () => ({
  recognizeSpeech: (...args: unknown[]) => recognizeSpeechMock(...args),
}));

function createRecordingResult(overrides?: Record<string, unknown>) {
  return {
    blob: new Blob(['audio'], { type: 'audio/webm' }),
    objectUrl: 'blob:debug-recording',
    mimeType: 'audio/webm',
    metrics: {
      durationMs: 3000,
      averageLevel: 0.12,
      peakLevel: 0.42,
      activityRatio: 0.58,
      speechStartMs: 220,
      speechEndMs: 2140,
      leadingSilenceMs: 220,
      trailingSilenceMs: 860,
      likelyIssue: null,
    },
    ...overrides,
  };
}

describe('usePracticeAttempt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    startRecordingMock.mockResolvedValue(undefined);
    stopRecordingMock.mockResolvedValue(createRecordingResult());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('progresses to correct and calls onSuccess for matching transcript', async () => {
    recognizeSpeechMock.mockResolvedValue('ship');
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      usePracticeAttempt({ word: 'ship', onSuccess }),
    );

    await act(async () => {
      await result.current.handleRecord();
    });

    expect(result.current.status).toBe('recording');

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe('correct');
    expect(result.current.transcript).toBe('ship');
    expect(result.current.feedback).toEqual({
      title: 'Nice.',
      detail: 'We matched the target word.',
    });

    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('idle');
    expect(result.current.isCompleted).toBe(true);
    expect(result.current.feedback).toBeNull();
  });

  it('goes to incorrect then returns to idle for non-matching transcript', async () => {
    recognizeSpeechMock.mockResolvedValue('shape');

    const { result } = renderHook(() =>
      usePracticeAttempt({ word: 'ship', onSuccess: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleRecord();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe('incorrect');
    expect(result.current.transcript).toBe('shape');

    await act(async () => {
      vi.advanceTimersByTime(2500);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('idle');
  });

  it('ignores repeat clicks while an attempt is in progress', async () => {
    recognizeSpeechMock.mockImplementation(() => new Promise<string>(() => {}));

    const { result } = renderHook(() =>
      usePracticeAttempt({ word: 'ship', onSuccess: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleRecord();
    });

    expect(result.current.status).toBe('recording');
    expect(startRecordingMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.handleRecord();
    });

    expect(startRecordingMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('processing');

    await act(async () => {
      await result.current.handleRecord();
    });

    expect(startRecordingMock).toHaveBeenCalledTimes(1);
  });

  it('does not start a new recording from incorrect state before reset', async () => {
    recognizeSpeechMock.mockResolvedValue('shape');

    const { result } = renderHook(() =>
      usePracticeAttempt({ word: 'ship', onSuccess: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleRecord();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe('incorrect');
    expect(startRecordingMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.handleRecord();
    });

    expect(startRecordingMock).toHaveBeenCalledTimes(1);
  });

  it('emits attempt evaluation callbacks for correct and incorrect results', async () => {
    const onAttemptEvaluated = vi.fn();

    recognizeSpeechMock.mockResolvedValueOnce('ship');
    const { result, rerender } = renderHook(
      ({ word }: { word: string }) =>
        usePracticeAttempt({ word, onSuccess: vi.fn(), onAttemptEvaluated }),
      { initialProps: { word: 'ship' } },
    );

    await act(async () => {
      await result.current.handleRecord();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onAttemptEvaluated).toHaveBeenCalledWith({
      isCorrect: true,
      transcript: 'ship',
      matchType: 'freeform',
    });

    recognizeSpeechMock.mockResolvedValueOnce('shape');
    rerender({ word: 'ship' });

    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.handleRecord();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onAttemptEvaluated).toHaveBeenLastCalledWith({
      isCorrect: false,
      transcript: 'shape',
      matchType: 'freeform',
    });
  });

  it('passes both word candidates to speech recognition', async () => {
    recognizeSpeechMock.mockResolvedValue({ transcript: 'ship', matchType: 'exact', matchedWord: 'ship' });

    const { result } = renderHook(() =>
      usePracticeAttempt({
        word: 'ship',
        partnerWord: 'sheep',
        dialect: 'uk_only',
        onSuccess: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleRecord();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(recognizeSpeechMock).toHaveBeenCalledWith(expect.anything(), {
      candidate1: 'ship',
      candidate2: 'sheep',
      dialect: 'uk_only',
      debug: true,
    });
  });

  it('still runs recognition when recorder metrics are unavailable', async () => {
    stopRecordingMock.mockResolvedValue(
      createRecordingResult({
        metrics: null,
      }),
    );
    recognizeSpeechMock.mockResolvedValue({ transcript: 'ship', matchType: 'exact', matchedWord: 'ship' });

    const { result } = renderHook(() =>
      usePracticeAttempt({ word: 'ship', partnerWord: 'sheep', onSuccess: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleRecord();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(recognizeSpeechMock).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('correct');
  });

  it('stays in an arming state until the microphone is actually ready', async () => {
    let resolveStart!: () => void;
    startRecordingMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveStart = resolve;
      }),
    );

    const { result } = renderHook(() =>
      usePracticeAttempt({ word: 'ship', partnerWord: 'sheep', onSuccess: vi.fn() }),
    );

    act(() => {
      void result.current.handleRecord();
    });

    expect(result.current.status).toBe('arming');

    await act(async () => {
      resolveStart();
      await Promise.resolve();
    });

    expect(result.current.status).toBe('recording');
  });

  it('uses no-match state and returns to idle', async () => {
    recognizeSpeechMock.mockResolvedValue({ transcript: 'bonjour', matchType: 'no_match', matchedWord: null });

    const { result } = renderHook(() =>
      usePracticeAttempt({ word: 'ship', partnerWord: 'sheep', onSuccess: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleRecord();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe('no_match');

    await act(async () => {
      vi.advanceTimersByTime(2500);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('idle');
  });

  it('exposes noMatchHint when frame_sentence mode has a transcript but no frame match', async () => {
    recognizeSpeechMock.mockResolvedValue({
      transcript: 'cat',
      matchType: 'no_match',
      matchedWord: null,
      debug: null,
    });
    const onAttemptEvaluated = vi.fn();

    const { result } = renderHook(() =>
      usePracticeAttempt({
        word: 'cat',
        onSuccess: vi.fn(),
        experimentMode: 'frame_sentence',
        onAttemptEvaluated,
      }),
    );

    await act(async () => { await result.current.handleRecord(); });
    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe('no_match');
    expect(result.current.noMatchHint).toBe('use_frame');
    expect(result.current.feedback).toEqual({
      title: 'You missed the frame sentence.',
      detail: 'Say “The word is cat” so we can extract the target word.',
    });
  });

  it('noMatchHint is null when transcript is empty in frame_sentence mode', async () => {
    recognizeSpeechMock.mockResolvedValue({
      transcript: '',
      matchType: 'no_match',
      matchedWord: null,
      debug: null,
    });

    const { result } = renderHook(() =>
      usePracticeAttempt({
        word: 'cat',
        onSuccess: vi.fn(),
        experimentMode: 'frame_sentence',
      }),
    );

    await act(async () => { await result.current.handleRecord(); });
    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe('no_match');
    expect(result.current.noMatchHint).toBeNull();
    expect(result.current.feedback).toEqual({
      title: 'We could not match that attempt.',
      detail: 'Try the target word again.',
    });
  });

  it('noMatchHint is null in standard mode even with a transcript', async () => {
    recognizeSpeechMock.mockResolvedValue({
      transcript: 'cot',
      matchType: 'no_match',
      matchedWord: null,
      debug: null,
    });

    const { result } = renderHook(() =>
      usePracticeAttempt({ word: 'cat', onSuccess: vi.fn() }),
    );

    await act(async () => { await result.current.handleRecord(); });
    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe('no_match');
    expect(result.current.noMatchHint).toBeNull();
  });

  it('skips recognition for low-signal recordings and exposes the debug reason', async () => {
    stopRecordingMock.mockResolvedValue(
      createRecordingResult({
        metrics: {
          durationMs: 3000,
          averageLevel: 0.002,
          peakLevel: 0.006,
          activityRatio: 0.01,
          speechStartMs: null,
          speechEndMs: null,
          leadingSilenceMs: 3000,
          trailingSilenceMs: 3000,
          likelyIssue: 'low_signal',
        },
      }),
    );

    const { result } = renderHook(() =>
      usePracticeAttempt({ word: 'ship', partnerWord: 'sheep', onSuccess: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleRecord();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(recognizeSpeechMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe('no_match');
    expect(result.current.debugInfo?.skipReason).toBe('low_signal');
    expect(result.current.debugInfo?.recording.metrics?.likelyIssue).toBe('low_signal');
    expect(result.current.feedback).toEqual({
      title: 'We barely heard you.',
      detail: 'Try speaking a little louder or closer to the mic.',
    });
  });

  it('skips recognition when the capture looks dominated by environmental noise', async () => {
    stopRecordingMock.mockResolvedValue(
      createRecordingResult({
        metrics: {
          durationMs: 3000,
          averageLevel: 0.08,
          peakLevel: 0.1,
          activityRatio: 0.98,
          speechStartMs: 0,
          speechEndMs: 3000,
          leadingSilenceMs: 0,
          trailingSilenceMs: 0,
          likelyIssue: 'possible_noise',
        },
      }),
    );

    const { result } = renderHook(() =>
      usePracticeAttempt({ word: 'ship', partnerWord: 'sheep', onSuccess: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleRecord();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(recognizeSpeechMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe('no_match');
    expect(result.current.debugInfo?.skipReason).toBe('possible_noise');
  });

  it('passes debug mode to recognition and stores the raw recognition details', async () => {
    recognizeSpeechMock.mockResolvedValue({
      transcript: 'ship',
      matchType: 'exact',
      matchedWord: 'ship',
      debug: {
        rawTranscript: 'Ship',
        normalizedTranscript: 'ship',
      },
    });

    const { result } = renderHook(() =>
      usePracticeAttempt({ word: 'ship', partnerWord: 'sheep', onSuccess: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleRecord();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(recognizeSpeechMock).toHaveBeenCalledWith(expect.anything(), {
      candidate1: 'ship',
      candidate2: 'sheep',
      dialect: undefined,
      debug: true,
    });
    expect(result.current.debugInfo?.recognition?.rawTranscript).toBe('Ship');
    expect(result.current.debugInfo?.recording.objectUrl).toBe('blob:debug-recording');
  });

  it('can disable debug mode and skip the extra recognition payload', async () => {
    recognizeSpeechMock.mockResolvedValue({
      transcript: 'ship',
      matchType: 'exact',
      matchedWord: 'ship',
      debug: null,
    });

    const { result } = renderHook(() =>
      usePracticeAttempt({
        word: 'ship',
        partnerWord: 'sheep',
        debugEnabled: false,
        onSuccess: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleRecord();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(recognizeSpeechMock).toHaveBeenCalledWith(expect.anything(), {
      candidate1: 'ship',
      candidate2: 'sheep',
      dialect: undefined,
      debug: false,
    });
    expect(result.current.debugInfo?.recognition).toBeNull();
  });

  it('allows a low-signal recording to be force-sent in development debug flow', async () => {
    stopRecordingMock.mockResolvedValue(
      createRecordingResult({
        metrics: {
          durationMs: 3000,
          averageLevel: 0.002,
          peakLevel: 0.006,
          activityRatio: 0.01,
          speechStartMs: null,
          speechEndMs: null,
          leadingSilenceMs: 3000,
          trailingSilenceMs: 3000,
          likelyIssue: 'low_signal',
        },
      }),
    );
    recognizeSpeechMock.mockResolvedValue({
      transcript: 'ship',
      matchType: 'exact',
      matchedWord: 'ship',
      debug: {
        rawTranscript: 'Ship',
        normalizedTranscript: 'ship',
      },
    });

    const { result } = renderHook(() =>
      usePracticeAttempt({ word: 'ship', partnerWord: 'sheep', onSuccess: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleRecord();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.debugInfo?.skipReason).toBe('low_signal');

    await act(async () => {
      await result.current.sendDebugRecording();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(recognizeSpeechMock).toHaveBeenCalledTimes(1);
    expect(result.current.debugInfo?.recognition?.rawTranscript).toBe('Ship');
    expect(result.current.debugInfo?.skipReason).toBeUndefined();
  });

  it('preserves API debug details when recognition fails with a server error', async () => {
    recognizeSpeechMock.mockRejectedValue(
      Object.assign(new Error('Speech recognition failed'), {
        status: 500,
        debug: {
          rawTranscript: '',
          normalizedTranscript: '',
          prompt: 'The speaker will say one short English word in British English.',
          rawResult: {
            error: {
              name: 'InferenceUpstreamError',
              message: 'error code: 1031',
            },
          },
        },
      }),
    );

    const { result } = renderHook(() =>
      usePracticeAttempt({ word: 'ship', partnerWord: 'sheep', onSuccess: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleRecord();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe('no_match');
    expect(result.current.debugInfo?.recognition?.prompt).toContain('British English');
    expect(result.current.debugInfo?.recognition?.rawResult).toEqual({
      error: {
        name: 'InferenceUpstreamError',
        message: 'error code: 1031',
      },
    });
  });

  it('resets completion state when the target word changes', async () => {
    recognizeSpeechMock.mockResolvedValue('ship');

    const { result, rerender } = renderHook(
      ({ word }: { word: string }) => usePracticeAttempt({ word, onSuccess: vi.fn() }),
      { initialProps: { word: 'ship' } },
    );

    await act(async () => {
      await result.current.handleRecord();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
    });

    expect(result.current.isCompleted).toBe(true);

    rerender({ word: 'bit' });

    expect(result.current.status).toBe('idle');
    expect(result.current.transcript).toBe('');
    expect(result.current.isCompleted).toBe(false);
  });
});

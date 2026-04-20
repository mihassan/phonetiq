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

describe('usePracticeAttempt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    startRecordingMock.mockResolvedValue(undefined);
    stopRecordingMock.mockResolvedValue(new Blob(['audio'], { type: 'audio/webm' }));
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

    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('idle');
    expect(result.current.isCompleted).toBe(true);
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
    });
  });
});

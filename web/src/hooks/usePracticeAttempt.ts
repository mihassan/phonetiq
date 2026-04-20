import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioRecorder } from './useAudioRecorder';
import { recognizeSpeech } from '../lib/api';

export type PracticeStatus =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'correct'
  | 'incorrect';

interface UsePracticeAttemptOptions {
  word: string;
  onSuccess: () => void;
  recordDurationMs?: number;
  successDelayMs?: number;
  incorrectDelayMs?: number;
}

export function usePracticeAttempt({
  word,
  onSuccess,
  recordDurationMs = 3000,
  successDelayMs = 1500,
  incorrectDelayMs = 2500,
}: UsePracticeAttemptOptions) {
  const { startRecording, stopRecording } = useAudioRecorder();

  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<PracticeStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(0 as unknown as ReturnType<typeof setTimeout>);

  useEffect(() => {
    if (status !== 'recording') {
      setProgress(0);
      return;
    }

    startTimeRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startTimeRef.current;
      setProgress(Math.min(elapsed / recordDurationMs, 1));
      if (elapsed < recordDurationMs) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [status, recordDurationMs]);

  const handleRecord = useCallback(async () => {
    if (status !== 'idle' && status !== 'incorrect') return;

    setStatus('recording');
    setTranscript('');
    await startRecording();

    timerRef.current = setTimeout(async () => {
      const blob = await stopRecording();
      if (blob.size === 0) {
        setStatus('idle');
        return;
      }

      setStatus('processing');
      try {
        const text = await recognizeSpeech(blob);
        setTranscript(text);

        const target = word.toLowerCase();
        if (text.includes(target)) {
          setStatus('correct');
          setTimeout(() => {
            setStatus('idle');
            setTranscript('');
            setIsCompleted(true);
            onSuccess();
          }, successDelayMs);
        } else {
          setStatus('incorrect');
          setTimeout(() => setStatus('idle'), incorrectDelayMs);
        }
      } catch {
        setStatus('idle');
      }
    }, recordDurationMs);
  }, [
    status,
    startRecording,
    stopRecording,
    word,
    onSuccess,
    recordDurationMs,
    successDelayMs,
    incorrectDelayMs,
  ]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return {
    transcript,
    status,
    progress,
    isCompleted,
    handleRecord,
  };
}

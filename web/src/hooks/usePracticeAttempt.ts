import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioRecorder } from './useAudioRecorder';
import { recognizeSpeech } from '../lib/api';

export type PracticeStatus =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'correct'
  | 'incorrect'
  | 'no_match';

interface UsePracticeAttemptOptions {
  word: string;
  partnerWord?: string;
  onSuccess: () => void;
  onAttemptEvaluated?: (result: {
    isCorrect: boolean;
    transcript: string;
    matchType: 'exact' | 'token' | 'fuzzy' | 'no_match' | 'freeform';
  }) => void;
  recordDurationMs?: number;
  successDelayMs?: number;
  incorrectDelayMs?: number;
}

export function usePracticeAttempt({
  word,
  partnerWord,
  onSuccess,
  onAttemptEvaluated,
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
  const outcomeTimerRef = useRef<ReturnType<typeof setTimeout>>(0 as unknown as ReturnType<typeof setTimeout>);

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
    if (status !== 'idle') return;

    clearTimeout(timerRef.current);
    clearTimeout(outcomeTimerRef.current);

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
        const rawRecognition = await recognizeSpeech(blob, {
          candidate1: word,
          candidate2: partnerWord ?? word,
        });
        const recognition =
          typeof rawRecognition === 'string'
            ? { transcript: rawRecognition, matchType: 'freeform' as const, matchedWord: null }
            : rawRecognition;
        const text = recognition.transcript.toLowerCase().trim();
        setTranscript(text);

        const target = word.toLowerCase();
        const matched = recognition.matchedWord?.toLowerCase().trim() ?? null;

        if (recognition.matchType === 'no_match') {
          onAttemptEvaluated?.({
            isCorrect: false,
            transcript: text,
            matchType: 'no_match',
          });
          setStatus('no_match');
          outcomeTimerRef.current = setTimeout(() => {
            setStatus('idle');
          }, incorrectDelayMs);
          return;
        }

        if (matched === target || text.includes(target)) {
          onAttemptEvaluated?.({
            isCorrect: true,
            transcript: text,
            matchType: recognition.matchType,
          });
          setStatus('correct');
          outcomeTimerRef.current = setTimeout(() => {
            setStatus('idle');
            setTranscript('');
            setIsCompleted(true);
            onSuccess();
          }, successDelayMs);
        } else {
          onAttemptEvaluated?.({
            isCorrect: false,
            transcript: text,
            matchType: recognition.matchType,
          });
          setStatus('incorrect');
          outcomeTimerRef.current = setTimeout(() => {
            setStatus('idle');
          }, incorrectDelayMs);
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
    partnerWord,
    onSuccess,
    recordDurationMs,
    successDelayMs,
    incorrectDelayMs,
    onAttemptEvaluated,
  ]);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(outcomeTimerRef.current);
    };
  }, []);

  return {
    transcript,
    status,
    progress,
    isCompleted,
    handleRecord,
  };
}

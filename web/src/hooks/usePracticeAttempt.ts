import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAudioRecorder,
  type RecordingMetrics,
  type RecordingResult,
} from './useAudioRecorder';
import { recognizeSpeech, type RecognizeSpeechResult } from '../lib/api';

export type PracticeStatus =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'correct'
  | 'incorrect'
  | 'no_match';

type MatchType = 'exact' | 'token' | 'fuzzy' | 'no_match' | 'freeform';
type DebugSkipReason = 'low_signal';

export interface PracticeAttemptDebugInfo {
  recording: {
    objectUrl: string | null;
    mimeType: string;
    blobSize: number;
    metrics: RecordingMetrics | null;
  };
  skipReason?: DebugSkipReason;
  recognition?: RecognizeSpeechResult['debug'];
}

interface UsePracticeAttemptOptions {
  word: string;
  partnerWord?: string;
  dialect?: string;
  onSuccess: () => void;
  onAttemptEvaluated?: (result: {
    isCorrect: boolean;
    transcript: string;
    matchType: MatchType;
  }) => void;
  recordDurationMs?: number;
  successDelayMs?: number;
  incorrectDelayMs?: number;
}

function revokeObjectUrl(url: string | null | undefined) {
  if (url && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
}

function shouldSkipRecognition(metrics: RecordingMetrics | null) {
  return (
    metrics?.likelyIssue === 'low_signal' ||
    ((metrics?.speechStartMs == null || (metrics?.activityRatio ?? 0) < 0.04) &&
      (metrics?.peakLevel ?? 0) < 0.02)
  );
}

export function usePracticeAttempt({
  word,
  partnerWord,
  dialect,
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
  const [debugInfo, setDebugInfo] = useState<PracticeAttemptDebugInfo | null>(null);

  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(0 as unknown as ReturnType<typeof setTimeout>);
  const outcomeTimerRef = useRef<ReturnType<typeof setTimeout>>(0 as unknown as ReturnType<typeof setTimeout>);
  const debugUrlRef = useRef<string | null>(null);
  const lastRecordingRef = useRef<RecordingResult | null>(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    clearTimeout(outcomeTimerRef.current);
    cancelAnimationFrame(animFrameRef.current);
    revokeObjectUrl(debugUrlRef.current);
    debugUrlRef.current = null;
    setStatus('idle');
    setTranscript('');
    setProgress(0);
    setIsCompleted(false);
    setDebugInfo(null);
    lastRecordingRef.current = null;
  }, [word, partnerWord]);

  const resetAttempt = useCallback(() => {
    clearTimeout(outcomeTimerRef.current);
    setStatus('idle');
    setTranscript('');
  }, []);

  const runRecognition = useCallback(async (
    recording: RecordingResult,
    nextDebugInfo: PracticeAttemptDebugInfo,
  ) => {
    setStatus('processing');
    try {
      const rawRecognition = await recognizeSpeech(recording.blob, {
        candidate1: word,
        candidate2: partnerWord ?? word,
        dialect,
        debug: import.meta.env.DEV,
      });
      const recognition =
        typeof rawRecognition === 'string'
          ? { transcript: rawRecognition, matchType: 'freeform' as const, matchedWord: null, debug: null }
          : rawRecognition;

      const text = recognition.transcript.toLowerCase().trim();
      setTranscript(text);
      setDebugInfo({
        ...nextDebugInfo,
        skipReason: undefined,
        recognition: recognition.debug ?? null,
      });

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
    } catch (error) {
      setDebugInfo({
        ...nextDebugInfo,
        recognition: {
          rawTranscript: '',
          normalizedTranscript: '',
          rawResult: {
            error: error instanceof Error ? error.message : 'Speech recognition failed',
          },
        },
      });
      setStatus('no_match');
    }
  }, [dialect, incorrectDelayMs, onAttemptEvaluated, onSuccess, partnerWord, successDelayMs, word]);

  const sendDebugRecording = useCallback(async () => {
    const recording = lastRecordingRef.current;
    const nextDebugInfo = debugInfo;
    if (!recording || !nextDebugInfo) return;

    await runRecognition(recording, nextDebugInfo);
  }, [debugInfo, runRecognition]);

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
      const recording = await stopRecording();
      if (recording.blob.size === 0) {
        setStatus('idle');
        return;
      }

      revokeObjectUrl(debugUrlRef.current);
      debugUrlRef.current = recording.objectUrl;
      lastRecordingRef.current = recording;

      const nextDebugInfo: PracticeAttemptDebugInfo = {
        recording: {
          objectUrl: recording.objectUrl,
          mimeType: recording.mimeType,
          blobSize: recording.blob.size,
          metrics: recording.metrics,
        },
      };
      setDebugInfo(nextDebugInfo);

      if (shouldSkipRecognition(recording.metrics)) {
        onAttemptEvaluated?.({
          isCorrect: false,
          transcript: '',
          matchType: 'no_match',
        });
        setStatus('no_match');
        setDebugInfo({
          ...nextDebugInfo,
          skipReason: 'low_signal',
        });
        if (!import.meta.env.DEV) {
          outcomeTimerRef.current = setTimeout(() => {
            setStatus('idle');
          }, incorrectDelayMs);
        }
        return;
      }

      await runRecognition(recording, nextDebugInfo);
    }, recordDurationMs);
  }, [
    status,
    startRecording,
    stopRecording,
    word,
    partnerWord,
    dialect,
    onSuccess,
    recordDurationMs,
    successDelayMs,
    incorrectDelayMs,
    onAttemptEvaluated,
    runRecognition,
  ]);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(outcomeTimerRef.current);
      revokeObjectUrl(debugUrlRef.current);
    };
  }, []);

  return {
    transcript,
    status,
    progress,
    isCompleted,
    debugInfo,
    resetAttempt,
    sendDebugRecording,
    handleRecord,
  };
}

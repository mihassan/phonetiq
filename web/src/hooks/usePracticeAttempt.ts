import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAudioRecorder,
  type RecordingMetrics,
  type RecordingResult,
} from './useAudioRecorder';
import { recognizeSpeech, type RecognizeSpeechResult } from '../lib/api';

export type PracticeStatus =
  | 'idle'
  | 'arming'
  | 'recording'
  | 'processing'
  | 'correct'
  | 'incorrect'
  | 'no_match';

type MatchType = 'exact' | 'token' | 'fuzzy' | 'no_match' | 'freeform';
type DebugSkipReason = 'low_signal' | 'possible_noise';

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

interface AttemptState {
  key: string;
  transcript: string;
  status: PracticeStatus;
  progress: number;
  isCompleted: boolean;
  debugInfo: PracticeAttemptDebugInfo | null;
  noMatchHint: 'use_frame' | null;
}

interface UsePracticeAttemptOptions {
  word: string;
  partnerWord?: string;
  dialect?: string;
  experimentMode?: 'frame_sentence';
  debugEnabled?: boolean;
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

function extractRecognitionDebug(error: unknown): RecognizeSpeechResult['debug'] {
  if (error && typeof error === 'object') {
    const errorLike = error as {
      debug?: RecognizeSpeechResult['debug'];
      status?: number;
      body?: unknown;
      message?: string;
    };

    if (errorLike.debug) {
      return errorLike.debug;
    }

    return {
      rawTranscript: '',
      normalizedTranscript: '',
      rawResult: {
        error: errorLike.message || 'Speech recognition failed',
        status: errorLike.status,
        body: errorLike.body ?? null,
      },
    };
  }

  return {
    rawTranscript: '',
    normalizedTranscript: '',
    rawResult: {
      error: 'Speech recognition failed',
    },
  };
}

function revokeObjectUrl(url: string | null | undefined) {
  if (url && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
}

function shouldSkipRecognition(metrics: RecordingMetrics | null) {
  if (!metrics) {
    return false;
  }

  return (
    metrics?.likelyIssue === 'low_signal' ||
    metrics?.likelyIssue === 'possible_noise' ||
    ((metrics?.speechStartMs == null || (metrics?.activityRatio ?? 0) < 0.04) &&
      (metrics?.peakLevel ?? 0) < 0.02)
  );
}

function getSkipReason(metrics: RecordingMetrics | null): DebugSkipReason {
  return metrics?.likelyIssue === 'possible_noise' ? 'possible_noise' : 'low_signal';
}

function buildInitialAttemptState(key: string): AttemptState {
  return {
    key,
    transcript: '',
    status: 'idle',
    progress: 0,
    isCompleted: false,
    debugInfo: null,
    noMatchHint: null,
  };
}

export function usePracticeAttempt({
  word,
  partnerWord,
  dialect,
  experimentMode,
  debugEnabled = import.meta.env.DEV,
  onSuccess,
  onAttemptEvaluated,
  recordDurationMs = 3000,
  successDelayMs = 1500,
  incorrectDelayMs = 2500,
}: UsePracticeAttemptOptions) {
  const sessionKey = `${word}::${partnerWord ?? ''}`;
  const { startRecording, stopRecording } = useAudioRecorder();

  const [attemptState, setAttemptState] = useState<AttemptState>(() =>
    buildInitialAttemptState(sessionKey),
  );

  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(0 as unknown as ReturnType<typeof setTimeout>);
  const outcomeTimerRef = useRef<ReturnType<typeof setTimeout>>(0 as unknown as ReturnType<typeof setTimeout>);
  const debugUrlRef = useRef<string | null>(null);
  const lastRecordingRef = useRef<RecordingResult | null>(null);
  const activeSessionKeyRef = useRef(sessionKey);

  const currentState =
    attemptState.key === sessionKey ? attemptState : buildInitialAttemptState(sessionKey);

  const patchAttemptState = useCallback(
    (targetKey: string, patch: Partial<Omit<AttemptState, 'key'>>) => {
      setAttemptState((prev) => {
        if (prev.key !== targetKey) {
          return { ...buildInitialAttemptState(targetKey), ...patch, key: targetKey };
        }
        return { ...prev, ...patch, key: targetKey };
      });
    },
    [],
  );

  useEffect(() => {
    clearTimeout(timerRef.current);
    clearTimeout(outcomeTimerRef.current);
    cancelAnimationFrame(animFrameRef.current);
    revokeObjectUrl(debugUrlRef.current);
    debugUrlRef.current = null;
    lastRecordingRef.current = null;
    activeSessionKeyRef.current = sessionKey;
  }, [sessionKey]);

  const resetAttempt = useCallback(() => {
    clearTimeout(outcomeTimerRef.current);
    patchAttemptState(sessionKey, {
      status: 'idle',
      transcript: '',
      progress: 0,
      noMatchHint: null,
    });
  }, [patchAttemptState, sessionKey]);

  const runRecognition = useCallback(async (
    attemptKey: string,
    recording: RecordingResult,
    nextDebugInfo: PracticeAttemptDebugInfo,
  ) => {
    patchAttemptState(attemptKey, {
      status: 'processing',
      progress: 0,
    });
    try {
      const rawRecognition = await recognizeSpeech(recording.blob, {
        candidate1: word,
        candidate2: partnerWord ?? word,
        dialect,
        debug: debugEnabled,
      });
      const recognition =
        typeof rawRecognition === 'string'
          ? { transcript: rawRecognition, matchType: 'freeform' as const, matchedWord: null, debug: null }
          : rawRecognition;

      if (activeSessionKeyRef.current !== attemptKey) {
        return;
      }

      const text = recognition.transcript.toLowerCase().trim();
      patchAttemptState(attemptKey, {
        transcript: text,
        debugInfo: {
          ...nextDebugInfo,
          skipReason: undefined,
          recognition: recognition.debug ?? null,
        },
      });

      const target = word.toLowerCase();
      const matched = recognition.matchedWord?.toLowerCase().trim() ?? null;

      if (recognition.matchType === 'no_match') {
        onAttemptEvaluated?.({
          isCorrect: false,
          transcript: text,
          matchType: 'no_match',
        });
        const hint =
          experimentMode === 'frame_sentence' && text.length > 0 ? 'use_frame' : null;
        patchAttemptState(attemptKey, {
          noMatchHint: hint,
          status: 'no_match',
        });
        outcomeTimerRef.current = setTimeout(() => {
          if (activeSessionKeyRef.current !== attemptKey) {
            return;
          }
          patchAttemptState(attemptKey, {
            status: 'idle',
            noMatchHint: null,
            progress: 0,
          });
        }, incorrectDelayMs);
        return;
      }

      if (matched === target || text.includes(target)) {
        onAttemptEvaluated?.({
          isCorrect: true,
          transcript: text,
          matchType: recognition.matchType,
        });
        patchAttemptState(attemptKey, {
          status: 'correct',
        });
        outcomeTimerRef.current = setTimeout(() => {
          if (activeSessionKeyRef.current !== attemptKey) {
            return;
          }
          patchAttemptState(attemptKey, {
            status: 'idle',
            transcript: '',
            isCompleted: true,
            progress: 0,
          });
          onSuccess();
        }, successDelayMs);
      } else {
        onAttemptEvaluated?.({
          isCorrect: false,
          transcript: text,
          matchType: recognition.matchType,
        });
        patchAttemptState(attemptKey, {
          status: 'incorrect',
        });
        outcomeTimerRef.current = setTimeout(() => {
          if (activeSessionKeyRef.current !== attemptKey) {
            return;
          }
          patchAttemptState(attemptKey, {
            status: 'idle',
            progress: 0,
          });
        }, incorrectDelayMs);
      }
    } catch (error) {
      if (activeSessionKeyRef.current !== attemptKey) {
        return;
      }
      patchAttemptState(attemptKey, {
        debugInfo: {
          ...nextDebugInfo,
          recognition: extractRecognitionDebug(error),
        },
        status: 'no_match',
        noMatchHint: null,
      });
    }
  }, [
    dialect,
    experimentMode,
    debugEnabled,
    incorrectDelayMs,
    onAttemptEvaluated,
    onSuccess,
    patchAttemptState,
    partnerWord,
    successDelayMs,
    word,
  ]);

  const sendDebugRecording = useCallback(async () => {
    const recording = lastRecordingRef.current;
    const nextDebugInfo = currentState.debugInfo;
    if (!recording || !nextDebugInfo) return;

    await runRecognition(sessionKey, recording, nextDebugInfo);
  }, [currentState.debugInfo, runRecognition, sessionKey]);

  useEffect(() => {
    if (currentState.status !== 'recording') {
      return;
    }

    const attemptKey = sessionKey;
    startTimeRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startTimeRef.current;
      setAttemptState((prev) => {
        if (prev.key !== attemptKey) return prev;
        return { ...prev, progress: Math.min(elapsed / recordDurationMs, 1) };
      });
      if (elapsed < recordDurationMs) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [currentState.status, recordDurationMs, sessionKey]);

  const handleRecord = useCallback(async () => {
    if (currentState.status !== 'idle') return;

    clearTimeout(timerRef.current);
    clearTimeout(outcomeTimerRef.current);

    const attemptKey = sessionKey;
    patchAttemptState(attemptKey, {
      status: 'arming',
      transcript: '',
      progress: 0,
      noMatchHint: null,
      isCompleted: false,
    });
    await startRecording();
    if (activeSessionKeyRef.current !== attemptKey) {
      return;
    }
    patchAttemptState(attemptKey, {
      status: 'recording',
      progress: 0,
    });

    timerRef.current = setTimeout(async () => {
      const recording = await stopRecording();
      if (recording.blob.size === 0) {
        if (activeSessionKeyRef.current !== attemptKey) {
          return;
        }
        patchAttemptState(attemptKey, {
          status: 'idle',
          progress: 0,
        });
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
      patchAttemptState(attemptKey, {
        debugInfo: nextDebugInfo,
      });

      if (shouldSkipRecognition(recording.metrics)) {
        onAttemptEvaluated?.({
          isCorrect: false,
          transcript: '',
          matchType: 'no_match',
        });
        patchAttemptState(attemptKey, {
          status: 'no_match',
          debugInfo: {
            ...nextDebugInfo,
            skipReason: getSkipReason(recording.metrics),
          },
        });
        if (!debugEnabled) {
          outcomeTimerRef.current = setTimeout(() => {
            if (activeSessionKeyRef.current !== attemptKey) {
              return;
            }
            patchAttemptState(attemptKey, {
              status: 'idle',
              progress: 0,
            });
          }, incorrectDelayMs);
        }
        return;
      }

      await runRecognition(attemptKey, recording, nextDebugInfo);
    }, recordDurationMs);
  }, [
    currentState.status,
    patchAttemptState,
    sessionKey,
    startRecording,
    stopRecording,
    recordDurationMs,
    incorrectDelayMs,
    onAttemptEvaluated,
    runRecognition,
    debugEnabled,
  ]);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(outcomeTimerRef.current);
      revokeObjectUrl(debugUrlRef.current);
    };
  }, []);

  return {
    transcript: currentState.transcript,
    status: currentState.status,
    progress: currentState.progress,
    isCompleted: currentState.isCompleted,
    debugInfo: currentState.debugInfo,
    noMatchHint: currentState.noMatchHint,
    resetAttempt,
    sendDebugRecording,
    handleRecord,
  };
}

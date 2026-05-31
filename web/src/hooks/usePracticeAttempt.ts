import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAudioRecorder,
  type RecordingMetrics,
  type RecordingResult,
} from './useAudioRecorder';
import { recognizeSpeech, type RecognizeSpeechResult } from '../lib/api';
import type { Dialect } from '../lib/types';

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

export interface PracticeAttemptFeedback {
  title: string;
  detail: string;
}

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
  feedback: PracticeAttemptFeedback | null;
}

interface UsePracticeAttemptOptions {
  word: string;
  partnerWord?: string;
  dialect?: Dialect;
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
    feedback: null,
  };
}

function buildSuccessFeedback(matchType: MatchType): PracticeAttemptFeedback {
  switch (matchType) {
    case 'exact':
      return {
        title: 'Nice.',
        detail: 'That was a clean match.',
      };
    case 'token':
      return {
        title: 'Nice.',
        detail: 'We found the word inside your sentence.',
      };
    case 'fuzzy':
      return {
        title: 'Nice.',
        detail: 'That was close enough to count.',
      };
    default:
      return {
        title: 'Nice.',
        detail: 'We matched the target word.',
      };
  }
}

function buildAudioIssueFeedback(issue: NonNullable<RecordingMetrics['likelyIssue']>): PracticeAttemptFeedback {
  switch (issue) {
    case 'low_signal':
      return {
        title: 'We barely heard you.',
        detail: 'Try speaking a little louder or closer to the mic.',
      };
    case 'long_preamble':
      return {
        title: 'You waited too long to start.',
        detail: 'Start saying the word sooner after tapping record.',
      };
    case 'long_trailing_silence':
      return {
        title: 'The word came too late in the clip.',
        detail: 'Say the word near the start of your recording.',
      };
    case 'possible_noise':
      return {
        title: 'Background noise may have masked the word.',
        detail: 'Try a quieter spot or move the mic away from noise.',
      };
    default:
      return {
        title: 'Try again.',
        detail: 'We could not isolate a clear speech window.',
      };
  }
}

function buildNoMatchFeedback(
  transcript: string,
  word: string,
  partnerWord: string | undefined,
  experimentMode: 'frame_sentence' | undefined,
  noMatchHint: 'use_frame' | null,
): PracticeAttemptFeedback {
  if (noMatchHint === 'use_frame' && experimentMode === 'frame_sentence') {
    return {
      title: 'You missed the frame sentence.',
      detail: `Say “The word is ${word}” so we can extract the target word.`,
    };
  }

  if (transcript) {
    return {
      title: 'We heard a transcript, but not the target word.',
      detail: partnerWord
        ? `Heard “${transcript}”. Try the target pair more clearly.`
        : `Heard “${transcript}”. Try saying the word more clearly.`,
    };
  }

  return {
    title: 'We could not match that attempt.',
    detail: partnerWord
      ? `Try the target word again and keep it distinct from “${partnerWord}”.`
      : 'Try the target word again.',
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
      feedback: null,
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
          feedback: buildNoMatchFeedback(text, word, partnerWord, experimentMode, hint),
        });
        outcomeTimerRef.current = setTimeout(() => {
          if (activeSessionKeyRef.current !== attemptKey) {
            return;
          }
          patchAttemptState(attemptKey, {
            status: 'idle',
            noMatchHint: null,
            feedback: null,
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
          feedback: buildSuccessFeedback(recognition.matchType),
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
            feedback: null,
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
          feedback: {
            title: matched && matched !== target ? `We heard “${matched}” instead.` : 'That was close, but not the target word.',
            detail: matched && matched !== target
              ? `Try saying “${word}” more distinctly${partnerWord ? ` so it stands apart from “${partnerWord}”.` : '.'}`
              : 'Try the target word again with a clearer start and ending.',
          },
        });
        outcomeTimerRef.current = setTimeout(() => {
          if (activeSessionKeyRef.current !== attemptKey) {
            return;
          }
          patchAttemptState(attemptKey, {
            status: 'idle',
            progress: 0,
            feedback: null,
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
        feedback: {
          title: 'Recognition failed.',
          detail: 'Try the attempt again; the server did not return a usable result.',
        },
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
      feedback: null,
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
          feedback: null,
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
        const skipReason = getSkipReason(recording.metrics);
        onAttemptEvaluated?.({
          isCorrect: false,
          transcript: '',
          matchType: 'no_match',
        });
        patchAttemptState(attemptKey, {
          status: 'no_match',
          debugInfo: {
            ...nextDebugInfo,
            skipReason,
          },
          feedback: buildAudioIssueFeedback(skipReason),
        });
        if (!debugEnabled) {
          outcomeTimerRef.current = setTimeout(() => {
            if (activeSessionKeyRef.current !== attemptKey) {
              return;
            }
            patchAttemptState(attemptKey, {
              status: 'idle',
              progress: 0,
              feedback: null,
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
    feedback: currentState.feedback,
    resetAttempt,
    sendDebugRecording,
    handleRecord,
  };
}

import { useState } from 'react';
import { Mic, Check, X, Loader2, Play } from 'lucide-react';
import { audioUrl } from '../lib/api';
import { playWordAudio } from '../lib/audioPlayback';
import { usePracticeAttempt } from '../hooks/usePracticeAttempt';
import type { AudioDialect } from '../lib/types';
import { getPracticeHeadingSizeClass } from '../lib/wordSizing';

const FRAME_TIP_KEY = 'phonetiq:seenFrameTip';

const RECORD_DURATION_DEFAULT = 3000;

interface Props {
  word: string;
  isActive: boolean;
  onSuccess: () => void;
  onAttemptEvaluated?: (result: {
    isCorrect: boolean;
    transcript: string;
    matchType: 'exact' | 'token' | 'fuzzy' | 'no_match' | 'freeform';
  }) => void;
  dialect?: string;
  audioDialect?: AudioDialect;
  isFirstWord: boolean;
  partnerWord: string;
  experimentMode?: 'frame_sentence';
  debugEnabled?: boolean;
}

export function PracticeCard({
  word,
  isActive,
  onSuccess,
  onAttemptEvaluated,
  dialect,
  audioDialect,
  isFirstWord,
  partnerWord,
  experimentMode,
  debugEnabled,
}: Props) {
  const recordDuration = RECORD_DURATION_DEFAULT;

  const { transcript, status, progress, isCompleted, debugInfo, resetAttempt, sendDebugRecording, handleRecord, noMatchHint } =
    usePracticeAttempt({
      word,
      partnerWord,
      dialect,
      experimentMode,
      debugEnabled,
      onSuccess,
      onAttemptEvaluated,
      recordDurationMs: recordDuration,
    });
  const sizeClass = getPracticeHeadingSizeClass(word, partnerWord);
  const isDevelopment = import.meta.env.DEV;

  const [showFrameTip, setShowFrameTip] = useState(
    experimentMode === 'frame_sentence' && !localStorage.getItem(FRAME_TIP_KEY),
  );

  const dismissFrameTip = () => {
    localStorage.setItem(FRAME_TIP_KEY, '1');
    setShowFrameTip(false);
  };

  const play = () => {
    playWordAudio(audioUrl(word, audioDialect ? { dialect: audioDialect, voice: 'default' } : undefined));
  };

  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progress);

  // If this card is the first word and we have already completed it, show the "Done" state
  if (isFirstWord && !isActive && isCompleted) {
    return (
      <div className="practice-card practice-card--inactive ui-practice-card-layout flex-1 w-full h-full md:border-r border-b md:border-b-0 ui-divider-border px-8 md:px-12 pb-8 md:pb-0 pt-2 md:pt-0 transition-opacity duration-500">
        <div className="ui-practice-zone-title">
          <h2 className={`ui-muted w-full max-w-[20rem] md:max-w-[24rem] min-h-[104px] md:min-h-[136px] px-2 text-center ${sizeClass} font-black tracking-tighter leading-[0.95] capitalize flex items-center justify-center`}>
            {word}
          </h2>
        </div>

        <div className="ui-practice-zone-helper">
          <div className="inline-flex items-center gap-1.5 text-[11px] md:text-xs font-bold text-[color:var(--color-primary)]">
            <Check size={14} strokeWidth={3} /> Done
          </div>
        </div>

        <div className="ui-practice-zone-action">
          <div
            data-testid="practice-inactive-slot"
            className="w-[72px] h-[72px] md:w-[92px] md:h-[92px] rounded-full border ui-divider-border"
          />
        </div>

        <div className="ui-practice-zone-status" />
        <div className="ui-practice-zone-feedback" />
      </div>
    );
  }

  // Inactive state (waiting its turn)
  if (!isActive) {
    return (
      <div className="practice-card practice-card--inactive ui-practice-card-layout flex-1 w-full h-full px-8 md:px-12 pb-8 md:pb-0 transition-opacity duration-500">
        <div className="ui-practice-zone-title">
          <h2 className={`ui-muted w-full max-w-[20rem] md:max-w-[24rem] min-h-[104px] md:min-h-[136px] px-2 text-center ${sizeClass} font-black tracking-tighter leading-[0.95] capitalize flex items-center justify-center`}>
            {word}
          </h2>
        </div>

        <div className="ui-practice-zone-helper" />

        <div className="ui-practice-zone-action">
          <div
            data-testid="practice-inactive-slot"
            className="w-[72px] h-[72px] md:w-[92px] md:h-[92px] rounded-full border ui-divider-border"
          />
        </div>

        <div className="ui-practice-zone-status" />
        <div className="ui-practice-zone-feedback" />
      </div>
    );
  }

  // Active state UI map
  const stateMap = {
    idle: {
      btnBg: 'ui-practice-state-idle',
      textCol: 'ui-muted',
      icon: <Mic size={24} className="text-white" />,
      label: 'Tap to speak',
    },
    arming: {
      btnBg: 'ui-practice-state-processing',
      textCol: 'text-[color:var(--color-primary)]',
      icon: <Loader2 size={24} className="text-[color:var(--color-primary)] animate-spin" />,
      label: 'Starting mic...',
    },
    recording: {
      btnBg: 'ui-practice-state-recording',
      textCol: 'text-[color:var(--color-state-recording)]',
      icon: <Mic size={24} className="text-white animate-pulse" />,
      label: `Listening... ${Math.ceil((recordDuration / 1000) * (1 - progress))}s`,
    },
    processing: {
      btnBg: 'ui-practice-state-processing',
      textCol: 'text-[color:var(--color-primary)]',
      icon: <Loader2 size={24} className="text-[color:var(--color-primary)] animate-spin" />,
      label: 'Processing...',
    },
    correct: {
      btnBg: 'ui-practice-state-correct',
      textCol: 'text-[color:var(--color-primary)]',
      icon: <Check size={28} className="text-[color:var(--color-primary)]" strokeWidth={3} />,
      label: 'Correct!',
    },
    incorrect: {
      btnBg: 'ui-practice-state-incorrect',
      textCol: 'text-[color:var(--color-state-incorrect)]',
      icon: <X size={28} className="text-[color:var(--color-state-incorrect)]" strokeWidth={3} />,
      label: 'Try again',
    },
    no_match: {
      btnBg: 'ui-practice-state-nomatch',
      textCol: 'text-[color:var(--color-state-nomatch)]',
      icon: <X size={28} className="text-[color:var(--color-state-nomatch)]" strokeWidth={3} />,
      label: "Didn't catch that",
    },
  };

  if (status === 'no_match' && noMatchHint === 'use_frame') {
    stateMap.no_match = {
      ...stateMap.no_match,
      label: `Try: "The word is ${word}"`,
    };
  }

  const ui = stateMap[status];

  return (
      <div
        data-testid="practice-card-active"
        className={`practice-card practice-card--active ui-practice-card-layout flex-1 w-full h-full px-8 md:px-12 ${isFirstWord ? 'md:border-r border-b md:border-b-0 ui-divider-border' : ''} pb-8 md:pb-0 pt-2 md:pt-0`}
      >
      <div className="ui-practice-zone-title">
        <h2
          data-testid="practice-card-heading"
          className={`w-full max-w-[20rem] md:max-w-[24rem] min-h-[104px] md:min-h-[136px] px-2 text-center ${sizeClass} font-black tracking-tighter leading-[0.95] capitalize flex items-center justify-center`}
        >
          {word}
        </h2>
      </div>

      <div className="ui-practice-zone-helper">
        <button
          onClick={play}
          data-testid="practice-listen-button"
          className="ui-link min-h-11 px-3 rounded-full flex items-center gap-1.5 text-[11px] md:text-xs font-bold transition-colors"
        >
          <Play size={14} fill="currentColor" /> Listen first
        </button>
        {experimentMode === 'frame_sentence' && (
          <p className="ui-muted text-[11px] md:text-xs font-semibold mt-1">
            Say: &ldquo;The word is {word}&rdquo;
          </p>
        )}
        {showFrameTip && (
          <div
            data-testid="frame-tip"
            className="mt-2 px-3 py-2 rounded-xl border ui-divider-border ui-card text-[11px] md:text-xs flex items-start gap-2 max-w-[220px]"
          >
            <span className="shrink-0 mt-px">💡</span>
            <span className="ui-muted font-medium leading-snug flex-1">
              Say the full sentence, not just the word.
            </span>
            <button
              onClick={dismissFrameTip}
              aria-label="Got it"
              className="shrink-0 ui-link font-bold text-[11px] md:text-xs"
            >
              Got it
            </button>
          </div>
        )}
      </div>

      <div className="ui-practice-zone-action">
        <div className="relative w-24 h-24 md:w-[120px] md:h-[120px] flex items-center justify-center">
          
          {/* Recording Rings */}
          {status === 'recording' && (
            <>
              <div data-testid="practice-recording-ring" className="absolute inset-0 border-4 border-[color:var(--color-state-recording-bg)] rounded-full"></div>
              <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 100 100">
                <circle
                  data-testid="practice-recording-ring-progress"
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke="var(--color-state-recording)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  className="transition-none"
                />
              </svg>
            </>
          )}

          <button
            onClick={handleRecord}
            disabled={status !== 'idle'}
            aria-label="Record pronunciation"
             className={`w-[72px] h-[72px] md:w-[92px] md:h-[92px] rounded-full flex items-center justify-center shadow-xl transition-all duration-300 z-10 disabled:opacity-70 disabled:cursor-not-allowed ${ui.btnBg}`}
           >
             {ui.icon}
           </button>
        </div>
      </div>

      <div className="ui-practice-zone-status">
        <p
          data-testid="practice-status-label"
          className={`text-[10px] md:text-[11px] font-extrabold uppercase tracking-widest ${ui.textCol}`}
        >
          {ui.label}
        </p>
      </div>

      {/* Transcript Pill */}
      <div className="ui-practice-zone-feedback">
        {(status === 'correct' || status === 'incorrect' || status === 'no_match') && transcript && (
          <div className={`px-5 py-2 rounded-full border flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
            status === 'correct'
              ? 'ui-card'
              : status === 'incorrect'
                ? 'ui-practice-state-incorrect'
                : 'ui-practice-state-nomatch'
          }`}>
            <span className={`text-xs font-bold ${
              status === 'correct'
                ? 'ui-muted'
                : status === 'incorrect'
                  ? 'text-[color:var(--color-state-incorrect)]'
                  : 'text-[color:var(--color-state-nomatch)]'
            }`}>Heard:</span>
            <span className="text-sm font-black capitalize">&ldquo;{transcript}&rdquo;</span>
          </div>
        )}

        {status === 'no_match' && noMatchHint === 'use_frame' && (
          <div
            data-testid="practice-frame-tip"
            className="mt-3 px-4 py-3 rounded-2xl border ui-divider-border ui-card text-xs md:text-sm flex items-start gap-2 max-w-md"
          >
            <span className="shrink-0 mt-px">💡</span>
            <span className="ui-muted font-medium leading-snug">
              Try the full sentence: &ldquo;The word is {word}&rdquo;.
            </span>
          </div>
        )}
      </div>

      {isDevelopment && debugEnabled && debugInfo && (
        <div
          data-testid="practice-debug-panel"
          className="mt-4 w-full rounded-2xl border ui-divider-border ui-card p-4 text-left"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="ui-eyebrow text-[color:var(--color-primary)]">Speech debug</p>
            <span className="ui-muted text-[10px] font-bold uppercase tracking-widest">
              {debugInfo.skipReason === 'low_signal'
                ? 'Low signal skipped'
                : debugInfo.skipReason === 'possible_noise'
                  ? 'Noise skipped'
                  : 'Recognition captured'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs mb-4">
            <div>
              <p className="ui-muted font-bold uppercase tracking-widest mb-1">Duration</p>
              <p>{Math.round(debugInfo.recording.metrics?.durationMs ?? 0)}ms</p>
            </div>
            <div>
              <p className="ui-muted font-bold uppercase tracking-widest mb-1">Blob size</p>
              <p>{debugInfo.recording.blobSize} bytes</p>
            </div>
            <div>
              <p className="ui-muted font-bold uppercase tracking-widest mb-1">Peak level</p>
              <p>{(debugInfo.recording.metrics?.peakLevel ?? 0).toFixed(3)}</p>
            </div>
            <div>
              <p className="ui-muted font-bold uppercase tracking-widest mb-1">Activity</p>
              <p>{Math.round((debugInfo.recording.metrics?.activityRatio ?? 0) * 100)}%</p>
            </div>
            <div>
              <p className="ui-muted font-bold uppercase tracking-widest mb-1">Leading silence</p>
              <p>{Math.round(debugInfo.recording.metrics?.leadingSilenceMs ?? 0)}ms</p>
            </div>
            <div>
              <p className="ui-muted font-bold uppercase tracking-widest mb-1">Trailing silence</p>
              <p>{Math.round(debugInfo.recording.metrics?.trailingSilenceMs ?? 0)}ms</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="ui-muted font-bold uppercase tracking-widest mb-1">Likely issue</p>
            <p>{debugInfo.recording.metrics?.likelyIssue ?? debugInfo.skipReason ?? (debugInfo.recording.metrics ? 'none detected' : 'analysis unavailable')}</p>
          </div>

          {debugInfo.recording.objectUrl && (
            <div className="mb-4">
              <p className="ui-muted font-bold uppercase tracking-widest mb-1">Captured audio</p>
              <audio
                data-testid="practice-debug-audio"
                controls
                src={debugInfo.recording.objectUrl}
                className="w-full"
              />
            </div>
          )}

          <div className="mb-4">
            <p className="ui-muted font-bold uppercase tracking-widest mb-1">Raw AI transcript</p>
            <p data-testid="practice-debug-raw-transcript" className="font-bold break-words">
              {debugInfo.recognition?.rawTranscript || '—'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs mb-4">
            <div>
              <p className="ui-muted font-bold uppercase tracking-widest mb-1">Normalized transcript</p>
              <p>{debugInfo.recognition?.normalizedTranscript || '—'}</p>
            </div>
            <div>
              <p className="ui-muted font-bold uppercase tracking-widest mb-1">Prompt used</p>
              <p className="break-words">{debugInfo.recognition?.prompt || '—'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {debugInfo.skipReason === 'low_signal' && (
              <button
                type="button"
                onClick={() => void sendDebugRecording()}
                className="ui-btn-secondary min-h-10 px-4 rounded-full text-xs font-bold"
              >
                Send anyway
              </button>
            )}

            {(status === 'incorrect' || status === 'no_match') && (
              <button
                type="button"
                onClick={resetAttempt}
                className="ui-btn-secondary min-h-10 px-4 rounded-full text-xs font-bold"
              >
                Try again
              </button>
            )}
          </div>

          {debugInfo.recognition && (
            <details className="text-xs">
              <summary className="cursor-pointer font-bold">Raw AI response</summary>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words ui-muted">
                {JSON.stringify(debugInfo.recognition, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

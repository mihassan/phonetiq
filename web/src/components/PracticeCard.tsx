import { Mic, Check, X, Loader2, Play } from 'lucide-react';
import { audioUrl } from '../lib/api';
import { playWordAudio } from '../lib/audioPlayback';
import { usePracticeAttempt } from '../hooks/usePracticeAttempt';
import { getPracticeHeadingSizeClass } from '../lib/wordSizing';

const RECORD_DURATION = 3000;

interface Props {
  word: string;
  isActive: boolean;
  onSuccess: () => void;
  onAttemptEvaluated?: (result: {
    isCorrect: boolean;
    transcript: string;
    matchType: 'exact' | 'token' | 'fuzzy' | 'no_match' | 'freeform';
  }) => void;
  isFirstWord: boolean;
  partnerWord: string;
}

export function PracticeCard({
  word,
  isActive,
  onSuccess,
  onAttemptEvaluated,
  isFirstWord,
  partnerWord,
}: Props) {
  const { transcript, status, progress, isCompleted, handleRecord } =
    usePracticeAttempt({
      word,
      partnerWord,
      onSuccess,
      onAttemptEvaluated,
      recordDurationMs: RECORD_DURATION,
    });
  const sizeClass = getPracticeHeadingSizeClass(word, partnerWord);

  const play = () => {
    playWordAudio(audioUrl(word));
  };

  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progress);

  // If this card is the first word and we have already completed it, show the "Done" state
  if (isFirstWord && !isActive && isCompleted) {
    return (
      <div className="practice-card practice-card--inactive ui-practice-card-layout flex-1 w-full h-full md:border-r border-b md:border-b-0 border-[#7dd3fc]/10 px-8 md:px-12 pb-8 md:pb-0 pt-2 md:pt-0 transition-opacity duration-500">
        <div className="ui-practice-zone-title">
          <h2 className={`w-full max-w-[20rem] md:max-w-[24rem] min-h-[104px] md:min-h-[136px] px-2 text-center ${sizeClass} font-black text-[#a0b4c4] tracking-tighter leading-[0.95] capitalize flex items-center justify-center`}>
            {word}
          </h2>
        </div>

        <div className="ui-practice-zone-helper">
          <div className="inline-flex items-center gap-1.5 text-[11px] md:text-xs font-bold text-[#7dd3fc]">
            <Check size={14} strokeWidth={3} /> Done
          </div>
        </div>

        <div className="ui-practice-zone-action">
          <div
            data-testid="practice-inactive-slot"
            className="w-[72px] h-[72px] md:w-[92px] md:h-[92px] rounded-full border border-[#7dd3fc]/10"
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
          <h2 className={`w-full max-w-[20rem] md:max-w-[24rem] min-h-[104px] md:min-h-[136px] px-2 text-center ${sizeClass} font-black text-[#a0b4c4] tracking-tighter leading-[0.95] capitalize flex items-center justify-center`}>
            {word}
          </h2>
        </div>

        <div className="ui-practice-zone-helper" />

        <div className="ui-practice-zone-action">
          <div
            data-testid="practice-inactive-slot"
            className="w-[72px] h-[72px] md:w-[92px] md:h-[92px] rounded-full border border-[#7dd3fc]/10"
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
      btnBg: 'bg-[#7dd3fc] text-[#001f2e] shadow-[#7dd3fc]/30',
      textCol: 'text-[#a0b4c4]',
      icon: <Mic size={24} className="text-[#001f2e]" />,
      label: 'Tap to speak',
    },
    recording: {
      btnBg: 'bg-[#ff6b6b] shadow-[#ff6b6b]/40',
      textCol: 'text-[#ffb3b3]',
      icon: <Mic size={24} className="text-white animate-pulse" />,
      label: `Listening... ${Math.ceil((RECORD_DURATION / 1000) * (1 - progress))}s`,
    },
    processing: {
      btnBg: 'bg-[#1a3a4e]',
      textCol: 'text-[#7dd3fc]',
      icon: <Loader2 size={24} className="text-white animate-spin" />,
      label: 'Processing...',
    },
    correct: {
      btnBg: 'bg-[#141c2e] border border-[#7dd3fc]/30',
      textCol: 'text-[#7dd3fc]',
      icon: <Check size={28} className="text-[#7dd3fc]" strokeWidth={3} />,
      label: 'Correct!',
    },
    incorrect: {
      btnBg: 'bg-[#3d1414] border border-[#ff6b6b]/30',
      textCol: 'text-[#ffb3b3]',
      icon: <X size={28} className="text-[#ffb3b3]" strokeWidth={3} />,
      label: 'Try again',
    },
    no_match: {
      btnBg: 'bg-[#3a2b13] border border-[#f6c453]/35',
      textCol: 'text-[#f6c453]',
      icon: <X size={28} className="text-[#f6c453]" strokeWidth={3} />,
      label: "Didn't catch that",
    },
  };

  const ui = stateMap[status];

  return (
      <div
        data-testid="practice-card-active"
        className={`practice-card practice-card--active ui-practice-card-layout flex-1 w-full h-full px-8 md:px-12 ${isFirstWord ? 'md:border-r border-b md:border-b-0 border-[#7dd3fc]/10' : ''} pb-8 md:pb-0 pt-2 md:pt-0`}
      >
      <div className="ui-practice-zone-title">
        <h2
          data-testid="practice-card-heading"
          className={`w-full max-w-[20rem] md:max-w-[24rem] min-h-[104px] md:min-h-[136px] px-2 text-center ${sizeClass} font-black text-[#e0e8f0] tracking-tighter leading-[0.95] capitalize flex items-center justify-center`}
        >
          {word}
        </h2>
      </div>

      <div className="ui-practice-zone-helper">
        <button
          onClick={play}
          data-testid="practice-listen-button"
          className="flex items-center gap-1.5 text-[11px] md:text-xs font-bold text-[#7dd3fc] hover:text-[#9bddff] transition-colors"
        >
          <Play size={14} fill="currentColor" /> Listen first
        </button>
      </div>

      <div className="ui-practice-zone-action">
        <div className="relative w-24 h-24 md:w-[120px] md:h-[120px] flex items-center justify-center">
          
          {/* Recording Rings */}
          {status === 'recording' && (
            <>
              <div data-testid="practice-recording-ring" className="absolute inset-0 border-4 border-[#ff6b6b]/30 rounded-full"></div>
              <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 100 100">
                <circle
                  data-testid="practice-recording-ring-progress"
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke="#ff6b6b"
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
              ? 'bg-[#141c2e] border-[#7dd3fc]/20'
              : status === 'incorrect'
                ? 'bg-[#3d1414] border-[#ff6b6b]/30'
                : 'bg-[#3a2b13] border-[#f6c453]/35'
          }`}>
            <span className={`text-xs font-bold ${
              status === 'correct'
                ? 'text-[#a0b4c4]'
                : status === 'incorrect'
                  ? 'text-[#ffb3b3]'
                  : 'text-[#f6c453]'
            }`}>Heard:</span>
            <span className="text-sm font-black text-[#e0e8f0] capitalize">&ldquo;{transcript}&rdquo;</span>
          </div>
        )}
      </div>
    </div>
  );
}

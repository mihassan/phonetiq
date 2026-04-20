import { Mic, Check, X, Loader2, Play } from 'lucide-react';
import { audioUrl } from '../lib/api';
import { playWordAudio } from '../lib/audioPlayback';
import { usePracticeAttempt } from '../hooks/usePracticeAttempt';

const RECORD_DURATION = 3000;

interface Props {
  word: string;
  isActive: boolean;
  onSuccess: () => void;
  isFirstWord: boolean;
  partnerWord: string;
}

export function PracticeCard({ word, isActive, onSuccess, isFirstWord, partnerWord: _partnerWord }: Props) {
  const { transcript, status, progress, isCompleted, handleRecord } =
    usePracticeAttempt({ word, onSuccess, recordDurationMs: RECORD_DURATION });

  const play = () => {
    playWordAudio(audioUrl(word));
  };

  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progress);

  // If this card is the first word and we have already completed it, show the "Done" state
  if (isFirstWord && !isActive && isCompleted) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center opacity-35 md:border-r border-b md:border-b-0 border-[#7dd3fc]/10 pb-8 md:pb-0 pt-2 md:pt-0 transition-opacity duration-500">
        <div className="flex items-center gap-4">
          <div className="text-5xl md:text-[80px] font-extrabold text-[#a0b4c4] tracking-tight leading-none capitalize">
            {word}
          </div>
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#141c2e] border border-[#7dd3fc]/30 flex justify-center items-center text-[#7dd3fc] shadow-sm">
            <Check size={16} strokeWidth={3} />
          </div>
        </div>
      </div>
    );
  }

  // Inactive state (waiting its turn)
  if (!isActive) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center opacity-35 pb-8 md:pb-0 transition-opacity duration-500">
        <div className="text-[56px] md:text-[80px] font-extrabold text-[#a0b4c4] tracking-tight leading-none mb-4 capitalize">
          {word}
        </div>
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
  };

  const ui = stateMap[status];

  return (
    <div
      data-testid="practice-card-active"
      className={`flex-1 flex flex-col justify-center items-center ${isFirstWord ? 'md:border-r border-b md:border-b-0 border-[#7dd3fc]/10' : ''} pb-8 md:pb-0 pt-2 md:pt-0`}
    >
      <h2
        data-testid="practice-card-heading"
        className="text-[64px] md:text-[104px] font-black text-[#e0e8f0] tracking-tighter mb-4 md:mb-6 leading-none capitalize"
      >
        {word}
      </h2>

      <button
        onClick={play}
        data-testid="practice-listen-button"
        className="mb-8 flex items-center gap-1.5 text-xs font-bold text-[#7dd3fc] hover:text-[#9bddff] transition-colors"
      >
        <Play size={14} fill="currentColor" /> Listen first
      </button>

      <div className="flex flex-col items-center gap-4 relative">
        <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
          
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
            disabled={status === 'processing' || status === 'correct'}
            aria-label="Record pronunciation"
            className={`w-[72px] h-[72px] md:w-[88px] md:h-[88px] rounded-full flex items-center justify-center shadow-xl transition-all duration-300 z-10 ${ui.btnBg}`}
          >
            {ui.icon}
          </button>
        </div>

        <p
          data-testid="practice-status-label"
          className={`text-[10px] md:text-xs font-extrabold uppercase tracking-widest ${ui.textCol}`}
        >
          {ui.label}
        </p>
      </div>

      {/* Transcript Pill */}
      {(status === 'correct' || status === 'incorrect') && transcript && (
        <div className={`mt-6 px-5 py-2 rounded-full border flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
          status === 'correct' ? 'bg-[#141c2e] border-[#7dd3fc]/20' : 'bg-[#3d1414] border-[#ff6b6b]/30'
        }`}>
          <span className={`text-xs font-bold ${status === 'correct' ? 'text-[#a0b4c4]' : 'text-[#ffb3b3]'}`}>Heard:</span>
          <span className="text-sm font-black text-[#e0e8f0] capitalize">&ldquo;{transcript}&rdquo;</span>
        </div>
      )}
    </div>
  );
}

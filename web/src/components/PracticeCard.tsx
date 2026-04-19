import { Mic, Check, X, Loader2, Play } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { recognizeSpeech, audioUrl } from '../lib/api';

const RECORD_DURATION = 3000;

interface Props {
  word: string;
  isActive: boolean;
  onSuccess: () => void;
  isFirstWord: boolean;
  partnerWord: string;
}

export function PracticeCard({ word, isActive, onSuccess, isFirstWord, partnerWord: _partnerWord }: Props) {
  const { startRecording, stopRecording } = useAudioRecorder();
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'correct' | 'incorrect'>('idle');
  const [progress, setProgress] = useState(0);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(0 as unknown as ReturnType<typeof setTimeout>);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (status !== 'recording') {
      setProgress(0);
      return;
    }
    startTimeRef.current = performance.now();
    const tick = () => {
      const elapsed = performance.now() - startTimeRef.current;
      setProgress(Math.min(elapsed / RECORD_DURATION, 1));
      if (elapsed < RECORD_DURATION) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [status]);

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
          }, 1500);
        } else {
          setStatus('incorrect');
          setTimeout(() => setStatus('idle'), 2500);
        }
      } catch {
        setStatus('idle');
      }
    }, RECORD_DURATION);
  }, [status, startRecording, stopRecording, word, onSuccess]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const play = () => {
    const audio = new Audio(audioUrl(word));
    audio.play().catch(() => {});
  };

  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progress);

  // If this card is the first word and we have already completed it, show the "Done" state
  if (isFirstWord && !isActive && isCompleted) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center opacity-35 md:border-r border-b md:border-b-0 border-slate-100 pb-8 md:pb-0 pt-2 md:pt-0 transition-opacity duration-500">
        <div className="flex items-center gap-4">
          <div className="text-5xl md:text-[80px] font-extrabold text-slate-400 tracking-tight leading-none capitalize">
            {word}
          </div>
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-emerald-100 flex justify-center items-center text-emerald-600 shadow-sm">
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
        <div className="text-[56px] md:text-[80px] font-extrabold text-slate-400 tracking-tight leading-none mb-4 capitalize">
          {word}
        </div>
      </div>
    );
  }

  // Active state UI map
  const stateMap = {
    idle: {
      btnBg: 'bg-indigo-600 shadow-indigo-600/40',
      textCol: 'text-slate-500',
      icon: <Mic size={24} className="text-white" />,
      label: 'Tap to speak',
    },
    recording: {
      btnBg: 'bg-red-600 shadow-red-600/50',
      textCol: 'text-red-600',
      icon: <Mic size={24} className="text-white animate-pulse" />,
      label: `Listening... ${Math.ceil((RECORD_DURATION / 1000) * (1 - progress))}s`,
    },
    processing: {
      btnBg: 'bg-indigo-600',
      textCol: 'text-indigo-600',
      icon: <Loader2 size={24} className="text-white animate-spin" />,
      label: 'Processing...',
    },
    correct: {
      btnBg: 'bg-emerald-100',
      textCol: 'text-emerald-600',
      icon: <Check size={28} className="text-emerald-600" strokeWidth={3} />,
      label: 'Correct!',
    },
    incorrect: {
      btnBg: 'bg-orange-100',
      textCol: 'text-orange-600',
      icon: <X size={28} className="text-orange-600" strokeWidth={3} />,
      label: 'Try again',
    },
  };

  const ui = stateMap[status];

  return (
    <div className={`flex-1 flex flex-col justify-center items-center ${isFirstWord ? 'md:border-r border-b md:border-b-0 border-slate-100' : ''} pb-8 md:pb-0 pt-2 md:pt-0`}>
      <h2 className="text-[64px] md:text-[104px] font-black text-slate-900 tracking-tighter mb-4 md:mb-6 leading-none capitalize">
        {word}
      </h2>

      <button
        onClick={play}
        className="mb-8 flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        <Play size={14} fill="currentColor" /> Listen first
      </button>

      <div className="flex flex-col items-center gap-4 relative">
        <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
          
          {/* Recording Rings */}
          {status === 'recording' && (
            <>
              <div className="absolute inset-0 border-4 border-red-100 rounded-full"></div>
              <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke="#dc2626"
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
            className={`w-[72px] h-[72px] md:w-[88px] md:h-[88px] rounded-full flex items-center justify-center shadow-xl transition-all duration-300 z-10 ${ui.btnBg}`}
          >
            {ui.icon}
          </button>
        </div>

        <p className={`text-[10px] md:text-xs font-extrabold uppercase tracking-widest ${ui.textCol}`}>
          {ui.label}
        </p>
      </div>

      {/* Transcript Pill */}
      {(status === 'correct' || status === 'incorrect') && transcript && (
        <div className={`mt-6 px-5 py-2 rounded-full border flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
          status === 'correct' ? 'bg-slate-50 border-slate-200' : 'bg-orange-50 border-orange-200'
        }`}>
          <span className={`text-xs font-bold ${status === 'correct' ? 'text-slate-500' : 'text-orange-600'}`}>Heard:</span>
          <span className="text-sm font-black text-slate-900 capitalize">&ldquo;{transcript}&rdquo;</span>
        </div>
      )}
    </div>
  );
}

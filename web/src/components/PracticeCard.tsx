import { Mic, Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { recognizeSpeech, audioUrl } from '../lib/api';

const RECORD_DURATION = 3000;

interface Props {
  word: string;
  isActive: boolean;
  onSuccess: () => void;
}

export function PracticeCard({ word, isActive, onSuccess }: Props) {
  const { startRecording, stopRecording } = useAudioRecorder();
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'correct' | 'incorrect'>('idle');
  const [progress, setProgress] = useState(0);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(0 as unknown as ReturnType<typeof setTimeout>);

  // Animate progress ring during recording
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

    // Orchestrate stop after RECORD_DURATION
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
            onSuccess();
          }, 1200);
        } else {
          setStatus('incorrect');
          setTimeout(() => setStatus('idle'), 2000);
        }
      } catch {
        setStatus('idle');
      }
    }, RECORD_DURATION);
  }, [status, startRecording, stopRecording, word, onSuccess]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const play = () => {
    const audio = new Audio(audioUrl(word));
    audio.play().catch(() => {});
  };

  // Progress ring SVG params
  const ringRadius = 36;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progress);

  if (!isActive) {
    return (
      <div className="bg-white border-2 border-transparent p-6 md:p-12 rounded-[2.5rem] opacity-30 grayscale flex flex-col items-center justify-center">
        <h2 className="text-3xl md:text-4xl font-black mb-6 md:mb-10 tracking-tight text-slate-800 capitalize">
          {word}
        </h2>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-indigo-500 shadow-xl p-6 md:p-12 rounded-[2.5rem] transition-all duration-300 flex flex-col items-center justify-center">
      <h2 className="text-3xl md:text-4xl font-black mb-4 md:mb-6 tracking-tight text-slate-800 capitalize">
        {word}
      </h2>

      {/* Listen button */}
      <button
        onClick={play}
        className="mb-4 md:mb-6 text-xs font-bold text-indigo-500 hover:text-indigo-700 underline underline-offset-4"
      >
        Listen first
      </button>

      {/* Record button with progress ring */}
      <div className="flex flex-col items-center gap-3 md:gap-4">
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Progress ring */}
          {status === 'recording' && (
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r={ringRadius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="4"
              />
              <circle
                cx="40"
                cy="40"
                r={ringRadius}
                fill="none"
                stroke="#6366f1"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                className="transition-none"
              />
            </svg>
          )}

          <button
            onClick={handleRecord}
            disabled={status === 'processing' || status === 'correct'}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
              status === 'recording'
                ? 'bg-rose-500 text-white animate-pulse'
                : status === 'correct'
                  ? 'bg-emerald-500 text-white'
                  : status === 'incorrect'
                    ? 'bg-amber-500 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {status === 'recording' ? (
              <Mic size={24} />
            ) : status === 'processing' ? (
              <Loader2 size={24} className="animate-spin" />
            ) : status === 'correct' ? (
              <CheckCircle2 size={24} />
            ) : status === 'incorrect' ? (
              <XCircle size={24} />
            ) : (
              <Play size={24} fill="currentColor" className="ml-1" />
            )}
          </button>
        </div>

        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {status === 'idle' && 'Tap to speak'}
          {status === 'recording' && `Listening... ${Math.ceil((RECORD_DURATION / 1000) * (1 - progress))}s`}
          {status === 'processing' && 'Processing...'}
          {status === 'correct' && 'Correct!'}
          {status === 'incorrect' && 'Try again'}
        </p>
      </div>

      {/* Transcript - prominently placed in flow */}
      {transcript && (
        <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-100">
          <span className="text-xs font-bold text-slate-600">Heard:</span>
          <span className="text-sm font-black text-indigo-600">
            &ldquo;{transcript}&rdquo;
          </span>
        </div>
      )}
    </div>
  );
}

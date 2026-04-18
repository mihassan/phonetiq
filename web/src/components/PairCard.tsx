import { Volume2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { audioUrl } from '../lib/api';

interface Props {
  word: string;
  isActive: boolean;
}

export function PairCard({ word, isActive }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    audioRef.current.src = audioUrl(word);
    audioRef.current.onplay = () => setIsPlaying(true);
    audioRef.current.onended = () => setIsPlaying(false);
    audioRef.current.onerror = () => setIsPlaying(false);
    audioRef.current.play().catch(() => setIsPlaying(false));
  };

  return (
    <div
      className={`bg-white border-2 p-6 md:p-12 rounded-[2.5rem] transition-all duration-300 flex flex-col items-center justify-center ${
        isActive
          ? 'border-indigo-500 shadow-xl'
          : 'border-transparent opacity-30 grayscale'
      }`}
    >
      <h2 className="text-3xl md:text-4xl font-black mb-6 md:mb-10 tracking-tight text-slate-800 capitalize">
        {word}
      </h2>

      <button
        onClick={play}
        disabled={!isActive}
        className="group relative w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100 disabled:opacity-30"
      >
        <Volume2
          size={24}
          className={isPlaying ? 'animate-pulse text-indigo-600' : ''}
        />
      </button>
    </div>
  );
}

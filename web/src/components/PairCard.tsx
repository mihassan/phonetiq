import { Play } from 'lucide-react';
import { useState, useRef } from 'react';
import { audioUrl } from '../lib/api';

interface Props {
  word: string;
  isActive: boolean;
  isFirstWord: boolean;
}

export function PairCard({ word, isActive, isFirstWord }: Props) {
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
      className={`flex-1 flex flex-col justify-center items-center ${
        isFirstWord ? 'md:border-r border-b md:border-b-0 border-slate-100' : ''
      } pb-8 md:pb-0 pt-8 md:pt-0 transition-opacity duration-500 ${
        isActive ? 'opacity-100' : 'opacity-35 grayscale'
      }`}
    >
      <h2 className="text-[64px] md:text-[104px] font-black text-slate-900 tracking-tighter mb-4 md:mb-6 leading-none capitalize">
        {word}
      </h2>

      <div className="flex flex-col items-center gap-3 md:gap-4">
        <button
          onClick={play}
          disabled={!isActive}
          className="group relative w-[72px] h-[72px] md:w-[88px] md:h-[88px] bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/40 disabled:opacity-30 disabled:shadow-none"
        >
          <Play
            size={28}
            fill="currentColor"
            className={`ml-1 ${isPlaying ? 'animate-pulse' : ''}`}
          />
        </button>
        <p className="text-[10px] md:text-xs font-extrabold text-slate-500 uppercase tracking-widest">
          Tap to speak
        </p>
      </div>
    </div>
  );
}

import { Play } from 'lucide-react';
import { useState, useRef } from 'react';
import { audioUrl } from '../lib/api';
import { playWordAudio } from '../lib/audioPlayback';

interface Props {
  word: string;
  isActive: boolean;
  isFirstWord: boolean;
}

function wordSizeClass(word: string) {
  if (word.length >= 11) return 'text-[48px] md:text-[72px]';
  if (word.length >= 6) return 'text-[56px] md:text-[88px]';
  return 'text-[64px] md:text-[104px]';
}

export function PairCard({ word, isActive, isFirstWord }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sizeClass = wordSizeClass(word);

  const play = () => {
    audioRef.current = playWordAudio(audioUrl(word), {
      reuseAudio: audioRef.current,
      onPlayStateChange: setIsPlaying,
    });
  };

  return (
    <div
      data-testid="pair-card"
      className={`flex-1 flex flex-col justify-center items-center ${
        isFirstWord ? 'md:border-r border-b md:border-b-0 border-[#7dd3fc]/10' : ''
      } pb-8 md:pb-0 pt-8 md:pt-0 transition-opacity duration-500 ${
        isActive ? 'opacity-100' : 'opacity-35 grayscale'
      }`}
    >
      <h2
        data-testid="pair-card-heading"
        className={`w-full max-w-[22rem] md:max-w-[28rem] min-h-[104px] md:min-h-[136px] px-2 text-center ${sizeClass} font-black text-[#e0e8f0] tracking-tighter mb-4 md:mb-6 leading-[0.95] capitalize flex items-center justify-center`}
      >
        {word}
      </h2>

      <div className="flex flex-col items-center gap-3 md:gap-4">
        <button
          onClick={play}
          disabled={!isActive}
          aria-label="Play pronunciation"
          className="group relative w-[72px] h-[72px] md:w-[88px] md:h-[88px] bg-[#7dd3fc] rounded-full flex items-center justify-center text-[#001f2e] hover:bg-[#9bddff] transition-all shadow-xl shadow-[#7dd3fc]/30 disabled:opacity-30 disabled:shadow-none"
        >
          <Play
            size={28}
            fill="currentColor"
            className={`ml-1 ${isPlaying ? 'animate-pulse' : ''}`}
          />
        </button>
        <p data-testid="pair-card-helper-text" className="text-[10px] md:text-xs font-extrabold text-[#a0b4c4] uppercase tracking-widest">
          Tap to speak
        </p>
      </div>
    </div>
  );
}

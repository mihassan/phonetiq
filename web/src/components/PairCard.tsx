import { Play } from 'lucide-react';
import { useState, useRef } from 'react';
import { audioUrl } from '../lib/api';
import { playWordAudio } from '../lib/audioPlayback';
import { getPairHeadingSizeClass } from '../lib/wordSizing';

interface Props {
  word: string;
  partnerWord?: string;
  isActive: boolean;
  isFirstWord: boolean;
}

export function PairCard({ word, partnerWord, isActive, isFirstWord }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sizeClass = getPairHeadingSizeClass(word, partnerWord);

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
        isFirstWord ? 'md:border-r border-b md:border-b-0 ui-divider-border' : ''
      } w-full h-full px-8 md:px-10 pb-8 md:pb-0 pt-8 md:pt-0 transition-opacity duration-500 ${
        isActive ? 'opacity-100' : 'opacity-35 grayscale'
      }`}
    >
      <h2
        data-testid="pair-card-heading"
        className={`word-heading word-heading--learn w-full max-w-[20rem] md:max-w-[24rem] min-h-[104px] md:min-h-[136px] px-2 text-center ${sizeClass} font-black tracking-tighter mb-4 md:mb-6 leading-[0.95] capitalize flex items-center justify-center`}
      >
        {word}
      </h2>

      <div className="flex flex-col items-center gap-3 md:gap-4">
        <button
          onClick={play}
          disabled={!isActive}
          aria-label="Play pronunciation"
          className="ui-cta-primary group relative w-[72px] h-[72px] md:w-[88px] md:h-[88px] rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:shadow-none"
        >
          <Play
            size={28}
            fill="currentColor"
            className={`ml-1 ${isPlaying ? 'animate-pulse' : ''}`}
          />
        </button>
        <p data-testid="pair-card-helper-text" className="ui-label-muted text-[10px] md:text-xs font-extrabold uppercase tracking-widest">
          Tap to speak
        </p>
      </div>
    </div>
  );
}

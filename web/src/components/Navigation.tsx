import { ChevronLeft, ChevronRight, PlaySquare } from 'lucide-react';
import { audioUrl } from '../lib/api';
import { playPairAudio } from '../lib/audioPlayback';

interface Props {
  onPrev: () => void;
  onNext: () => void;
  word1: string;
  word2: string;
}

export function Navigation({ onPrev, onNext, word1, word2 }: Props) {
  const playPair = async () => {
    await playPairAudio(audioUrl(word1), audioUrl(word2));
  };

  return (
    <div
      data-testid="navigation-controls"
      className="ui-filter-shell flex justify-center items-center gap-3 md:gap-6 mt-3 md:mt-6 rounded-full px-2.5 py-2"
    >
      <button
        onClick={onPrev}
        aria-label="Previous pair"
        className="ui-btn-secondary w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-colors"
      >
        <ChevronLeft size={24} />
      </button>

        <button
          onClick={playPair}
          aria-label="Play pair audio"
          className="ui-btn-primary h-12 md:h-16 px-5 md:px-10 rounded-full flex items-center gap-2 md:gap-3 font-bold text-sm md:text-lg transition-colors"
        >
        <PlaySquare size={20} fill="currentColor" />
        Play Auto
      </button>

      <button
        onClick={onNext}
        aria-label="Next pair"
        className="ui-btn-secondary w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-colors"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
}

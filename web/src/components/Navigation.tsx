import { ChevronLeft, ChevronRight, PlaySquare } from 'lucide-react';
import { audioUrl } from '../lib/api';

interface Props {
  onPrev: () => void;
  onNext: () => void;
  word1: string;
  word2: string;
}

export function Navigation({ onPrev, onNext, word1, word2 }: Props) {
  const playPair = async () => {
    const a1 = new Audio(audioUrl(word1));
    const a2 = new Audio(audioUrl(word2));

    try {
      await a1.play();
      a1.onended = () => {
        setTimeout(() => a2.play(), 600);
      };
    } catch {}
  };

  return (
    <div className="flex justify-center items-center gap-4 md:gap-6 mt-8 md:mt-12">
      <button
        onClick={onPrev}
        className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center text-slate-900 hover:bg-slate-50 transition-colors shadow-lg shadow-slate-200/50"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={playPair}
        className="h-14 md:h-16 px-8 md:px-10 bg-slate-900 text-white rounded-full flex items-center gap-3 font-bold md:text-lg hover:bg-slate-800 transition-colors shadow-xl shadow-slate-900/20"
      >
        <PlaySquare size={20} fill="currentColor" />
        Play Auto
      </button>

      <button
        onClick={onNext}
        className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center text-slate-900 hover:bg-slate-50 transition-colors shadow-lg shadow-slate-200/50"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
}

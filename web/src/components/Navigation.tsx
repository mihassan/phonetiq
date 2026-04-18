import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import { audioUrl } from '../lib/api';

interface Props {
  onPrev: () => void;
  onNext: () => void;
  word1: string;
  word2: string;
}

export function Navigation({ onPrev, onNext, word1, word2 }: Props) {
  const playPair = () => {
    const a1 = new Audio(audioUrl(word1));
    a1.onended = () => {
      const a2 = new Audio(audioUrl(word2));
      a2.play().catch(() => {});
    };
    a1.play().catch(() => {});
  };

  return (
    <div className="flex items-center justify-center gap-6">
      <button
        onClick={onPrev}
        className="p-4 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all shadow-sm active:scale-90"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={playPair}
        className="px-10 py-4 bg-slate-900 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center gap-3 text-sm tracking-tight"
      >
        <RefreshCcw size={18} /> Play Pair
      </button>
      <button
        onClick={onNext}
        className="p-4 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all shadow-sm active:scale-90"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

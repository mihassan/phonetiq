import { PairCard } from './PairCard';
import type { WordPair } from '../lib/types';

interface LearnStageProps {
  pair: WordPair;
  index: number;
  totalPairs: number;
  progress: number;
}

export function LearnStage({ pair, index, totalPairs, progress }: LearnStageProps) {
  return (
    <main
      data-testid="learn-stage"
      className="learn-stage ui-stage-panel w-[92%] md:w-full max-w-5xl rounded-[32px] md:rounded-[48px] flex flex-col overflow-hidden relative min-h-[340px] md:min-h-[600px] mt-3 md:mt-8"
    >
      <div className="flex flex-col">
        <div className="ui-progress-track w-full h-1 md:h-1.5">
          <div
            className="ui-progress-fill h-full rounded-r-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between items-center px-6 md:px-12 pt-6 md:pt-8 pb-4">
          <div className="ui-meta-label ui-eyebrow">
            Pair {index + 1} of {totalPairs}
          </div>
          {pair.target_sounds && (
            <div className="ui-sound-chip text-[10px] md:text-sm font-extrabold px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg tracking-wider">
              {pair.target_sounds}
            </div>
          )}
        </div>
      </div>

      <div
        data-testid="learn-stage-columns"
        className="learn-stage-columns grid grid-cols-1 md:grid-cols-2 items-stretch flex-1 pb-8 md:pb-0"
      >
        <PairCard
          word={pair.word1}
          partnerWord={pair.word2}
          isActive={true}
          isFirstWord={true}
        />
        <PairCard
          word={pair.word2}
          partnerWord={pair.word1}
          isActive={true}
          isFirstWord={false}
        />
      </div>
    </main>
  );
}

import {
  getDialectPromptLabel,
  isTargetDialect,
  type TargetDialect,
} from './dialects';

export interface EvalVoice {
  name: string;
}

export interface EvalPair {
  word1: string;
  word2: string;
  dialect: TargetDialect;
  voices: EvalVoice[];
}

export interface EvalResult {
  word: string;
  expectedWord: string;
  candidate1: string;
  candidate2: string;
  dialect: TargetDialect;
  voice: string;
  matchType: string;
  matchedWord: string | null;
  matchedBy: string | null;
  correct: boolean;
}

export interface EvalSummaryBucket {
  dialect?: TargetDialect;
  label: string;
  total: number;
  correct: number;
  wrong: number;
  noMatch: number;
  aliasResolved: number;
}

export const DIALECT_EVAL_CORPUS: EvalPair[] = [
  { word1: 'ship', word2: 'sheep', dialect: 'us_only', voices: [{ name: 'Samantha' }] },
  { word1: 'ship', word2: 'sheep', dialect: 'uk_only', voices: [{ name: 'Daniel' }] },
  { word1: 'ship', word2: 'sheep', dialect: 'au_only', voices: [{ name: 'Karen' }] },
  { word1: 'pen', word2: 'pan', dialect: 'us_only', voices: [{ name: 'Samantha' }] },
  { word1: 'pen', word2: 'pan', dialect: 'uk_only', voices: [{ name: 'Daniel' }] },
  { word1: 'pen', word2: 'pan', dialect: 'au_only', voices: [{ name: 'Karen' }] },
  { word1: 'bar', word2: 'bore', dialect: 'us_only', voices: [{ name: 'Samantha' }] },
  { word1: 'cut', word2: 'cart', dialect: 'uk_only', voices: [{ name: 'Daniel' }] },
  { word1: 'peer', word2: 'pear', dialect: 'au_only', voices: [{ name: 'Karen' }] },
];

const DIALECT_ORDER: TargetDialect[] = ['us_only', 'uk_only', 'au_only'];

function buildSummaryBucket(
  label: string,
  results: EvalResult[],
  dialect?: TargetDialect,
): EvalSummaryBucket {
  const total = results.length;
  const correct = results.filter((result) => result.correct).length;
  const wrong = results.filter(
    (result) => !result.correct && result.matchType !== 'no_match' && result.matchType !== 'freeform',
  ).length;
  const noMatch = results.filter(
    (result) => result.matchType === 'no_match' || result.matchType === 'freeform',
  ).length;
  const aliasResolved = results.filter(
    (result) => result.matchedBy?.startsWith('dialect_alias') ?? false,
  ).length;

  return {
    dialect,
    label,
    total,
    correct,
    wrong,
    noMatch,
    aliasResolved,
  };
}

export function readDialectFilterArg(argv: string[]): TargetDialect | null {
  const dialectFlagIndex = argv.indexOf('--dialect');
  if (dialectFlagIndex === -1) {
    return null;
  }

  const value = argv[dialectFlagIndex + 1];
  if (!value) {
    throw new Error('Missing value for --dialect. Use one of: us_only, uk_only, au_only.');
  }

  if (!isTargetDialect(value)) {
    throw new Error(`Invalid --dialect "${value}". Use one of: us_only, uk_only, au_only.`);
  }

  return value;
}

export function filterEvalCorpus(
  corpus: EvalPair[],
  dialect: TargetDialect | null,
): EvalPair[] {
  if (!dialect) {
    return corpus;
  }

  return corpus.filter((pair) => pair.dialect === dialect);
}

export function summarizeEvalResults(results: EvalResult[]) {
  return {
    overall: buildSummaryBucket('Overall', results),
    byDialect: DIALECT_ORDER
      .map((dialect) => {
        const dialectResults = results.filter((result) => result.dialect === dialect);
        if (dialectResults.length === 0) {
          return null;
        }

        return buildSummaryBucket(getDialectPromptLabel(dialect), dialectResults, dialect);
      })
      .filter((bucket): bucket is EvalSummaryBucket => bucket !== null),
  };
}

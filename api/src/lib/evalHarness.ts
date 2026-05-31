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
  family: string;
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

export interface EvalFamilySummaryBucket {
  family: string;
  label: string;
  total: number;
  correct: number;
  wrong: number;
  noMatch: number;
  aliasResolved: number;
  byDialect: EvalSummaryBucket[];
}

export interface EvalSummary {
  overall: EvalSummaryBucket;
  byDialect: EvalSummaryBucket[];
  byFamily: EvalFamilySummaryBucket[];
}

export interface EvalGuardrailThresholds {
  minOverallAccuracyPct?: number;
  minDialectAccuracyPct?: number;
  maxOverallNoMatchPct?: number;
  maxDialectNoMatchPct?: number;
}

export interface EvalGuardrailResult {
  passed: boolean;
  failures: string[];
}

export interface EvalOutputMode {
  json: boolean;
  summaryJson: boolean;
  pretty: boolean;
}

export type EvalJsonOutputMode = 'full' | 'summary';

export interface EvalRunMetadata {
  requestCount: number;
  errorCount: number;
  elapsedMs: number;
}

export interface EvalJsonReport {
  schemaVersion: number;
  outputMode: EvalJsonOutputMode;
  generatedAt: string;
  baseUrl: string;
  label: string;
  fixtureDir: string;
  delayMs: number;
  dialectFilter: TargetDialect | null;
  run: EvalRunMetadata;
  summary: EvalSummary;
  results: EvalResult[];
  guardrails: {
    enabled: boolean;
    thresholds: EvalGuardrailThresholds | null;
    passed: boolean | null;
    failures: string[];
  };
}

export interface EvalSummaryJsonReport {
  schemaVersion: number;
  outputMode: EvalJsonOutputMode;
  generatedAt: string;
  baseUrl: string;
  label: string;
  fixtureDir: string;
  delayMs: number;
  dialectFilter: TargetDialect | null;
  run: EvalRunMetadata;
  summary: EvalSummary;
  guardrails: {
    enabled: boolean;
    thresholds: EvalGuardrailThresholds | null;
    passed: boolean | null;
    failures: string[];
  };
}

export const DEFAULT_EVAL_GUARDRAILS: Required<EvalGuardrailThresholds> = {
  minOverallAccuracyPct: 70,
  minDialectAccuracyPct: 60,
  maxOverallNoMatchPct: 30,
  maxDialectNoMatchPct: 40,
};
export const EVAL_JSON_SCHEMA_VERSION = 1;

const DIALECT_ORDER: TargetDialect[] = ['us_only', 'uk_only', 'au_only'];
const DIALECT_VOICE_BY_TARGET: Record<TargetDialect, EvalVoice> = {
  us_only: { name: 'Samantha' },
  uk_only: { name: 'Daniel' },
  au_only: { name: 'Karen' },
};

const CROSS_DIALECT_EVAL_CONTRASTS = [
  ['ship', 'sheep'],
  ['pen', 'pan'],
  ['cot', 'caught'],
] as const;

const TARGETED_EVAL_CONTRASTS: Array<{
  word1: string;
  word2: string;
  dialect: TargetDialect;
}> = [
  { word1: 'bar', word2: 'bore', dialect: 'us_only' },
  { word1: 'cut', word2: 'cart', dialect: 'uk_only' },
  { word1: 'peer', word2: 'pear', dialect: 'au_only' },
  { word1: 'hut', word2: 'heart', dialect: 'uk_only' },
  { word1: 'hut', word2: 'heart', dialect: 'au_only' },
];

export const DIALECT_EVAL_CORPUS: EvalPair[] = [
  ...CROSS_DIALECT_EVAL_CONTRASTS.flatMap(([word1, word2]) =>
    DIALECT_ORDER.map((dialect) => ({
      word1,
      word2,
      dialect,
      voices: [DIALECT_VOICE_BY_TARGET[dialect]],
    })),
  ),
  ...TARGETED_EVAL_CONTRASTS.map((pair) => ({
    ...pair,
    voices: [DIALECT_VOICE_BY_TARGET[pair.dialect]],
  })),
];

export function toContrastFamily(word1: string, word2: string): string {
  return [word1, word2].sort().join('|');
}

function familyLabel(family: string) {
  const [wordA, wordB] = family.split('|');
  return `${wordA} <-> ${wordB}`;
}

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
  const byFamily = new Map<string, EvalResult[]>();
  for (const result of results) {
    const family = result.family || toContrastFamily(result.candidate1, result.candidate2);
    const existing = byFamily.get(family);
    if (existing) {
      existing.push(result);
    } else {
      byFamily.set(family, [result]);
    }
  }

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
    byFamily: Array.from(byFamily.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([family, familyResults]) => {
        const overall = buildSummaryBucket(familyLabel(family), familyResults);
        const byDialect = DIALECT_ORDER
          .map((dialect) => {
            const dialectResults = familyResults.filter((result) => result.dialect === dialect);
            if (dialectResults.length === 0) {
              return null;
            }

            return buildSummaryBucket(getDialectPromptLabel(dialect), dialectResults, dialect);
          })
          .filter((bucket): bucket is EvalSummaryBucket => bucket !== null);

        return {
          family,
          label: overall.label,
          total: overall.total,
          correct: overall.correct,
          wrong: overall.wrong,
          noMatch: overall.noMatch,
          aliasResolved: overall.aliasResolved,
          byDialect,
        };
      }),
  } satisfies EvalSummary;
}

function readPercentArg(argv: string[], flag: string): number | null {
  const flagIndex = argv.indexOf(flag);
  if (flagIndex === -1) {
    return null;
  }

  const value = argv[flagIndex + 1];
  if (!value) {
    throw new Error(`Missing value for ${flag}. Use a percentage between 0 and 100.`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`Invalid ${flag} "${value}". Use a percentage between 0 and 100.`);
  }

  return parsed;
}

export function readEvalGuardrailArgs(argv: string[]): EvalGuardrailThresholds | null {
  const strict = argv.includes('--strict');
  const minOverallAccuracyPct = readPercentArg(argv, '--min-overall-accuracy');
  const minDialectAccuracyPct = readPercentArg(argv, '--min-dialect-accuracy');
  const maxOverallNoMatchPct = readPercentArg(argv, '--max-overall-no-match');
  const maxDialectNoMatchPct = readPercentArg(argv, '--max-dialect-no-match');

  if (
    !strict &&
    minOverallAccuracyPct === null &&
    minDialectAccuracyPct === null &&
    maxOverallNoMatchPct === null &&
    maxDialectNoMatchPct === null
  ) {
    return null;
  }

  return {
    minOverallAccuracyPct:
      minOverallAccuracyPct ?? (strict ? DEFAULT_EVAL_GUARDRAILS.minOverallAccuracyPct : undefined),
    minDialectAccuracyPct:
      minDialectAccuracyPct ?? (strict ? DEFAULT_EVAL_GUARDRAILS.minDialectAccuracyPct : undefined),
    maxOverallNoMatchPct:
      maxOverallNoMatchPct ?? (strict ? DEFAULT_EVAL_GUARDRAILS.maxOverallNoMatchPct : undefined),
    maxDialectNoMatchPct:
      maxDialectNoMatchPct ?? (strict ? DEFAULT_EVAL_GUARDRAILS.maxDialectNoMatchPct : undefined),
  };
}

export function readEvalOutputModeArgs(argv: string[]): EvalOutputMode {
  const jsonPretty = argv.includes('--json-pretty');
  const summaryJsonPretty = argv.includes('--summary-json-pretty');
  const json = argv.includes('--json') || jsonPretty;
  const summaryJson = argv.includes('--summary-json') || summaryJsonPretty;

  if (json && summaryJson) {
    throw new Error(
      'Use either --json/--json-pretty or --summary-json/--summary-json-pretty, not both.',
    );
  }

  return {
    json,
    summaryJson,
    pretty: jsonPretty || summaryJsonPretty,
  };
}

export function readEvalJsonOutArg(argv: string[]): string | null {
  const jsonOutIndex = argv.indexOf('--json-out');
  if (jsonOutIndex === -1) {
    return null;
  }

  const value = argv[jsonOutIndex + 1];
  if (!value || value.startsWith('--')) {
    throw new Error('Missing value for --json-out. Provide a file path.');
  }

  return value;
}

export function validateEvalOutputArgs(outputMode: EvalOutputMode, jsonOutPath: string | null) {
  if (jsonOutPath && !outputMode.json && !outputMode.summaryJson) {
    throw new Error(
      '--json-out requires --json/--json-pretty or --summary-json/--summary-json-pretty.',
    );
  }
}

function accuracyPct(bucket: EvalSummaryBucket) {
  return bucket.total === 0 ? 100 : (bucket.correct / bucket.total) * 100;
}

function noMatchPct(bucket: EvalSummaryBucket) {
  return bucket.total === 0 ? 0 : (bucket.noMatch / bucket.total) * 100;
}

function pctLabel(value: number) {
  return `${value.toFixed(1)}%`;
}

export function evaluateEvalGuardrails(
  summary: EvalSummary,
  thresholds: EvalGuardrailThresholds,
): EvalGuardrailResult {
  const failures: string[] = [];
  const overallAccuracy = accuracyPct(summary.overall);
  const overallNoMatch = noMatchPct(summary.overall);

  if (
    thresholds.minOverallAccuracyPct !== undefined &&
    overallAccuracy < thresholds.minOverallAccuracyPct
  ) {
    failures.push(
      `Overall accuracy ${pctLabel(overallAccuracy)} is below minimum ${pctLabel(thresholds.minOverallAccuracyPct)}.`,
    );
  }

  if (
    thresholds.maxOverallNoMatchPct !== undefined &&
    overallNoMatch > thresholds.maxOverallNoMatchPct
  ) {
    failures.push(
      `Overall no-match rate ${pctLabel(overallNoMatch)} is above maximum ${pctLabel(thresholds.maxOverallNoMatchPct)}.`,
    );
  }

  if (thresholds.minDialectAccuracyPct !== undefined) {
    for (const bucket of summary.byDialect) {
      const dialectAccuracy = accuracyPct(bucket);
      if (dialectAccuracy < thresholds.minDialectAccuracyPct) {
        failures.push(
          `${bucket.label} accuracy ${pctLabel(dialectAccuracy)} is below minimum ${pctLabel(thresholds.minDialectAccuracyPct)}.`,
        );
      }
    }
  }

  if (thresholds.maxDialectNoMatchPct !== undefined) {
    for (const bucket of summary.byDialect) {
      const dialectNoMatch = noMatchPct(bucket);
      if (dialectNoMatch > thresholds.maxDialectNoMatchPct) {
        failures.push(
          `${bucket.label} no-match rate ${pctLabel(dialectNoMatch)} is above maximum ${pctLabel(thresholds.maxDialectNoMatchPct)}.`,
        );
      }
    }
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}

export function buildEvalJsonReport(input: {
  generatedAt: string;
  baseUrl: string;
  label: string;
  fixtureDir: string;
  delayMs: number;
  dialectFilter: TargetDialect | null;
  run: EvalRunMetadata;
  summary: EvalSummary;
  results: EvalResult[];
  guardrails: {
    thresholds: EvalGuardrailThresholds | null;
    result: EvalGuardrailResult | null;
  };
}): EvalJsonReport {
  return {
    schemaVersion: EVAL_JSON_SCHEMA_VERSION,
    outputMode: 'full',
    generatedAt: input.generatedAt,
    baseUrl: input.baseUrl,
    label: input.label,
    fixtureDir: input.fixtureDir,
    delayMs: input.delayMs,
    dialectFilter: input.dialectFilter,
    run: input.run,
    summary: input.summary,
    results: input.results,
    guardrails: {
      enabled: input.guardrails.thresholds !== null,
      thresholds: input.guardrails.thresholds,
      passed: input.guardrails.result?.passed ?? null,
      failures: input.guardrails.result?.failures ?? [],
    },
  };
}

export function buildEvalSummaryJsonReport(input: {
  generatedAt: string;
  baseUrl: string;
  label: string;
  fixtureDir: string;
  delayMs: number;
  dialectFilter: TargetDialect | null;
  run: EvalRunMetadata;
  summary: EvalSummary;
  guardrails: {
    thresholds: EvalGuardrailThresholds | null;
    result: EvalGuardrailResult | null;
  };
}): EvalSummaryJsonReport {
  return {
    schemaVersion: EVAL_JSON_SCHEMA_VERSION,
    outputMode: 'summary',
    generatedAt: input.generatedAt,
    baseUrl: input.baseUrl,
    label: input.label,
    fixtureDir: input.fixtureDir,
    delayMs: input.delayMs,
    dialectFilter: input.dialectFilter,
    run: input.run,
    summary: input.summary,
    guardrails: {
      enabled: input.guardrails.thresholds !== null,
      thresholds: input.guardrails.thresholds,
      passed: input.guardrails.result?.passed ?? null,
      failures: input.guardrails.result?.failures ?? [],
    },
  };
}

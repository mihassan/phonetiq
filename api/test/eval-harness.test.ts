import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EVAL_GUARDRAILS,
  DIALECT_EVAL_CORPUS,
  evaluateEvalGuardrails,
  filterEvalCorpus,
  readDialectFilterArg,
  readEvalGuardrailArgs,
  summarizeEvalResults,
  type EvalResult,
} from '../src/lib/evalHarness';

describe('evalHarness', () => {
  it('keeps the dialect eval corpus explicit and voice-aligned', () => {
    expect(DIALECT_EVAL_CORPUS.every((pair) => pair.voices.length > 0)).toBe(true);
    expect(DIALECT_EVAL_CORPUS.every((pair) => pair.voices.length === 1)).toBe(true);
    expect(new Set(DIALECT_EVAL_CORPUS.map((pair) => pair.dialect))).toEqual(
      new Set(['us_only', 'uk_only', 'au_only']),
    );
  });

  it('parses an optional dialect filter flag', () => {
    expect(readDialectFilterArg(['node', 'script.ts'])).toBeNull();
    expect(readDialectFilterArg(['node', 'script.ts', '--dialect', 'uk_only'])).toBe('uk_only');
  });

  it('rejects invalid dialect filters', () => {
    expect(() => readDialectFilterArg(['node', 'script.ts', '--dialect', 'all'])).toThrow(
      'Invalid --dialect "all"',
    );
  });

  it('parses optional strict guardrail settings', () => {
    expect(readEvalGuardrailArgs(['node', 'script.ts'])).toBeNull();
    expect(readEvalGuardrailArgs(['node', 'script.ts', '--strict'])).toEqual(
      DEFAULT_EVAL_GUARDRAILS,
    );
    expect(
      readEvalGuardrailArgs([
        'node',
        'script.ts',
        '--strict',
        '--min-dialect-accuracy',
        '75',
        '--max-overall-no-match',
        '20',
      ]),
    ).toEqual({
      ...DEFAULT_EVAL_GUARDRAILS,
      minDialectAccuracyPct: 75,
      maxOverallNoMatchPct: 20,
    });
  });

  it('rejects invalid guardrail percentages', () => {
    expect(() =>
      readEvalGuardrailArgs(['node', 'script.ts', '--min-overall-accuracy', 'nan']),
    ).toThrow('Invalid --min-overall-accuracy');
    expect(() =>
      readEvalGuardrailArgs(['node', 'script.ts', '--max-dialect-no-match', '101']),
    ).toThrow('Invalid --max-dialect-no-match');
  });

  it('filters the corpus by target dialect', () => {
    const filtered = filterEvalCorpus(DIALECT_EVAL_CORPUS, 'au_only');

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((pair) => pair.dialect === 'au_only')).toBe(true);
  });

  it('summarizes totals overall and by dialect, including alias-resolved runs', () => {
    const results: EvalResult[] = [
      {
        word: 'bore',
        expectedWord: 'bore',
        candidate1: 'bar',
        candidate2: 'bore',
        dialect: 'us_only',
        voice: 'Samantha',
        matchType: 'fuzzy',
        matchedWord: 'bore',
        matchedBy: 'dialect_alias_exact',
        correct: true,
      },
      {
        word: 'sheep',
        expectedWord: 'sheep',
        candidate1: 'ship',
        candidate2: 'sheep',
        dialect: 'uk_only',
        voice: 'Daniel',
        matchType: 'exact',
        matchedWord: 'sheep',
        matchedBy: 'exact',
        correct: true,
      },
      {
        word: 'pear',
        expectedWord: 'pear',
        candidate1: 'peer',
        candidate2: 'pear',
        dialect: 'au_only',
        voice: 'Karen',
        matchType: 'no_match',
        matchedWord: null,
        matchedBy: 'none',
        correct: false,
      },
    ];

    const summary = summarizeEvalResults(results);

    expect(summary.overall.total).toBe(3);
    expect(summary.overall.correct).toBe(2);
    expect(summary.overall.noMatch).toBe(1);
    expect(summary.overall.aliasResolved).toBe(1);
    expect(summary.byDialect).toEqual([
      {
        dialect: 'us_only',
        label: 'American English',
        total: 1,
        correct: 1,
        wrong: 0,
        noMatch: 0,
        aliasResolved: 1,
      },
      {
        dialect: 'uk_only',
        label: 'British English',
        total: 1,
        correct: 1,
        wrong: 0,
        noMatch: 0,
        aliasResolved: 0,
      },
      {
        dialect: 'au_only',
        label: 'Australian English',
        total: 1,
        correct: 0,
        wrong: 0,
        noMatch: 1,
        aliasResolved: 0,
      },
    ]);
  });

  it('evaluates guardrail pass/fail thresholds', () => {
    const results: EvalResult[] = [
      {
        word: 'ship',
        expectedWord: 'ship',
        candidate1: 'ship',
        candidate2: 'sheep',
        dialect: 'us_only',
        voice: 'Samantha',
        matchType: 'exact',
        matchedWord: 'ship',
        matchedBy: 'exact',
        correct: true,
      },
      {
        word: 'sheep',
        expectedWord: 'sheep',
        candidate1: 'ship',
        candidate2: 'sheep',
        dialect: 'us_only',
        voice: 'Samantha',
        matchType: 'no_match',
        matchedWord: null,
        matchedBy: 'none',
        correct: false,
      },
      {
        word: 'pen',
        expectedWord: 'pen',
        candidate1: 'pen',
        candidate2: 'pan',
        dialect: 'uk_only',
        voice: 'Daniel',
        matchType: 'exact',
        matchedWord: 'pen',
        matchedBy: 'exact',
        correct: true,
      },
      {
        word: 'pan',
        expectedWord: 'pan',
        candidate1: 'pen',
        candidate2: 'pan',
        dialect: 'uk_only',
        voice: 'Daniel',
        matchType: 'exact',
        matchedWord: 'pan',
        matchedBy: 'exact',
        correct: true,
      },
    ];

    const summary = summarizeEvalResults(results);
    const pass = evaluateEvalGuardrails(summary, {
      minOverallAccuracyPct: 70,
      minDialectAccuracyPct: 50,
      maxOverallNoMatchPct: 30,
      maxDialectNoMatchPct: 60,
    });
    const fail = evaluateEvalGuardrails(summary, {
      minOverallAccuracyPct: 80,
      minDialectAccuracyPct: 60,
      maxOverallNoMatchPct: 20,
      maxDialectNoMatchPct: 40,
    });

    expect(pass.passed).toBe(true);
    expect(pass.failures).toEqual([]);
    expect(fail.passed).toBe(false);
    expect(fail.failures).toEqual([
      'Overall accuracy 75.0% is below minimum 80.0%.',
      'Overall no-match rate 25.0% is above maximum 20.0%.',
      'American English accuracy 50.0% is below minimum 60.0%.',
      'American English no-match rate 50.0% is above maximum 40.0%.',
    ]);
  });
});

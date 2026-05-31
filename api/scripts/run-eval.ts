#!/usr/bin/env npx tsx
/**
 * Phonetiq recognition eval harness.
 *
 * Usage:
 *   npx tsx scripts/run-eval.ts [--base-url http://localhost:8787] [--dialect us_only]
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DIALECT_EVAL_CORPUS,
  evaluateEvalGuardrails,
  filterEvalCorpus,
  readDialectFilterArg,
  readEvalGuardrailArgs,
  summarizeEvalResults,
  type EvalGuardrailThresholds,
  type EvalPair,
  type EvalResult,
  type EvalSummary,
} from '../src/lib/evalHarness';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, '../test/fixtures/recognition-eval');
const BASE_URL = process.argv.includes('--base-url')
  ? process.argv[process.argv.indexOf('--base-url') + 1]
  : 'http://localhost:8787';
const DELAY_MS = process.argv.includes('--delay-ms')
  ? parseInt(process.argv[process.argv.indexOf('--delay-ms') + 1], 10)
  : 0;
const LABEL = process.argv.includes('--label')
  ? process.argv[process.argv.indexOf('--label') + 1]
  : 'FRAME SENTENCE (the word is X)';
const DIALECT_FILTER = readDialectFilterArg(process.argv);
const EVAL_GUARDRAILS = readEvalGuardrailArgs(process.argv);
const EVAL_CORPUS = filterEvalCorpus(DIALECT_EVAL_CORPUS, DIALECT_FILTER);
const RATE_LIMIT_BATCH = 8;

function voiceSlug(voice: string) {
  return voice.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function wavPath(word: string, voice: string): string {
  return join(FIXTURES_DIR, `${word}_${voiceSlug(voice)}.wav`);
}

function generateWav(word: string, voice: string, path: string) {
  if (existsSync(path)) return;
  execSync(`say -v "${voice}" -o "${path}" --data-format=LEF32@22050 "the word is ${word}"`, {
    stdio: 'pipe',
  });
  const tmp = path + '.tmp.wav';
  execSync(`afconvert -f WAVE -d LEI16@16000 -c 1 "${path}" "${tmp}"`, { stdio: 'pipe' });
  execSync(`mv "${tmp}" "${path}"`, { stdio: 'pipe' });
}

function isLocalBaseUrl(baseUrl: string) {
  const host = new URL(baseUrl).hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

function getLocalOrigin(baseUrl: string) {
  const url = new URL(baseUrl);
  return `${url.protocol}//${url.host}`;
}

async function recognize(
  wavFilePath: string,
  word1: string,
  word2: string,
  dialect: EvalPair['dialect'],
): Promise<{
  matchType: string;
  matchedWord: string | null;
  transcript: string;
  matchedBy: string | null;
}> {
  const audioData = readFileSync(wavFilePath);
  const blob = new Blob([audioData], { type: 'audio/wav' });
  const form = new FormData();
  form.append('audio', blob, 'recording.wav');
  form.append('candidate1', word1);
  form.append('candidate2', word2);
  form.append('dialect', dialect);

  const requestDebug = isLocalBaseUrl(BASE_URL);
  if (requestDebug) {
    form.append('debug', '1');
  }

  const resp = await fetch(`${BASE_URL}/api/recognize`, {
    method: 'POST',
    body: form,
    headers: requestDebug ? { Origin: getLocalOrigin(BASE_URL) } : undefined,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${text}`);
  }

  const json = (await resp.json()) as {
    matchType?: string;
    matchedWord?: string | null;
    transcript?: string;
    result?: string;
    debug?: {
      transcript?: string;
      matching?: {
        matchedBy?: string;
      };
    };
  };

  return {
    matchType: json.matchType ?? json.result ?? 'unknown',
    matchedWord: json.matchedWord ?? null,
    transcript: json.transcript ?? json.debug?.transcript ?? '',
    matchedBy: json.debug?.matching?.matchedBy ?? null,
  };
}

function pct(n: number, total: number) {
  return total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`;
}

function printTable(results: EvalResult[], label: string, summary: EvalSummary) {
  const overall = summary.overall;

  console.log(`\n${'='.repeat(110)}`);
  console.log(`  ${label}`);
  console.log(`${'='.repeat(110)}`);
  console.log(
    `${'Word'.padEnd(10)} ${'Expected'.padEnd(10)} ${'Got'.padEnd(12)} ${'Type'.padEnd(10)} ${'Dialect'.padEnd(8)} ${'Voice'.padEnd(12)} ${'MatchedBy'.padEnd(20)} OK?`,
  );
  console.log('-'.repeat(110));

  for (const result of results) {
    console.log(
      `${result.word.padEnd(10)} ${result.expectedWord.padEnd(10)} ${(result.matchedWord ?? '—').padEnd(12)} ${result.matchType.padEnd(10)} ${result.dialect.padEnd(8)} ${result.voice.padEnd(12)} ${(result.matchedBy ?? '—').padEnd(20)} ${result.correct ? '✓' : '✗'}`,
    );
  }

  console.log('-'.repeat(110));
  console.log(
    `Total: ${overall.total}  Correct: ${overall.correct} (${pct(overall.correct, overall.total)})  Wrong: ${overall.wrong} (${pct(overall.wrong, overall.total)})  No-match: ${overall.noMatch} (${pct(overall.noMatch, overall.total)})  Alias-resolved: ${overall.aliasResolved}`,
  );
}

function printDialectSummary(summary: EvalSummary) {
  console.log('\nBy target dialect');
  for (const bucket of summary.byDialect) {
    console.log(
      `- ${bucket.label} (${bucket.dialect}, N=${bucket.total}): Correct ${bucket.correct} (${pct(bucket.correct, bucket.total)}), Wrong ${bucket.wrong} (${pct(bucket.wrong, bucket.total)}), No-match ${bucket.noMatch} (${pct(bucket.noMatch, bucket.total)}), Alias-resolved ${bucket.aliasResolved}`,
    );
  }
}

function printGuardrailSettings(settings: EvalGuardrailThresholds) {
  const parts: string[] = [];
  if (settings.minOverallAccuracyPct !== undefined) {
    parts.push(`min overall accuracy ${settings.minOverallAccuracyPct}%`);
  }
  if (settings.minDialectAccuracyPct !== undefined) {
    parts.push(`min dialect accuracy ${settings.minDialectAccuracyPct}%`);
  }
  if (settings.maxOverallNoMatchPct !== undefined) {
    parts.push(`max overall no-match ${settings.maxOverallNoMatchPct}%`);
  }
  if (settings.maxDialectNoMatchPct !== undefined) {
    parts.push(`max dialect no-match ${settings.maxDialectNoMatchPct}%`);
  }
  console.log(`Guardrails: ${parts.join(', ')}`);
}

async function checkWorkerRunning() {
  try {
    const resp = await fetch(`${BASE_URL}/api/pairs?limit=1`);
    if (!resp.ok) throw new Error(`status ${resp.status}`);
  } catch {
    console.error(`\n✗ Cannot reach Worker at ${BASE_URL}`);
    console.error('  Start it with: cd api && npm run dev\n');
    process.exit(1);
  }
}

async function main() {
  console.log('\nPhonetiq Recognition Eval Harness');
  console.log(`Base URL: ${BASE_URL}`);
  if (DIALECT_FILTER) {
    console.log(`Target dialect filter: ${DIALECT_FILTER}`);
  }
  if (EVAL_GUARDRAILS) {
    printGuardrailSettings(EVAL_GUARDRAILS);
  }
  console.log(`Fixtures: ${FIXTURES_DIR}\n`);

  await checkWorkerRunning();
  mkdirSync(FIXTURES_DIR, { recursive: true });
  if (EVAL_CORPUS.length === 0) {
    throw new Error('No eval corpus rows matched the selected dialect filter.');
  }

  process.stdout.write('Generating WAV fixtures...');
  for (const pair of EVAL_CORPUS) {
    for (const word of [pair.word1, pair.word2]) {
      for (const { name: voice } of pair.voices) {
        const path = wavPath(word, voice);
        if (!existsSync(path)) {
          process.stdout.write(` ${word}(${voice})`);
          generateWav(word, voice, path);
        }
      }
    }
  }
  console.log(' done.\n');

  const results: EvalResult[] = [];
  let requestCount = 0;

  for (const pair of EVAL_CORPUS) {
    for (const targetWord of [pair.word1, pair.word2]) {
      for (const { name: voice } of pair.voices) {
        if (requestCount > 0 && requestCount % RATE_LIMIT_BATCH === 0 && DELAY_MS === 0) {
          process.stdout.write(
            `\n  (pausing 62s to reset rate limiter after ${requestCount} requests...)`,
          );
          await new Promise((resolve) => setTimeout(resolve, 62_000));
          process.stdout.write(' continuing\n');
        }
        if (DELAY_MS > 0) {
          await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
        }

        requestCount += 1;
        const path = wavPath(targetWord, voice);

        try {
          const { matchType, matchedWord, matchedBy } = await recognize(
            path,
            pair.word1,
            pair.word2,
            pair.dialect,
          );
          results.push({
            word: targetWord,
            expectedWord: targetWord,
            candidate1: pair.word1,
            candidate2: pair.word2,
            dialect: pair.dialect,
            voice,
            matchType,
            matchedWord,
            matchedBy,
            correct: matchedWord === targetWord,
          });
        } catch (error) {
          console.error(`\nERROR recognizing ${targetWord} (${voice}): ${error}`);
          results.push({
            word: targetWord,
            expectedWord: targetWord,
            candidate1: pair.word1,
            candidate2: pair.word2,
            dialect: pair.dialect,
            voice,
            matchType: 'error',
            matchedWord: null,
            matchedBy: null,
            correct: false,
          });
        }
      }
    }
  }

  const summary = summarizeEvalResults(results);

  printTable(results, LABEL, summary);
  printDialectSummary(summary);
  if (EVAL_GUARDRAILS) {
    const guardrailResult = evaluateEvalGuardrails(summary, EVAL_GUARDRAILS);
    if (guardrailResult.passed) {
      console.log('\nGuardrails: PASS');
    } else {
      console.error('\nGuardrails: FAIL');
      for (const failure of guardrailResult.failures) {
        console.error(`- ${failure}`);
      }
      process.exit(1);
    }
  }
  console.log();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

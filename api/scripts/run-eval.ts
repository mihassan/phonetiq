#!/usr/bin/env npx tsx
/**
 * Phonetiq recognition eval harness.
 *
 * Usage:
 *   npx tsx scripts/run-eval.ts [--base-url http://localhost:8787]
 *
 * Requires:
 *   - macOS `say` command (for synthetic WAV generation)
 *   - `wrangler dev` running at --base-url (default http://localhost:8787)
 *
 * Runs each eval word through /api/recognize with both candidate words and
 * the word's dialect. Scores correct / wrong / no_match per run, then
 * prints a summary table.
 *
 * Run twice to compare flag states:
 *   RECOGNITION_FOUNDATION_V2=false  → baseline (biasing prompt + fuzzy match)
 *   RECOGNITION_FOUNDATION_V2=true   → foundation-v2 (no biasing, strict match)
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

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
  : 'BASELINE (biasing prompt + fuzzy match)';

interface EvalPair {
  word1: string;
  word2: string;
  dialect: string;
  voices: Array<{ name: string; accent: string }>;
}

const EVAL_CORPUS: EvalPair[] = [
  { word1: 'ship', word2: 'sheep', dialect: 'all', voices: [{ name: 'Samantha', accent: 'us' }, { name: 'Daniel', accent: 'gb' }] },
  { word1: 'pen', word2: 'pan', dialect: 'all', voices: [{ name: 'Samantha', accent: 'us' }, { name: 'Daniel', accent: 'gb' }] },
  { word1: 'cot', word2: 'cut', dialect: 'all', voices: [{ name: 'Samantha', accent: 'us' }, { name: 'Daniel', accent: 'gb' }] },
  { word1: 'sip', word2: 'ship', dialect: 'all', voices: [{ name: 'Samantha', accent: 'us' }, { name: 'Daniel', accent: 'gb' }] },
  { word1: 'pat', word2: 'bat', dialect: 'all', voices: [{ name: 'Samantha', accent: 'us' }, { name: 'Daniel', accent: 'gb' }] },
  { word1: 'thin', word2: 'sin', dialect: 'all', voices: [{ name: 'Samantha', accent: 'us' }, { name: 'Daniel', accent: 'gb' }] },
  { word1: 'light', word2: 'right', dialect: 'all', voices: [{ name: 'Samantha', accent: 'us' }, { name: 'Daniel', accent: 'gb' }] },
  { word1: 'cat', word2: 'cart', dialect: 'all', voices: [{ name: 'Samantha', accent: 'us' }, { name: 'Daniel', accent: 'gb' }, { name: 'Karen', accent: 'au' }] },
];

// ---------------------------------------------------------------------------

interface EvalResult {
  word: string;
  expectedWord: string;
  candidate1: string;
  candidate2: string;
  dialect: string;
  voice: string;
  matchType: string;
  matchedWord: string | null;
  correct: boolean;
}

function wavPath(word: string, voice: string): string {
  return join(FIXTURES_DIR, `${word}_${voice.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.wav`);
}

function generateWav(word: string, voice: string, path: string) {
  if (existsSync(path)) return;
  execSync(`say -v "${voice}" -o "${path}" --data-format=LEF32@22050 "${word}"`, { stdio: 'pipe' });
  // Convert to 16-bit PCM WAV that Whisper accepts
  const tmp = path + '.tmp.wav';
  execSync(`afconvert -f WAVE -d LEI16@16000 -c 1 "${path}" "${tmp}"`, { stdio: 'pipe' });
  execSync(`mv "${tmp}" "${path}"`, { stdio: 'pipe' });
}

async function recognize(
  wavFilePath: string,
  word1: string,
  word2: string,
  dialect: string,
): Promise<{ matchType: string; matchedWord: string | null; transcript: string }> {
  const audioData = readFileSync(wavFilePath);
  const blob = new Blob([audioData], { type: 'audio/wav' });
  const form = new FormData();
  form.append('audio', blob, 'recording.wav');
  form.append('candidate1', word1);
  form.append('candidate2', word2);
  form.append('dialect', dialect);

  const resp = await fetch(`${BASE_URL}/api/recognize`, { method: 'POST', body: form });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${text}`);
  }
  const json = (await resp.json()) as {
    matchType?: string;
    matchedWord?: string | null;
    transcript?: string;
    result?: string;
    debug?: { transcript?: string };
  };

  return {
    matchType: json.matchType ?? json.result ?? 'unknown',
    matchedWord: json.matchedWord ?? null,
    transcript: json.transcript ?? json.debug?.transcript ?? '',
  };
}

const RATE_LIMIT_BATCH = 8;

function printTable(results: EvalResult[], label: string) {
  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const wrong = results.filter((r) => !r.correct && r.matchType !== 'no_match' && r.matchType !== 'freeform').length;
  const noMatch = results.filter((r) => r.matchType === 'no_match' || r.matchType === 'freeform').length;

  console.log(`\n${'='.repeat(72)}`);
  console.log(`  ${label}`);
  console.log(`${'='.repeat(72)}`);
  console.log(
    `${'Word'.padEnd(10)} ${'Expected'.padEnd(10)} ${'Got'.padEnd(12)} ${'Type'.padEnd(10)} ${'Voice'.padEnd(12)} OK?`,
  );
  console.log('-'.repeat(72));

  for (const r of results) {
    const ok = r.correct ? '✓' : '✗';
    console.log(
      `${r.word.padEnd(10)} ${r.expectedWord.padEnd(10)} ${(r.matchedWord ?? '—').padEnd(12)} ${r.matchType.padEnd(10)} ${r.voice.padEnd(12)} ${ok}`,
    );
  }

  console.log('-'.repeat(72));
  console.log(
    `Total: ${total}  Correct: ${correct} (${pct(correct, total)})  Wrong: ${wrong} (${pct(wrong, total)})  No-match: ${noMatch} (${pct(noMatch, total)})`,
  );
}

function pct(n: number, total: number) {
  return total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`;
}

async function checkWorkerRunning() {
  try {
    const resp = await fetch(`${BASE_URL}/api/pairs?limit=1`);
    if (!resp.ok) throw new Error(`status ${resp.status}`);
  } catch (e) {
    console.error(`\n✗ Cannot reach Worker at ${BASE_URL}`);
    console.error('  Start it with: cd api && npm run dev\n');
    process.exit(1);
  }
}

async function main() {
  console.log(`\nPhonetiq Recognition Eval Harness`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Fixtures: ${FIXTURES_DIR}\n`);

  await checkWorkerRunning();
  mkdirSync(FIXTURES_DIR, { recursive: true });

  process.stdout.write('Generating WAV fixtures...');
  for (const pair of EVAL_CORPUS) {
    for (const { word1, word2 } of [{ word1: pair.word1, word2: '' }, { word1: pair.word2, word2: '' }]) {
      for (const { name: voice } of pair.voices) {
        const path = wavPath(word1, voice);
        if (!existsSync(path)) {
          process.stdout.write(` ${word1}(${voice})`);
          generateWav(word1, voice, path);
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
          process.stdout.write(`\n  (pausing 62s to reset rate limiter after ${requestCount} requests...)`);
          await new Promise((r) => setTimeout(r, 62_000));
          process.stdout.write(' continuing\n');
        }
        if (DELAY_MS > 0) {
          await new Promise((r) => setTimeout(r, DELAY_MS));
        }

        const path = wavPath(targetWord, voice);
        requestCount += 1;
        try {
          const { matchType, matchedWord } = await recognize(path, pair.word1, pair.word2, pair.dialect);
          results.push({
            word: targetWord,
            expectedWord: targetWord,
            candidate1: pair.word1,
            candidate2: pair.word2,
            dialect: pair.dialect,
            voice,
            matchType,
            matchedWord,
            correct: matchedWord === targetWord,
          });
        } catch (err) {
          console.error(`\nERROR recognizing ${targetWord} (${voice}): ${err}`);
          results.push({
            word: targetWord,
            expectedWord: targetWord,
            candidate1: pair.word1,
            candidate2: pair.word2,
            dialect: pair.dialect,
            voice,
            matchType: 'error',
            matchedWord: null,
            correct: false,
          });
        }
      }
    }
  }

  printTable(results, LABEL);
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

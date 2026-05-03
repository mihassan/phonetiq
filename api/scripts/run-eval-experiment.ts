#!/usr/bin/env npx tsx
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  : 'EXPERIMENT';

const EXPERIMENT = process.argv.includes('--experiment')
  ? (process.argv[process.argv.indexOf('--experiment') + 1] as 'repetition' | 'frame_sentence')
  : 'repetition';

if (EXPERIMENT !== 'repetition' && EXPERIMENT !== 'frame_sentence') {
  console.error(`Unknown experiment: ${EXPERIMENT}. Use repetition or frame_sentence.`);
  process.exit(1);
}

interface EvalPair {
  word1: string;
  word2: string;
  dialect: string;
  voices: Array<{ name: string }>;
}

const EVAL_CORPUS: EvalPair[] = [
  { word1: 'ship', word2: 'sheep', dialect: 'all', voices: [{ name: 'Samantha' }, { name: 'Daniel' }] },
  { word1: 'pen', word2: 'pan', dialect: 'all', voices: [{ name: 'Samantha' }, { name: 'Daniel' }] },
  { word1: 'cot', word2: 'cut', dialect: 'all', voices: [{ name: 'Samantha' }, { name: 'Daniel' }] },
  { word1: 'sip', word2: 'ship', dialect: 'all', voices: [{ name: 'Samantha' }, { name: 'Daniel' }] },
  { word1: 'pat', word2: 'bat', dialect: 'all', voices: [{ name: 'Samantha' }, { name: 'Daniel' }] },
  { word1: 'thin', word2: 'sin', dialect: 'all', voices: [{ name: 'Samantha' }, { name: 'Daniel' }] },
  { word1: 'light', word2: 'right', dialect: 'all', voices: [{ name: 'Samantha' }, { name: 'Daniel' }] },
  { word1: 'cat', word2: 'cart', dialect: 'all', voices: [{ name: 'Samantha' }, { name: 'Daniel' }, { name: 'Karen' }] },
];

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

function voiceSlug(voice: string) {
  return voice.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function wavPath(word: string, voice: string, experiment: string): string {
  return join(FIXTURES_DIR, `${word}_${voiceSlug(voice)}_${experiment}.wav`);
}

function sayPhrase(word: string, experiment: 'repetition' | 'frame_sentence'): string {
  if (experiment === 'repetition') return `${word} ${word} ${word}`;
  return `the word is ${word}`;
}

function generateWav(word: string, voice: string, path: string, experiment: 'repetition' | 'frame_sentence') {
  if (existsSync(path)) return;
  const phrase = sayPhrase(word, experiment);
  execSync(`say -v "${voice}" -o "${path}" --data-format=LEF32@22050 "${phrase}"`, { stdio: 'pipe' });
  const tmp = path + '.tmp.wav';
  execSync(`afconvert -f WAVE -d LEI16@16000 -c 1 "${path}" "${tmp}"`, { stdio: 'pipe' });
  execSync(`mv "${tmp}" "${path}"`, { stdio: 'pipe' });
}

async function recognize(
  wavFilePath: string,
  word1: string,
  word2: string,
  dialect: string,
  experiment: 'repetition' | 'frame_sentence',
): Promise<{ matchType: string; matchedWord: string | null; transcript: string }> {
  const audioData = readFileSync(wavFilePath);
  const blob = new Blob([audioData], { type: 'audio/wav' });
  const form = new FormData();
  form.append('audio', blob, 'recording.wav');
  form.append('candidate1', word1);
  form.append('candidate2', word2);
  form.append('dialect', dialect);
  form.append('experiment', experiment);

  const resp = await fetch(`${BASE_URL}/api/recognize`, { method: 'POST', body: form });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${text}`);
  }
  const json = (await resp.json()) as {
    matchType?: string;
    matchedWord?: string | null;
    transcript?: string;
  };

  return {
    matchType: json.matchType ?? 'unknown',
    matchedWord: json.matchedWord ?? null,
    transcript: json.transcript ?? '',
  };
}

const RATE_LIMIT_BATCH = 8;

function pct(n: number, total: number) {
  return total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`;
}

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

async function checkWorkerRunning() {
  try {
    const resp = await fetch(`${BASE_URL}/api/pairs?limit=1`);
    if (!resp.ok) throw new Error(`status ${resp.status}`);
  } catch {
    console.error(`\n✗ Cannot reach Worker at ${BASE_URL}`);
    console.error(`  Start it with: cd api && npm run dev:${EXPERIMENT === 'repetition' ? 'repetition' : 'frame'}\n`);
    process.exit(1);
  }
}

async function main() {
  console.log(`\nPhonetiq Recognition Eval — Experiment: ${EXPERIMENT}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Fixtures: ${FIXTURES_DIR}\n`);

  await checkWorkerRunning();
  mkdirSync(FIXTURES_DIR, { recursive: true });

  process.stdout.write('Generating WAV fixtures...');
  for (const pair of EVAL_CORPUS) {
    for (const word of [pair.word1, pair.word2]) {
      for (const { name: voice } of pair.voices) {
        const path = wavPath(word, voice, EXPERIMENT);
        if (!existsSync(path)) {
          process.stdout.write(` ${word}(${voice})`);
          generateWav(word, voice, path, EXPERIMENT);
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

        const path = wavPath(targetWord, voice, EXPERIMENT);
        requestCount += 1;
        try {
          const { matchType, matchedWord } = await recognize(path, pair.word1, pair.word2, pair.dialect, EXPERIMENT);
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

import { spawn } from 'node:child_process';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type SupportedAudioDialect = 'en-US' | 'en-GB' | 'en-AU';
export type VoiceLabel = 'default';

const GOOGLE_TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const DIALECTS: SupportedAudioDialect[] = ['en-US', 'en-GB', 'en-AU'];
const DEFAULT_VOICES: Record<SupportedAudioDialect, string> = {
  'en-US': 'en-US-Standard-A',
  'en-GB': 'en-GB-Standard-A',
  'en-AU': 'en-AU-Standard-A',
};
const D1_WORD_QUERY =
  "SELECT DISTINCT word FROM (SELECT word1 AS word FROM word_pairs UNION SELECT word2 AS word FROM word_pairs) ORDER BY word;";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = path.join(projectRoot, 'api');
const audioCacheDir = path.join(projectRoot, '.audio-cache');
const defaultVoiceLabel: VoiceLabel = 'default';
const apiRequire = createRequire(path.join(apiDir, 'package.json'));

export function sanitizeWord(value: string) {
  return value.toLowerCase().trim().replace(/'/g, '').replace(/\s+/g, '-');
}

export function getDefaultVoiceForDialect(dialect: SupportedAudioDialect) {
  return DEFAULT_VOICES[dialect];
}

export function buildAssetKey(dialect: SupportedAudioDialect, voiceLabel: VoiceLabel, word: string) {
  return `${dialect.toLowerCase()}/${voiceLabel}/${sanitizeWord(word)}.m4a`;
}

function parseArgs(argv: string[]) {
  const dialectsArg = argv.find((arg) => arg.startsWith('--dialects='));
  const parsedDialects = dialectsArg
    ? dialectsArg
        .slice('--dialects='.length)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean) as SupportedAudioDialect[]
    : DIALECTS;

  return {
    dialects: parsedDialects,
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    upload: argv.includes('--upload'),
    remote: argv.includes('--remote'),
  };
}

async function loadApiEnvFile() {
  const envPath = path.join(apiDir, '.env');

  if (!existsSync(envPath)) return;

  const envFile = await readFile(envPath, 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.trim().replace(/^['"]|['"]$/g, '');
    process.env[key] ??= value;
  }
}

async function runCommand(command: string, args: string[], options: { cwd?: string } = {}) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      reject(new Error(stderr || `${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}`));
    });
  });
}

async function listWordsFromD1(remote: boolean) {
  const stdout = await runCommand(
    'npx',
    ['wrangler', 'd1', 'execute', 'phonetiq-db', remote ? '--remote' : '--local', `--command=${D1_WORD_QUERY}`, '--json'],
    { cwd: apiDir },
  );

  const parsed = JSON.parse(stdout) as Array<{ results?: Array<{ word: string }> }>;
  return (parsed[0]?.results ?? []).map((row) => row.word);
}

async function getAccessToken() {
  const { GoogleAuth } = apiRequire('google-auth-library') as { GoogleAuth: new (options: unknown) => { getClient: () => Promise<{ getAccessToken: () => Promise<{ token?: string | null }> }> } };
  const auth = process.env.GOOGLE_CREDENTIALS_JSON
    ? new GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON),
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      })
    : new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;
  if (!token) {
    throw new Error('Failed to obtain Google Cloud access token. Set GOOGLE_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS.');
  }

  return token;
}

async function synthesizeWordToMp3(word: string, dialect: SupportedAudioDialect, voiceName: string) {
  const token = await getAccessToken();
  const response = await fetch(GOOGLE_TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      input: { text: word },
      voice: {
        languageCode: dialect,
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: 'MP3',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Google TTS request failed (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { audioContent?: string };
  if (!data.audioContent) {
    throw new Error(`Google TTS returned no audioContent for "${word}" (${dialect}).`);
  }

  return Buffer.from(data.audioContent, 'base64');
}

async function ensureFfmpeg() {
  await runCommand('ffmpeg', ['-version']);
}

async function transcodeMp3ToM4a(mp3Path: string, m4aPath: string) {
  await runCommand('ffmpeg', ['-y', '-i', mp3Path, '-c:a', 'aac', '-b:a', '128k', m4aPath]);
}

async function uploadToR2(key: string, filePath: string, remote: boolean) {
  const args = ['wrangler', 'r2', 'object', 'put', `phonetiq-audio/${key}`, `--file=${filePath}`];
  args.push(remote ? '--remote' : '--local');
  await runCommand('npx', args, { cwd: apiDir });
}

async function fileExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function generateAsset(word: string, dialect: SupportedAudioDialect, voiceLabel: VoiceLabel, force: boolean, upload: boolean, remote: boolean) {
  const key = buildAssetKey(dialect, voiceLabel, word);
  const outputPath = path.join(audioCacheDir, key);

  if (!force && (await fileExists(outputPath))) {
    if (upload) {
      await uploadToR2(key, outputPath, remote);
    }
    return { key, skipped: true, uploaded: upload };
  }

  const voiceName = getDefaultVoiceForDialect(dialect);
  await mkdir(path.dirname(outputPath), { recursive: true });

  const tempMp3Path = outputPath.replace(/\.m4a$/, '.mp3');
  const audioBuffer = await synthesizeWordToMp3(word, dialect, voiceName);
  await writeFile(tempMp3Path, audioBuffer);
  await transcodeMp3ToM4a(tempMp3Path, outputPath);
  await rm(tempMp3Path, { force: true });

  if (upload) {
    await uploadToR2(key, outputPath, remote);
  }

  return { key, skipped: false, uploaded: upload };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await loadApiEnvFile();

  if (options.dialects.length === 0) {
    throw new Error('No dialects selected. Use --dialects=en-US,en-GB,en-AU');
  }

  const words = await listWordsFromD1(options.remote);

  if (options.dryRun) {
    for (const dialect of options.dialects) {
      for (const word of words) {
        console.log(buildAssetKey(dialect, defaultVoiceLabel, word));
      }
    }
    return;
  }

  await ensureFfmpeg();

  let generated = 0;
  let skipped = 0;
  for (const dialect of options.dialects) {
    for (const word of words) {
      const result = await generateAsset(
        word,
        dialect,
        defaultVoiceLabel,
        options.force,
        options.upload,
        options.remote,
      );
      if (result.skipped) {
        skipped += 1;
      } else {
        generated += 1;
      }
      console.log(`${result.skipped ? 'SKIP' : 'GEN '} ${result.key}`);
    }
  }

  console.log(`Done: ${generated} generated, ${skipped} skipped.`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

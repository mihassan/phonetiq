import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '../..');

const docsToCheck = [
  'README.md',
  'PROJECT.md',
  'AGENTS.md',
  'api/AGENTS.md',
];

function readRepoFile(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function extractNpmRunCommands(markdown: string) {
  const commands = new Set<string>();
  const pattern = /npm run ([A-Za-z0-9:_-]+)/g;
  let match: RegExpExecArray | null = pattern.exec(markdown);

  while (match) {
    commands.add(match[1]);
    match = pattern.exec(markdown);
  }

  return [...commands];
}

describe('documentation command contracts', () => {
  it('keeps npm-run commands in docs aligned with package scripts', () => {
    const apiScripts = Object.keys(JSON.parse(readRepoFile('api/package.json')).scripts ?? {});
    const webScripts = Object.keys(JSON.parse(readRepoFile('web/package.json')).scripts ?? {});
    const knownScripts = new Set([...apiScripts, ...webScripts]);

    const missing: string[] = [];

    for (const docPath of docsToCheck) {
      const commands = extractNpmRunCommands(readRepoFile(docPath));

      for (const command of commands) {
        if (!knownScripts.has(command)) {
          missing.push(`${docPath}: npm run ${command}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it('uses the npm wrangler wrapper for D1/R2 commands in docs', () => {
    const docs = ['README.md', 'PROJECT.md'].map((docPath) => readRepoFile(docPath));
    const forbiddenPattern = /\bnpx wrangler\s+(d1|r2)\b/;

    for (const markdown of docs) {
      expect(forbiddenPattern.test(markdown)).toBe(false);
    }
  });
});

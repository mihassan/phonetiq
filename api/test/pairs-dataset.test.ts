import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const seedSql = readFileSync(path.resolve(testDir, '../src/db/seed.sql'), 'utf8');
const schemaSource = readFileSync(path.resolve(testDir, '../src/db/schema.ts'), 'utf8');

const rows = [...seedSql.matchAll(/\('.*?', '.*?', '.*?', '.*?', '(all|uk_only|us_only|au_only)', (\d)\)/g)];

describe('seed curriculum dataset', () => {
  it('contains at least 400 seeded word pairs', () => {
    expect(rows.length).toBeGreaterThanOrEqual(400);
  });

  it('includes common plus dialect-specific coverage for UK, US, and AU', () => {
    const dialectCounts = rows.reduce<Record<string, number>>((acc, match) => {
      const dialect = match[1];
      acc[dialect] = (acc[dialect] ?? 0) + 1;
      return acc;
    }, {});

    expect(dialectCounts.all).toBeGreaterThan(0);
    expect(dialectCounts.uk_only).toBeGreaterThan(0);
    expect(dialectCounts.us_only).toBeGreaterThan(0);
    expect(dialectCounts.au_only).toBeGreaterThanOrEqual(10);
  });

  it('extends the curriculum to difficulty level 3 or higher', () => {
    const maxDifficulty = Math.max(...rows.map((match) => Number(match[2])));
    expect(maxDifficulty).toBeGreaterThanOrEqual(3);
  });

  it('keeps the schema AU-ready for au_only rows', () => {
    expect(schemaSource).toContain("dialectFilter: text('dialect_filter')");
  });
});

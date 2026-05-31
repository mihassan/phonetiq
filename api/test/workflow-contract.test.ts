import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '../..');

function readRepoFile(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('deployment workflow contracts', () => {
  it('keeps API deploy workflow scoped to api paths and api working directory', () => {
    const workflow = readRepoFile('.github/workflows/deploy-api.yml');

    expect(workflow).toMatch(/paths:\s*[\s\S]*-\s*'api\/\*\*'/);
    expect(workflow).toMatch(/node-version:\s*'24'/);
    expect(workflow).toMatch(/working-directory:\s*api/);
    expect(workflow).toMatch(/d1 migrations apply phonetiq-db --remote/);
    expect(workflow).toMatch(/Verify remote D1 schema/);
    expect(workflow).toMatch(/PRAGMA table_info\(user_progress\)/);
    expect(workflow).toMatch(/workingDirectory:\s*'api'/);
  });

  it('keeps web deploy workflow scoped to web paths and web build/deploy settings', () => {
    const workflow = readRepoFile('.github/workflows/deploy-web.yml');

    expect(workflow).toMatch(/paths:\s*[\s\S]*-\s*'web\/\*\*'/);
    expect(workflow).toMatch(/node-version:\s*'24'/);
    expect(workflow).toMatch(/run:\s*npm run build[\s\S]*working-directory:\s*web/);
    expect(workflow).toMatch(/VITE_API_URL:\s*https:\/\/api\.phonetiq\.mihassan\.com/);
    expect(workflow).toMatch(/command:\s*pages deploy dist --project-name phonetiq/);
    expect(workflow).toMatch(/workingDirectory:\s*'web'/);
  });

  it('keeps CI workflow validating local D1 migrations and schema for API changes', () => {
    const workflow = readRepoFile('.github/workflows/ci.yml');

    expect(workflow).toMatch(/name:\s*CI/);
    expect(workflow).toMatch(/d1 migrations apply phonetiq-db --local/);
    expect(workflow).toMatch(/Verify migrated D1 schema/);
    expect(workflow).toMatch(/sqlite_master/);
    expect(workflow).toMatch(/target_dialect/);
  });
});

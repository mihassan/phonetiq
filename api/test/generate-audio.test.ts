import { describe, expect, it, vi } from 'vitest';
import {
  buildAssetKey,
  getDefaultVoiceForDialect,
  sanitizeWord,
} from '../../scripts/generate-audio';

vi.stubGlobal('window', {
  location: {
    origin: 'http://localhost:3000',
  },
});

describe('sanitizeWord', () => {
  it('lowercases, removes apostrophes, and replaces spaces with hyphens', () => {
    expect(sanitizeWord("Who'd There")).toBe('whod-there');
  });
});

describe('getDefaultVoiceForDialect', () => {
  it('returns a configured default voice for each supported dialect', () => {
    expect(getDefaultVoiceForDialect('en-US')).toBeTruthy();
    expect(getDefaultVoiceForDialect('en-GB')).toBeTruthy();
    expect(getDefaultVoiceForDialect('en-AU')).toBeTruthy();
  });
});

describe('buildAssetKey', () => {
  it('builds the R2 asset key from dialect, voice label, and sanitized word', () => {
    expect(buildAssetKey('en-AU', 'default', "Who'd")).toBe('en-au/default/whod.m4a');
  });
});

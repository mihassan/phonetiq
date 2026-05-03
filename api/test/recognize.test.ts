import { describe, it, expect } from 'vitest';
import {
  buildDialectPrompt,
  buildInitialPrompt,
  matchTranscriptToCandidates,
} from '../src/routes/recognize';

describe('buildDialectPrompt', () => {
  it('returns UK prompt for uk_only', () => {
    expect(buildDialectPrompt('uk_only')).toContain('British English');
  });

  it('returns US prompt for us_only', () => {
    expect(buildDialectPrompt('us_only')).toContain('American English');
  });

  it('returns AU prompt for au_only', () => {
    expect(buildDialectPrompt('au_only')).toContain('Australian English');
  });

  it('returns common-international prompt by default', () => {
    expect(buildDialectPrompt(undefined)).toContain('common international English');
    expect(buildDialectPrompt('all')).toContain('common international English');
  });
});

describe('buildInitialPrompt — F1 (drop biasing prompt)', () => {
  it('legacy mode includes the candidate-biasing clause', () => {
    const prompt = buildInitialPrompt('all', 'desert', 'dessert', false);
    expect(prompt).toContain('The expected options are: desert or dessert.');
  });

  it('foundation-v2 mode strips the candidate-biasing clause', () => {
    const prompt = buildInitialPrompt('all', 'desert', 'dessert', true);
    expect(prompt).not.toContain('expected options');
    expect(prompt).not.toContain('desert');
    expect(prompt).not.toContain('dessert');
  });

  it('foundation-v2 mode preserves dialect prompt', () => {
    const prompt = buildInitialPrompt('uk_only', 'desert', 'dessert', true);
    expect(prompt).toContain('British English');
  });

  it('legacy mode without candidates falls back to dialect-only prompt', () => {
    const prompt = buildInitialPrompt('all', undefined, undefined, false);
    expect(prompt).not.toContain('expected options');
  });

  it('legacy mode with only one candidate also falls back to dialect-only prompt', () => {
    const prompt = buildInitialPrompt('all', 'desert', undefined, false);
    expect(prompt).not.toContain('expected options');
  });
});

describe('matchTranscriptToCandidates', () => {
  describe('strict mode (foundation-v2 enabled)', () => {
    it('returns exact match when transcript equals candidate1', () => {
      const result = matchTranscriptToCandidates('desert', 'desert', 'dessert', true);
      expect(result.matchType).toBe('exact');
      expect(result.matchedWord).toBe('desert');
    });

    it('returns exact match regardless of candidate order', () => {
      const result = matchTranscriptToCandidates('desert', 'dessert', 'desert', true);
      expect(result.matchType).toBe('exact');
      expect(result.matchedWord).toBe('desert');
    });

    it('returns no_match for edit-distance-1 transcripts (rejects fuzzy)', () => {
      const result = matchTranscriptToCandidates('deserts', 'desert', 'dessert', true);
      expect(result.matchType).toBe('no_match');
      expect(result.matchedWord).toBeNull();
    });

    it('still accepts token match for multi-word transcripts', () => {
      const result = matchTranscriptToCandidates('the desert', 'desert', 'dessert', true);
      expect(result.matchType).toBe('token');
      expect(result.matchedWord).toBe('desert');
    });

    it('returns no_match when both candidates appear as tokens', () => {
      const result = matchTranscriptToCandidates(
        'desert and dessert',
        'desert',
        'dessert',
        true,
      );
      expect(result.matchType).toBe('no_match');
    });
  });

  describe('legacy mode (foundation-v2 disabled)', () => {
    it('preserves fuzzy match for edit-distance-1 transcripts', () => {
      const result = matchTranscriptToCandidates('deserts', 'desert', 'dessert', false);
      expect(result.matchType).toBe('fuzzy');
      expect(result.matchedWord).toBe('desert');
    });

    it('still returns exact when transcript matches a candidate exactly', () => {
      const result = matchTranscriptToCandidates('dessert', 'desert', 'dessert', false);
      expect(result.matchType).toBe('exact');
      expect(result.matchedWord).toBe('dessert');
    });
  });

  describe('shared behavior (both modes)', () => {
    it('returns freeform when candidates are missing', () => {
      const result = matchTranscriptToCandidates('anything', undefined, undefined, true);
      expect(result.matchType).toBe('freeform');
      expect(result.matchedWord).toBeNull();
    });

    it('returns no_match for empty transcript', () => {
      const result = matchTranscriptToCandidates('', 'desert', 'dessert', true);
      expect(result.matchType).toBe('no_match');
    });

    it('normalizes punctuation and capitalization', () => {
      const result = matchTranscriptToCandidates('Desert.', 'desert', 'dessert', true);
      expect(result.matchType).toBe('exact');
      expect(result.matchedWord).toBe('desert');
    });

    it('exposes strict flag in debug payload', () => {
      const strict = matchTranscriptToCandidates('desert', 'desert', 'dessert', true);
      const legacy = matchTranscriptToCandidates('desert', 'desert', 'dessert', false);
      expect(strict.debug.strict).toBe(true);
      expect(legacy.debug.strict).toBe(false);
    });
  });
});

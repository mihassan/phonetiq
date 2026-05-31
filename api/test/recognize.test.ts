import { describe, it, expect } from 'vitest';
import {
  buildDialectPrompt,
  buildInitialPrompt,
  matchTranscriptToCandidates,
  extractFrameWord,
  matchFrameSentence,
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

  it('defaults to American English when dialect is missing or legacy', () => {
    expect(buildDialectPrompt(undefined)).toContain('American English');
    expect(buildDialectPrompt('all')).toContain('American English');
  });
});

describe('buildInitialPrompt', () => {
  it('includes the candidate-biasing clause when both candidates are provided', () => {
    const prompt = buildInitialPrompt('us_only', 'desert', 'dessert');
    expect(prompt).toContain('The expected options are: desert or dessert.');
  });

  it('falls back to dialect-only prompt when candidates are missing', () => {
    expect(buildInitialPrompt('us_only', undefined, undefined)).not.toContain('expected options');
    expect(buildInitialPrompt('us_only', 'desert', undefined)).not.toContain('expected options');
  });
});

describe('matchTranscriptToCandidates', () => {
  it('returns exact match when transcript equals candidate1', () => {
    const result = matchTranscriptToCandidates('desert', 'desert', 'dessert', 'us_only');
    expect(result.matchType).toBe('exact');
    expect(result.matchedWord).toBe('desert');
  });

  it('returns token match for multi-word transcript', () => {
    const result = matchTranscriptToCandidates('the desert', 'desert', 'dessert', 'us_only');
    expect(result.matchType).toBe('token');
    expect(result.matchedWord).toBe('desert');
  });

  it('preserves fuzzy match for edit-distance-1 transcripts', () => {
    const result = matchTranscriptToCandidates('deserts', 'desert', 'dessert', 'us_only');
    expect(result.matchType).toBe('fuzzy');
    expect(result.matchedWord).toBe('desert');
  });

  it('returns freeform when candidates are missing', () => {
    const result = matchTranscriptToCandidates('anything', undefined, undefined, 'us_only');
    expect(result.matchType).toBe('freeform');
    expect(result.matchedWord).toBeNull();
  });

  it('accepts an AU-specific spelling alias for supported pilot pairs', () => {
    const result = matchTranscriptToCandidates('pair', 'peer', 'pear', 'au_only');
    expect(result.matchType).toBe('fuzzy');
    expect(result.matchedWord).toBe('pear');
    expect(result.debug.matchedRuleTag).toBe('au_only:vowel_long:peer-pear-spelling');
    expect(result.debug.matchedBy).toBe('dialect_alias_exact');
  });

  it('keeps alias lookup order-insensitive for the same supported pair', () => {
    const result = matchTranscriptToCandidates('boar', 'bore', 'bar', 'us_only');
    expect(result.matchType).toBe('fuzzy');
    expect(result.matchedWord).toBe('bore');
    expect(result.debug.matchedRuleTag).toBe('us_only:vowel_long:bar-bore-spelling');
  });

  it('does not apply another dialects alias profile', () => {
    const result = matchTranscriptToCandidates('pair', 'peer', 'pear', 'us_only');
    expect(result.matchType).toBe('no_match');
    expect(result.matchedWord).toBeNull();
    expect(result.debug.availableRuleTags).toEqual([]);
  });

  it('does not widen matching for weak US merger pilot pairs', () => {
    const result = matchTranscriptToCandidates('bawl', 'bowl', 'ball', 'us_only');
    expect(result.matchType).toBe('no_match');
    expect(result.matchedWord).toBeNull();
    expect(result.debug.availableRuleTags).toEqual([]);
  });
});

describe('extractFrameWord', () => {
  it('extracts word after "the word is"', () => {
    expect(extractFrameWord('the word is desert')).toBe('desert');
  });

  it('is case-insensitive and handles punctuation', () => {
    expect(extractFrameWord('The Word Is Desert.')).toBe('desert');
  });

  it('returns null when frame is absent', () => {
    expect(extractFrameWord('desert desert desert')).toBeNull();
  });
});

describe('matchFrameSentence', () => {
  it('resolves to candidate1 via exact match after extraction', () => {
    const r = matchFrameSentence('the word is ship', 'ship', 'sheep', 'us_only');
    expect(r.matchedWord).toBe('ship');
    expect(r.matchType).toBe('exact');
  });

  it('resolves to candidate2 via exact match after extraction', () => {
    const r = matchFrameSentence('The word is sheep.', 'ship', 'sheep', 'us_only');
    expect(r.matchedWord).toBe('sheep');
  });

  it('returns no_match when frame is absent', () => {
    const r = matchFrameSentence('I said sheep', 'ship', 'sheep', 'us_only');
    expect(r.matchedWord).toBeNull();
    expect(r.matchType).toBe('no_match');
  });

  it('threads dialect through the frame matcher for AU-specific aliases', () => {
    const matched = matchFrameSentence('The word is pair.', 'peer', 'pear', 'au_only');
    expect(matched.matchedWord).toBe('pear');
    expect(matched.matchType).toBe('fuzzy');
    expect(matched.debug.matchedRuleTag).toBe('au_only:vowel_long:peer-pear-spelling');

    const rejected = matchFrameSentence('The word is pair.', 'peer', 'pear', 'us_only');
    expect(rejected.matchedWord).toBeNull();
    expect(rejected.matchType).toBe('no_match');
  });
});

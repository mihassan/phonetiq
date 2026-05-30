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

  it('returns common-international prompt by default', () => {
    expect(buildDialectPrompt(undefined)).toContain('common international English');
    expect(buildDialectPrompt('all')).toContain('common international English');
  });
});

describe('buildInitialPrompt', () => {
  it('includes the candidate-biasing clause when both candidates are provided', () => {
    const prompt = buildInitialPrompt('all', 'desert', 'dessert');
    expect(prompt).toContain('The expected options are: desert or dessert.');
  });

  it('falls back to dialect-only prompt when candidates are missing', () => {
    expect(buildInitialPrompt('all', undefined, undefined)).not.toContain('expected options');
    expect(buildInitialPrompt('all', 'desert', undefined)).not.toContain('expected options');
  });
});

describe('matchTranscriptToCandidates', () => {
  it('returns exact match when transcript equals candidate1', () => {
    const result = matchTranscriptToCandidates('desert', 'desert', 'dessert');
    expect(result.matchType).toBe('exact');
    expect(result.matchedWord).toBe('desert');
  });

  it('returns token match for multi-word transcript', () => {
    const result = matchTranscriptToCandidates('the desert', 'desert', 'dessert');
    expect(result.matchType).toBe('token');
    expect(result.matchedWord).toBe('desert');
  });

  it('preserves fuzzy match for edit-distance-1 transcripts', () => {
    const result = matchTranscriptToCandidates('deserts', 'desert', 'dessert');
    expect(result.matchType).toBe('fuzzy');
    expect(result.matchedWord).toBe('desert');
  });

  it('returns freeform when candidates are missing', () => {
    const result = matchTranscriptToCandidates('anything', undefined, undefined);
    expect(result.matchType).toBe('freeform');
    expect(result.matchedWord).toBeNull();
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
    const r = matchFrameSentence('the word is ship', 'ship', 'sheep');
    expect(r.matchedWord).toBe('ship');
    expect(r.matchType).toBe('exact');
  });

  it('resolves to candidate2 via exact match after extraction', () => {
    const r = matchFrameSentence('The word is sheep.', 'ship', 'sheep');
    expect(r.matchedWord).toBe('sheep');
  });

  it('returns no_match when frame is absent', () => {
    const r = matchFrameSentence('I said sheep', 'ship', 'sheep');
    expect(r.matchedWord).toBeNull();
    expect(r.matchType).toBe('no_match');
  });
});

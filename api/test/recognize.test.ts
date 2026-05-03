import { describe, it, expect } from 'vitest';
import {
  buildDialectPrompt,
  buildInitialPrompt,
  matchTranscriptToCandidates,
  buildTwoPassPrompt,
  extractFirstContentWord,
  runTwoPassRecognition,
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

describe('buildTwoPassPrompt', () => {
  it('includes the dialect prompt verbatim', () => {
    const dialectPrompt = 'The speaker will say one short English word in British English.';
    const result = buildTwoPassPrompt(dialectPrompt, 'desert');
    expect(result).toContain(dialectPrompt);
  });

  it('includes "The speaker said the word X" phrasing', () => {
    const result = buildTwoPassPrompt('Dialect.', 'dessert');
    expect(result).toContain('The speaker said the word dessert');
  });
});

describe('extractFirstContentWord', () => {
  it('returns the single word from a one-word transcript', () => {
    expect(extractFirstContentWord('desert')).toBe('desert');
  });

  it('skips stopwords and returns the first content word', () => {
    expect(extractFirstContentWord('The word is desert')).toBe('desert');
  });

  it('handles punctuation via normalizeText', () => {
    expect(extractFirstContentWord('Desert.')).toBe('desert');
  });

  it('returns empty string for empty input', () => {
    expect(extractFirstContentWord('')).toBe('');
  });

  it('returns first token when all tokens are stopwords', () => {
    expect(extractFirstContentWord('the a an')).toBe('the');
  });
});

describe('runTwoPassRecognition', () => {
  function makeAi(transcriptA: string, transcriptB: string): Ai {
    let callCount = 0;
    return {
      run: () => {
        callCount += 1;
        return Promise.resolve({ text: callCount === 1 ? transcriptA : transcriptB });
      },
    } as unknown as Ai;
  }

  it('returns candidate1 when both passes agree on candidate1', async () => {
    const ai = makeAi('desert', 'desert');
    const result = await runTwoPassRecognition(ai, '', 'Dialect.', 'desert', 'dessert');
    expect(result.matchResult.matchedWord).toBe('desert');
    expect(result.matchResult.matchType).toBe('token');
  });

  it('returns candidate2 when both passes agree on candidate2', async () => {
    const ai = makeAi('dessert', 'dessert');
    const result = await runTwoPassRecognition(ai, '', 'Dialect.', 'desert', 'dessert');
    expect(result.matchResult.matchedWord).toBe('dessert');
    expect(result.matchResult.matchType).toBe('token');
  });

  it('returns no_match when passes disagree', async () => {
    const ai = makeAi('desert', 'dessert');
    const result = await runTwoPassRecognition(ai, '', 'Dialect.', 'desert', 'dessert');
    expect(result.matchResult.matchedWord).toBeNull();
    expect(result.matchResult.matchType).toBe('no_match');
  });

  it('returns no_match when both passes return unknown word', async () => {
    const ai = makeAi('something', 'else');
    const result = await runTwoPassRecognition(ai, '', 'Dialect.', 'desert', 'dessert');
    expect(result.matchResult.matchedWord).toBeNull();
    expect(result.matchResult.matchType).toBe('no_match');
  });

  it('exposes passAWord and passBWord in the result', async () => {
    const ai = makeAi('desert', 'desert');
    const result = await runTwoPassRecognition(ai, '', 'Dialect.', 'desert', 'dessert');
    expect(result.passAWord).toBe('desert');
    expect(result.passBWord).toBe('desert');
  });

  it('sets twoPass: true in debug', async () => {
    const ai = makeAi('desert', 'desert');
    const result = await runTwoPassRecognition(ai, '', 'Dialect.', 'desert', 'dessert');
    expect(result.matchResult.debug.twoPass).toBe(true);
  });
});

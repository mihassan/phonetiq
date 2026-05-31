import { describe, expect, it } from 'vitest';
import { getDialectContrastCopy, getDialectRecognitionRuleCopy } from './dialectFeedback';

describe('dialectFeedback', () => {
  it('builds a weak-contrast notice for the selected dialect', () => {
    expect(
      getDialectContrastCopy(
        {
          contrast_strength: 'weak',
          contrast_note: 'The /ɔ/ side is weakened for many American speakers.',
        },
        'us_only',
      ),
    ).toEqual({
      eyebrow: 'Subtle contrast · US',
      title: 'This contrast is weaker in American English.',
      detail: 'The /ɔ/ side is weakened for many American speakers.',
      tone: 'weak',
    });
  });

  it('returns null for supported pairs with no note', () => {
    expect(
      getDialectContrastCopy(
        {
          contrast_strength: 'supported',
          contrast_note: null,
        },
        'au_only',
      ),
    ).toBeNull();
  });

  it('builds a supported note when pilot metadata includes one', () => {
    expect(
      getDialectContrastCopy(
        {
          contrast_strength: 'supported',
          contrast_note: 'AU pilot contrast set for /e/ vs /æ/ and /ɪə/ vs /eː/.',
        },
        'au_only',
      ),
    ).toEqual({
      eyebrow: 'Dialect note · AU',
      title: 'This contrast is supported in Australian English.',
      detail: 'AU pilot contrast set for /e/ vs /æ/ and /ɪə/ vs /eː/.',
      tone: 'supported',
    });
  });

  it('builds a readable dev note for dialect alias matches', () => {
    expect(
      getDialectRecognitionRuleCopy(
        {
          matchedBy: 'dialect_alias_exact',
          matchedRuleTag: 'au_only:vowel_long:peer-pear-spelling',
        },
        'au_only',
      ),
    ).toBe('Debug: matched using an Australian English pilot spelling alias.');
  });

  it('ignores non-alias matching debug info', () => {
    expect(
      getDialectRecognitionRuleCopy(
        {
          matchedBy: 'fuzzy',
          matchedRuleTag: 'au_only:vowel_long:peer-pear-spelling',
        },
        'au_only',
      ),
    ).toBeNull();
  });
});

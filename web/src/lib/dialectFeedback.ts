import type { RecognizeMatchingDebug } from './api';
import { getDialectProfile } from './dialects';
import type { Dialect, WordPair } from './types';

export interface DialectContrastCopy {
  eyebrow: string;
  title: string;
  detail: string;
  tone: 'supported' | 'weak' | 'unavailable';
}

export function getDialectContrastCopy(
  pair: Pick<WordPair, 'contrast_strength' | 'contrast_note'> | null | undefined,
  dialect: Dialect,
): DialectContrastCopy | null {
  if (!pair) return null;

  const profile = getDialectProfile(dialect);
  const note = pair.contrast_note?.trim() ?? '';

  switch (pair.contrast_strength) {
    case 'weak':
      return {
        eyebrow: `Subtle contrast · ${profile.shortLabel}`,
        title: `This contrast is weaker in ${profile.label}.`,
        detail:
          note ||
          'Some speakers pronounce this family more similarly, so treat it as a lighter pilot contrast.',
        tone: 'weak',
      };
    case 'unavailable':
      return {
        eyebrow: `Pilot availability · ${profile.shortLabel}`,
        title: `This contrast is not in the ${profile.label} pilot yet.`,
        detail:
          note ||
          'We are not serving this contrast for the current dialect because the pilot set is still incomplete.',
        tone: 'unavailable',
      };
    case 'supported':
      if (!note) return null;
      return {
        eyebrow: `Dialect note · ${profile.shortLabel}`,
        title: `This contrast is supported in ${profile.label}.`,
        detail: note,
        tone: 'supported',
      };
    default:
      return note
        ? {
            eyebrow: `Dialect note · ${profile.shortLabel}`,
            title: `Current note for ${profile.label}.`,
            detail: note,
            tone: 'supported',
          }
        : null;
  }
}

function getIndefiniteArticle(label: string) {
  return /^[aeiou]/i.test(label) ? 'an' : 'a';
}

export function getDialectRecognitionRuleCopy(
  matching: RecognizeMatchingDebug | null | undefined,
  dialect: Dialect,
) {
  if (!matching?.matchedRuleTag || !matching.matchedBy?.startsWith('dialect_alias')) {
    return null;
  }

  const profile = getDialectProfile(dialect);
  const article = getIndefiniteArticle(profile.label);

  if (matching.matchedBy === 'dialect_alias_token') {
    return `Debug: matched using ${article} ${profile.label} pilot alias inside the sentence.`;
  }

  return `Debug: matched using ${article} ${profile.label} pilot spelling alias.`;
}

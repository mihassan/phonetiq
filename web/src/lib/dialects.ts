import type { AudioDialect, Dialect, TargetDialect } from './types';

export interface DialectProfile {
  id: TargetDialect;
  label: string;
  shortLabel: string;
  audioDialect: AudioDialect;
}

export const DEFAULT_TARGET_DIALECT: TargetDialect = 'us_only';

export const DIALECT_PROFILES: Record<TargetDialect, DialectProfile> = {
  us_only: {
    id: 'us_only',
    label: 'American English',
    shortLabel: 'US',
    audioDialect: 'en-US',
  },
  uk_only: {
    id: 'uk_only',
    label: 'British English',
    shortLabel: 'UK',
    audioDialect: 'en-GB',
  },
  au_only: {
    id: 'au_only',
    label: 'Australian English',
    shortLabel: 'AU',
    audioDialect: 'en-AU',
  },
};

export const TARGET_DIALECT_OPTIONS = Object.values(DIALECT_PROFILES);

export function isTargetDialect(value: string | null | undefined): value is TargetDialect {
  return value === 'us_only' || value === 'uk_only' || value === 'au_only';
}

export function coerceTargetDialect(value: string | null | undefined): Dialect {
  return isTargetDialect(value) ? value : DEFAULT_TARGET_DIALECT;
}

export function getDialectProfile(dialect: Dialect): DialectProfile {
  return DIALECT_PROFILES[dialect];
}

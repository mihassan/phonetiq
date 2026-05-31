export type ContentDialect = 'all' | 'uk_only' | 'us_only' | 'au_only';

export type TargetDialect = Exclude<ContentDialect, 'all'>;

export const DEFAULT_TARGET_DIALECT: TargetDialect = 'us_only';

const DIALECT_PROMPTS: Record<TargetDialect, string> = {
  us_only: 'American English',
  uk_only: 'British English',
  au_only: 'Australian English',
};

export function isTargetDialect(value: string | null | undefined): value is TargetDialect {
  return value === 'us_only' || value === 'uk_only' || value === 'au_only';
}

export function coerceTargetDialect(value: string | null | undefined): TargetDialect {
  return isTargetDialect(value) ? value : DEFAULT_TARGET_DIALECT;
}

export function getDialectPromptLabel(dialect: TargetDialect): string {
  return DIALECT_PROMPTS[dialect];
}

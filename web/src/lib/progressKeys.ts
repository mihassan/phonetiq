import { coerceTargetDialect } from './dialects';
import type { PairProgress, ProgressStore } from './types';

export function getPairProgressKey(pairId: number, dialect: string | null | undefined) {
  return `${pairId}:${coerceTargetDialect(dialect)}`;
}

export function getPairProgress(
  store: ProgressStore,
  pairId: number,
  dialect: string | null | undefined,
): PairProgress | undefined {
  return store.pairs[getPairProgressKey(pairId, dialect)];
}

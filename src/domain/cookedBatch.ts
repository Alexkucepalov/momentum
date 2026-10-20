/** Pure helpers for cooked recipe inventory. Never invent remaining. */

export type CookedBatchGrams = {
  remainingG: number;
  initialYieldG: number;
};

function assertFiniteNonNeg(n: number, label: string): void {
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid ${label}`);
}

/**
 * Decrease remaining after logging a portion. Clamps to ≥ 0.
 * Does not invent grams — requires known positive consumeG.
 */
export function decreaseCookedRemaining(
  remainingG: number,
  consumeG: number,
): number {
  assertFiniteNonNeg(remainingG, 'remainingG');
  assertFiniteNonNeg(consumeG, 'consumeG');
  const next = remainingG - consumeG;
  return next < 0 ? 0 : next;
}

/** Pick FIFO active batch id for a recipe (earliest cookedAt). */
export function pickFifoBatchId<T extends { id: string; cookedAt: string; remainingG: number; deletedAt: string | null }>(
  batches: T[],
): string | null {
  const active = batches
    .filter((b) => b.deletedAt === null && b.remainingG > 0)
    .sort((a, b) => a.cookedAt.localeCompare(b.cookedAt));
  return active[0]?.id ?? null;
}

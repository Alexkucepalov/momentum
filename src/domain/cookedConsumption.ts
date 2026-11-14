import type {
  CookedBatch,
  CookedConsumption,
  FoodEntry,
} from "../storage/types";
import { assertNonNegativeFinite } from "../storage/validation";

export const cloneConsumption = (rows: CookedConsumption[]) =>
  rows.map((row) => ({ ...row }));
export function cloneFoodEntry(entry: FoodEntry): FoodEntry {
  return {
    ...entry,
    ...(entry.cookedConsumption === undefined
      ? {}
      : { cookedConsumption: cloneConsumption(entry.cookedConsumption) }),
  };
}
export function validateCookedConsumption(
  value: unknown,
  grams: number,
): asserts value is CookedConsumption[] {
  if (!Array.isArray(value))
    throw new Error("Некорректная связь порции с остатками");
  const ids = new Set<string>();
  let sum = 0;
  for (const part of value) {
    if (
      !part ||
      typeof part !== "object" ||
      typeof part.batchId !== "string" ||
      !part.batchId.trim() ||
      ids.has(part.batchId) ||
      typeof part.grams !== "number" ||
      !Number.isFinite(part.grams) ||
      part.grams <= 0
    )
      throw new Error("Некорректное списание партии");
    ids.add(part.batchId);
    sum += part.grams;
  }
  if (
    !Number.isFinite(sum) ||
    sum > grams + Math.max(1, grams) * Number.EPSILON * 32
  )
    throw new Error("Списание больше массы порции");
}
export function allocateCookedConsumption(
  batches: CookedBatch[],
  recipeId: string,
  grams: number,
): CookedConsumption[] {
  assertNonNegativeFinite(grams, "grams");
  let need = grams;
  const receipt: CookedConsumption[] = [];
  for (const batch of batches
    .filter((b) => b.recipeId === recipeId && !b.deletedAt)
    .sort(
      (a, b) =>
        Date.parse(a.cookedAt) - Date.parse(b.cookedAt) ||
        Date.parse(a.createdAt) - Date.parse(b.createdAt),
    )) {
    assertNonNegativeFinite(batch.remainingG, "remainingG");
    if (need <= 0) break;
    const take = Math.min(need, batch.remainingG);
    if (take > 0) {
      receipt.push({ batchId: batch.id, grams: take });
      need -= take;
    }
  }
  return receipt;
}
export function mergeConsumption(
  ...receipts: CookedConsumption[][]
): CookedConsumption[] {
  const grams = new Map<string, number>();
  for (const receipt of receipts)
    for (const part of receipt)
      grams.set(part.batchId, (grams.get(part.batchId) ?? 0) + part.grams);
  return [...grams]
    .filter(([, g]) => g > 0)
    .map(([batchId, g]) => ({ batchId, grams: g }));
}
/** Compute the complete transition first. Missing/deleted batches are never recreated. */
export function planConsumptionChange(
  batches: CookedBatch[],
  before: CookedConsumption[],
  after: CookedConsumption[],
): Map<string, number> {
  const old = new Map(
    mergeConsumption(before).map((p) => [p.batchId, p.grams]),
  );
  const next = new Map(
    mergeConsumption(after).map((p) => [p.batchId, p.grams]),
  );
  const changes = new Map<string, number>();
  for (const batch of batches) {
    if (batch.deletedAt || (!old.has(batch.id) && !next.has(batch.id)))
      continue;
    const amount =
      batch.remainingG + ((old.get(batch.id) ?? 0) - (next.get(batch.id) ?? 0));
    const epsilon =
      Math.max(
        1,
        batch.remainingG,
        old.get(batch.id) ?? 0,
        next.get(batch.id) ?? 0,
      ) *
      Number.EPSILON *
      32;
    if (!Number.isFinite(amount) || amount < -epsilon)
      throw new Error(
        "Остатки уже изменились. Для этой отмены не хватает доступной партии.",
      );
    const remaining = Math.max(0, amount);
    if (remaining !== batch.remainingG) changes.set(batch.id, remaining);
  }
  return changes;
}

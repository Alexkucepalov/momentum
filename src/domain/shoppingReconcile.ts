/**
 * Reconcile open shopping lines with confirmed purchase quantities.
 * Does not invent coverage: unknown purchase qty → no auto check-off.
 */

import { normalizeShoppingName, type ShoppingUnit } from './aggregateShopping';

export type PurchaseReconcileLine = {
  displayName: string;
  quantity: number | null;
  unit: ShoppingUnit | null;
  excluded: boolean;
  isFood: boolean;
};

export type ShoppingReconcileItem = {
  id: string;
  displayName: string;
  unit: ShoppingUnit;
  needToBuy: number;
  checked: boolean;
};

export type ShoppingReconcilePatch = {
  itemId: string;
  needToBuy: number;
  checked: boolean;
  coveredDelta: number;
};

/**
 * For each shopping item, subtract matching purchase qty (same normalized name + unit).
 * If need drops to 0 → checked. Partial cover reduces needToBuy.
 */
export function reconcileShoppingWithPurchaseLines(
  items: ShoppingReconcileItem[],
  purchaseLines: PurchaseReconcileLine[],
): ShoppingReconcilePatch[] {
  const pool = new Map<string, number>();
  for (const pl of purchaseLines) {
    if (pl.excluded || !pl.isFood) continue;
    if (pl.quantity == null || !Number.isFinite(pl.quantity) || pl.quantity < 0) continue;
    if (pl.unit == null) continue;
    const key = `${normalizeShoppingName(pl.displayName)}|${pl.unit}`;
    pool.set(key, (pool.get(key) ?? 0) + pl.quantity);
  }

  const patches: ShoppingReconcilePatch[] = [];
  for (const item of items) {
    if (item.checked || item.needToBuy <= 0) continue;
    const key = `${normalizeShoppingName(item.displayName)}|${item.unit}`;
    const available = pool.get(key) ?? 0;
    if (available <= 0) continue;
    const used = Math.min(available, item.needToBuy);
    const nextNeed = Math.max(0, item.needToBuy - used);
    pool.set(key, available - used);
    patches.push({
      itemId: item.id,
      needToBuy: nextNeed,
      checked: nextNeed <= 0,
      coveredDelta: used,
    });
  }
  return patches;
}

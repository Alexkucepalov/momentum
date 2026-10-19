import type { FoodEntry, MealSlot } from '../storage/types';

export type RepeatableMealItem =
  | { kind: 'product'; productId: string; grams: number; displayName: string }
  | { kind: 'recipe'; recipeId: string; grams: number; displayName: string };

export type RepeatableDayItem = RepeatableMealItem & { meal: MealSlot };

/**
 * Build one-tap repeat payloads from existing meal entries.
 * Skips soft-deleted-shaped rows and entries without product/recipe link.
 */
export function repeatableFromEntries(entries: FoodEntry[]): RepeatableMealItem[] {
  return repeatableDayFromEntries(entries).map(({ meal: _meal, ...item }) => item);
}

/** Same as repeatableFromEntries but keeps original meal slots (for «вчера → сегодня»). */
export function repeatableDayFromEntries(entries: FoodEntry[]): RepeatableDayItem[] {
  const out: RepeatableDayItem[] = [];
  for (const e of entries) {
    if (e.deletedAt != null) continue;
    if (!(e.grams > 0) || !Number.isFinite(e.grams)) continue;
    if (e.productId) {
      out.push({
        kind: 'product',
        productId: e.productId,
        grams: e.grams,
        displayName: e.displayName,
        meal: e.meal,
      });
      continue;
    }
    if (e.recipeId) {
      out.push({
        kind: 'recipe',
        recipeId: e.recipeId,
        grams: e.grams,
        displayName: e.displayName,
        meal: e.meal,
      });
    }
  }
  return out;
}

export function shiftDateLocal(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

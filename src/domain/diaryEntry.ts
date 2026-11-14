import type { FoodEntry, MealSlot } from "../storage/types";
import { assertNonNegativeFinite } from "../storage/validation";

export const MEALS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];
export const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
  snack: "Перекус",
};
export type EntryDetails = Pick<
  FoodEntry,
  "dateLocal" | "meal" | "grams" | "energyKcal" | "proteinG" | "fatG" | "carbG"
>;
export function entryDetails(entry: FoodEntry): EntryDetails {
  const { dateLocal, meal, grams, energyKcal, proteinG, fatG, carbG } = entry;
  return { dateLocal, meal, grams, energyKcal, proteinG, fatG, carbG };
}
/** A diary edit scales its historical snapshot, never a mutable catalog card. */
export function resizeEntrySnapshot(
  entry: FoodEntry,
  grams: number,
): EntryDetails {
  assertNonNegativeFinite(grams, "grams");
  if (grams === entry.grams) return entryDetails(entry);
  if (!(entry.grams > 0))
    throw new Error(
      "У записи нет исходной массы. Добавь новую порцию из каталога.",
    );
  const factor = grams / entry.grams;
  const scale = (n: number | null) => (n == null ? null : n * factor);
  const next = {
    ...entryDetails(entry),
    grams,
    energyKcal: scale(entry.energyKcal),
    proteinG: scale(entry.proteinG),
    fatG: scale(entry.fatG),
    carbG: scale(entry.carbG),
  };
  for (const value of [next.energyKcal, next.proteinG, next.fatG, next.carbG])
    if (value != null) assertNonNegativeFinite(value, "nutrition");
  return next;
}
export function isQuickEntry(
  entry: Pick<FoodEntry, "productId" | "recipeId">,
): boolean {
  return !entry.productId && !entry.recipeId;
}
export function entryAmountLabel(entry: FoodEntry): string {
  return `${entry.grams.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} ${isQuickEntry(entry) ? "порц." : "г"}`;
}

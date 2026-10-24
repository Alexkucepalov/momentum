/**
 * UX-01 — default portion grams for ConfirmPortionSheet.
 * Prefer last logged portion; never invent nutrition — grams only.
 */

export const DEFAULT_PRODUCT_PORTION_G = 100;
export const DEFAULT_RECIPE_PORTION_CAP_G = 200;

export function defaultProductPortionGrams(lastGrams: number | null | undefined): number {
  if (lastGrams != null && Number.isFinite(lastGrams) && lastGrams > 0) {
    return lastGrams;
  }
  return DEFAULT_PRODUCT_PORTION_G;
}

export function defaultRecipePortionGrams(
  lastGrams: number | null | undefined,
  cookedYieldG: number,
): number {
  if (lastGrams != null && Number.isFinite(lastGrams) && lastGrams > 0) {
    return lastGrams;
  }
  const yieldG =
    Number.isFinite(cookedYieldG) && cookedYieldG > 0 ? cookedYieldG : DEFAULT_RECIPE_PORTION_CAP_G;
  return Math.min(DEFAULT_RECIPE_PORTION_CAP_G, yieldG);
}

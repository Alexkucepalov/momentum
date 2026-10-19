export type Nutrition = { kcal: number | null; protein: number | null; fat: number | null; carbs: number | null };
export type Ingredient = { grams: number; nutritionPer100g: Nutrition };
const keys = ['kcal', 'protein', 'fat', 'carbs'] as const;
function finiteNonNegative(n: number): boolean { return Number.isFinite(n) && n >= 0; }
export function validateNutrition(n: Nutrition): void { for (const k of keys) if (n[k] !== null && !finiteNonNegative(n[k]!)) throw new Error(`Invalid ${k}`); }
export function portion(per100: Nutrition, grams: number): Nutrition {
  if (!finiteNonNegative(grams)) throw new Error('Invalid grams');
  validateNutrition(per100);
  const out = {} as Nutrition;
  for (const k of keys) out[k] = per100[k] === null ? null : per100[k]! * grams / 100;
  return out;
}
export function addNutrition(items: Nutrition[]): Nutrition {
  const out = {} as Nutrition;
  for (const k of keys) out[k] = items.some(i => i[k] === null) ? null : items.reduce((s,i) => s + i[k]!,0);
  return out;
}
export function recipePortion(ingredients: Ingredient[], cookedYieldGrams: number, servedGrams: number): Nutrition {
  if (!Number.isFinite(cookedYieldGrams) || cookedYieldGrams <= 0) throw new Error('Cooked yield must be > 0');
  if (!finiteNonNegative(servedGrams)) throw new Error('Invalid served grams');
  const total = addNutrition(ingredients.map(i => portion(i.nutritionPer100g, i.grams)));
  return portion(total, servedGrams * 100 / cookedYieldGrams);
}

import { portion, recipePortion, type Nutrition } from './nutrition';
import type { Recipe, RecipeIngredient } from '../storage/types';

/**
 * POLICY (Q-05 / Momentum 2.0): single source for recipe KBJU in UI and diary.
 *
 * 1. If the recipe has any user-entered finished per-100g field → use those (portion scale).
 * 2. Else if there are ingredients → derive from ingredient macros + cookedYieldG.
 * 3. Else → all null (unknown ≠ 0). Never invent values; never show raw
 *    `recipe.energyKcalPer100g` alone when ingredients would yield a different number.
 *
 * All list cards, detail, Eat Now, portion sheets, and `addEntryFromRecipe` must use
 * `nutritionForRecipePortion` (or `nutritionPer100gCooked`).
 */
export function recipeHasManualPer100g(recipe: Pick<
  Recipe,
  'energyKcalPer100g' | 'proteinGPer100g' | 'fatGPer100g' | 'carbGPer100g'
>): boolean {
  return (
    recipe.energyKcalPer100g !== null ||
    recipe.proteinGPer100g !== null ||
    recipe.fatGPer100g !== null ||
    recipe.carbGPer100g !== null
  );
}

export function recipeManualPer100g(recipe: Pick<
  Recipe,
  'energyKcalPer100g' | 'proteinGPer100g' | 'fatGPer100g' | 'carbGPer100g'
>): Nutrition {
  return {
    kcal: recipe.energyKcalPer100g,
    protein: recipe.proteinGPer100g,
    fat: recipe.fatGPer100g,
    carbs: recipe.carbGPer100g,
  };
}

/**
 * Resolve nutrition for a served portion.
 * Prefer explicit per-100g on the recipe; otherwise derive from ingredients + cooked yield.
 */
export function nutritionForRecipePortion(
  recipe: Recipe,
  ingredients: RecipeIngredient[],
  servedGrams: number,
): Nutrition {
  if (recipeHasManualPer100g(recipe)) {
    return portion(recipeManualPer100g(recipe), servedGrams);
  }
  if (ingredients.length === 0) {
    return { kcal: null, protein: null, fat: null, carbs: null };
  }
  return recipePortion(
    ingredients.map((i) => ({
      grams: i.rawGrams,
      nutritionPer100g: {
        kcal: i.energyKcal,
        protein: i.proteinG,
        fat: i.fatG,
        carbs: i.carbG,
      },
    })),
    recipe.cookedYieldG,
    servedGrams,
  );
}

/** Display / compare per 100 g cooked — same policy as portion logging. */
export function nutritionPer100gCooked(
  recipe: Recipe,
  ingredients: RecipeIngredient[],
): Nutrition {
  return nutritionForRecipePortion(recipe, ingredients, 100);
}

/** Map domain Nutrition → MacroStrip props. */
export function macrosForStrip(n: Nutrition): {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
} {
  return {
    energyKcal: n.kcal,
    proteinG: n.protein,
    fatG: n.fat,
    carbG: n.carbs,
  };
}

/** Absolute difference for UI consistency checks (null vs number = mismatch). */
export function nutritionKcalDelta(
  a: Nutrition,
  b: Nutrition,
): number | null {
  if (a.kcal === null && b.kcal === null) return 0;
  if (a.kcal === null || b.kcal === null) return null;
  return Math.abs(a.kcal - b.kcal);
}

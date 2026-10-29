import { portion, recipePortion, type Nutrition } from './nutrition';
import type { Recipe, RecipeIngredient } from '../storage/types';

/** True when the recipe has at least one user-entered per-100g value. */
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

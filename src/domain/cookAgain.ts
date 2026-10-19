import type { Nutrition } from './nutrition';
import type { Recipe, RecipeIngredient } from '../storage/types';

export type CookAgainDraft = {
  cookedYieldG: number;
  /** Override raw grams by ingredient id; omit to keep original. */
  ingredientRawGrams?: Record<string, number>;
};

export type CookAgainRecipeInput = {
  name: string;
  cookedYieldG: number;
  description: string | null;
  instructions: string | null;
  photoUri: string | null;
  nutritionPer100g: Nutrition | null;
  ingredients: Array<{
    productId: string | null;
    displayName: string;
    rawGrams: number;
    nutritionPer100g: Nutrition;
  }>;
};

function formatBatchSuffix(dateLocal: string): string {
  const [y, m, d] = dateLocal.split('-').map(Number);
  if (!y || !m || !d) return dateLocal;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/**
 * Build input for a fresh cook batch from an existing recipe.
 * Ingredient nutrition snapshots are preserved; cooked yield is the actual finished weight.
 * Manual per-100g on the source is cleared when ingredients exist so yield math applies.
 */
export function buildCookAgainInput(
  recipe: Recipe,
  ingredients: RecipeIngredient[],
  draft: CookAgainDraft,
  batchDateLocal: string,
): CookAgainRecipeInput {
  const yieldG = draft.cookedYieldG;
  if (!Number.isFinite(yieldG) || yieldG <= 0) {
    throw new Error('Выход готового блюда должен быть > 0');
  }

  const suffix = formatBatchSuffix(batchDateLocal);
  const baseName = recipe.name.replace(/\s·\sпартия\s.+$/i, '').trim() || recipe.name;
  const name = `${baseName} · партия ${suffix}`;

  if (ingredients.length === 0) {
    return {
      name,
      cookedYieldG: yieldG,
      description: recipe.description,
      instructions: recipe.instructions,
      photoUri: recipe.photoUri,
      nutritionPer100g:
        recipe.energyKcalPer100g != null ||
        recipe.proteinGPer100g != null ||
        recipe.fatGPer100g != null ||
        recipe.carbGPer100g != null
          ? {
              kcal: recipe.energyKcalPer100g,
              protein: recipe.proteinGPer100g,
              fat: recipe.fatGPer100g,
              carbs: recipe.carbGPer100g,
            }
          : null,
      ingredients: [],
    };
  }

  const nextIngredients = ingredients.map((ing) => {
    const raw =
      draft.ingredientRawGrams && Object.prototype.hasOwnProperty.call(draft.ingredientRawGrams, ing.id)
        ? draft.ingredientRawGrams[ing.id]!
        : ing.rawGrams;
    if (!Number.isFinite(raw) || raw < 0) {
      throw new Error(`Граммы ингредиента «${ing.displayName}» должны быть ≥ 0`);
    }
    return {
      productId: ing.productId,
      displayName: ing.displayName,
      rawGrams: raw,
      nutritionPer100g: {
        kcal: ing.energyKcal,
        protein: ing.proteinG,
        fat: ing.fatG,
        carbs: ing.carbG,
      },
    };
  });

  return {
    name,
    cookedYieldG: yieldG,
    description: recipe.description,
    instructions: recipe.instructions,
    photoUri: recipe.photoUri,
    nutritionPer100g: null,
    ingredients: nextIngredients,
  };
}

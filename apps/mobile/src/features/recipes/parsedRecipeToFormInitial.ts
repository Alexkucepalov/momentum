import type { ParsedRecipeText } from '../../../../../src/domain/parseRecipeText';
import { emptyIngredient, type DraftIngredient } from '../diary/addFood/types';
import type { RecipeFormInitial } from './RecipeEditorForm';

function numField(n: number | null | undefined): string {
  return n == null || !Number.isFinite(n) ? '' : String(n);
}

export function parsedRecipeToFormInitial(parsed: ParsedRecipeText): RecipeFormInitial {
  const ingredients: DraftIngredient[] =
    parsed.ingredients.length === 0
      ? [emptyIngredient()]
      : parsed.ingredients.map((ing) => ({
          key: `ing-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          displayName: ing.displayName,
          rawGrams: numField(ing.rawGrams),
          kcalPer100: numField(ing.energyKcalPer100g),
          proteinPer100: numField(ing.proteinGPer100g),
          fatPer100: numField(ing.fatGPer100g),
          carbPer100: numField(ing.carbGPer100g),
        }));

  return {
    name: parsed.name ?? '',
    cookedYieldG: parsed.cookedYieldG ?? undefined,
    description: parsed.description,
    instructions: parsed.instructions,
    ingredients,
  };
}

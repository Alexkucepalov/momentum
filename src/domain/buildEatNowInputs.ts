import { recipeHasManualPer100g, recipeManualPer100g, nutritionForRecipePortion } from './recipeNutrition';
import type { Nutrition } from './nutrition';
import type { EatNowCandidateInput } from './scoreEatNow';
import type { CookedBatch, FoodProduct, Recipe, RecipeIngredient } from '../storage/types';

function productPer100(p: FoodProduct): Nutrition {
  return {
    kcal: p.energyKcal,
    protein: p.proteinG,
    fat: p.fatG,
    carbs: p.carbG,
  };
}

function recipePer100(recipe: Recipe, ingredients: RecipeIngredient[]): Nutrition | null {
  if (recipeHasManualPer100g(recipe)) {
    return recipeManualPer100g(recipe);
  }
  if (ingredients.length === 0) return null;
  const n = nutritionForRecipePortion(recipe, ingredients, 100);
  if (n.kcal === null && n.protein === null && n.fat === null && n.carbs === null) return null;
  return n;
}

/** Map personal recipes → Eat Now inputs. Skip fully unknown nutrition. */
export function eatNowInputsFromRecipes(
  recipes: Recipe[],
  ingredientsByRecipeId: (recipeId: string) => RecipeIngredient[],
  opts?: { defaultPrepMinutes?: number | null; atHome?: boolean },
): EatNowCandidateInput[] {
  const prep = opts?.defaultPrepMinutes ?? null;
  const atHome = opts?.atHome ?? true;
  const out: EatNowCandidateInput[] = [];
  for (const r of recipes) {
    if (r.deletedAt) continue;
    const per100 = recipePer100(r, ingredientsByRecipeId(r.id));
    if (!per100) continue;
    out.push({
      id: r.id,
      kind: 'recipe',
      title: r.name,
      per100,
      prepMinutes: prep,
      atHome,
    });
  }
  return out;
}

/** Map products → Eat Now inputs (treat as no-cook ≤5 min). */
export function eatNowInputsFromProducts(
  products: FoodProduct[],
  opts?: { atHome?: boolean | ((productId: string) => boolean) },
): EatNowCandidateInput[] {
  const out: EatNowCandidateInput[] = [];
  for (const p of products) {
    if (p.deletedAt) continue;
    const per100 = productPer100(p);
    if (per100.kcal === null && per100.protein === null && per100.fat === null && per100.carbs === null) {
      continue;
    }
    const atHome =
      typeof opts?.atHome === 'function'
        ? opts.atHome(p.id)
        : (opts?.atHome ?? false);
    out.push({
      id: p.id,
      kind: 'product',
      title: p.brand ? `${p.name} · ${p.brand}` : p.name,
      per100,
      prepMinutes: null,
      atHome,
    });
  }
  return out;
}

/**
 * Cooked batches → Eat Now (at home, quick reheat).
 * Uses recipe nutrition; id is batch id; caller logs via recipeId on open.
 */
export function eatNowInputsFromCookedBatches(
  batches: CookedBatch[],
  recipesById: Map<string, Recipe> | ((id: string) => Recipe | null),
  ingredientsByRecipeId: (recipeId: string) => RecipeIngredient[],
): EatNowCandidateInput[] {
  const getRecipe =
    typeof recipesById === 'function'
      ? recipesById
      : (id: string) => recipesById.get(id) ?? null;
  const out: EatNowCandidateInput[] = [];
  for (const b of batches) {
    if (b.deletedAt || !(b.remainingG > 0)) continue;
    const recipe = getRecipe(b.recipeId);
    if (!recipe || recipe.deletedAt) continue;
    const per100 = recipePer100(recipe, ingredientsByRecipeId(recipe.id));
    if (!per100) continue;
    out.push({
      id: b.id,
      kind: 'cooked_batch',
      title: `${recipe.name} · остаток ${Math.round(b.remainingG)} г`,
      per100,
      prepMinutes: null,
      atHome: true,
    });
  }
  return out;
}

import { recipeHasManualPer100g, recipeManualPer100g, nutritionForRecipePortion } from './recipeNutrition';
import type { Nutrition } from './nutrition';
import type { EatNowCandidateInput } from './scoreEatNow';
import type { FoodProduct, Recipe, RecipeIngredient } from '../storage/types';

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
  const prep = opts?.defaultPrepMinutes ?? 20;
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
  opts?: { atHome?: boolean },
): EatNowCandidateInput[] {
  const atHome = opts?.atHome ?? false;
  const out: EatNowCandidateInput[] = [];
  for (const p of products) {
    if (p.deletedAt) continue;
    const per100 = productPer100(p);
    if (per100.kcal === null && per100.protein === null && per100.fat === null && per100.carbs === null) {
      continue;
    }
    out.push({
      id: p.id,
      kind: 'product',
      title: p.brand ? `${p.name} · ${p.brand}` : p.name,
      per100,
      prepMinutes: 2,
      atHome,
    });
  }
  return out;
}

import { addNutrition, portion, type Nutrition } from './nutrition';
import { nutritionForRecipePortion } from './recipeNutrition';
import type { FoodProduct, PlannedMeal, Recipe, RecipeIngredient } from '../storage/types';

export type PlannedMealNutritionLookup = {
  getRecipe: (id: string) => Recipe | null;
  getRecipeIngredients: (id: string) => RecipeIngredient[];
  getProduct: (id: string) => FoodProduct | null;
};

/** Nutrition for one planned line. Unknown fields stay null (never invent 0). */
export function nutritionForPlannedMeal(
  meal: PlannedMeal,
  lookup: PlannedMealNutritionLookup,
): Nutrition {
  if (meal.recipeId) {
    const recipe = lookup.getRecipe(meal.recipeId);
    if (!recipe) return { kcal: null, protein: null, fat: null, carbs: null };
    return nutritionForRecipePortion(
      recipe,
      lookup.getRecipeIngredients(meal.recipeId),
      meal.grams,
    );
  }
  if (meal.productId) {
    const product = lookup.getProduct(meal.productId);
    if (!product) return { kcal: null, protein: null, fat: null, carbs: null };
    return portion(
      {
        kcal: product.energyKcal,
        protein: product.proteinG,
        fat: product.fatG,
        carbs: product.carbG,
      },
      meal.grams,
    );
  }
  return { kcal: null, protein: null, fat: null, carbs: null };
}

export type DayPlanNutritionSummary = {
  totals: Nutrition;
  /** True if any planned item (or any macro field) is unknown. */
  incomplete: boolean;
  mealCount: number;
  empty: boolean;
};

/**
 * Aggregate planned meals for a day.
 * empty = no meals; incomplete = meals exist but any macro unknown.
 * Empty day is not "0 kcal" — totals stay null and incomplete=false with empty=true.
 */
export function summarizePlannedDayNutrition(
  meals: PlannedMeal[],
  lookup: PlannedMealNutritionLookup,
): DayPlanNutritionSummary {
  const active = meals.filter((m) => !m.deletedAt && m.status !== 'skipped');
  if (active.length === 0) {
    return {
      totals: { kcal: null, protein: null, fat: null, carbs: null },
      incomplete: false,
      mealCount: 0,
      empty: true,
    };
  }
  const parts = active.map((m) => nutritionForPlannedMeal(m, lookup));
  const totals = addNutrition(parts);
  const incomplete = parts.some(
    (n) => n.kcal === null || n.protein === null || n.fat === null || n.carbs === null,
  );
  return { totals, incomplete, mealCount: active.length, empty: false };
}

export type DayFill = 'empty' | 'partial' | 'filled';

/** Week-strip fill hint: empty / partial (incomplete macros) / filled (all known). */
export function dayFillFromSummary(summary: DayPlanNutritionSummary): DayFill {
  if (summary.empty) return 'empty';
  if (summary.incomplete) return 'partial';
  return 'filled';
}

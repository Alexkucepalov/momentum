import type { Nutrition } from './nutrition';
import { portion } from './nutrition';
import { nutritionForRecipePortion } from './recipeNutrition';
import type { FoodProduct, PlannedMeal, Recipe, RecipeIngredient } from '../storage/types';

export type PlannedMacros = {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
};

export type DayTargets = {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
};

export type PlannedDayNutrition = PlannedMacros & {
  remaining: PlannedMacros;
  mealCount: number;
};

type NutritionLookup = {
  getRecipe: (id: string) => Recipe | null;
  getRecipeIngredients: (recipeId: string) => RecipeIngredient[];
  getProduct: (id: string) => FoodProduct | null;
};

function nutritionToMacros(n: Nutrition): PlannedMacros {
  return {
    energyKcal: n.kcal,
    proteinG: n.protein,
    fatG: n.fat,
    carbG: n.carbs,
  };
}

/** Sum known macros only; all-unknown → null (unknown ≠ 0). */
export function sumPlannedMacros(items: PlannedMacros[]): PlannedMacros {
  const keys = ['energyKcal', 'proteinG', 'fatG', 'carbG'] as const;
  const out: PlannedMacros = {
    energyKcal: null,
    proteinG: null,
    fatG: null,
    carbG: null,
  };
  for (const k of keys) {
    let sum = 0;
    let any = false;
    for (const item of items) {
      const v = item[k];
      if (v == null || !Number.isFinite(v) || v < 0) continue;
      sum += v;
      any = true;
    }
    out[k] = any ? sum : null;
  }
  return out;
}

/** remaining = target − planned when both known; else null. */
export function remainingToTarget(planned: PlannedMacros, targets: DayTargets): PlannedMacros {
  const keys = ['energyKcal', 'proteinG', 'fatG', 'carbG'] as const;
  const out: PlannedMacros = {
    energyKcal: null,
    proteinG: null,
    fatG: null,
    carbG: null,
  };
  for (const k of keys) {
    const t = targets[k];
    const p = planned[k];
    if (t == null || p == null) {
      out[k] = null;
      continue;
    }
    if (!Number.isFinite(t) || !Number.isFinite(p)) {
      out[k] = null;
      continue;
    }
    out[k] = t - p;
  }
  return out;
}

export function nutritionForPlannedMeal(
  meal: Pick<PlannedMeal, 'recipeId' | 'productId' | 'grams'>,
  lookup: NutritionLookup,
): PlannedMacros {
  if (meal.recipeId) {
    const recipe = lookup.getRecipe(meal.recipeId);
    if (!recipe) return { energyKcal: null, proteinG: null, fatG: null, carbG: null };
    return nutritionToMacros(
      nutritionForRecipePortion(recipe, lookup.getRecipeIngredients(recipe.id), meal.grams),
    );
  }
  if (meal.productId) {
    const product = lookup.getProduct(meal.productId);
    if (!product) return { energyKcal: null, proteinG: null, fatG: null, carbG: null };
    const per100: Nutrition = {
      kcal: product.energyKcal,
      protein: product.proteinG,
      fat: product.fatG,
      carbs: product.carbG,
    };
    try {
      return nutritionToMacros(portion(per100, meal.grams));
    } catch {
      return { energyKcal: null, proteinG: null, fatG: null, carbG: null };
    }
  }
  return { energyKcal: null, proteinG: null, fatG: null, carbG: null };
}

/**
 * Aggregate planned meals for one calendar day.
 * Does not invent macros; diary totals are unrelated.
 */
export function buildPlannedDayNutrition(args: {
  meals: PlannedMeal[];
  targets: DayTargets;
  lookup: NutritionLookup;
}): PlannedDayNutrition {
  const active = args.meals.filter((m) => !m.deletedAt && m.status !== 'skipped');
  const perMeal = active.map((m) => nutritionForPlannedMeal(m, args.lookup));
  const totals = sumPlannedMacros(perMeal);
  return {
    ...totals,
    remaining: remainingToTarget(totals, args.targets),
    mealCount: active.length,
  };
}

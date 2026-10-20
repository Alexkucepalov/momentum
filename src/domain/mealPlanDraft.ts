import type { MealSlot } from '../storage/types';
import { shiftDateLocal } from './repeatMeal';

export type MealPlanPeriodDays = 3 | 5 | 7;
export type MealPlanDiversity = 'balanced' | 'fewer';

export type MealPlanRecipePick = {
  id: string;
  name: string;
  /** Suggested portion grams for a single meal. */
  defaultGrams: number;
};

export type PlannedMealDraftLine = {
  dateLocal: string;
  meal: MealSlot;
  recipeId: string | null;
  productId: string | null;
  displayName: string;
  grams: number;
};

const DAY_MEALS: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

export { shiftDateLocal };

export function endDateForPeriod(startDateLocal: string, days: MealPlanPeriodDays): string {
  return shiftDateLocal(startDateLocal, days - 1);
}

function assertPositiveInt(n: number, label: string): void {
  if (!Number.isInteger(n) || n < 1) throw new Error(`Invalid ${label}`);
}

function assertGrams(g: number): void {
  if (!Number.isFinite(g) || g < 0) throw new Error('Invalid grams');
}

/**
 * Deterministic draft menu from personal recipes.
 * Does not invent nutrition — only names/ids/grams.
 * cookSessions controls how often dinner recipes rotate (meal-prep style repeats).
 */
export function buildMealPlanDraft(args: {
  startDateLocal: string;
  days: MealPlanPeriodDays;
  recipes: MealPlanRecipePick[];
  cookSessions?: number;
  diversity?: MealPlanDiversity;
}): { startDateLocal: string; endDateLocal: string; lines: PlannedMealDraftLine[] } {
  const { startDateLocal, days } = args;
  const diversity = args.diversity ?? 'balanced';
  const cookSessions = args.cookSessions ?? 2;
  assertPositiveInt(cookSessions, 'cookSessions');
  if (![3, 5, 7].includes(days)) throw new Error('days must be 3, 5, or 7');

  const usable = args.recipes.filter((r) => r.name.trim() && Number.isFinite(r.defaultGrams) && r.defaultGrams > 0);
  if (usable.length === 0) {
    return {
      startDateLocal,
      endDateLocal: endDateForPeriod(startDateLocal, days),
      lines: [],
    };
  }

  const poolSize =
    diversity === 'fewer' ? Math.max(1, Math.min(usable.length, cookSessions)) : usable.length;
  const pool = usable.slice(0, poolSize);

  const daysPerCook = Math.max(1, Math.ceil(days / cookSessions));
  const lines: PlannedMealDraftLine[] = [];

  for (let i = 0; i < days; i++) {
    const dateLocal = shiftDateLocal(startDateLocal, i);
    const cookBlock = Math.floor(i / daysPerCook);
    for (let m = 0; m < DAY_MEALS.length; m++) {
      const meal = DAY_MEALS[m]!;
      // Breakfast cycles faster; lunch/dinner stick to cook blocks for meal-prep.
      const idx =
        meal === 'breakfast'
          ? (i + m) % pool.length
          : (cookBlock + m) % pool.length;
      const pick = pool[idx]!;
      assertGrams(pick.defaultGrams);
      lines.push({
        dateLocal,
        meal,
        recipeId: pick.id,
        productId: null,
        displayName: pick.name,
        grams: pick.defaultGrams,
      });
    }
  }

  return {
    startDateLocal,
    endDateLocal: endDateForPeriod(startDateLocal, days),
    lines,
  };
}

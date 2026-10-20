import type { MealSlot } from '../storage/types';

/**
 * Suggest meal slot from local clock. User can override in AddFoodSheet.
 * Boundaries match Eat Now defaults (not medical advice).
 */
export function mealSlotForNow(now: Date = new Date()): MealSlot {
  const h = now.getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

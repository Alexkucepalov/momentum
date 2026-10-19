import { addNutrition, type Nutrition } from '../domain/nutrition';
import type { DailyTotals, FoodEntry } from './types';

export function computeDailyTotals(entries: FoodEntry[]): DailyTotals {
  const active = entries.filter((e) => e.deletedAt == null);
  const items: Nutrition[] = active.map((e) => ({
    kcal: e.energyKcal,
    protein: e.proteinG,
    fat: e.fatG,
    carbs: e.carbG,
  }));
  if (items.length === 0) {
    return {
      energyKcal: 0,
      proteinG: 0,
      fatG: 0,
      carbG: 0,
      hasUnknownFields: false,
      entryCount: 0,
    };
  }
  const sum = addNutrition(items);
  const hasUnknownFields = items.some(
    (i) => i.kcal === null || i.protein === null || i.fat === null || i.carbs === null,
  );
  return {
    energyKcal: sum.kcal,
    proteinG: sum.protein,
    fatG: sum.fat,
    carbG: sum.carbs,
    hasUnknownFields,
    entryCount: active.length,
  };
}

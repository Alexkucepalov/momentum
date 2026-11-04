import type { MealSlot } from '../../../../../src/storage/types';

export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MEAL_LABELS_RU: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

export function formatPlannedKcal(kcal: number | null): string {
  return kcal == null ? '—' : `${Math.round(kcal)} ккал`;
}

export function formatRemainingLine(args: {
  remainingKcal: number | null;
  hasTarget: boolean;
}): string {
  if (!args.hasTarget) return 'Цель ккал не задана';
  if (args.remainingKcal == null) return 'Остаток —';
  const r = Math.round(args.remainingKcal);
  if (r > 0) return `Ещё ~${r} ккал`;
  if (r === 0) return 'План = цель';
  return `План выше цели на ${Math.abs(r)} ккал`;
}

import { validateNutrition, type Nutrition } from '../domain/nutrition';

export function assertNonNegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be non-negative and finite`);
  }
}

export function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid ${label}`);
  }
}

export function nutritionFromProductFields(fields: {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
}): Nutrition {
  const n: Nutrition = {
    kcal: fields.energyKcal,
    protein: fields.proteinG,
    fat: fields.fatG,
    carbs: fields.carbG,
  };
  validateNutrition(n);
  return n;
}

export function localDateKey(date: Date, timeZone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(date);
}

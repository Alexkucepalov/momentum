import { validateNutrition, type Nutrition } from '../domain/nutrition';

export function assertNonNegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid ${label}`);
  }
}

export function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid ${label}`);
  }
}

/** Calendar date, including month length/leap years; regex alone accepts 30 February. */
export function assertLocalDate(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Некорректная дата');
  const time = Date.parse(`${value}T12:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) {
    throw new Error('Некорректная дата');
  }
}

export function assertLocalTime(value: string | null): void {
  if (value != null && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error('Время — в формате ЧЧ:ММ');
  }
}

export function assertRepetitions(value: number | null | undefined): void {
  if (value == null) return;
  if (!Number.isInteger(value) || value < 0) throw new Error('Повторения — целое число от 0');
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

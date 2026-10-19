import type { WorkoutType } from '../storage/types';

/** Compendium-style MET approximations — estimates only, not medical advice. */
const MET_BY_TYPE: Record<WorkoutType, number> = {
  walking: 3.5,
  cycling: 7.5,
  strength: 5.0,
  football: 8.0,
  other: 5.0,
};

export function metForWorkoutType(type: WorkoutType): number {
  return MET_BY_TYPE[type];
}

/**
 * Estimate workout energy: MET × body weight (kg) × hours.
 * Returns null when weight is unknown — never invents a default body mass.
 */
export function estimateWorkoutKcal(args: {
  type: WorkoutType;
  durationSec: number;
  weightKg: number | null;
}): number | null {
  const { type, durationSec, weightKg } = args;
  if (weightKg === null) return null;
  if (!Number.isFinite(weightKg) || weightKg <= 0) throw new Error('Invalid weightKg');
  if (!Number.isFinite(durationSec) || durationSec < 0) throw new Error('Invalid durationSec');
  if (durationSec === 0) return 0;
  const hours = durationSec / 3600;
  return metForWorkoutType(type) * weightKg * hours;
}

/** Sum of workout estimates; null if weight unknown. */
export function sumActivityKcal(
  workouts: Array<{ type: WorkoutType; durationSec: number }>,
  weightKg: number | null,
): number | null {
  if (weightKg === null) return null;
  let sum = 0;
  for (const w of workouts) {
    const k = estimateWorkoutKcal({ ...w, weightKg });
    if (k === null) return null;
    sum += k;
  }
  return Math.round(sum);
}

/** Atwater energy from macros for ring composition; null macros stay unknown. */
export function macroEnergyShares(macros: {
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
}): {
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  knownTotal: number | null;
} {
  const protein = macros.proteinG === null ? null : macros.proteinG * 4;
  const fat = macros.fatG === null ? null : macros.fatG * 9;
  const carbs = macros.carbG === null ? null : macros.carbG * 4;
  const parts = [protein, fat, carbs];
  if (parts.some((p) => p === null)) {
    return { protein, fat, carbs, knownTotal: null };
  }
  const knownTotal = (protein as number) + (fat as number) + (carbs as number);
  return { protein, fat, carbs, knownTotal };
}

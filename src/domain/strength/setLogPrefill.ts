import type { WorkoutSet } from './types';

/**
 * Prefill set log fields for gym speed.
 * Actual logged values win; otherwise use previous/target hints.
 * Empty string means unknown — never invent "0".
 */
export function initialSetFieldValues(set: WorkoutSet): { weight: string; reps: string } {
  const weight =
    set.weightKg != null
      ? String(set.weightKg)
      : set.targetWeightKg != null
        ? String(set.targetWeightKg)
        : '';
  const reps =
    set.reps != null
      ? String(set.reps)
      : set.targetReps != null
        ? String(set.targetReps)
        : '';
  return { weight, reps };
}

/** Next incomplete set index in a flat list (for focus / scroll hints). */
export function nextIncompleteSetId(sets: WorkoutSet[]): string | null {
  const open = sets
    .filter((s) => s.deletedAt == null && !s.completed)
    .sort((a, b) => a.exerciseId.localeCompare(b.exerciseId) || a.setIndex - b.setIndex);
  return open[0]?.id ?? null;
}

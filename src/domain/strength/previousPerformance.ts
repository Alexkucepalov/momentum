import type { WorkoutSession, WorkoutSet } from './types';

export type PreviousSetHint = {
  weightKg: number | null;
  reps: number | null;
  completedAt: string;
};

/**
 * Last completed sets for an exercise from the most recent finished session
 * (excluding the current session). Unknown stays null — never invent weight.
 */
export function previousCompletedSetsForExercise(args: {
  exerciseId: string;
  sessions: WorkoutSession[];
  sets: WorkoutSet[];
  excludeSessionId?: string | null;
}): PreviousSetHint[] {
  const finished = args.sessions
    .filter(
      (s) =>
        s.deletedAt == null &&
        s.status === 'completed' &&
        s.id !== args.excludeSessionId,
    )
    .sort((a, b) => (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt));
  for (const session of finished) {
    const rows = args.sets
      .filter(
        (s) =>
          s.deletedAt == null &&
          s.sessionId === session.id &&
          s.exerciseId === args.exerciseId &&
          s.completed,
      )
      .sort((a, b) => a.setIndex - b.setIndex);
    if (rows.length === 0) continue;
    return rows.map((r) => ({
      weightKg: r.weightKg,
      reps: r.reps,
      completedAt: r.completedAt ?? session.completedAt ?? session.startedAt,
    }));
  }
  return [];
}

/** Best estimate of “working weight”: heaviest completed set with known kg. */
export function workingWeightFromSets(sets: Array<{ weightKg: number | null; reps: number | null; completed: boolean }>): number | null {
  let best: number | null = null;
  for (const s of sets) {
    if (!s.completed || s.weightKg == null || !Number.isFinite(s.weightKg) || s.weightKg < 0) continue;
    if (best == null || s.weightKg > best) best = s.weightKg;
  }
  return best;
}

import { workingWeightFromSets } from './previousPerformance';
import type { WorkoutSession, WorkoutSet } from './types';

export type ExerciseProgressPoint = {
  dateLocal: string;
  sessionId: string;
  workingWeightKg: number | null;
  topReps: number | null;
  completedAt: string;
};

/**
 * Chronological series of working weight for one exercise (oldest → newest).
 * Sessions without completed sets for the exercise are skipped — never invent 0 kg.
 */
export function exerciseWorkingWeightSeries(args: {
  exerciseId: string;
  sessions: WorkoutSession[];
  sets: WorkoutSet[];
  limit?: number;
}): ExerciseProgressPoint[] {
  const finished = args.sessions
    .filter((s) => s.deletedAt == null && s.status === 'completed')
    .slice()
    .sort((a, b) => (a.completedAt ?? a.startedAt).localeCompare(b.completedAt ?? b.startedAt));

  const out: ExerciseProgressPoint[] = [];
  for (const session of finished) {
    const rows = args.sets.filter(
      (s) =>
        s.deletedAt == null &&
        s.sessionId === session.id &&
        s.exerciseId === args.exerciseId &&
        s.completed,
    );
    if (rows.length === 0) continue;
    const workingWeightKg = workingWeightFromSets(rows);
    let topReps: number | null = null;
    for (const r of rows) {
      if (r.reps == null || !Number.isFinite(r.reps) || r.reps < 0) continue;
      if (topReps == null || r.reps > topReps) topReps = r.reps;
    }
    out.push({
      dateLocal: session.dateLocal,
      sessionId: session.id,
      workingWeightKg,
      topReps,
      completedAt: session.completedAt ?? session.startedAt,
    });
  }
  if (args.limit != null && args.limit > 0 && out.length > args.limit) {
    return out.slice(out.length - args.limit);
  }
  return out;
}

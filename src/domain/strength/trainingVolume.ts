import type { WorkoutSession, WorkoutSet } from './types';

export type SessionVolume = {
  sessionId: string;
  dateLocal: string;
  title: string;
  /** Sum of weightKg × reps for completed sets with known weight & reps. */
  tonnageKg: number | null;
  completedSets: number;
  /** True when at least one completed set lacked weight or reps. */
  incomplete: boolean;
};

export type ExerciseRecord = {
  exerciseId: string;
  weightKg: number;
  reps: number;
  dateLocal: string;
  sessionId: string;
  setId: string;
};

function setLoad(s: WorkoutSet): number | null {
  if (!s.completed) return null;
  if (s.weightKg == null || s.reps == null) return null;
  if (!Number.isFinite(s.weightKg) || !Number.isFinite(s.reps)) return null;
  if (s.weightKg < 0 || s.reps < 0) return null;
  return s.weightKg * s.reps;
}

/** Per completed session tonnage; unknown sets mark incomplete (never coerce to 0 load). */
export function sessionVolumes(args: {
  sessions: WorkoutSession[];
  sets: WorkoutSet[];
  fromDateLocal?: string;
  toDateLocal?: string;
}): SessionVolume[] {
  const sessions = args.sessions
    .filter((s) => {
      if (s.deletedAt != null || s.status !== 'completed') return false;
      if (args.fromDateLocal && s.dateLocal < args.fromDateLocal) return false;
      if (args.toDateLocal && s.dateLocal > args.toDateLocal) return false;
      return true;
    })
    .sort((a, b) => a.dateLocal.localeCompare(b.dateLocal));

  return sessions.map((session) => {
    const rows = args.sets.filter(
      (s) => s.deletedAt == null && s.sessionId === session.id && s.completed,
    );
    let tonnage = 0;
    let known = 0;
    let incomplete = false;
    for (const r of rows) {
      const load = setLoad(r);
      if (load == null) {
        incomplete = true;
        continue;
      }
      tonnage += load;
      known += 1;
    }
    return {
      sessionId: session.id,
      dateLocal: session.dateLocal,
      title: session.title,
      tonnageKg: known > 0 ? tonnage : null,
      completedSets: rows.length,
      incomplete: incomplete || (rows.length > 0 && known === 0),
    };
  });
}

/**
 * Best set per exercise: heaviest weight, then higher reps at that weight.
 * Skips sets with unknown weight — never invents a PR.
 */
export function personalRecordsByExercise(args: {
  sessions: WorkoutSession[];
  sets: WorkoutSet[];
}): Map<string, ExerciseRecord> {
  const sessionById = new Map(
    args.sessions.filter((s) => s.deletedAt == null && s.status === 'completed').map((s) => [s.id, s]),
  );
  const best = new Map<string, ExerciseRecord>();
  for (const s of args.sets) {
    if (s.deletedAt != null || !s.completed) continue;
    if (s.weightKg == null || s.reps == null) continue;
    if (!Number.isFinite(s.weightKg) || !Number.isFinite(s.reps)) continue;
    if (s.weightKg < 0 || s.reps < 0) continue;
    const session = sessionById.get(s.sessionId);
    if (!session) continue;
    const cand: ExerciseRecord = {
      exerciseId: s.exerciseId,
      weightKg: s.weightKg,
      reps: s.reps,
      dateLocal: session.dateLocal,
      sessionId: session.id,
      setId: s.id,
    };
    const prev = best.get(s.exerciseId);
    if (
      !prev ||
      cand.weightKg > prev.weightKg ||
      (cand.weightKg === prev.weightKg && cand.reps > prev.reps)
    ) {
      best.set(s.exerciseId, cand);
    }
  }
  return best;
}

export type WeekStrengthSummary = {
  weekStart: string;
  completedSessions: number;
  plannedStrength: number;
  tonnageKg: number | null;
  incompleteTonnage: boolean;
};

export function weekStrengthSummary(args: {
  weekStart: string;
  weekDates: string[];
  plannedStrengthCount: number;
  sessions: WorkoutSession[];
  sets: WorkoutSet[];
}): WeekStrengthSummary {
  const vols = sessionVolumes({
    sessions: args.sessions,
    sets: args.sets,
    fromDateLocal: args.weekDates[0],
    toDateLocal: args.weekDates[args.weekDates.length - 1],
  });
  let tonnage = 0;
  let known = 0;
  let incomplete = false;
  for (const v of vols) {
    if (v.tonnageKg != null) {
      tonnage += v.tonnageKg;
      known += 1;
    }
    if (v.incomplete) incomplete = true;
  }
  return {
    weekStart: args.weekStart,
    completedSessions: vols.length,
    plannedStrength: args.plannedStrengthCount,
    tonnageKg: known > 0 ? tonnage : null,
    incompleteTonnage: incomplete || (vols.length > 0 && known === 0),
  };
}

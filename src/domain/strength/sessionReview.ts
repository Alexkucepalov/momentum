import type { WorkoutSession, WorkoutSet, SessionExercisePlan } from "./types";

export function cloneWorkoutSession(session: WorkoutSession): WorkoutSession {
  return {
    ...session,
    ...(session.exercisePlan === undefined
      ? {}
      : {
          exercisePlan: session.exercisePlan.map((p) => ({
            ...p,
            primaryMuscles: [...p.primaryMuscles],
          })),
        }),
  };
}
export function repsRangeLabel(
  plan:
    | Pick<SessionExercisePlan, "targetRepsMin" | "targetRepsMax">
    | undefined,
): string {
  const min = plan?.targetRepsMin,
    max = plan?.targetRepsMax;
  if (min == null && max == null) return "Повторы по факту";
  if (min == null) return `до ${max}`;
  if (max == null) return `от ${min}`;
  return min === max ? String(min) : `${min}–${max}`;
}
export function sessionDurationSec(session: WorkoutSession): number | null {
  if (!session.completedAt) return null;
  const seconds =
    (Date.parse(session.completedAt) - Date.parse(session.startedAt)) / 1000;
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}
export function formatSetPerformance(
  set: Pick<WorkoutSet, "weightKg" | "reps">,
): string {
  return `${set.weightKg == null ? "—" : set.weightKg.toLocaleString("ru-RU")} кг × ${set.reps ?? "—"}`;
}
/** Prior means completed before this session started, including when reviewing old history. */
export function previousExercisePerformance(
  exerciseId: string,
  session: WorkoutSession,
  sessions: WorkoutSession[],
  sets: WorkoutSet[],
) {
  const cutoff = Date.parse(session.startedAt);
  const candidates = sessions
    .filter(
      (s) =>
        s.id !== session.id &&
        !s.deletedAt &&
        s.status === "completed" &&
        s.completedAt != null &&
        Date.parse(s.completedAt) <= cutoff,
    )
    .sort((a, b) => Date.parse(b.completedAt!) - Date.parse(a.completedAt!));
  for (const candidate of candidates) {
    const rows = sets
      .filter(
        (s) =>
          s.sessionId === candidate.id &&
          s.exerciseId === exerciseId &&
          !s.deletedAt &&
          s.completed,
      )
      .sort((a, b) => a.setIndex - b.setIndex);
    if (rows.length)
      return {
        session: cloneWorkoutSession(candidate),
        sets: rows.map((s) => ({ ...s })),
      };
  }
  return null;
}
export function buildSessionReview(
  session: WorkoutSession,
  sets: WorkoutSet[],
  historySessions: WorkoutSession[] = [],
  historySets: WorkoutSet[] = [],
) {
  const rows = sets.filter((s) => s.sessionId === session.id && !s.deletedAt);
  const completed = rows.filter((s) => s.completed);
  const groups = new Map<string, WorkoutSet[]>();
  for (const set of rows)
    groups.set(set.exerciseId, [...(groups.get(set.exerciseId) ?? []), set]);
  const knownReps = completed.filter((s) => s.reps != null);
  const exercises = [...groups].map(([exerciseId, sets]) => {
    const plan = session.exercisePlan?.find((p) => p.exerciseId === exerciseId);
    const done = sets.filter((s) => s.completed);
    const rangeKnown =
      plan != null &&
      (plan.targetRepsMin != null || plan.targetRepsMax != null);
    const checkedRangeSets = done.filter((s) => s.reps != null).length;
    const inRange =
      rangeKnown && checkedRangeSets > 0
        ? done.filter(
            (s) =>
              s.reps != null &&
              (plan.targetRepsMin == null || s.reps >= plan.targetRepsMin) &&
              (plan.targetRepsMax == null || s.reps <= plan.targetRepsMax),
          ).length
        : null;
    return {
      exerciseId,
      plan,
      sets,
      completed: done.length,
      inRange,
      checkedRangeSets,
      previous: previousExercisePerformance(
        exerciseId,
        session,
        historySessions,
        historySets,
      ),
    };
  });
  return {
    completedSets: completed.length,
    totalSets: rows.length,
    completedExercises: exercises.filter((e) => e.completed > 0).length,
    totalExercises: groups.size,
    repetitions: knownReps.length
      ? knownReps.reduce((sum, s) => sum + s.reps!, 0)
      : null,
    knownRepSets: knownReps.length,
    incompleteReps: knownReps.length < completed.length,
    durationSec: sessionDurationSec(session),
    exercises,
  };
}
export type SessionReview = ReturnType<typeof buildSessionReview>;

export function validateExercisePlan(
  value: unknown,
): asserts value is SessionExercisePlan[] {
  if (!Array.isArray(value) || value.length > 200)
    throw new Error("Некорректный план сессии");
  const ids = new Set<string>();
  const muscles = [
    "chest",
    "back",
    "shoulders",
    "biceps",
    "triceps",
    "legs",
    "core",
    "other",
  ];
  for (const p of value) {
    if (
      !p ||
      typeof p.exerciseId !== "string" ||
      !p.exerciseId ||
      ids.has(p.exerciseId) ||
      typeof p.name !== "string" ||
      !p.name.trim() ||
      !Number.isInteger(p.targetSets) ||
      p.targetSets < 1 ||
      p.targetSets > 100
    )
      throw new Error("Некорректное упражнение плана");
    ids.add(p.exerciseId);
    if (
      !Array.isArray(p.primaryMuscles) ||
      p.primaryMuscles.some((m: unknown) => !muscles.includes(m as string))
    )
      throw new Error("Некорректные группы мышц");
    for (const k of ["targetRepsMin", "targetRepsMax", "restSec"])
      if (
        p[k] != null &&
        (typeof p[k] !== "number" ||
          !Number.isFinite(p[k]) ||
          p[k] < 0 ||
          (k !== "restSec" && !Number.isInteger(p[k])))
      )
        throw new Error("Некорректный ориентир плана");
    if (
      p.targetRepsMin != null &&
      p.targetRepsMax != null &&
      p.targetRepsMin > p.targetRepsMax
    )
      throw new Error("Минимум повторений больше максимума");
    for (const k of ["equipment", "notes"])
      if (p[k] != null && typeof p[k] !== "string")
        throw new Error("Некорректное описание плана");
  }
}

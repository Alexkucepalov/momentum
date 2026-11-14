import type { Workout, WorkoutSession } from "../storage/types";

export type CompletedTrainingFact = {
  id: string;
  type: Workout["type"];
  title: string | null;
  durationSec: number | null;
  distanceM: number | null;
  calories: number | null;
  notes: string | null;
  source: "workout" | "strength_session";
  origin: Workout["source"];
};

/** Source records stay separate: no guessed matching by title, day or duration. Plans are not facts. */
export function completedTrainingFacts(
  workouts: Workout[],
  sessions: WorkoutSession[],
): CompletedTrainingFact[] {
  return [
    ...workouts
      .filter((w) => !w.deletedAt)
      .map((w) => ({
        id: w.id,
        type: w.type,
        title: null,
        durationSec: w.durationSec,
        distanceM: w.distanceM,
        calories: w.calories,
        notes: w.notes,
        source: "workout" as const,
        origin: w.source,
      })),
    ...sessions
      .filter((s) => !s.deletedAt && s.status === "completed")
      .map((s) => {
        const elapsed = s.completedAt
          ? (Date.parse(s.completedAt) - Date.parse(s.startedAt)) / 1000
          : NaN;
        return {
          id: s.id,
          type: "strength" as const,
          title: s.title,
          durationSec:
            Number.isFinite(elapsed) && elapsed >= 0 ? elapsed : null,
          distanceM: null,
          calories: null,
          notes: s.feelingNote,
          source: "strength_session" as const,
          origin: "user" as const,
        };
      }),
  ];
}

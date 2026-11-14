/** Muscle tags for volume maps — guidance only, not hypertrophy measurement. */
export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "legs"
  | "core"
  | "other";

export type StrengthExercise = {
  id: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: string | null;
  createdAt: string;
  deletedAt: string | null;
};

export type SessionExercisePlan = Pick<
  WorkoutTemplateExercise,
  | "exerciseId"
  | "targetSets"
  | "targetRepsMin"
  | "targetRepsMax"
  | "restSec"
  | "notes"
> & { name: string; equipment: string | null; primaryMuscles: MuscleGroup[] };

export type WorkoutTemplate = {
  /** User-authored plan information, stored locally. */
  notes?: string | null;
  id: string;
  name: string;
  /** e.g. «Грудь · спина · плечи» */
  subtitle: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type WorkoutTemplateExercise = {
  id: string;
  templateId: string;
  exerciseId: string;
  sortOrder: number;
  targetSets: number;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  /** Suggested rest after a completed set. */
  restSec: number | null;
  notes: string | null;
};

export type PlannedActivityKind = "strength" | "cardio" | "rest";

/** Calendar card — independent from WorkoutSession history. */
export type PlannedActivity = {
  id: string;
  dateLocal: string;
  /** HH:mm local wall clock, or null if untimed. */
  timeLocal: string | null;
  kind: PlannedActivityKind;
  title: string;
  subtitle: string | null;
  templateId: string | null;
  cardioMinutes: number | null;
  /** Explicit relation to an imported completed ride; never changes the source record. */
  linkedWorkoutId?: string | null;
  sortOrder: number;
  createdAt: string;
  deletedAt: string | null;
};

export type TrainingCycleSlot = Pick<
  PlannedActivity,
  | "kind"
  | "title"
  | "subtitle"
  | "templateId"
  | "timeLocal"
  | "cardioMinutes"
  | "sortOrder"
> & { weekdayIndex: number };
export type TrainingCycle = {
  name: string;
  slots: TrainingCycleSlot[];
  updatedAt: string;
};

export type WorkoutSessionStatus = "in_progress" | "completed" | "abandoned";

export type WorkoutSession = {
  /** Frozen at start; absent on legacy sessions, never reconstructed from edited templates. */
  exercisePlan?: SessionExercisePlan[];
  planNotes?: string | null;
  /** null explicitly means skipped/finished rest; undefined is legacy. */
  restUntilAt?: string | null;
  id: string;
  dateLocal: string;
  templateId: string | null;
  plannedActivityId: string | null;
  title: string;
  status: WorkoutSessionStatus;
  startedAt: string;
  completedAt: string | null;
  /** Subjective difficulty 1–10 after session; null = unknown (not zero). */
  feelingRpe: number | null;
  /** Free-text recovery / form note — never invented. */
  feelingNote: string | null;
  createdAt: string;
  deletedAt: string | null;
};

export type WorkoutSet = {
  /** Unconfirmed input; not a completed set or an actual result. */
  draftWeightText?: string;
  draftRepsText?: string;
  id: string;
  sessionId: string;
  exerciseId: string;
  /** 1-based index within the exercise for this session. */
  setIndex: number;
  weightKg: number | null;
  reps: number | null;
  completed: boolean;
  completedAt: string | null;
  /** Prefill from template / last session — not overwritten by history edits. */
  targetWeightKg: number | null;
  targetReps: number | null;
  createdAt: string;
  deletedAt: string | null;
};

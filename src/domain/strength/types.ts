/** Muscle tags for volume maps — guidance only, not hypertrophy measurement. */
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'core'
  | 'other';

export type StrengthExercise = {
  id: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: string | null;
  createdAt: string;
  deletedAt: string | null;
};

export type WorkoutTemplate = {
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

export type PlannedActivityKind = 'strength' | 'cardio' | 'rest';

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
  sortOrder: number;
  createdAt: string;
  deletedAt: string | null;
};

export type WorkoutSessionStatus = 'in_progress' | 'completed' | 'abandoned';

export type WorkoutSession = {
  id: string;
  dateLocal: string;
  templateId: string | null;
  plannedActivityId: string | null;
  title: string;
  status: WorkoutSessionStatus;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  deletedAt: string | null;
};

export type WorkoutSet = {
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

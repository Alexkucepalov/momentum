import type {
  MuscleGroup,
  StrengthExercise,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from './types';

type SeedExercise = Omit<StrengthExercise, 'createdAt' | 'deletedAt'>;
type SeedTemplate = Omit<WorkoutTemplate, 'createdAt' | 'updatedAt' | 'deletedAt'>;
type SeedLine = Omit<WorkoutTemplateExercise, 'id'>;

const TS = '2026-11-01T00:00:00.000Z';

/** Built-in catalog for dogfood — synthetic, not personal records. */
export const SEED_STRENGTH_EXERCISES: SeedExercise[] = [
  {
    id: 'ex-chest-press',
    name: 'Жим груди в тренажёре',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps'],
    equipment: 'machine',
  },
  {
    id: 'ex-lat-pulldown',
    name: 'Вертикальная тяга',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
  },
  {
    id: 'ex-lateral-raise',
    name: 'Махи гантелями в стороны',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: [],
    equipment: 'dumbbell',
  },
  {
    id: 'ex-row',
    name: 'Тяга горизонтального блока',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
  },
  {
    id: 'ex-shoulder-press',
    name: 'Жим плеч в тренажёре',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    equipment: 'machine',
  },
  {
    id: 'ex-curl',
    name: 'Сгибание рук на бицепс',
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    equipment: 'dumbbell',
  },
  {
    id: 'ex-squat',
    name: 'Приседания в тренажёре',
    primaryMuscles: ['legs'],
    secondaryMuscles: ['core'],
    equipment: 'machine',
  },
  {
    id: 'ex-rdl',
    name: 'Румынская тяга',
    primaryMuscles: ['legs'],
    secondaryMuscles: ['back'],
    equipment: 'barbell',
  },
  {
    id: 'ex-leg-press',
    name: 'Жим ногами',
    primaryMuscles: ['legs'],
    secondaryMuscles: [],
    equipment: 'machine',
  },
  {
    id: 'ex-crunch',
    name: 'Скручивания',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    equipment: 'bodyweight',
  },
  {
    id: 'ex-pushup',
    name: 'Отжимания',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'bodyweight',
  },
  {
    id: 'ex-face-pull',
    name: 'Face pull',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['back'],
    equipment: 'cable',
  },
];

export const SEED_WORKOUT_TEMPLATES: SeedTemplate[] = [
  { id: 'tmpl-upper-a', name: 'Верх A', subtitle: 'Грудь · спина · плечи' },
  { id: 'tmpl-legs', name: 'Ноги + пресс', subtitle: 'Ноги · корпус' },
  { id: 'tmpl-upper-b', name: 'Верх B', subtitle: 'Плечи · руки' },
  { id: 'tmpl-upper-c', name: 'Верх C', subtitle: 'Грудь · спина · пресс' },
];

const line = (
  templateId: string,
  exerciseId: string,
  sortOrder: number,
  sets: number,
  repsMin: number,
  repsMax: number,
  restSec = 90,
): SeedLine => ({
  templateId,
  exerciseId,
  sortOrder,
  targetSets: sets,
  targetRepsMin: repsMin,
  targetRepsMax: repsMax,
  restSec,
  notes: null,
});

export const SEED_TEMPLATE_EXERCISES: SeedLine[] = [
  line('tmpl-upper-a', 'ex-chest-press', 0, 3, 8, 12),
  line('tmpl-upper-a', 'ex-lat-pulldown', 1, 3, 8, 12),
  line('tmpl-upper-a', 'ex-row', 2, 3, 8, 12),
  line('tmpl-upper-a', 'ex-lateral-raise', 3, 3, 10, 15),
  line('tmpl-upper-a', 'ex-shoulder-press', 4, 3, 8, 12),
  line('tmpl-upper-a', 'ex-face-pull', 5, 3, 12, 15),
  line('tmpl-legs', 'ex-squat', 0, 3, 8, 12),
  line('tmpl-legs', 'ex-leg-press', 1, 3, 10, 15),
  line('tmpl-legs', 'ex-rdl', 2, 3, 8, 12),
  line('tmpl-legs', 'ex-crunch', 3, 3, 12, 20, 60),
  line('tmpl-upper-b', 'ex-shoulder-press', 0, 3, 8, 12),
  line('tmpl-upper-b', 'ex-lateral-raise', 1, 3, 10, 15),
  line('tmpl-upper-b', 'ex-curl', 2, 3, 8, 12),
  line('tmpl-upper-b', 'ex-lat-pulldown', 3, 3, 8, 12),
  line('tmpl-upper-b', 'ex-face-pull', 4, 3, 12, 15),
  line('tmpl-upper-b', 'ex-row', 5, 3, 8, 12),
  line('tmpl-upper-c', 'ex-pushup', 0, 3, 8, 15, 60),
  line('tmpl-upper-c', 'ex-lat-pulldown', 1, 3, 8, 12),
  line('tmpl-upper-c', 'ex-chest-press', 2, 3, 8, 12),
  line('tmpl-upper-c', 'ex-crunch', 3, 3, 12, 20, 60),
  line('tmpl-upper-c', 'ex-row', 4, 3, 8, 12),
];

export function materializeSeedExercises(now = TS): StrengthExercise[] {
  return SEED_STRENGTH_EXERCISES.map((e) => ({
    ...e,
    createdAt: now,
    deletedAt: null,
  }));
}

export function materializeSeedTemplates(now = TS): {
  templates: WorkoutTemplate[];
  lines: WorkoutTemplateExercise[];
} {
  const templates = SEED_WORKOUT_TEMPLATES.map((t) => ({
    ...t,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }));
  const lines = SEED_TEMPLATE_EXERCISES.map((l, i) => ({
    ...l,
    id: `tmpl-line-${i + 1}`,
  }));
  return { templates, lines };
}

export function muscleLabelRu(m: MuscleGroup): string {
  switch (m) {
    case 'chest':
      return 'грудь';
    case 'back':
      return 'спина';
    case 'shoulders':
      return 'плечи';
    case 'biceps':
      return 'бицепс';
    case 'triceps':
      return 'трицепс';
    case 'legs':
      return 'ноги';
    case 'core':
      return 'корпус';
    default:
      return 'другое';
  }
}

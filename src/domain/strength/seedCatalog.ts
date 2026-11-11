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

/**
 * Built-in catalog for personal dogfood program (start 2026-11-16).
 * Synthetic fixtures only — not personal health records.
 */
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
    name: 'Вертикальная тяга блока',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
  },
  {
    id: 'ex-incline-press',
    name: 'Наклонный жим груди',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'machine',
  },
  {
    id: 'ex-row',
    name: 'Горизонтальная тяга блока',
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
    id: 'ex-tricep-pushdown',
    name: 'Разгибание рук на трицепс',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: 'cable',
  },
  {
    id: 'ex-leg-press',
    name: 'Жим ногами',
    primaryMuscles: ['legs'],
    secondaryMuscles: [],
    equipment: 'machine',
  },
  {
    id: 'ex-leg-curl',
    name: 'Сгибание ног в тренажёре',
    primaryMuscles: ['legs'],
    secondaryMuscles: [],
    equipment: 'machine',
  },
  {
    id: 'ex-leg-extension',
    name: 'Разгибание ног в тренажёре',
    primaryMuscles: ['legs'],
    secondaryMuscles: [],
    equipment: 'machine',
  },
  {
    id: 'ex-calf-raise',
    name: 'Подъёмы на носки',
    primaryMuscles: ['legs'],
    secondaryMuscles: [],
    equipment: 'machine',
  },
  {
    id: 'ex-pallof',
    name: 'Паллоф-пресс',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    equipment: 'cable',
  },
  {
    id: 'ex-dead-bug',
    name: 'Dead Bug',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    equipment: 'bodyweight',
  },
  {
    id: 'ex-shoulder-press',
    name: 'Жим плечами в тренажёре',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    equipment: 'machine',
  },
  {
    id: 'ex-reverse-fly',
    name: 'Обратная бабочка',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['back'],
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
    id: 'ex-light-row',
    name: 'Лёгкая горизонтальная тяга',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
  },
  {
    id: 'ex-pec-deck',
    name: 'Сведение рук в тренажёре',
    primaryMuscles: ['chest'],
    secondaryMuscles: [],
    equipment: 'machine',
  },
  // Kept for optional swaps — not in default weekly templates.
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
  { id: 'tmpl-upper-a', name: 'Верх A', subtitle: 'Грудь и спина · 19:30' },
  { id: 'tmpl-legs', name: 'Ноги + пресс', subtitle: 'Беречь поясницу · 19:30' },
  { id: 'tmpl-upper-b', name: 'Верх B', subtitle: 'Плечи и руки · 19:30' },
  { id: 'tmpl-upper-c', name: 'Верх C', subtitle: 'Грудь · спина · руки · пресс · 10:00' },
];

/** Ids of built-in templates whose lines are refreshed from seed. */
export const BUILTIN_TEMPLATE_IDS = SEED_WORKOUT_TEMPLATES.map((t) => t.id);

const line = (
  templateId: string,
  exerciseId: string,
  sortOrder: number,
  sets: number,
  repsMin: number,
  repsMax: number,
  restSec = 90,
  notes: string | null = null,
): SeedLine => ({
  templateId,
  exerciseId,
  sortOrder,
  targetSets: sets,
  targetRepsMin: repsMin,
  targetRepsMax: repsMax,
  restSec,
  notes,
});

/** Personal program: mostly 2 working sets, RIR 2–3, rest 60–120s. */
export const SEED_TEMPLATE_EXERCISES: SeedLine[] = [
  // Monday — Верх A (12 sets)
  line('tmpl-upper-a', 'ex-chest-press', 0, 2, 8, 12),
  line('tmpl-upper-a', 'ex-lat-pulldown', 1, 2, 8, 12),
  line('tmpl-upper-a', 'ex-incline-press', 2, 2, 10, 12),
  line('tmpl-upper-a', 'ex-row', 3, 2, 10, 12),
  line('tmpl-upper-a', 'ex-lateral-raise', 4, 2, 12, 15),
  line('tmpl-upper-a', 'ex-tricep-pushdown', 5, 2, 10, 15),
  // Tuesday — Ноги + пресс (12 sets)
  line('tmpl-legs', 'ex-leg-press', 0, 2, 10, 12, 90, 'Амплитуда по комфорту поясницы'),
  line('tmpl-legs', 'ex-leg-curl', 1, 2, 12, 15),
  line('tmpl-legs', 'ex-leg-extension', 2, 2, 12, 15),
  line('tmpl-legs', 'ex-calf-raise', 3, 2, 12, 20, 60),
  line('tmpl-legs', 'ex-pallof', 4, 2, 10, 10, 60, '10 на сторону'),
  line('tmpl-legs', 'ex-dead-bug', 5, 2, 8, 8, 60, '8 на сторону'),
  // Thursday — Верх B (12 sets)
  line('tmpl-upper-b', 'ex-shoulder-press', 0, 2, 8, 12, 90, 'Только при комфортной спине'),
  line('tmpl-upper-b', 'ex-lateral-raise', 1, 2, 12, 20),
  line('tmpl-upper-b', 'ex-reverse-fly', 2, 2, 12, 15),
  line('tmpl-upper-b', 'ex-curl', 3, 2, 10, 15),
  line('tmpl-upper-b', 'ex-tricep-pushdown', 4, 2, 10, 15),
  line('tmpl-upper-b', 'ex-light-row', 5, 2, 12, 12),
  // Saturday — Верх C (16 sets)
  line('tmpl-upper-c', 'ex-incline-press', 0, 2, 8, 12),
  line('tmpl-upper-c', 'ex-row', 1, 2, 8, 12),
  line('tmpl-upper-c', 'ex-lat-pulldown', 2, 2, 10, 12),
  line('tmpl-upper-c', 'ex-pec-deck', 3, 2, 12, 15),
  line('tmpl-upper-c', 'ex-lateral-raise', 4, 2, 15, 15),
  line('tmpl-upper-c', 'ex-curl', 5, 2, 12, 12),
  line('tmpl-upper-c', 'ex-tricep-pushdown', 6, 2, 12, 12),
  line('tmpl-upper-c', 'ex-pallof', 7, 2, 10, 10, 60, '10 на сторону'),
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
    id: `tmpl-line-v2-${i + 1}`,
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

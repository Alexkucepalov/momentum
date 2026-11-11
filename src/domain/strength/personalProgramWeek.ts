import type { PlannedActivityKind } from './types';

/** First Monday of the personal dogfood strength program. */
export const PERSONAL_PROGRAM_START = '2026-11-16';

export type ProgramWeekSlot = {
  /** 0 = Monday … 6 = Sunday */
  weekdayIndex: number;
  kind: PlannedActivityKind;
  title: string;
  subtitle: string | null;
  templateId: string | null;
  timeLocal: string | null;
  cardioMinutes: number | null;
};

/**
 * Fixed weekly skeleton: 4 strength + bike + 2 rest.
 * Times are local wall clock hints for the calendar card.
 */
export const PERSONAL_PROGRAM_WEEK: ProgramWeekSlot[] = [
  {
    weekdayIndex: 0,
    kind: 'strength',
    title: 'Верх A',
    subtitle: 'Грудь и спина · 19:30–20:40',
    templateId: 'tmpl-upper-a',
    timeLocal: '19:30',
    cardioMinutes: null,
  },
  {
    weekdayIndex: 1,
    kind: 'strength',
    title: 'Ноги + пресс',
    subtitle: '19:30–20:30 · беречь поясницу',
    templateId: 'tmpl-legs',
    timeLocal: '19:30',
    cardioMinutes: null,
  },
  {
    weekdayIndex: 2,
    kind: 'rest',
    title: 'Отдых',
    subtitle: 'По желанию прогулка',
    templateId: null,
    timeLocal: null,
    cardioMinutes: null,
  },
  {
    weekdayIndex: 3,
    kind: 'strength',
    title: 'Верх B',
    subtitle: 'Плечи и руки · 19:30–20:40',
    templateId: 'tmpl-upper-b',
    timeLocal: '19:30',
    cardioMinutes: null,
  },
  {
    weekdayIndex: 4,
    kind: 'cardio',
    title: 'Велостанок',
    subtitle: 'Зона 2 · 45–50 мин · без спринтов',
    templateId: null,
    timeLocal: '19:30',
    cardioMinutes: 45,
  },
  {
    weekdayIndex: 5,
    kind: 'strength',
    title: 'Верх C',
    subtitle: 'Грудь · спина · руки · пресс · 10:00–11:10',
    templateId: 'tmpl-upper-c',
    timeLocal: '10:00',
    cardioMinutes: null,
  },
  {
    weekdayIndex: 6,
    kind: 'rest',
    title: 'Отдых',
    subtitle: 'Полный день восстановления',
    templateId: null,
    timeLocal: null,
    cardioMinutes: null,
  },
];

function addDays(dateLocal: string, days: number): string {
  const [y, m, d] = dateLocal.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export type ProgramWeekDraft = {
  dateLocal: string;
  timeLocal: string | null;
  kind: PlannedActivityKind;
  title: string;
  subtitle: string | null;
  templateId: string | null;
  cardioMinutes: number | null;
  sortOrder: number;
};

/** Plan cards for Mon–Sun. Never mutates WorkoutSession history. */
export function buildPersonalProgramWeekDrafts(weekStartMonday: string): ProgramWeekDraft[] {
  return PERSONAL_PROGRAM_WEEK.map((slot) => ({
    dateLocal: addDays(weekStartMonday, slot.weekdayIndex),
    timeLocal: slot.timeLocal,
    kind: slot.kind,
    title: slot.title,
    subtitle: slot.subtitle,
    templateId: slot.templateId,
    cardioMinutes: slot.cardioMinutes,
    sortOrder: slot.weekdayIndex,
  }));
}

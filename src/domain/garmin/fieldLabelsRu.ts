export type GarminFieldGroup = 'main' | 'heart' | 'cycling' | 'other';

export type GarminLabeledField = {
  key: string;
  labelRu: string;
  value: string;
  group: GarminFieldGroup;
};

const LABELS: Record<string, { labelRu: string; group: GarminFieldGroup }> = {
  activityName: { labelRu: 'Название', group: 'main' },
  activityId: { labelRu: 'ID активности', group: 'other' },
  calendarDate: { labelRu: 'Дата', group: 'main' },
  startTimeLocal: { labelRu: 'Старт (локально)', group: 'main' },
  startTimeGMT: { labelRu: 'Старт (GMT)', group: 'other' },
  duration: { labelRu: 'Длительность, с', group: 'main' },
  elapsedDuration: { labelRu: 'Общее время, с', group: 'main' },
  movingDuration: { labelRu: 'В движении, с', group: 'main' },
  distance: { labelRu: 'Дистанция, м', group: 'main' },
  calories: { labelRu: 'Калории', group: 'main' },
  activeCalories: { labelRu: 'Активные ккал', group: 'main' },
  bmrCalories: { labelRu: 'BMR ккал', group: 'other' },
  averageHR: { labelRu: 'Ср. пульс', group: 'heart' },
  avgHR: { labelRu: 'Ср. пульс', group: 'heart' },
  maxHR: { labelRu: 'Макс. пульс', group: 'heart' },
  minHR: { labelRu: 'Мин. пульс', group: 'heart' },
  avgPower: { labelRu: 'Ср. мощность, Вт', group: 'cycling' },
  averagePower: { labelRu: 'Ср. мощность, Вт', group: 'cycling' },
  maxPower: { labelRu: 'Макс. мощность, Вт', group: 'cycling' },
  normPower: { labelRu: 'Норм. мощность (NP), Вт', group: 'cycling' },
  normalizedPower: { labelRu: 'Норм. мощность (NP), Вт', group: 'cycling' },
  avgBikeCadence: { labelRu: 'Ср. каденс', group: 'cycling' },
  averageBikeCadence: { labelRu: 'Ср. каденс', group: 'cycling' },
  maxBikeCadence: { labelRu: 'Макс. каденс', group: 'cycling' },
  averageSpeed: { labelRu: 'Ср. скорость, м/с', group: 'cycling' },
  avgSpeed: { labelRu: 'Ср. скорость, м/с', group: 'cycling' },
  maxSpeed: { labelRu: 'Макс. скорость, м/с', group: 'cycling' },
  elevationGain: { labelRu: 'Набор высоты, м', group: 'cycling' },
  elevationLoss: { labelRu: 'Потеря высоты, м', group: 'cycling' },
  minElevation: { labelRu: 'Мин. высота, м', group: 'cycling' },
  maxElevation: { labelRu: 'Макс. высота, м', group: 'cycling' },
  startLatitude: { labelRu: 'Широта старта', group: 'other' },
  startLongitude: { labelRu: 'Долгота старта', group: 'other' },
  endLatitude: { labelRu: 'Широта финиша', group: 'other' },
  endLongitude: { labelRu: 'Долгота финиша', group: 'other' },
  locationName: { labelRu: 'Локация', group: 'main' },
  deviceName: { labelRu: 'Устройство', group: 'other' },
  aerobicTrainingEffect: { labelRu: 'Аэробный эффект', group: 'heart' },
  anaerobicTrainingEffect: { labelRu: 'Анаэробный эффект', group: 'heart' },
  trainingLoadPeak: { labelRu: 'Training Load', group: 'heart' },
  activityTrainingLoad: { labelRu: 'Нагрузка тренировки', group: 'heart' },
  avgStress: { labelRu: 'Ср. стресс', group: 'heart' },
  maxStress: { labelRu: 'Макс. стресс', group: 'heart' },
  steps: { labelRu: 'Шаги', group: 'main' },
  waterEstimated: { labelRu: 'Оценка воды, мл', group: 'other' },
};

const GROUP_ORDER: GarminFieldGroup[] = ['main', 'heart', 'cycling', 'other'];

export const GARMIN_FIELD_GROUP_RU: Record<GarminFieldGroup, string> = {
  main: 'Основные',
  heart: 'Пульс и нагрузка',
  cycling: 'Вело / скорость',
  other: 'Прочее',
};

export function labelGarminField(key: string): { labelRu: string; group: GarminFieldGroup } {
  return LABELS[key] ?? { labelRu: key, group: 'other' };
}

export function groupGarminDetailFields(
  fields: Record<string, string | number | boolean | null>,
): GarminLabeledField[] {
  const out: GarminLabeledField[] = [];
  for (const [key, raw] of Object.entries(fields)) {
    if (raw === null || raw === undefined || raw === '') continue;
    const { labelRu, group } = labelGarminField(key);
    out.push({ key, labelRu, value: String(raw), group });
  }
  out.sort((a, b) => {
    const g = GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);
    if (g !== 0) return g;
    return a.labelRu.localeCompare(b.labelRu, 'ru');
  });
  return out;
}

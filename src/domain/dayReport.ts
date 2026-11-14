import { formatDateRu } from './dateFormatRu';

export type DayReportSleep = {
  sleepSec: number | null;
  deepSec: number | null;
  lightSec: number | null;
  remSec: number | null;
  awakeSec: number | null;
  sleepScore: number | null;
  avgSpo2: number | null;
};

export type DayReportWorkout = {
  type: string;
  durationMin: number | null;
  calories: number | null;
  notes: string | null;
};

export type DayReportInput = {
  dateLocal: string;
  generatedAtIso: string;
  nutrition: {
    entryCount: number;
    energyKcal: number | null;
    proteinG: number | null;
    fatG: number | null;
    carbG: number | null;
    hasUnknownFields: boolean;
  };
  waterMl: number;
  waterTargetMl: number | null;
  activityMinutes: number;
  steps: number | null;
  workouts: DayReportWorkout[];
  weightKg: number | null;
  sleep: DayReportSleep | null;
  targets: {
    energyKcal: number | null;
    proteinG: number | null;
    fatG: number | null;
    carbG: number | null;
  };
};

function fmt(n: number | null, digits = 0): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return digits > 0 ? n.toFixed(digits) : String(Math.round(n));
}

function fmtHours(sec: number | null): string {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return '—';
  const minutes = Math.round(sec / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} ч ${m} мин`;
}

/**
 * Plain-text day report for paste into ChatGPT / notes.
 * Never invents nutrition — unknown stays «—».
 * No medical advice language.
 */
export function buildDayReportText(input: DayReportInput): string {
  const lines: string[] = [];
  lines.push(`# Отчёт nf-fit · ${formatDateRu(input.dateLocal)}`);
  lines.push(`Сформирован: ${input.generatedAtIso}`);
  lines.push('');
  lines.push(
    'Контекст для анализа: ниже только локальные факты с устройства. Неизвестные значения — «—», не ноль. Без медицинских заключений и без оценочных ярлыков.',
  );
  lines.push('');

  lines.push('## Цели (профиль)');
  lines.push(
    `- Энергия: ${fmt(input.targets.energyKcal)} ккал · Б ${fmt(input.targets.proteinG)} / Ж ${fmt(input.targets.fatG)} / У ${fmt(input.targets.carbG)} г`,
  );
  lines.push(
    `- Вода: цель ${input.waterTargetMl == null ? '—' : `${input.waterTargetMl} мл`}`,
  );
  lines.push('');

  lines.push('## Питание');
  const n = input.nutrition;
  if (n.entryCount === 0) {
    lines.push('- Записей нет');
  } else {
    lines.push(`- Записей: ${n.entryCount}`);
    lines.push(
      `- КБЖУ: ${n.hasUnknownFields || n.energyKcal == null ? 'ккал —' : `${fmt(n.energyKcal)} ккал`} · Б ${fmt(n.proteinG)} / Ж ${fmt(n.fatG)} / У ${fmt(n.carbG)} г`,
    );
    if (n.hasUnknownFields) lines.push('- Есть позиции с неизвестными нутриентами');
  }
  lines.push(
    `- Вода: ${input.waterMl} мл${
      input.waterTargetMl != null && input.waterTargetMl > 0
        ? ` / ${input.waterTargetMl} мл`
        : ''
    }`,
  );
  lines.push('');

  lines.push('## Активность');
  lines.push(`- Минуты тренировок: ${input.activityMinutes > 0 ? input.activityMinutes : '—'}`);
  lines.push(`- Шаги: ${fmt(input.steps)}`);
  if (input.workouts.length === 0) {
    lines.push('- Тренировок нет');
  } else {
    for (const w of input.workouts) {
      const kcal = w.calories == null ? '' : ` · ${fmt(w.calories)} ккал`;
      const note = w.notes ? ` · ${w.notes}` : '';
      lines.push(`- ${w.type}: ${fmt(w.durationMin)} мин${kcal}${note}`);
    }
  }
  lines.push('');

  lines.push('## Сон');
  if (!input.sleep) {
    lines.push('- Нет данных (нужна синхронизация Garmin)');
  } else {
    const s = input.sleep;
    lines.push(`- Длительность: ${fmtHours(s.sleepSec)}`);
    lines.push(
      `- Фазы: глубокий ${fmtHours(s.deepSec)} · лёгкий ${fmtHours(s.lightSec)} · REM ${fmtHours(s.remSec)} · бодрствование ${fmtHours(s.awakeSec)}`,
    );
    lines.push(`- Оценка Garmin: ${fmt(s.sleepScore)}`);
    lines.push(`- Ср. SpO₂: ${fmt(s.avgSpo2, 1)}%`);
  }
  lines.push('');

  lines.push('## Вес');
  lines.push(`- ${input.weightKg == null ? '—' : `${fmt(input.weightKg, 1)} кг`}`);
  lines.push('');

  lines.push('---');
  lines.push(
    'Это наблюдательный снимок, не медицинская рекомендация. Неизвестные нутриенты не подменяются нулями.',
  );
  return lines.join('\n');
}

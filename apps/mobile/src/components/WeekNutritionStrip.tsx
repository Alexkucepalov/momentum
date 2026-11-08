import {
  averageKnownKcal,
  loggedDaysForAverage,
  type WeekDayNutrition,
} from '../../../../src/domain/weekNutrition';
import { localDateKey } from '../../../../src/storage/validation';
import { WeekBarChart } from './WeekBarChart';
import { formatWeekRangeRu } from './weekFormat';

function fmt(n: number | null): string {
  if (n === null) return '—';
  return String(Math.round(n));
}

export function WeekNutritionStrip({
  days,
  selectedDate,
  targetKcal,
  onSelectDate,
  timeZone,
}: {
  days: WeekDayNutrition[];
  selectedDate: string;
  targetKcal: number | null;
  onSelectDate?: (dateLocal: string) => void;
  timeZone?: string;
}) {
  const avg = averageKnownKcal(days);
  const logged = loggedDaysForAverage(days);
  const start = days[0]?.dateLocal;
  const end = days[6]?.dateLocal;
  const today = timeZone ? localDateKey(new Date(), timeZone) : undefined;
  const range = start && end ? formatWeekRangeRu(start, end) : '';

  const avgLabel =
    avg == null ? 'ср. —' : `ср. ${fmt(avg)} ккал (${logged}/${days.length || 7})`;

  const subtitleParts = [
    range,
    avgLabel,
    targetKcal != null ? `цель ${Math.round(targetKcal)}` : null,
  ].filter(Boolean);

  return (
    <WeekBarChart
      title="Неделя еды"
      subtitle={subtitleParts.join(' · ')}
      selectedDate={selectedDate}
      todayDate={today}
      onSelectDate={onSelectDate}
      maxValue={Math.max(targetKcal ?? 0, ...days.map((d) => d.energyKcal ?? 0), 1)}
      footnote="Столбик — сумма ккал за день. Пустой день — нет записей, не «провал»."
      days={days.map((d) => ({
        dateLocal: d.dateLocal,
        weekdayIndex: d.weekdayIndex,
        value: d.entryCount === 0 || d.energyKcal == null ? 0 : d.energyKcal,
        valueLabel: d.entryCount === 0 ? '·' : fmt(d.energyKcal),
      }))}
    />
  );
}

import { formatDateRu } from './dateFormatRu';

/** Categories the user can include in a flexible personal report. */
export type ReportCategory =
  | 'profile'
  | 'nutrition'
  | 'activity'
  | 'weight'
  | 'habits';

export const REPORT_CATEGORY_LABELS_RU: Record<ReportCategory, string> = {
  profile: 'Профиль и цели',
  nutrition: 'Питание',
  activity: 'Спорт',
  weight: 'Вес',
  habits: 'Привычки',
};

export type ReportDayNutrition = {
  dateLocal: string;
  entryCount: number;
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
  hasUnknownFields: boolean;
};

export type ReportWorkoutRow = {
  dateLocal: string;
  type: string;
  durationMin: number;
  distanceM: number | null;
  notes: string | null;
};

export type ReportWeightRow = {
  dateLocal: string;
  kg: number;
};

export type ReportHabitRow = {
  name: string;
  kind: string;
  completionsInRange: number;
  unit: string | null;
};

export type FlexibleReportInput = {
  periodStart: string;
  periodEnd: string;
  categories: ReportCategory[];
  generatedAtIso: string;
  profile: {
    timezone: string;
    heightCm: number | null;
    waterTargetMl: number | null;
    dailyEnergyKcal: number | null;
    dailyProteinG: number | null;
    dailyFatG: number | null;
    dailyCarbG: number | null;
  };
  latestWeightKg: number | null;
  nutritionDays: ReportDayNutrition[];
  workouts: ReportWorkoutRow[];
  weights: ReportWeightRow[];
  habits: ReportHabitRow[];
};

/** Compact dashboard tile on the first page of the PDF. */
export type ReportKpi = {
  label: string;
  value: string;
  hint?: string;
};

export type ReportSection = {
  id: ReportCategory;
  title: string;
  /** Short facts shown in a summary strip under the section title. */
  summary: string[];
  /** Day-by-day / row detail (optional). */
  details: string[];
};

export type FlexibleReport = {
  title: string;
  periodLabel: string;
  /** Top dashboard KPIs (first “blocks”). */
  kpis: ReportKpi[];
  sections: ReportSection[];
  disclaimer: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function assertReportPeriod(start: string, end: string): void {
  if (!DATE_RE.test(start) || !DATE_RE.test(end)) {
    throw new Error('Даты в формате ГГГГ-ММ-ДД');
  }
  if (end < start) throw new Error('Конец периода раньше начала');
}

/** Inclusive local calendar days from start to end. */
export function datesInInclusiveRange(start: string, end: string): string[] {
  assertReportPeriod(start, end);
  const out: string[] = [];
  let cur = start;
  while (cur <= end) {
    out.push(cur);
    if (out.length > 366) throw new Error('Период не длиннее 366 дней');
    const [y, m, d] = cur.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + 1));
    cur = dt.toISOString().slice(0, 10);
  }
  return out;
}

function fmtNum(n: number | null, digits = 0): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return digits > 0 ? n.toFixed(digits) : String(Math.round(n));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = nums.reduce((a, b) => a + b, 0);
  return s / nums.length;
}

type NutritionAgg = {
  withFood: ReportDayNutrition[];
  knownEnergyDays: ReportDayNutrition[];
  unknownFoodDays: number;
  entryTotal: number;
  avgKcal: number | null;
  energySumKnown: number | null;
};

function aggregateNutrition(days: ReportDayNutrition[]): NutritionAgg {
  const withFood = days.filter((d) => d.entryCount > 0);
  const knownEnergyDays = withFood.filter(
    (d) => !d.hasUnknownFields && d.energyKcal != null && Number.isFinite(d.energyKcal),
  );
  const unknownFoodDays = withFood.length - knownEnergyDays.length;
  const entryTotal = days.reduce((s, d) => s + d.entryCount, 0);
  const energies = knownEnergyDays.map((d) => d.energyKcal as number);
  const avgKcal = mean(energies);
  const energySumKnown = energies.length === 0 ? null : energies.reduce((a, b) => a + b, 0);
  return { withFood, knownEnergyDays, unknownFoodDays, entryTotal, avgKcal, energySumKnown };
}

type WeightAgg = {
  sorted: ReportWeightRow[];
  first: ReportWeightRow | null;
  last: ReportWeightRow | null;
  avg: number | null;
  min: number | null;
  max: number | null;
};

function aggregateWeight(rows: ReportWeightRow[]): WeightAgg {
  const sorted = [...rows].sort((a, b) => a.dateLocal.localeCompare(b.dateLocal));
  if (sorted.length === 0) {
    return { sorted, first: null, last: null, avg: null, min: null, max: null };
  }
  const kgs = sorted.map((r) => r.kg);
  return {
    sorted,
    first: sorted[0]!,
    last: sorted[sorted.length - 1]!,
    avg: mean(kgs),
    min: Math.min(...kgs),
    max: Math.max(...kgs),
  };
}

function buildKpis(input: FlexibleReportInput, cats: ReportCategory[]): ReportKpi[] {
  const kpis: ReportKpi[] = [];
  const dayCount = datesInInclusiveRange(input.periodStart, input.periodEnd).length;

  if (cats.includes('weight')) {
    const w = aggregateWeight(input.weights);
    if (w.first && w.last) {
      const delta = w.last.kg - w.first.kg;
      const sign = delta > 0 ? '+' : '';
      kpis.push({
        label: 'Вес за период',
        value: `${fmtNum(w.first.kg, 1)} → ${fmtNum(w.last.kg, 1)} кг`,
        hint: `Δ ${sign}${fmtNum(delta, 1)} кг · ${w.sorted.length} взвеш.`,
      });
      kpis.push({
        label: 'Средний вес',
        value: `${fmtNum(w.avg, 1)} кг`,
        hint:
          w.min != null && w.max != null
            ? `мин ${fmtNum(w.min, 1)} · макс ${fmtNum(w.max, 1)}`
            : undefined,
      });
    } else if (input.latestWeightKg != null) {
      kpis.push({
        label: 'Актуальный вес',
        value: `${fmtNum(input.latestWeightKg, 1)} кг`,
        hint: 'В выбран периоде взвешиваний нет',
      });
    } else {
      kpis.push({ label: 'Вес', value: '—', hint: 'Нет данных' });
    }
  }

  if (cats.includes('nutrition')) {
    const n = aggregateNutrition(input.nutritionDays);
    kpis.push({
      label: 'Среднее ккал / день',
      value: n.avgKcal == null ? '—' : fmtNum(n.avgKcal),
      hint:
        n.avgKcal == null
          ? n.withFood.length === 0
            ? 'Нет дней с едой'
            : 'Недостаточно полных данных'
          : n.unknownFoodDays > 0
            ? `по ${n.knownEnergyDays.length} дням с полными ккал`
            : `по ${n.knownEnergyDays.length} дням с едой`,
    });
    kpis.push({
      label: 'Дни с записями',
      value: `${n.withFood.length} / ${dayCount}`,
      hint: `${n.entryTotal} позиций в дневнике`,
    });
  }

  if (cats.includes('activity')) {
    const mins = input.workouts.reduce((s, x) => s + x.durationMin, 0);
    kpis.push({
      label: 'Тренировки',
      value: String(input.workouts.length),
      hint: input.workouts.length === 0 ? 'В периоде нет' : `${mins} мин суммарно`,
    });
    if (input.workouts.length > 0) {
      const avgMin = mean(input.workouts.map((w) => w.durationMin));
      kpis.push({
        label: 'Средняя тренировка',
        value: `${fmtNum(avgMin)} мин`,
        hint: `${fmtNum(mins / dayCount, 1)} мин/день периода`,
      });
    }
  }

  if (cats.includes('habits') && input.habits.length > 0) {
    const total = input.habits.reduce((s, h) => s + h.completionsInRange, 0);
    kpis.push({
      label: 'Привычки',
      value: String(input.habits.length),
      hint: `${fmtNum(total)} отметок / значений за период`,
    });
  }

  if (cats.includes('profile')) {
    const p = input.profile;
    kpis.push({
      label: 'Ориентир ккал',
      value: p.dailyEnergyKcal == null ? '—' : fmtNum(p.dailyEnergyKcal),
      hint:
        p.heightCm == null
          ? 'Цель на день (если задана)'
          : `рост ${p.heightCm} см · цель на день`,
    });
  }

  return kpis.slice(0, 8);
}

/**
 * Build a neutral observational report. Never invents kcal/macros:
 * unknown stays «—», not 0.
 */
export function buildFlexibleReport(input: FlexibleReportInput): FlexibleReport {
  assertReportPeriod(input.periodStart, input.periodEnd);
  const cats = [...new Set(input.categories)];
  if (cats.length === 0) throw new Error('Выбери хотя бы одну категорию');

  const sections: ReportSection[] = [];
  const kpis = buildKpis(input, cats);

  if (cats.includes('profile')) {
    const p = input.profile;
    sections.push({
      id: 'profile',
      title: REPORT_CATEGORY_LABELS_RU.profile,
      summary: [
        `Часовой пояс: ${p.timezone}`,
        `Рост: ${p.heightCm == null ? '—' : `${p.heightCm} см`}`,
        `Актуальный вес: ${input.latestWeightKg == null ? '—' : `${fmtNum(input.latestWeightKg, 1)} кг`}`,
        `Ориентир ккал/день: ${fmtNum(p.dailyEnergyKcal)}`,
        `Ориентир Б/Ж/У: ${fmtNum(p.dailyProteinG)} / ${fmtNum(p.dailyFatG)} / ${fmtNum(p.dailyCarbG)} г`,
        `Подсказка по воде: ${p.waterTargetMl == null ? '—' : `${p.waterTargetMl} мл`}`,
      ],
      details: [],
    });
  }

  if (cats.includes('nutrition')) {
    const n = aggregateNutrition(input.nutritionDays);
    const summary = [
      `Дней с записями: ${n.withFood.length} из ${input.nutritionDays.length}`,
      `Позиций в дневнике: ${n.entryTotal}`,
      n.avgKcal == null
        ? n.withFood.length === 0
          ? 'Среднее ккал/день: —'
          : 'Среднее ккал/день: часть значений неизвестна — не усредняем все дни'
        : `Среднее ккал/день (полные данные): ${fmtNum(n.avgKcal)}${
            n.unknownFoodDays > 0 ? ` · ещё ${n.unknownFoodDays} дн. с неизвестными` : ''
          }`,
      n.energySumKnown == null
        ? 'Сумма ккал: —'
        : `Сумма ккал (известные дни): ${fmtNum(n.energySumKnown)}`,
    ];
    const details: string[] = [];
    for (const d of n.withFood.slice(0, 60)) {
      const kcal =
        d.hasUnknownFields || d.energyKcal == null
          ? 'ккал —'
          : `${fmtNum(d.energyKcal)} ккал`;
      details.push(
        `${formatDateRu(d.dateLocal)}: ${d.entryCount} зап. · ${kcal} · Б ${fmtNum(d.proteinG)} / Ж ${fmtNum(d.fatG)} / У ${fmtNum(d.carbG)}`,
      );
    }
    if (n.withFood.length > 60) details.push(`… и ещё ${n.withFood.length - 60} дней с записями`);
    sections.push({
      id: 'nutrition',
      title: REPORT_CATEGORY_LABELS_RU.nutrition,
      summary,
      details,
    });
  }

  if (cats.includes('activity')) {
    const w = input.workouts;
    const mins = w.reduce((s, x) => s + x.durationMin, 0);
    const summary = [`Тренировок: ${w.length}`, `Минут суммарно: ${mins}`];
    const details: string[] = [];
    for (const row of w.slice(0, 80)) {
      const dist =
        row.distanceM == null ? '' : ` · ${(row.distanceM / 1000).toFixed(2)} км`;
      const note = row.notes ? ` · ${row.notes}` : '';
      details.push(
        `${formatDateRu(row.dateLocal)}: ${row.type} · ${row.durationMin} мин${dist}${note}`,
      );
    }
    if (w.length > 80) details.push(`… и ещё ${w.length - 80} тренировок`);
    if (w.length === 0) details.push('В этом периоде тренировок нет');
    sections.push({
      id: 'activity',
      title: REPORT_CATEGORY_LABELS_RU.activity,
      summary,
      details,
    });
  }

  if (cats.includes('weight')) {
    const w = aggregateWeight(input.weights);
    const summary: string[] = [];
    const details: string[] = [];
    if (w.sorted.length === 0) {
      summary.push('Взвешиваний в периоде нет');
    } else {
      summary.push(`Записей веса: ${w.sorted.length}`);
      summary.push(
        `Диапазон: ${fmtNum(w.min, 1)}–${fmtNum(w.max, 1)} кг · среднее ${fmtNum(w.avg, 1)} кг`,
      );
      if (w.first && w.last) {
        const delta = w.last.kg - w.first.kg;
        const sign = delta > 0 ? '+' : '';
        summary.push(
          `Старт ${formatDateRu(w.first.dateLocal)}: ${fmtNum(w.first.kg, 1)} кг → финиш ${formatDateRu(w.last.dateLocal)}: ${fmtNum(w.last.kg, 1)} кг (Δ ${sign}${fmtNum(delta, 1)})`,
        );
      }
      for (const r of w.sorted) {
        details.push(`${formatDateRu(r.dateLocal)}: ${fmtNum(r.kg, 1)} кг`);
      }
    }
    sections.push({
      id: 'weight',
      title: REPORT_CATEGORY_LABELS_RU.weight,
      summary,
      details,
    });
  }

  if (cats.includes('habits')) {
    const summary: string[] = [];
    const details: string[] = [];
    if (input.habits.length === 0) {
      summary.push('Активных привычек нет');
    } else {
      summary.push(`Привычек в отчёте: ${input.habits.length}`);
      for (const h of input.habits) {
        const u = h.unit ? ` ${h.unit}` : '';
        details.push(`${h.name}: ${h.completionsInRange}${u} за период (${h.kind})`);
      }
    }
    sections.push({
      id: 'habits',
      title: REPORT_CATEGORY_LABELS_RU.habits,
      summary,
      details,
    });
  }

  return {
    title: 'Momentum — личный отчёт',
    periodLabel: `${formatDateRu(input.periodStart)} → ${formatDateRu(input.periodEnd)}`,
    kpis,
    sections,
    disclaimer:
      'Наблюдательный отчёт по данным на устройстве. Не медицинская рекомендация. Неизвестные нутриенты не подменяются нулями.',
  };
}

/** HTML suitable for expo-print. Synthetic / local data only. */
export function flexibleReportToHtml(report: FlexibleReport, generatedAtIso: string): string {
  const kpiHtml =
    report.kpis.length === 0
      ? ''
      : `<div class="kpi-grid">${report.kpis
          .map(
            (k) => `<div class="kpi">
  <div class="kpi-label">${escapeHtml(k.label)}</div>
  <div class="kpi-value">${escapeHtml(k.value)}</div>
  ${k.hint ? `<div class="kpi-hint">${escapeHtml(k.hint)}</div>` : ''}
</div>`,
          )
          .join('')}</div>`;

  const sectionsHtml = report.sections
    .map((s) => {
      const summaryList =
        s.summary.length === 0
          ? ''
          : `<ul class="summary">${s.summary.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>`;
      const detailList =
        s.details.length === 0
          ? ''
          : `<div class="details-label">Подробности</div><ul class="details">${s.details
              .map((l) => `<li>${escapeHtml(l)}</li>`)
              .join('')}</ul>`;
      return `<section class="block">
  <h2>${escapeHtml(s.title)}</h2>
  ${summaryList}
  ${detailList}
</section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(report.title)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    padding: 28px 32px;
    font-size: 11.5px;
    line-height: 1.45;
    background: #fff;
  }
  .hero {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 2px solid #1a1a1a;
  }
  h1 { font-size: 22px; margin: 0; letter-spacing: -0.02em; }
  .meta { color: #555; margin: 0; text-align: right; font-size: 11px; }
  .dash-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #666;
    margin: 0 0 10px;
  }
  .kpi-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 22px;
  }
  .kpi {
    flex: 1 1 42%;
    min-width: 140px;
    max-width: 48%;
    border: 1px solid #e2e2e2;
    background: #f7f7f5;
    border-radius: 10px;
    padding: 12px 14px;
  }
  .kpi-label { font-size: 10px; color: #666; font-weight: 600; margin-bottom: 4px; }
  .kpi-value { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
  .kpi-hint { font-size: 10px; color: #777; margin-top: 4px; }
  .block {
    margin-bottom: 16px;
    padding: 12px 14px 10px;
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    page-break-inside: avoid;
  }
  h2 {
    font-size: 13px;
    margin: 0 0 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #ddd;
  }
  ul { margin: 0; padding-left: 16px; }
  li { margin-bottom: 2px; }
  ul.summary { margin-bottom: 8px; }
  ul.summary li { font-weight: 600; }
  .details-label {
    font-size: 10px;
    font-weight: 700;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 6px 0 4px;
  }
  ul.details { color: #333; font-weight: 400; }
  .foot { margin-top: 22px; color: #666; font-size: 10px; border-top: 1px solid #ddd; padding-top: 10px; }
</style>
</head>
<body>
  <header class="hero">
    <h1>${escapeHtml(report.title)}</h1>
    <p class="meta">Период: ${escapeHtml(report.periodLabel)}<br/>Сформирован: ${escapeHtml(generatedAtIso)}</p>
  </header>
  ${report.kpis.length ? `<p class="dash-title">Сводка периода</p>${kpiHtml}` : ''}
  ${sectionsHtml}
  <p class="foot">${escapeHtml(report.disclaimer)}</p>
</body>
</html>`;
}

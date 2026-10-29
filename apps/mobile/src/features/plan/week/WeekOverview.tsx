import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DayPlanNutritionSummary } from '../../../../../../src/domain/plannedMealNutrition';
import { formatWeekRangeRu, WEEKDAY_SHORT_RU_CAP, dayNumber } from '@/src/components/weekFormat';
import { colors, radius, space, type } from '@/src/theme/tokens';

function averageKnown(values: Array<number | null>): number | null {
  const known = values.filter((value): value is number => value != null);
  if (known.length === 0) return null;
  return known.reduce((sum, value) => sum + value, 0) / known.length;
}

function fmt(value: number | null, unit: string): string {
  return value == null ? '—' : `${Math.round(value)} ${unit}`;
}

function share(value: number | null, target: number | null): string | null {
  if (value == null || target == null || target <= 0) return null;
  return `${Math.round((value / target) * 100)}%`;
}

/** Week summary: real averages only. Empty and unknown stay em dash. */
export function WeekOverview({
  days,
  summaries,
  targetKcal,
  targets,
  selected,
  onSelect,
}: {
  days: string[];
  summaries: Record<string, DayPlanNutritionSummary>;
  targetKcal: number | null;
  targets: { proteinG: number | null; fatG: number | null; carbG: number | null };
  selected: string;
  onSelect: (dateLocal: string) => void;
}) {
  const kcalValues = days.map((day) => summaries[day]?.totals.kcal ?? null);
  const avgKcal = averageKnown(kcalValues);
  const avgProtein = averageKnown(days.map((day) => summaries[day]?.totals.protein ?? null));
  const avgFat = averageKnown(days.map((day) => summaries[day]?.totals.fat ?? null));
  const avgCarbs = averageKnown(days.map((day) => summaries[day]?.totals.carbs ?? null));
  const maxKcal = Math.max(targetKcal ?? 0, ...kcalValues.map((value) => value ?? 0), 1);
  const range =
    days.length >= 2 ? formatWeekRangeRu(days[0]!, days[days.length - 1]!) : '';

  return (
    <View accessibilityRole="summary" accessibilityLabel="Недельный план">
      <Text style={styles.kicker}>Недельный план</Text>
      <Text style={styles.range}>{range}</Text>

      <Text style={styles.section}>Калории</Text>
      <Text style={avgKcal == null ? styles.valueEmpty : styles.value}>
        {avgKcal == null ? '—' : Math.round(avgKcal)}
      </Text>
      <Text style={styles.caption}>
        {avgKcal == null
          ? 'Среднее появится, когда в днях будут известные калории'
          : targetKcal != null
            ? `Среднее за неделю · ориентир ${Math.round(targetKcal)}`
            : 'Среднее за неделю'}
      </Text>

      <View style={styles.bars}>
        {days.map((iso, index) => {
          const summary = summaries[iso];
          const kcal = summary?.totals.kcal ?? null;
          const empty = !summary || summary.empty || kcal == null;
          const height = empty ? 8 : Math.max(12, Math.round((kcal / maxKcal) * 112));
          const on = iso === selected;
          return (
            <Pressable
              key={iso}
              onPress={() => onSelect(iso)}
              style={styles.col}
              accessibilityRole="button"
              accessibilityLabel={`${WEEKDAY_SHORT_RU_CAP[index]} ${dayNumber(iso)}, ${empty ? 'нет данных' : `${Math.round(kcal)} килокалорий`}`}
            >
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height },
                    empty ? styles.barEmpty : null,
                    on && !empty ? styles.barOn : null,
                  ]}
                />
              </View>
              <Text style={[styles.wd, on && styles.wdOn]}>{WEEKDAY_SHORT_RU_CAP[index]}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section}>КБЖУ · среднее за неделю</Text>
      <View style={styles.macros}>
        <MacroRing
          label="Белки"
          value={fmt(avgProtein, 'г')}
          shareLabel={share(avgProtein, targets.proteinG)}
          color={colors.protein}
        />
        <MacroRing
          label="Жиры"
          value={fmt(avgFat, 'г')}
          shareLabel={share(avgFat, targets.fatG)}
          color={colors.fat}
        />
        <MacroRing
          label="Углеводы"
          value={fmt(avgCarbs, 'г')}
          shareLabel={share(avgCarbs, targets.carbG)}
          color={colors.carbs}
        />
      </View>
    </View>
  );
}

function MacroRing({
  label,
  value,
  shareLabel,
  color,
}: {
  label: string;
  value: string;
  shareLabel: string | null;
  color: string;
}) {
  return (
    <View style={styles.macro}>
      <View style={[styles.ring, { borderColor: color }]}>
        <Text style={styles.ringValue}>{value}</Text>
        <Text style={styles.ringShare}>{shareLabel ?? '—'}</Text>
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: type.caption, fontWeight: '700', color: colors.textMuted },
  range: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
    marginBottom: space.lg,
  },
  section: {
    fontSize: type.body,
    fontWeight: '800',
    color: colors.text,
    marginBottom: space.xs,
  },
  value: { fontSize: 40, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  valueEmpty: { fontSize: 28, fontWeight: '600', color: colors.textMuted, marginBottom: 2 },
  caption: {
    fontSize: type.caption,
    color: colors.textSecondary,
    marginBottom: space.md,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: space.xl,
    minHeight: 148,
  },
  col: { flex: 1, alignItems: 'center', gap: 8 },
  barTrack: { height: 112, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: {
    width: '62%',
    borderRadius: 6,
    backgroundColor: colors.textSecondary,
  },
  barEmpty: { backgroundColor: colors.accentSoft },
  barOn: { backgroundColor: colors.text },
  wd: { fontSize: type.micro, fontWeight: '700', color: colors.textMuted },
  wdOn: { color: colors.text },
  macros: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  macro: { flex: 1, alignItems: 'center', gap: space.sm },
  ring: {
    width: 92,
    height: 92,
    borderRadius: radius.pill,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  ringValue: { fontSize: type.caption, fontWeight: '800', color: colors.text },
  ringShare: { fontSize: type.micro, color: colors.textMuted, marginTop: 2 },
  macroLabel: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary },
});

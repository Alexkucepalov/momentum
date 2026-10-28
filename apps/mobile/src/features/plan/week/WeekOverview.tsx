import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDateRu } from '../../../../../../src/domain/dateFormatRu';
import type { DayPlanNutritionSummary } from '../../../../../../src/domain/plannedMealNutrition';
import { dayNumber, WEEKDAY_SHORT_RU_CAP } from '@/src/components/weekFormat';
import { colors, elevation, radius, space, touchMin, type } from '@/src/theme/tokens';

/** Compact week bars — reference screen 6, without decorative dashboards. */
export function WeekOverview({
  days,
  summaries,
  targetKcal,
  selected,
  onSelect,
}: {
  days: string[];
  summaries: Record<string, DayPlanNutritionSummary>;
  targetKcal: number | null;
  selected: string;
  onSelect: (dateLocal: string) => void;
}) {
  const maxKcal = Math.max(
    targetKcal ?? 0,
    ...days.map((d) => summaries[d]?.totals.kcal ?? 0),
    1,
  );

  return (
    <View style={styles.wrap} accessibilityRole="summary" accessibilityLabel="Обзор недели">
      <Text style={styles.title}>Неделя</Text>
      <View style={styles.bars}>
        {days.map((iso, i) => {
          const s = summaries[iso];
          const kcal = s?.totals.kcal ?? null;
          const empty = !s || s.empty;
          const incomplete = s?.incomplete ?? false;
          const h =
            empty || kcal === null
              ? 8
              : Math.max(8, Math.round((kcal / maxKcal) * 96));
          const on = iso === selected;
          return (
            <Pressable
              key={iso}
              onPress={() => onSelect(iso)}
              style={[styles.col, on && styles.colOn]}
              accessibilityRole="button"
              accessibilityLabel={`${WEEKDAY_SHORT_RU_CAP[i]} ${formatDateRu(iso)}, ${kcal === null ? 'нет данных' : `${Math.round(kcal)} килокалорий`}`}
            >
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: h },
                    incomplete && styles.barPartial,
                    empty && styles.barEmpty,
                  ]}
                />
              </View>
              <Text style={[styles.wd, on && styles.wdOn]}>{WEEKDAY_SHORT_RU_CAP[i]}</Text>
              <Text style={[styles.num, on && styles.wdOn]}>{dayNumber(iso)}</Text>
              <Text style={styles.kcal}>
                {empty ? '—' : kcal === null ? '?' : Math.round(kcal)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>«?» / «частично» — неизвестные КБЖУ, не ноль</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...elevation.card,
    padding: space.md,
    marginBottom: space.md,
    gap: space.sm,
  },
  title: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  bars: { flexDirection: 'row', gap: 4, alignItems: 'flex-end' },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
    minHeight: touchMin,
  },
  colOn: { backgroundColor: colors.accentSoft },
  barTrack: {
    height: 100,
    width: '70%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    borderRadius: radius.sm,
    backgroundColor: colors.primaryButton,
    minHeight: 8,
  },
  barPartial: { backgroundColor: colors.warning },
  barEmpty: { backgroundColor: colors.border, opacity: 0.7 },
  wd: { fontSize: type.micro, fontWeight: '700', color: colors.textMuted },
  num: { fontSize: type.caption, fontWeight: '800', color: colors.text },
  wdOn: { color: colors.text },
  kcal: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  hint: { fontSize: type.micro, color: colors.textMuted },
});

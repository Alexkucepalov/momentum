import { StyleSheet, View } from 'react-native';

import type { MonthOverviewResult } from '../../../../../src/domain/monthOverview';
import { AppCard, AppText, space } from '@/src/design-system';

function fmtDelta(kg: number | null): string {
  if (kg == null) return '—';
  if (kg > 0) return `+${kg}`;
  return String(kg);
}

/** Combined 30-day glance: food · activity · sleep · weight (M1/M2). */
export function MonthOverviewCard({
  overview,
  testID = 'month-overview',
}: {
  overview: MonthOverviewResult;
  testID?: string;
}) {
  return (
    <AppCard style={styles.card} testID={testID} accessibilityLabel="Обзор за 30 дней">
      <AppText variant="label" tone="muted">
        30 дней
      </AppText>
      <AppText variant="caption" tone="secondary" style={styles.lead}>
        Сводка по еде, движению, сну и весу. Нет данных ≠ ноль.
      </AppText>
      <View style={styles.grid}>
        <Cell
          label="Еда"
          value={`${overview.foodDays}/${overview.daysInWindow}`}
          meta={
            overview.energyAvgKcal == null
              ? 'ср. ккал —'
              : `ср. ${overview.energyAvgKcal} ккал`
          }
        />
        <Cell
          label="Активность"
          value={overview.workoutMinutes > 0 ? String(overview.workoutMinutes) : '—'}
          meta="мин тренировок"
        />
        <Cell
          label="Сон"
          value={overview.sleepAvgHours == null ? '—' : String(overview.sleepAvgHours)}
          meta={`ч ср. · ${overview.sleepKnownNights} ноч.`}
        />
        <Cell
          label="Вес"
          value={fmtDelta(overview.weightDeltaKg)}
          meta="кг · Δ за период"
        />
      </View>
    </AppCard>
  );
}

function Cell({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <View style={styles.cell}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <AppText variant="subtitle" style={styles.value}>
        {value}
      </AppText>
      <AppText variant="caption" tone="secondary">
        {meta}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm, marginBottom: space.md },
  lead: { lineHeight: 18 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  cell: {
    width: '47%',
    flexGrow: 1,
    gap: 2,
  },
  value: { fontWeight: '800' },
});

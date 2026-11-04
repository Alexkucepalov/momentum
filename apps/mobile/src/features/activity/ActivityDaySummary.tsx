import { StyleSheet, View } from 'react-native';

import { AppText, MetricCard, colors, radius, space } from '@/src/design-system';

type ActivityDaySummaryProps = {
  totalMinutes: number;
  /** Estimated MET kcal — informational only; never offsets food targets. */
  activityKcal: number | null;
  /** Daily steps from Garmin (or other integration); null = unknown, not zero. */
  steps?: number | null;
  /** Distance from daily stats (m). */
  distanceM?: number | null;
  /** Active kcal from daily stats when known. */
  activeKcal?: number | null;
  /** Workouts logged that day. */
  workoutCount?: number;
  /** Sum of Garmin/manual workout calories when known. */
  workoutCalories?: number | null;
  testID?: string;
};

function formatKm(distanceM: number | null | undefined): string {
  if (distanceM == null || !Number.isFinite(distanceM) || distanceM < 0) return '—';
  const km = distanceM / 1000;
  return km >= 10 ? String(Math.round(km)) : km.toFixed(1);
}

/**
 * Day movement glance. Energy here is never subtracted from food diary goals.
 */
export function ActivityDaySummary({
  totalMinutes,
  activityKcal,
  steps = null,
  distanceM = null,
  activeKcal = null,
  workoutCount = 0,
  workoutCalories = null,
  testID = 'activity-day-summary',
}: ActivityDaySummaryProps) {
  const kcal = workoutCalories ?? activeKcal ?? activityKcal;
  const kcalMeta =
    workoutCalories != null
      ? 'из тренировок'
      : activeKcal != null
        ? 'активные (Garmin)'
        : activityKcal != null
          ? 'оценка MET'
          : 'нет данных';

  return (
    <View style={styles.wrap} testID={testID} accessibilityLabel="Активность за день">
      <MetricCard
        label="Минуты"
        value={totalMinutes > 0 ? totalMinutes : null}
        unit="мин"
        meta={
          workoutCount > 0
            ? `${workoutCount} тр. · не вычитается из еды`
            : 'не вычитается из еды'
        }
        testID={`${testID}-minutes`}
      />
      <View style={styles.sideRow}>
        <Stat
          testID={`${testID}-steps`}
          label="Шаги"
          value={steps == null ? '—' : steps.toLocaleString('ru-RU')}
          meta={steps == null ? 'Garmin —' : 'за день'}
        />
        <View style={styles.sideRule} />
        <Stat
          testID={`${testID}-distance`}
          label="Дистанция"
          value={formatKm(distanceM)}
          meta={distanceM == null ? 'нет данных' : 'км'}
        />
        <View style={styles.sideRule} />
        <Stat
          testID={`${testID}-kcal`}
          label="Ккал"
          value={kcal == null ? '—' : String(Math.round(kcal))}
          meta={kcalMeta}
        />
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  meta,
  testID,
}: {
  label: string;
  value: string;
  meta: string;
  testID: string;
}) {
  return (
    <View style={styles.sideCell} testID={testID}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <AppText variant="subtitle" style={styles.sideValue}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted" numberOfLines={1}>
        {meta}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.sm,
  },
  sideRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
  },
  sideCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 2,
  },
  sideValue: { fontWeight: '800' },
  sideRule: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
});

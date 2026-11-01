import { StyleSheet, View } from 'react-native';

import { AppText, MetricCard, space } from '@/src/design-system';

type ActivityDaySummaryProps = {
  totalMinutes: number;
  /** Estimated MET kcal — informational only; never offsets food targets. */
  activityKcal: number | null;
  /** Daily steps from Garmin (or other integration); null = unknown, not zero. */
  steps?: number | null;
  /** Workouts logged that day. */
  workoutCount?: number;
  /** Sum of Garmin/manual workout calories when known. */
  workoutCalories?: number | null;
  testID?: string;
};

/**
 * Day activity glance. Zero minutes means no logs (shown as «—» for kcal when unknown).
 * Workout energy is never subtracted from food diary goals.
 */
export function ActivityDaySummary({
  totalMinutes,
  activityKcal,
  steps = null,
  workoutCount = 0,
  workoutCalories = null,
  testID = 'activity-day-summary',
}: ActivityDaySummaryProps) {
  return (
    <View style={styles.wrap} testID={testID} accessibilityLabel="Активность за день">
      <AppText variant="label" tone="secondary">
        Активность · не вычитается из еды
      </AppText>
      <View style={styles.row}>
        <View style={styles.item}>
          <MetricCard
            label="Минуты"
            value={totalMinutes > 0 ? totalMinutes : null}
            unit="мин"
            meta={workoutCount > 0 ? `${workoutCount} тр.` : 'нет записей'}
            testID={`${testID}-minutes`}
          />
        </View>
        <View style={styles.item}>
          <MetricCard
            label="Оценка MET"
            value={activityKcal}
            unit="ккал"
            meta="не из еды"
            testID={`${testID}-kcal`}
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.item}>
          <MetricCard
            label="Шаги"
            value={steps}
            unit="шаг"
            meta={steps == null ? 'нет данных Garmin' : 'из Garmin'}
            testID={`${testID}-steps`}
          />
        </View>
        <View style={styles.item}>
          <MetricCard
            label="Ккал Garmin"
            value={workoutCalories}
            unit="ккал"
            meta={workoutCalories == null ? 'нет в activity' : 'сумма тренировок'}
            testID={`${testID}-garmin-kcal`}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.md,
    marginBottom: space.md,
  },
  row: {
    flexDirection: 'row',
    gap: space.sm,
  },
  item: {
    flex: 1,
  },
});

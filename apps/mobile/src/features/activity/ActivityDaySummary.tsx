import { StyleSheet, View } from 'react-native';

import { AppText, MetricCard, space } from '@/src/design-system';

type ActivityDaySummaryProps = {
  totalMinutes: number;
  /** Estimated MET kcal — informational only; never offsets food targets. */
  activityKcal: number | null;
  testID?: string;
};

/**
 * Day activity glance. Zero minutes means no logs (shown as «—» for kcal when unknown).
 * Workout energy is never subtracted from food diary goals.
 */
export function ActivityDaySummary({
  totalMinutes,
  activityKcal,
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
            meta={totalMinutes > 0 ? 'за выбранный день' : 'нет записей'}
            testID={`${testID}-minutes`}
          />
        </View>
        <View style={styles.item}>
          <MetricCard
            label="Оценка"
            value={activityKcal}
            unit="ккал"
            meta="MET · только факт"
            testID={`${testID}-kcal`}
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

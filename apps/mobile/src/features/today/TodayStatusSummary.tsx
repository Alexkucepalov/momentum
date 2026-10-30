import { StyleSheet, View } from 'react-native';

import type { DailyTotals } from '../../../../../src/storage/types';
import { AppText, MetricCard, space } from '@/src/design-system';

type TodayStatusSummaryProps = {
  totals: DailyTotals;
  waterMl: number;
  waterTargetMl: number | null;
  activityMinutes: number;
  energyTargetKcal: number | null;
  testID?: string;
};

/**
 * Today glance: energy (unknown ≠ 0), water, activity minutes.
 * Empty diary shows «—» for energy — never fabricated kcal.
 */
export function TodayStatusSummary({
  totals,
  waterMl,
  waterTargetMl,
  activityMinutes,
  energyTargetKcal,
  testID = 'today-status-summary',
}: TodayStatusSummaryProps) {
  const energyMeta =
    energyTargetKcal != null && Number.isFinite(energyTargetKcal)
      ? `цель ${Math.round(energyTargetKcal)} ккал`
      : totals.entryCount === 0
        ? 'дневник пуст'
        : totals.hasUnknownFields
          ? 'есть неизвестные'
          : `${totals.entryCount} зап.`;

  const waterMeta =
    waterTargetMl != null && waterTargetMl > 0
      ? `цель ${waterTargetMl} мл`
      : waterMl > 0
        ? 'без цели'
        : 'нажми +250 в карточке ниже';

  return (
    <View style={styles.wrap} testID={testID} accessibilityLabel="Статус дня">
      <AppText variant="label" tone="secondary">
        Сегодня
      </AppText>
      <MetricCard
        label="Энергия"
        value={totals.entryCount === 0 ? null : totals.energyKcal}
        unit="ккал"
        meta={energyMeta}
        testID={`${testID}-energy`}
      />
      <View style={styles.row}>
        <View style={styles.item}>
          <MetricCard
            label="Вода"
            value={waterMl}
            unit="мл"
            meta={waterMeta}
            testID={`${testID}-water`}
          />
        </View>
        <View style={styles.item}>
          <MetricCard
            label="Активность"
            value={activityMinutes > 0 ? activityMinutes : null}
            unit="мин"
            meta={activityMinutes > 0 ? 'тренировки' : 'пока нет'}
            testID={`${testID}-activity`}
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

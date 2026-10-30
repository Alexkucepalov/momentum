import { StyleSheet, View } from 'react-native';

import type { DailyTotals } from '../../../../../src/storage/types';
import { MetricCard } from '@/src/design-system';
import { space } from '@/src/design-system';

type DiaryDaySummaryProps = {
  totals: DailyTotals;
  energyTargetKcal: number | null;
  testID?: string;
};

/**
 * Day nutrition glance — unknown macros stay "—" (never coerced to 0).
 */
export function DiaryDaySummary({
  totals,
  energyTargetKcal,
  testID = 'diary-day-summary',
}: DiaryDaySummaryProps) {
  const targetMeta =
    energyTargetKcal != null && Number.isFinite(energyTargetKcal)
      ? `цель ${Math.round(energyTargetKcal)} ккал`
      : totals.entryCount === 0
        ? 'пока пусто'
        : totals.hasUnknownFields
          ? 'есть неизвестные значения'
          : `${totals.entryCount} зап.`;

  return (
    <View style={styles.wrap} testID={testID} accessibilityLabel="Итоги дня по питанию">
      <MetricCard
        label="Энергия"
        value={totals.entryCount === 0 ? null : totals.energyKcal}
        unit="ккал"
        meta={targetMeta}
        testID={`${testID}-energy`}
      />
      <View style={styles.macros}>
        <View style={styles.macroItem}>
          <MetricCard
            label="Белки"
            value={totals.entryCount === 0 ? null : totals.proteinG}
            unit="г"
            testID={`${testID}-protein`}
          />
        </View>
        <View style={styles.macroItem}>
          <MetricCard
            label="Жиры"
            value={totals.entryCount === 0 ? null : totals.fatG}
            unit="г"
            testID={`${testID}-fat`}
          />
        </View>
        <View style={styles.macroItem}>
          <MetricCard
            label="Углев."
            value={totals.entryCount === 0 ? null : totals.carbG}
            unit="г"
            testID={`${testID}-carb`}
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
  macros: {
    flexDirection: 'row',
    gap: space.sm,
  },
  macroItem: {
    flex: 1,
  },
});

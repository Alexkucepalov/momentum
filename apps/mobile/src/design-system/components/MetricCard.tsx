import { StyleSheet, View } from 'react-native';

import { formatMetricValue } from '../../../../../src/design-system/metricFormat';
import { space } from '../tokens';
import { AppCard } from './AppCard';
import { AppText } from './AppText';

export { formatMetricValue };

type MetricCardProps = {
  label: string;
  /** Numeric or string metric. `null`/`undefined` means unknown — never coerced to 0. */
  value: number | string | null | undefined;
  unit?: string;
  meta?: string;
  accessibilityLabel?: string;
  testID?: string;
};

export function MetricCard({
  label,
  value,
  unit,
  meta,
  accessibilityLabel,
  testID,
}: MetricCardProps) {
  const display = formatMetricValue(value);
  const a11y =
    accessibilityLabel ??
    `${label}: ${display}${unit ? ` ${unit}` : ''}${meta ? `, ${meta}` : ''}`;

  return (
    <AppCard accessibilityLabel={a11y} testID={testID}>
      <AppText variant="label" tone="secondary">
        {label}
      </AppText>
      <View style={styles.row}>
        <AppText variant="metric" accessibilityRole="text">
          {display}
        </AppText>
        {unit ? (
          <AppText variant="caption" tone="secondary" style={styles.unit}>
            {unit}
          </AppText>
        ) : null}
      </View>
      {meta ? (
        <AppText variant="caption" tone="muted">
          {meta}
        </AppText>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm,
  },
  unit: {
    marginBottom: 4,
  },
});

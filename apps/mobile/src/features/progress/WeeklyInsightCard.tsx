import { StyleSheet, Text } from 'react-native';

import { formatDateRu } from '../../../../../src/domain/dateFormatRu';
import type { WeeklyInsight } from '../../../../../src/domain/weeklyInsight';
import { colors, space, type } from '../../theme/tokens';
import { AppCard } from '@/src/ui/AppCard';

export function WeeklyInsightCard({ insight }: { insight: WeeklyInsight }) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.range}>
        {formatDateRu(insight.weekStart)} — {formatDateRu(insight.weekEnd)}
      </Text>
      {insight.lines.map((line) => (
        <Text key={line} style={styles.line}>
          {line}
        </Text>
      ))}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.md, gap: space.sm },
  range: {
    fontSize: type.micro,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.textMuted,
    marginBottom: space.xs,
  },
  line: {
    fontSize: type.body,
    color: colors.text,
    lineHeight: 22,
  },
});

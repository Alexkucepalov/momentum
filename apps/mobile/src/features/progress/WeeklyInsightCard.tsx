import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatDateRu } from '../../../../../src/domain/dateFormatRu';
import type { WeeklyInsight } from '../../../../../src/domain/weeklyInsight';
import { AppText, colors, radius, space } from '@/src/design-system';

export function WeeklyInsightCard({ insight }: { insight: WeeklyInsight }) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <Ionicons name="calendar-outline" size={18} color={colors.ink} />
        </View>
        <View style={styles.flex}>
          <AppText variant="subtitle" style={styles.title} accessibilityRole="header">
            Неделя
          </AppText>
          <AppText variant="caption" tone="muted">
            {formatDateRu(insight.weekStart)} → {formatDateRu(insight.weekEnd)}
          </AppText>
        </View>
      </View>
      {insight.lines.map((line) => (
        <AppText key={line} variant="caption" tone="secondary" style={styles.line}>
          {line}
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.xs,
  },
  head: {
    flexDirection: 'row',
    gap: space.md,
    marginBottom: space.sm,
    alignItems: 'center',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 2 },
  title: { fontWeight: '800' },
  line: { lineHeight: 20 },
});

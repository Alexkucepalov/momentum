import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatDateRu } from '../../../../../src/domain/dateFormatRu';
import type { WeeklyInsight } from '../../../../../src/domain/weeklyInsight';
import { colors, radius, space, type } from '../../theme/tokens';
import { AppCard } from '@/src/ui/AppCard';

export function WeeklyInsightCard({ insight }: { insight: WeeklyInsight }) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <Ionicons name="calendar-outline" size={18} color={colors.text} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title} accessibilityRole="header">
            Итоги
          </Text>
          <Text style={styles.range}>
            {formatDateRu(insight.weekStart)} → {formatDateRu(insight.weekEnd)}
          </Text>
        </View>
      </View>
      {insight.lines.map((line) => (
        <Text key={line} style={styles.line}>
          {line}
        </Text>
      ))}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.xl },
  head: { flexDirection: 'row', gap: space.md, marginBottom: space.md, alignItems: 'center' },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  title: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  range: { fontSize: type.micro, color: colors.textMuted, marginTop: 2 },
  line: {
    fontSize: type.caption,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: space.xs,
  },
});

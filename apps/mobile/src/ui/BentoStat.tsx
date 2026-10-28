import { StyleSheet, Text, View } from 'react-native';

import { colors, space, type } from '@/src/theme/tokens';
import { AppCard } from './AppCard';

/** Canonical metric cell — large number + label (Nutrition Soft Light). */
export function BentoStat({
  label,
  value,
  meta,
  wide,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  value: string;
  meta?: string;
  wide?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <AppCard
      onPress={onPress}
      style={[styles.card, wide && styles.wide]}
      accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 104, marginBottom: space.sm },
  wide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 72,
  },
  label: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  valueRow: { gap: 2 },
  value: {
    fontSize: type.hero,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  meta: { fontSize: type.caption, color: colors.textSecondary, fontWeight: '600' },
});

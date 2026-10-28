import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space, type } from '@/src/theme/tokens';
import { AppCard } from './AppCard';

/** Soft masonry metric cell (ref 10) — label + value + optional visual. */
export function SoftMetricCard({
  label,
  value,
  meta,
  visual,
  tall,
  wide,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  value: string;
  meta?: string;
  visual?: ReactNode;
  tall?: boolean;
  wide?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <AppCard
      onPress={onPress}
      style={[styles.card, tall && styles.tall, wide && styles.wide]}
      accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.body}>
        {visual}
        <View style={styles.copy}>
          <Text style={styles.value}>{value}</Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 112,
    gap: space.sm,
  },
  tall: { minHeight: 168 },
  wide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 88,
  },
  label: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textMuted,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  copy: { flex: 1, gap: 2 },
  value: {
    fontSize: type.title,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
  },
  meta: {
    fontSize: type.micro,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

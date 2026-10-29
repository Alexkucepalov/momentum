import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { colors, space, type } from '@/src/theme/tokens';
import { AppCard } from '@/src/ui/AppCard';

/**
 * Ref 01 bodyweight block: large kg on the left, quiet week bars on the right.
 * Coral marks a real week change only — empty history stays flat and muted.
 */
export function ProgressWeightHero({
  kg,
  deltaLabel,
  deltaSigned,
  hint,
  bars,
  onLog,
}: {
  kg: number | null;
  deltaLabel: string | null;
  deltaSigned: number;
  hint: string;
  /** 0..1, oldest → newest. Empty array renders a flat placeholder. */
  bars: number[];
  onLog: () => void;
}) {
  const series = bars.length > 0 ? bars : [0.28, 0.28, 0.28, 0.28, 0.28, 0.28, 0.28];
  const showFocus = bars.length > 0 && deltaSigned !== 0;

  return (
    <AppCard style={styles.card}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.label}>ВЕС</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.value, kg == null && styles.valueEmpty]}>
              {kg == null ? '—' : String(kg)}
            </Text>
            <Text style={styles.unit}>кг</Text>
          </View>
          {deltaLabel ? (
            <Text
              style={[styles.delta, showFocus && styles.deltaFocus]}
              accessibilityLabel={deltaLabel}
            >
              {deltaLabel}
              {deltaSigned > 0 ? ' ↑' : deltaSigned < 0 ? ' ↓' : ''}
            </Text>
          ) : (
            <Text style={styles.deltaMuted}>пока нет сравнения</Text>
          )}
          <Text style={styles.hint}>{hint}</Text>
        </View>
        <View
          style={styles.bars}
          accessibilityElementsHidden
          accessibilityLabel="Столбики последних взвешиваний"
        >
          {series.map((h, i) => {
            const last = i === series.length - 1;
            const px = Math.round(10 + Math.max(0.15, Math.min(1, h)) * 54);
            return (
              <View
                key={i}
                style={[
                  styles.bar,
                  { height: px },
                  last && showFocus ? styles.barFocus : styles.barMute,
                ]}
              />
            );
          })}
        </View>
      </View>
      <PrimaryButton label="Записать вес" onPress={onLog} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.md, gap: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  copy: { flex: 1 },
  label: {
    fontSize: type.micro,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.textMuted,
    marginBottom: space.sm,
  },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  value: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.6,
    color: colors.text,
    lineHeight: 48,
  },
  valueEmpty: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  unit: {
    fontSize: type.subtitle,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  delta: {
    marginTop: space.sm,
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  deltaFocus: { color: colors.focus },
  deltaMuted: {
    marginTop: space.sm,
    fontSize: type.caption,
    fontWeight: '600',
    color: colors.textMuted,
  },
  hint: {
    marginTop: space.xs,
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '600',
  },
  bars: {
    width: 112,
    height: 72,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
  },
  bar: {
    flex: 1,
    borderRadius: 4,
    minHeight: 8,
  },
  barMute: { backgroundColor: colors.accentSoft },
  barFocus: { backgroundColor: colors.focus },
});

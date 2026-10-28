import { StyleSheet, Text, View } from 'react-native';

import { colors, space, type } from '@/src/theme/tokens';
import { AppCard } from '@/src/ui/AppCard';

/** Soft bento cell — bodyweight + mini week bars (refs 01 + 08). */
export function HomeWeightCard({
  kg,
  deltaLabel,
  deltaSigned,
  weekBars,
  onPress,
}: {
  kg: number | null;
  deltaLabel: string | null;
  deltaSigned: number;
  /** 0..1 heights oldest→newest for up to 7 days. */
  weekBars: number[];
  onPress: () => void;
}) {
  return (
    <AppCard
      onPress={onPress}
      style={styles.card}
      accessibilityLabel={
        kg == null
          ? 'Вес не задан. Открыть прогресс'
          : `Вес ${kg} килограмм${deltaLabel ? `. ${deltaLabel}` : ''}`
      }
    >
      <Text style={styles.label}>Вес</Text>
      <Text style={styles.value}>{kg == null ? '—' : `${kg}`}</Text>
      <Text style={styles.unit}>кг</Text>
      {deltaLabel ? (
        <Text
          style={[styles.delta, deltaSigned !== 0 && styles.deltaFocus]}
          accessibilityLabel={deltaLabel}
        >
          {deltaLabel}
          {deltaSigned > 0 ? ' ↑' : deltaSigned < 0 ? ' ↓' : ''}
        </Text>
      ) : (
        <Text style={styles.deltaMuted}>добавь первое значение</Text>
      )}
      <View style={styles.bars} accessibilityElementsHidden>
        {(weekBars.length > 0 ? weekBars : [0.35, 0.4, 0.38, 0.42, 0.45, 0.5, 0.55]).map(
          (h, i, arr) => {
            const last = i === arr.length - 1;
            const px = Math.round(6 + Math.max(0.15, Math.min(1, h)) * 28);
            return (
              <View
                key={i}
                style={[styles.bar, { height: px }, last ? styles.barFocus : styles.barMute]}
              />
            );
          },
        )}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 168,
    gap: 2,
  },
  label: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  value: {
    fontSize: type.hero,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1.2,
  },
  unit: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: space.sm,
  },
  delta: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  deltaFocus: { color: colors.focus },
  deltaMuted: {
    fontSize: type.micro,
    color: colors.textMuted,
  },
  bars: {
    marginTop: 'auto',
    height: 36,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 3,
    paddingTop: space.sm,
  },
  bar: {
    flex: 1,
    borderRadius: 4,
  },
  barMute: { backgroundColor: colors.accentSoft },
  barFocus: { backgroundColor: colors.focus },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, space, surfaceCard, type } from '@/src/theme/tokens';

/** Ref 01 — bodyweight hero + mini week bars. */
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={
        kg == null
          ? 'Вес не задан. Открыть прогресс'
          : `Вес ${kg} килограмм${deltaLabel ? `. ${deltaLabel}` : ''}`
      }
    >
      <View style={styles.left}>
        <Text style={styles.label}>ВЕС</Text>
        <Text style={styles.value}>{kg == null ? '—' : `${kg} кг`}</Text>
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
      </View>
      <View style={styles.bars} accessibilityElementsHidden>
        {(weekBars.length > 0 ? weekBars : [0.35, 0.4, 0.38, 0.42, 0.45, 0.5, 0.55]).map(
          (h, i, arr) => {
            const last = i === arr.length - 1;
            const px = Math.round(8 + Math.max(0.15, Math.min(1, h)) * 56);
            return (
              <View
                key={i}
                style={[styles.bar, { height: px }, last ? styles.barFocus : styles.barMute]}
              />
            );
          },
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...surfaceCard,
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: space.lg,
    marginBottom: space.md,
    gap: space.lg,
    minHeight: 112,
  },
  pressed: { opacity: 0.92 },
  left: { flex: 1, justifyContent: 'center' },
  label: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  value: {
    fontSize: type.hero,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  delta: {
    marginTop: 6,
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  deltaFocus: { color: colors.focus },
  deltaMuted: {
    marginTop: 6,
    fontSize: type.caption,
    color: colors.textMuted,
  },
  bars: {
    width: 88,
    height: 72,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
  },
  bar: {
    flex: 1,
    borderRadius: 4,
  },
  barMute: { backgroundColor: colors.accentSoft },
  barFocus: { backgroundColor: colors.focus },
});

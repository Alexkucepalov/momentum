import { StyleSheet, View } from 'react-native';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';

import { colors, radius, space, type } from '../theme/tokens';

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return String(Math.round(n));
}

/** Compact per-100g (or absolute) macros — color + letter label for a11y. */
export function MacroStrip({
  energyKcal,
  proteinG,
  fatG,
  carbG,
  suffix = '/100г',
}: {
  energyKcal: number | null | undefined;
  proteinG: number | null | undefined;
  fatG: number | null | undefined;
  carbG: number | null | undefined;
  suffix?: string;
}) {
  return (
    <View style={styles.row} accessibilityRole="text">
      <View style={[styles.chip, styles.kcalChip]}>
        <Text style={styles.kcalValue}>{fmt(energyKcal)}</Text>
        <Text style={styles.kcalUnit}>ккал{suffix}</Text>
      </View>
      <View style={styles.chip}>
        <Text style={[styles.letter, { color: colors.protein }]}>Б</Text>
        <Text style={styles.value}>{fmt(proteinG)}</Text>
      </View>
      <View style={styles.chip}>
        <Text style={[styles.letter, { color: colors.fat }]}>Ж</Text>
        <Text style={styles.value}>{fmt(fatG)}</Text>
      </View>
      <View style={styles.chip}>
        <Text style={[styles.letter, { color: colors.carbs }]}>У</Text>
        <Text style={styles.value}>{fmt(carbG)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: space.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    minHeight: 26,
  },
  kcalChip: {
    backgroundColor: colors.text,
  },
  letter: { fontSize: type.micro, fontWeight: '800' },
  value: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  kcalValue: { fontSize: type.caption, fontWeight: '800', color: colors.primaryButtonText },
  kcalUnit: { fontSize: type.micro, fontWeight: '600', color: colors.textMuted },
});

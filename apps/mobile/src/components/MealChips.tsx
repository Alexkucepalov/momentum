import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';

import type { MealSlot } from '../../../../src/storage/types';
import { colors, radius, space, touchMin, type } from '../theme/tokens';

const MEALS: Array<{ id: MealSlot; label: string }> = [
  { id: 'breakfast', label: 'Завтрак' },
  { id: 'lunch', label: 'Обед' },
  { id: 'dinner', label: 'Ужин' },
  { id: 'snack', label: 'Перекус' },
];

export function MealChips({
  value,
  onChange,
  compact,
}: {
  value: MealSlot;
  onChange: (meal: MealSlot) => void;
  compact?: boolean;
}) {
  return (
    <View
      style={[styles.wrap, compact && styles.wrapCompact]}
      accessibilityRole="tablist"
      accessibilityLabel="Приём пищи"
    >
      {MEALS.map((m) => {
        const on = value === m.id;
        return (
          <Pressable
            key={m.id}
            onPress={() => onChange(m.id)}
            style={({ pressed }) => [
              styles.chip,
              compact && styles.chipCompact,
              on && styles.chipOn,
              pressed && styles.pressed,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }} aria-selected={on}
            accessibilityLabel={m.label}
          >
            <Text style={[styles.label, compact && styles.labelCompact, on && styles.labelOn]}>
              {m.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.lg,
  },
  wrapCompact: {
    marginBottom: 0,
  },
  chip: {
    paddingHorizontal: space.md,
    minHeight: touchMin,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCompact: {
    minHeight: touchMin,
    paddingHorizontal: space.md,
  },
  chipOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  pressed: { opacity: 0.88 },
  label: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.text,
  },
  labelCompact: {
    fontSize: type.micro,
  },
  labelOn: {
    color: colors.primaryButtonText,
  },
});

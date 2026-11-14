import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText, colors, radius, space, type, touchMin } from '@/src/design-system';

export function AddFoodActionChip({
  icon,
  label,
  onPress,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipOn]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={16} color={active ? colors.onAccent : colors.ink} />
      <AppText
        variant="caption"
        tone={active ? 'inverse' : 'ink'}
        style={styles.label}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: touchMin,
  },
  chipOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  label: { fontSize: type.micro, fontWeight: '700' },
});

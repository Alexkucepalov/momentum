import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, space, touchMin } from '../tokens';
import { AppText } from './AppText';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

/** Filter / toggle chip — height ≥ 40, touch target padded to 48 where needed. */
export function Chip({
  label,
  selected = false,
  onPress,
  disabled,
  accessibilityLabel,
  testID,
}: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipOn,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <AppText variant="caption" tone={selected ? 'inverse' : 'ink'} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    // Expand hit slop visually toward touchMin without forcing huge chips.
    marginVertical: Math.max(0, (touchMin - 40) / 2),
  },
  chipOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  label: { fontWeight: '700' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
});

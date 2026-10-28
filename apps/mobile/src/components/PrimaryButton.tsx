import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, touchMin, type } from '../theme/tokens';

type Variant = 'primary' | 'secondary';

/** Canonical CTA — primary = black pill; secondary = text (no second black job). */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  accessibilityHint,
  variant = 'primary',
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
  variant?: Variant;
}) {
  const secondary = variant === 'secondary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        secondary && styles.btnSecondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={[styles.text, secondary && styles.textSecondary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primaryButton,
    minHeight: touchMin,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    color: colors.primaryButtonText,
    fontSize: type.body,
    fontWeight: '800',
  },
  textSecondary: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
});

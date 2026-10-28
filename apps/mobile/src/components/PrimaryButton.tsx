import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, touchMin, type } from '../theme/tokens';

export function PrimaryButton({
  label,
  onPress,
  disabled,
  accessibilityHint,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={styles.text}>{label}</Text>
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
});

import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, elevation, touchMin } from '@/src/theme/tokens';

/** Soft circular icon control (ref 08 header / card chevrons). */
export function CircleIconButton({
  icon,
  onPress,
  accessibilityLabel,
  tone = 'light',
  size = 'md',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: 'light' | 'inverse' | 'dark';
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 40 : touchMin;
  const iconSize = size === 'sm' ? 18 : 20;
  const fg =
    tone === 'inverse' ? colors.text : tone === 'dark' ? colors.darkText : colors.text;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { width: dim, height: dim, borderRadius: dim / 2 },
        tone === 'light' && styles.light,
        tone === 'inverse' && styles.inverse,
        tone === 'dark' && styles.dark,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={iconSize} color={fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  light: {
    backgroundColor: colors.surface,
    ...elevation.card,
  },
  inverse: {
    backgroundColor: colors.surface,
  },
  dark: {
    backgroundColor: colors.darkSurfaceRaised,
  },
  pressed: { opacity: 0.88 },
});

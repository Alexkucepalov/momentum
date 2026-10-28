import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, elevation, radius, space } from '@/src/theme/tokens';

type Variant = 'raised' | 'flat' | 'dark';

/** Global card primitive — use instead of ad-hoc bordered Views. */
export function AppCard({
  children,
  variant = 'raised',
  padding = 'lg',
  style,
  onPress,
  accessibilityLabel,
  accessibilityRole,
}: {
  children: ReactNode;
  variant?: Variant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'summary' | 'none';
}) {
  const pad =
    padding === 'none' ? 0 : padding === 'sm' ? space.sm : padding === 'md' ? space.md : space.lg;
  const body = (
    <View
      style={[
        styles.base,
        variant === 'raised' && styles.raised,
        variant === 'flat' && styles.flat,
        variant === 'dark' && styles.dark,
        { padding: pad },
        style,
      ]}
      accessibilityRole={!onPress ? accessibilityRole : undefined}
      accessibilityLabel={!onPress ? accessibilityLabel : undefined}
    >
      {children}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  raised: {
    backgroundColor: colors.surface,
    ...elevation.card,
  },
  flat: {
    backgroundColor: colors.accentSoft,
  },
  dark: {
    backgroundColor: colors.darkBg,
  },
  pressed: { opacity: 0.92 },
});

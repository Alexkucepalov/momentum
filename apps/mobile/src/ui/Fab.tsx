import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { shell } from '@/src/theme/shell';
import { colors, elevation, touchMin } from '@/src/theme/tokens';

/** Black circular FAB — Nutrition ref «+». */
export function Fab({
  onPress,
  accessibilityLabel = 'Добавить',
}: {
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name="add" size={28} color={colors.primaryButtonText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: shell.fabBottom,
    width: touchMin + 8,
    height: touchMin + 8,
    borderRadius: (touchMin + 8) / 2,
    backgroundColor: colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.tabBar,
  },
  pressed: { opacity: 0.88 },
});

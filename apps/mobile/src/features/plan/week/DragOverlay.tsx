import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { colors, radius, space, type } from '@/src/theme/tokens';
import { usePlanDrag } from './planDragContext';

/** Floating ghost — position driven by Reanimated shared values (no per-frame React). */
export function DragOverlay({
  pointerX,
  pointerY,
}: {
  pointerX: SharedValue<number>;
  pointerY: SharedValue<number>;
}) {
  const { activeMeal, cancelDrag } = usePlanDrag();

  const ghostStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.max(12, pointerX.value - 110) },
      { translateY: Math.max(12, pointerY.value - 32) },
    ],
  }));

  if (!activeMeal) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[styles.ghost, ghostStyle]} pointerEvents="none">
        <View style={styles.thumb}>
          <Text style={styles.thumbIcon}>↕</Text>
        </View>
        <View style={styles.ghostText}>
          <Text style={styles.ghostTitle} numberOfLines={1}>
            {activeMeal.displayName}
          </Text>
          <Text style={styles.ghostMeta}>{Math.round(activeMeal.grams)} г</Text>
        </View>
      </Animated.View>
      <Pressable
        style={styles.cancel}
        onPress={cancelDrag}
        accessibilityRole="button"
        accessibilityLabel="Отменить перенос"
      >
        <Text style={styles.cancelText}>Отмена</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    elevation: 100,
  },
  ghost: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.text,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: { fontSize: 16, fontWeight: '800', color: colors.text },
  ghostText: { flex: 1, minWidth: 0 },
  ghostTitle: { fontSize: type.body, fontWeight: '700', color: colors.text },
  ghostMeta: { fontSize: type.caption, color: colors.textSecondary, marginTop: 1 },
  cancel: {
    position: 'absolute',
    top: space.md,
    right: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { fontSize: type.caption, fontWeight: '700', color: colors.text },
});

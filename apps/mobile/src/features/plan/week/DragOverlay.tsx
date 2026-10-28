import { useMemo, useRef } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { colors, radius, space, type } from '@/src/theme/tokens';
import { usePlanDrag } from './planDragContext';

/** Floating ghost while dragging — reference screen 3. */
export function DragOverlay({
  onDrop,
}: {
  onDrop: (
    mealId: string,
    target: import('./planDragContext').DropTarget | null,
  ) => void;
}) {
  const { session, updatePointer, endDrag, cancelDrag } = usePlanDrag();
  const mealIdRef = useRef<string | null>(null);
  mealIdRef.current = session?.meal.id ?? null;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          updatePointer(e.nativeEvent.pageX, e.nativeEvent.pageY);
        },
        onPanResponderMove: (e: GestureResponderEvent) => {
          updatePointer(e.nativeEvent.pageX, e.nativeEvent.pageY);
        },
        onPanResponderRelease: () => {
          const id = mealIdRef.current;
          const target = endDrag();
          if (id) onDrop(id, target);
        },
        onPanResponderTerminate: () => {
          cancelDrag();
        },
      }),
    [updatePointer, endDrag, cancelDrag, onDrop],
  );

  if (!session) return null;

  return (
    <View style={styles.root} {...pan.panHandlers} pointerEvents="box-only">
      <View
        pointerEvents="none"
        style={[
          styles.ghost,
          {
            left: Math.max(12, session.pointerX - 110),
            top: Math.max(12, session.pointerY - 32),
          },
        ]}
      >
        <View style={styles.thumb}>
          <Text style={styles.thumbIcon}>↕</Text>
        </View>
        <View style={styles.ghostText}>
          <Text style={styles.ghostTitle} numberOfLines={1}>
            {session.meal.displayName}
          </Text>
          <Text style={styles.ghostMeta}>{Math.round(session.meal.grams)} г</Text>
        </View>
      </View>
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
    width: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.preview,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: { fontSize: 14, fontWeight: '800', color: colors.carbs },
  ghostText: { flex: 1, minWidth: 0 },
  ghostTitle: { fontWeight: '800', color: colors.text, fontSize: type.caption },
  ghostMeta: { fontSize: type.micro, color: colors.textSecondary, marginTop: 2 },
  cancel: {
    position: 'absolute',
    bottom: space.xl,
    alignSelf: 'center',
    left: '28%',
    right: '28%',
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontWeight: '800', color: colors.text },
});

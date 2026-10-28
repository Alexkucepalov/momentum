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

/**
 * Full-screen layer while dragging: ghost follows pointer; release commits hover target.
 */
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
          if (id && target) onDrop(id, target);
        },
        onPanResponderTerminate: () => {
          cancelDrag();
        },
      }),
    [updatePointer, endDrag, cancelDrag, onDrop],
  );

  if (!session) return null;

  const label =
    session.hover?.kind === 'slot'
      ? `Отпусти → ${slotRu(session.hover.slot)}`
      : session.hover?.kind === 'day'
        ? 'Отпусти → этот день'
        : 'Наведи на слот или день';

  return (
    <View style={styles.root} {...pan.panHandlers} pointerEvents="box-only">
      <View style={styles.banner} pointerEvents="none">
        <Text style={styles.bannerText}>{label}</Text>
        <Text style={styles.bannerHint}>Отмена — кнопка ниже или уведи палец за экран</Text>
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.ghost,
          {
            left: session.pointerX - 90,
            top: session.pointerY - 28,
          },
        ]}
      >
        <Text style={styles.ghostTitle} numberOfLines={1}>
          {session.meal.displayName}
        </Text>
        <Text style={styles.ghostMeta}>{Math.round(session.meal.grams)} г</Text>
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

function slotRu(slot: string): string {
  switch (slot) {
    case 'breakfast':
      return 'Завтрак';
    case 'lunch':
      return 'Обед';
    case 'dinner':
      return 'Ужин';
    case 'snack':
      return 'Перекус';
    default:
      return slot;
  }
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    elevation: 100,
  },
  banner: {
    position: 'absolute',
    top: space.lg,
    left: space.lg,
    right: space.lg,
    backgroundColor: colors.primaryButton,
    borderRadius: radius.md,
    padding: space.md,
    gap: 4,
  },
  bannerText: {
    color: colors.primaryButtonText,
    fontWeight: '800',
    fontSize: type.body,
    textAlign: 'center',
  },
  bannerHint: {
    color: colors.chipOnInverse,
    fontSize: type.micro,
    textAlign: 'center',
  },
  ghost: {
    position: 'absolute',
    width: 180,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primaryButton,
    shadowColor: colors.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  ghostTitle: { fontWeight: '800', color: colors.text, fontSize: type.caption },
  ghostMeta: { fontSize: type.micro, color: colors.textSecondary, marginTop: 2 },
  cancel: {
    position: 'absolute',
    bottom: space.xl,
    alignSelf: 'center',
    left: '30%',
    right: '30%',
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

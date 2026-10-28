import { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, type SharedValue } from 'react-native-reanimated';

import type { PlannedMeal } from '../../../../../../src/storage/types';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { usePlanDrag, type DropTarget } from './planDragContext';

const LONG_PRESS_MS = 300;

/** Flat meal row — continuous long-press pan (no overlay hand-off). */
export function PlannedMealCard({
  meal,
  kcalLabel,
  onOpenMenu,
  pointerX,
  pointerY,
  onDrop,
}: {
  meal: PlannedMeal;
  kcalLabel: string;
  onOpenMenu: () => void;
  pointerX: SharedValue<number>;
  pointerY: SharedValue<number>;
  onDrop: (mealId: string, target: DropTarget | null) => void;
}) {
  const logged = meal.status === 'logged';
  const { activeMeal, beginDrag, updatePointer, endDrag, cancelDrag } = usePlanDrag();
  const dragging = activeMeal?.id === meal.id;

  const mealRef = useRef(meal);
  mealRef.current = meal;
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const beginRef = useRef(beginDrag);
  beginRef.current = beginDrag;
  const updateRef = useRef(updatePointer);
  updateRef.current = updatePointer;
  const endRef = useRef(endDrag);
  endRef.current = endDrag;
  const cancelRef = useRef(cancelDrag);
  cancelRef.current = cancelDrag;
  const activeIdRef = useRef<string | null>(null);

  const onGestureStart = (x: number, y: number) => {
    activeIdRef.current = mealRef.current.id;
    beginRef.current(mealRef.current, x, y);
  };

  const onGestureMove = (x: number, y: number) => {
    updateRef.current(x, y);
  };

  const onGestureEnd = () => {
    if (!activeIdRef.current) return;
    const id = activeIdRef.current;
    activeIdRef.current = null;
    const target = endRef.current();
    onDropRef.current(id, target);
  };

  const onGestureCancel = () => {
    if (!activeIdRef.current) return;
    activeIdRef.current = null;
    cancelRef.current();
  };

  const pan = useMemo(() => {
    if (logged) return Gesture.Pan().enabled(false);
    return Gesture.Pan()
      .activateAfterLongPress(LONG_PRESS_MS)
      .maxPointers(1)
      .onStart((e) => {
        'worklet';
        pointerX.value = e.absoluteX;
        pointerY.value = e.absoluteY;
        runOnJS(onGestureStart)(e.absoluteX, e.absoluteY);
      })
      .onUpdate((e) => {
        'worklet';
        pointerX.value = e.absoluteX;
        pointerY.value = e.absoluteY;
        runOnJS(onGestureMove)(e.absoluteX, e.absoluteY);
      })
      .onEnd(() => {
        'worklet';
        runOnJS(onGestureEnd)();
      })
      .onFinalize((_e, success) => {
        'worklet';
        if (!success) {
          runOnJS(onGestureCancel)();
        }
      });
  }, [logged, pointerX, pointerY]);

  const row = (
    <View
      style={[styles.card, dragging && styles.cardDragging]}
      accessibilityRole="summary"
      accessibilityLabel={`${meal.displayName}, ${Math.round(meal.grams)} грамм. Удерживайте, чтобы перенести`}
    >
      <Pressable
        onPress={logged || dragging ? undefined : onOpenMenu}
        style={styles.main}
        accessibilityRole="button"
        accessibilityHint="Удерживайте для переноса, нажмите для меню"
      >
        <View style={styles.thumb}>
          <Ionicons
            name={meal.recipeId ? 'restaurant' : 'nutrition'}
            size={18}
            color={colors.textSecondary}
          />
        </View>
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {meal.displayName}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {Math.round(meal.grams)} г
            {logged ? ' · в дневнике' : ''}
          </Text>
        </View>
        <Text style={styles.kcal} numberOfLines={1}>
          {kcalLabel}
        </Text>
      </Pressable>
      {!logged && !dragging ? (
        <Pressable
          onPress={onOpenMenu}
          style={styles.more}
          accessibilityRole="button"
          accessibilityLabel={`Действия: ${meal.displayName}`}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
        </Pressable>
      ) : (
        <View style={styles.moreSpacer} />
      )}
    </View>
  );

  if (logged) return row;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View>{row}</Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.sm,
    paddingLeft: space.sm,
    paddingRight: space.xs,
    marginBottom: space.sm,
    minHeight: touchMin + 8,
    gap: 2,
  },
  cardDragging: {
    opacity: 0.35,
    borderStyle: 'dashed',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touchMin,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  title: { fontSize: type.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: type.caption, color: colors.textSecondary, marginTop: 1 },
  kcal: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginRight: space.xs,
  },
  more: {
    width: 40,
    height: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreSpacer: { width: 40 },
});

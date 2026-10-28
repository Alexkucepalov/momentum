import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PlannedMeal } from '../../../../../../src/storage/types';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { usePlanDrag } from './planDragContext';

/** Compact card matching planner reference: thumb · name · grams · kcal · ⋮ */
export function PlannedMealCard({
  meal,
  kcalLabel,
  onOpenMenu,
}: {
  meal: PlannedMeal;
  /** e.g. "320 ккал" or "— ккал" */
  kcalLabel: string;
  onOpenMenu: () => void;
}) {
  const logged = meal.status === 'logged';
  const { session, beginDrag } = usePlanDrag();
  const dragging = session?.meal.id === meal.id;
  const cardRef = useRef<View>(null);

  const startDrag = () => {
    if (logged) return;
    cardRef.current?.measureInWindow((x, y, width, height) => {
      beginDrag(meal, x + width / 2, y + height / 2);
    });
  };

  return (
    <View
      ref={cardRef}
      collapsable={false}
      style={[styles.card, dragging && styles.cardDragging]}
      accessibilityRole="summary"
      accessibilityLabel={`${meal.displayName}, ${Math.round(meal.grams)} грамм. Удерживайте, чтобы перенести`}
    >
      <Pressable
        onLongPress={startDrag}
        delayLongPress={200}
        onPress={logged ? undefined : onOpenMenu}
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

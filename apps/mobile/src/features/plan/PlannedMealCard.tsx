import { Pressable, StyleSheet, View } from 'react-native';

import type { PlannedMeal } from '../../../../../src/storage/types';
import { AppText, colors, radius, space, touchMin } from '@/src/design-system';
import { formatPlannedKcal } from './mealBoardLabels';

export function PlannedMealCard({
  meal,
  kcal,
  onPress,
  onLog,
  onMove,
  onDelete,
}: {
  meal: PlannedMeal;
  kcal: number | null;
  onPress: () => void;
  /** Explicit plan → diary. Only for status === planned. */
  onLog?: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  const logged = meal.status === 'logged';
  return (
    <View style={styles.card} testID={`planned-meal-${meal.id}`}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${meal.displayName}, ${Math.round(meal.grams)} грамм. Изменить порцию`}
      >
        <AppText variant="body" style={styles.name} numberOfLines={2}>
          {meal.displayName}
        </AppText>
        <AppText variant="caption" tone="muted">
          {Math.round(meal.grams)} г · {formatPlannedKcal(kcal)}
          {logged ? ' · в дневнике' : ''}
        </AppText>
      </Pressable>
      {onLog && meal.status === 'planned' ? (
        <Pressable
          onPress={onLog}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`В дневник ${meal.displayName}`}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          testID={`planned-meal-log-${meal.id}`}
        >
          <AppText variant="caption" tone="ink" style={styles.actionText}>
            В дневник
          </AppText>
        </Pressable>
      ) : null}
      <Pressable
        onPress={onMove}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Перенести ${meal.displayName}`}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        testID={`planned-meal-move-${meal.id}`}
      >
        <AppText variant="caption" tone="secondary" style={styles.actionText}>
          Перенести
        </AppText>
      </Pressable>
      <Pressable
        onPress={onDelete}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Удалить ${meal.displayName}`}
        style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
      >
        <AppText variant="caption" tone="danger">
          ✕
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    minHeight: touchMin,
  },
  body: { flex: 1, gap: 2, minWidth: 0, justifyContent: 'center' },
  name: { fontWeight: '600' },
  action: {
    minHeight: touchMin,
    justifyContent: 'center',
    paddingHorizontal: space.xs,
  },
  actionText: { fontWeight: '700' },
  delete: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
});

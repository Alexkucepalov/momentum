import { Pressable, StyleSheet, View } from 'react-native';

import type { PlannedMeal } from '../../../../../src/storage/types';
import { AppText, colors, radius, space, touchMin } from '@/src/design-system';
import { formatPlannedKcal } from './mealBoardLabels';

export function PlannedMealCard({
  meal,
  kcal,
  onPress,
  onLongPress,
  onDelete,
}: {
  meal: PlannedMeal;
  kcal: number | null;
  onPress: () => void;
  onLongPress: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.card} testID={`planned-meal-${meal.id}`}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={350}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${meal.displayName}, ${Math.round(meal.grams)} грамм. Долгое нажатие — перенести`}
      >
        <AppText variant="body" style={styles.name} numberOfLines={2}>
          {meal.displayName}
        </AppText>
        <AppText variant="caption" tone="muted">
          {Math.round(meal.grams)} г · {formatPlannedKcal(kcal)}
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
  delete: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
});

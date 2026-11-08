import { Pressable, StyleSheet, View } from 'react-native';

import type { PlannedDayNutrition } from '../../../../../src/domain/plannedDayNutrition';
import type { MealSlot, PlannedMeal } from '../../../../../src/storage/types';
import { AppText, colors, radius, space, touchMin } from '@/src/design-system';
import { PlannedMealCard } from './PlannedMealCard';
import {
  MEAL_LABELS_RU,
  MEAL_SLOTS,
  formatPlannedKcal,
  formatRemainingLine,
} from './mealBoardLabels';

export function DayColumn({
  dateLocal,
  weekdayLabel,
  dayNumber,
  nutrition,
  hasEnergyTarget,
  mealsBySlot,
  kcalForMeal,
  onAdd,
  onPressMeal,
  onMoveMeal,
  onDeleteMeal,
}: {
  dateLocal: string;
  weekdayLabel: string;
  dayNumber: number;
  nutrition: PlannedDayNutrition;
  hasEnergyTarget: boolean;
  mealsBySlot: Record<MealSlot, PlannedMeal[]>;
  kcalForMeal: (m: PlannedMeal) => number | null;
  onAdd: (slot: MealSlot) => void;
  onPressMeal: (m: PlannedMeal) => void;
  onMoveMeal: (m: PlannedMeal) => void;
  onDeleteMeal: (m: PlannedMeal) => void;
}) {
  return (
    <View style={styles.col} testID={`day-column-${dateLocal}`}>
      <View style={styles.head}>
        <AppText variant="subtitle" style={styles.headTitle}>
          {weekdayLabel} {dayNumber}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {formatPlannedKcal(nutrition.energyKcal)}
          {nutrition.proteinG != null ? ` · Б ${Math.round(nutrition.proteinG)}` : ''}
          {nutrition.fatG != null ? ` · Ж ${Math.round(nutrition.fatG)}` : ''}
          {nutrition.carbG != null ? ` · У ${Math.round(nutrition.carbG)}` : ''}
        </AppText>
        <AppText variant="caption" tone="muted">
          {formatRemainingLine({
            remainingKcal: nutrition.remaining.energyKcal,
            hasTarget: hasEnergyTarget,
          })}
        </AppText>
      </View>

      {MEAL_SLOTS.map((slot) => (
        <View key={slot} style={styles.slot}>
          <View style={styles.slotHead}>
            <AppText variant="label" tone="muted" style={styles.slotLabel}>
              {MEAL_LABELS_RU[slot]}
            </AppText>
            <Pressable
              onPress={() => onAdd(slot)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Добавить в ${MEAL_LABELS_RU[slot]} ${weekdayLabel}`}
              style={styles.addBtn}
            >
              <AppText variant="caption" style={styles.addText}>
                +
              </AppText>
            </Pressable>
          </View>
          {mealsBySlot[slot].length === 0 ? (
            <AppText variant="caption" tone="muted" style={styles.emptySlot}>
              пусто
            </AppText>
          ) : (
            mealsBySlot[slot].map((m) => (
              <PlannedMealCard
                key={m.id}
                meal={m}
                kcal={kcalForMeal(m)}
                onPress={() => onPressMeal(m)}
                onMove={() => onMoveMeal(m)}
                onDelete={() => onDeleteMeal(m)}
              />
            ))
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  col: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.md,
    gap: space.md,
  },
  head: { gap: 2 },
  headTitle: { fontWeight: '800' },
  slot: { gap: space.sm },
  slotHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotLabel: {
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  addBtn: {
    minWidth: touchMin - 12,
    minHeight: touchMin - 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
  },
  addText: { fontWeight: '800', fontSize: 18 },
  emptySlot: { paddingLeft: space.xs },
});

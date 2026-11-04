import { ScrollView, StyleSheet, View } from 'react-native';

import { HABIT_WEEKDAY_LABELS_RU } from '../../../../../src/domain/habitWeek';
import type { PlannedDayNutrition } from '../../../../../src/domain/plannedDayNutrition';
import type { MealSlot, PlannedMeal } from '../../../../../src/storage/types';
import { space } from '@/src/design-system';
import { DayColumn } from './DayColumn';

export type WeekBoardDay = {
  dateLocal: string;
  weekdayIndex: number;
  dayNumber: number;
  nutrition: PlannedDayNutrition;
  mealsBySlot: Record<MealSlot, PlannedMeal[]>;
};

export function WeekBoard({
  days,
  hasEnergyTarget,
  kcalForMeal,
  onAdd,
  onPressMeal,
  onLongPressMeal,
  onDeleteMeal,
}: {
  days: WeekBoardDay[];
  hasEnergyTarget: boolean;
  kcalForMeal: (m: PlannedMeal) => number | null;
  onAdd: (dateLocal: string, slot: MealSlot) => void;
  onPressMeal: (m: PlannedMeal) => void;
  onLongPressMeal: (m: PlannedMeal) => void;
  onDeleteMeal: (m: PlannedMeal) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID="week-board"
    >
      {days.map((d) => (
        <View key={d.dateLocal} style={styles.colWrap}>
          <DayColumn
            dateLocal={d.dateLocal}
            weekdayLabel={HABIT_WEEKDAY_LABELS_RU[d.weekdayIndex]!}
            dayNumber={d.dayNumber}
            nutrition={d.nutrition}
            hasEnergyTarget={hasEnergyTarget}
            mealsBySlot={d.mealsBySlot}
            kcalForMeal={kcalForMeal}
            onAdd={(slot) => onAdd(d.dateLocal, slot)}
            onPressMeal={onPressMeal}
            onLongPressMeal={onLongPressMeal}
            onDeleteMeal={onDeleteMeal}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    gap: space.md,
  },
  colWrap: {},
});

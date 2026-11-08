import { Pressable, StyleSheet, View } from 'react-native';

import { HABIT_WEEKDAY_LABELS_RU } from '../../../../../src/domain/habitWeek';
import type { PlannedDayNutrition } from '../../../../../src/domain/plannedDayNutrition';
import type { MealSlot, PlannedMeal } from '../../../../../src/storage/types';
import { AppText, colors, radius, space, touchMin } from '@/src/design-system';
import { DayColumn } from './DayColumn';

export type WeekBoardDay = {
  dateLocal: string;
  weekdayIndex: number;
  dayNumber: number;
  nutrition: PlannedDayNutrition;
  mealsBySlot: Record<MealSlot, PlannedMeal[]>;
};

/**
 * Mobile-first week plan: pick a day, then edit vertical meal slots.
 * All seven days stay one tap away; move uses an explicit action (not only long-press).
 */
export function WeekBoard({
  days,
  selectedDateLocal,
  onSelectDate,
  hasEnergyTarget,
  kcalForMeal,
  onAdd,
  onPressMeal,
  onMoveMeal,
  onDeleteMeal,
}: {
  days: WeekBoardDay[];
  selectedDateLocal: string;
  onSelectDate: (dateLocal: string) => void;
  hasEnergyTarget: boolean;
  kcalForMeal: (m: PlannedMeal) => number | null;
  onAdd: (dateLocal: string, slot: MealSlot) => void;
  onPressMeal: (m: PlannedMeal) => void;
  onMoveMeal: (m: PlannedMeal) => void;
  onDeleteMeal: (m: PlannedMeal) => void;
}) {
  const selected =
    days.find((d) => d.dateLocal === selectedDateLocal) ?? days[0] ?? null;

  return (
    <View style={styles.wrap} testID="week-board">
      <View style={styles.dayRow} accessibilityRole="tablist">
        {days.map((d) => {
          const on = d.dateLocal === selected?.dateLocal;
          return (
            <Pressable
              key={d.dateLocal}
              onPress={() => onSelectDate(d.dateLocal)}
              style={({ pressed }) => [styles.dayChip, on && styles.dayChipOn, pressed && styles.pressed]}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${HABIT_WEEKDAY_LABELS_RU[d.weekdayIndex]} ${d.dayNumber}`}
              testID={`week-day-chip-${d.dateLocal}`}
            >
              <AppText
                variant="caption"
                tone={on ? 'inverse' : 'secondary'}
                style={styles.dayChipWd}
              >
                {HABIT_WEEKDAY_LABELS_RU[d.weekdayIndex]}
              </AppText>
              <AppText variant="body" tone={on ? 'inverse' : 'ink'} style={styles.dayChipNum}>
                {d.dayNumber}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {selected ? (
        <DayColumn
          dateLocal={selected.dateLocal}
          weekdayLabel={HABIT_WEEKDAY_LABELS_RU[selected.weekdayIndex]!}
          dayNumber={selected.dayNumber}
          nutrition={selected.nutrition}
          hasEnergyTarget={hasEnergyTarget}
          mealsBySlot={selected.mealsBySlot}
          kcalForMeal={kcalForMeal}
          onAdd={(slot) => onAdd(selected.dateLocal, slot)}
          onPressMeal={onPressMeal}
          onMoveMeal={onMoveMeal}
          onDeleteMeal={onDeleteMeal}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  dayRow: {
    flexDirection: 'row',
    gap: space.xs,
  },
  dayChip: {
    flex: 1,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dayChipOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  dayChipWd: {
    fontWeight: '600',
    fontSize: 10,
  },
  dayChipNum: {
    fontWeight: '800',
  },
  pressed: { opacity: 0.9 },
});

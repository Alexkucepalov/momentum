import { StyleSheet, View } from "react-native";
import { MEALS, MEAL_LABELS } from "../../../../../src/domain/diaryEntry";
import type { MealSlot } from "../../../../../src/storage/types";
import { AppText, Chip, space } from "@/src/design-system";
export function MealPickerRow({
  value,
  onChange,
}: {
  value: MealSlot;
  onChange: (meal: MealSlot) => void;
}) {
  return (
    <View style={styles.wrap}>
      <AppText variant="caption" tone="secondary">
        Добавить в
      </AppText>
      <View
        style={styles.options}
        accessibilityRole="toolbar"
        accessibilityLabel="Приём для добавления"
      >
        {MEALS.map((meal) => (
          <Chip
            key={meal}
            label={MEAL_LABELS[meal]}
            selected={value === meal}
            onPress={() => onChange(meal)}
            testID={`quick-meal-${meal}`}
          />
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  options: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
});

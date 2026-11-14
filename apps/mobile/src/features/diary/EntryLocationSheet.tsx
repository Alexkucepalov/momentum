import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { FoodEntry, MealSlot } from "../../../../../src/storage/types";
import { assertLocalDate } from "../../../../../src/storage/validation";
import { shiftDateLocal } from "../../../../../src/domain/repeatMeal";
import {
  AppButton,
  AppText,
  Field,
  colors,
  space,
  touchMin,
} from "@/src/design-system";
import { SwipeToDismissSheet } from "@/src/components/SwipeToDismissSheet";
import { FormScrollView } from "@/src/components/FormScrollView";
import { MealPickerRow } from "./MealPickerRow";
export function EntryLocationSheet({
  entry,
  mode,
  onClose,
  onSave,
}: {
  entry: FoodEntry | null;
  mode: "move" | "copy";
  onClose: () => void;
  onSave: (date: string, meal: MealSlot) => void;
}) {
  const [date, setDate] = useState("");
  const [meal, setMeal] = useState<MealSlot>("breakfast");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (entry) {
      setDate(entry.dateLocal);
      setMeal(entry.meal);
      setError(null);
    }
  }, [entry]);
  return (
    <SwipeToDismissSheet
      visible={!!entry}
      onClose={onClose}
      maxHeightRatio={0.9}
      testID="entry-location-sheet"
    >
      <FormScrollView variant="sheet" contentContainerStyle={styles.body}>
        <View style={styles.head}>
          <AppText variant="title" style={{ flex: 1 }}>
            {mode === "move" ? "Перенести запись" : "Скопировать запись"}
          </AppText>
          <Pressable
            onPress={onClose}
            style={styles.close}
            accessibilityRole="button"
            accessibilityLabel="Закрыть перенос"
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>
        <AppText variant="body">{entry?.displayName}</AppText>
        <Field
          label="Дата (ГГГГ-ММ-ДД)"
          value={date}
          onChangeText={value=>{setDate(value);setError(null);}}
          placeholder="2026-11-13"
          maxLength={10}
        />
        <View style={styles.days}>
          {[-1, 1].map((delta) => (
            <AppButton
              key={delta}
              variant="secondary"
              label={delta < 0 ? "На день раньше" : "На день позже"}
              style={{ flex: 1 }}
              onPress={() => {
                try {
                  assertLocalDate(date);
                  setDate(shiftDateLocal(date, delta));
                  setError(null);
                } catch {
                  setError("Проверь дату");
                }
              }}
            />
          ))}
        </View>
        <MealPickerRow value={meal} onChange={value=>{setMeal(value);setError(null);}} />
        <AppText variant="caption" tone="secondary">
          {mode === "move"
            ? "Запись изменит дату и приём."
            : "Исходная запись останется на месте."}{" "}
          Порция и сохранённые КБЖУ не изменятся.
        </AppText>
        {error ? (
          <AppText variant="caption" tone="danger" accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}
        <AppButton
          label={mode === "move" ? "Перенести" : "Скопировать"}
          testID="entry-location-save"
          onPress={() => {
            try {
              onSave(date, meal);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Не удалось сохранить");
            }
          }}
        />
      </FormScrollView>
    </SwipeToDismissSheet>
  );
}
const styles = StyleSheet.create({
  body: { padding: space.screen, gap: space.lg },
  head: { flexDirection: "row", alignItems: "center", gap: space.sm },
  close: {
    minHeight: touchMin,
    minWidth: touchMin,
    alignItems: "center",
    justifyContent: "center",
  },
  days: { flexDirection: "row", gap: space.sm },
});

import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  AppButton,
  AppText,
  Field,
  colors,
  space,
  touchMin,
} from "@/src/design-system";
import { FormScrollView } from "@/src/components/FormScrollView";
import { SwipeToDismissSheet } from "@/src/components/SwipeToDismissSheet";
import type { FlexibleHabit } from "../../../../../src/storage/types";
export function HabitDayValueSheet({
  habit,
  value,
  onClose,
  onSave,
}: {
  habit: FlexibleHabit | null;
  value: number;
  onClose: () => void;
  onSave: (value: number) => void;
}) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (habit) {
      setRaw(value ? String(value) : "");
      setError(null);
    }
  }, [habit, value]);
  return (
    <SwipeToDismissSheet
      visible={!!habit}
      onClose={onClose}
      maxHeightRatio={0.8}
      testID="today-habit-sheet"
    >
      <FormScrollView variant="sheet" contentContainerStyle={styles.body}>
        <View style={styles.head}>
          <AppText variant="title" style={{ flex: 1 }}>
            {habit?.name}
          </AppText>
          <Pressable
            style={styles.close}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Закрыть привычку"
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>
        <Field
          label={`Всего за выбранный день${habit?.unit ? `, ${habit.unit}` : ""}`}
          value={raw}
          onChangeText={setRaw}
          keyboardType="decimal-pad"
        />
        <AppText variant="caption" tone="secondary">
          Замени итог дня целиком. Ноль уберёт отметку; изменение можно
          отменить.
        </AppText>
        {error ? (
          <AppText variant="caption" tone="danger" accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}
        <AppButton
          label="Сохранить значение"
          testID="today-habit-save"
          onPress={() => {
            try {
              const n = Number(raw.trim().replace(",", "."));
              if (!raw.trim() || !Number.isFinite(n) || n < 0)
                throw new Error("Укажи число от нуля");
              onSave(n);
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
});

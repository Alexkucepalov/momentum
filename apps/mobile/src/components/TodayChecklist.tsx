import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { HabitKind } from "../../../../src/storage/types";
import { AppText, colors, space, touchMin } from "../design-system";
export type FlexibleHabitRow = {
  id: string;
  name: string;
  loggedToday: boolean;
  weekLabel: string;
  completed: number;
  target: number;
  kind: HabitKind;
  dayValue: number;
  unit: string | null;
};
export function TodayChecklist({
  flexibleHabits,
  onToggleFlexible,
  onManageHabits,
}: {
  flexibleHabits: FlexibleHabitRow[];
  onToggleFlexible: (id: string) => void;
  onManageHabits?: () => void;
}) {
  return (
    <View style={styles.wrap} testID="today-habits">
      <View style={styles.head}>
        <AppText variant="subtitle">Привычки</AppText>
        <Pressable
          onPress={onManageHabits}
          style={styles.manage}
          accessibilityRole="button"
          accessibilityLabel="Управлять привычками"
        >
          <AppText variant="caption" tone="secondary">
            Настроить
          </AppText>
          <Ionicons
            name="arrow-forward"
            size={16}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>
      {flexibleHabits.length ? (
        flexibleHabits.map((h) => (
          <Pressable
            key={h.id}
            style={styles.row}
            onPress={() => onToggleFlexible(h.id)}
            accessibilityRole={h.kind === "quantity" ? "button" : "checkbox"}
            aria-checked={h.kind === "quantity" ? undefined : h.loggedToday}
            accessibilityState={
              h.kind === "quantity" ? undefined : { checked: h.loggedToday }
            }
            accessibilityLabel={`${h.name}, ${h.kind === "quantity" ? `${h.dayValue} ${h.unit ?? ""} за день. Изменить` : h.loggedToday ? "отмечено" : "не отмечено"}. ${h.weekLabel}`}
            testID={`today-habit-${h.id}`}
          >
            <Ionicons
              name={
                h.kind === "quantity"
                  ? "add-circle-outline"
                  : h.loggedToday
                    ? "checkmark-circle"
                    : "ellipse-outline"
              }
              size={22}
              color={h.loggedToday ? colors.sageInk : colors.textSecondary}
            />
            <View style={styles.copy}>
              <AppText variant="body">{h.name}</AppText>
              <AppText variant="caption" tone="secondary">
                {h.weekLabel}
              </AppText>
            </View>
            {h.kind === "quantity" ? (
              <AppText variant="body">
                {h.dayValue.toLocaleString("ru-RU")} {h.unit}
              </AppText>
            ) : null}
          </Pressable>
        ))
      ) : (
        <AppText variant="body" tone="secondary">
          Добавь свои привычки, если хочешь отмечать их здесь.
        </AppText>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { gap: space.sm, paddingVertical: space.md },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  manage: {
    minHeight: touchMin,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: space.sm,
  },
  copy: { flex: 1, gap: space.xs, minWidth: 0 },
});

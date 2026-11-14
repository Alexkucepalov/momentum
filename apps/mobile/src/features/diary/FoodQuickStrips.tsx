import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type {
  FoodEntry,
  SavedMeal,
  MealSlot,
} from "../../../../../src/storage/types";
import {
  MEALS,
  MEAL_LABELS,
  entryAmountLabel,
} from "../../../../../src/domain/diaryEntry";
import { ActionMenuSheet } from "@/src/components/ActionMenuSheet";
import {
  AppText,
  SegmentedControl,
  colors,
  space,
  touchMin,
} from "@/src/design-system";
export function FoodQuickStrips({
  savedMeals,
  recent,
  onLogSaved,
  onRecentConfirm,
  onRecentQuick,
  onOpenSavedInSheet,
  onOpenRecentInSheet,
  maxItems = 3,
  compact = false,
  meal,
  onPickMeal,
}: {
  savedMeals: SavedMeal[];
  recent: FoodEntry[];
  onLogSaved: (meal: SavedMeal) => void;
  onRecentConfirm: (entry: FoodEntry) => void;
  onRecentQuick: (entry: FoodEntry) => void;
  onOpenSavedInSheet: () => void;
  onOpenRecentInSheet: () => void;
  maxItems?: number;
  compact?: boolean;
  meal?: MealSlot;
  onPickMeal?: (meal: MealSlot) => void;
}) {
  const [mealOpen, setMealOpen] = useState(false);
  const [tab, setTab] = useState<"recent" | "saved">("recent");
  if (!savedMeals.length && !recent.length) return null;
  const active =
    compact && recent.length
      ? "recent"
      : tab === "saved" && !savedMeals.length
        ? "recent"
        : tab === "recent" && !recent.length
          ? "saved"
          : tab;
  return (
    <View style={styles.wrap} testID="food-quick-strips">
      <View style={styles.head}>
        <AppText variant="subtitle">Быстрый повтор</AppText>
        <Pressable
          style={styles.more}
          onPress={
            meal && onPickMeal
              ? () => setMealOpen(true)
              : active === "saved"
                ? onOpenSavedInSheet
                : onOpenRecentInSheet
          }
          accessibilityRole="button"
          accessibilityLabel={
            meal && onPickMeal
              ? `Приём для повтора: ${MEAL_LABELS[meal]}`
              : active === "saved"
                ? "Все сохранённые приёмы"
                : "Все недавние записи"
          }
          testID={meal ? "quick-meal-context" : undefined}
        >
          <AppText variant="caption" tone="secondary">
            {meal && onPickMeal ? MEAL_LABELS[meal] : "Все"}
          </AppText>
          <Ionicons
            name={meal && onPickMeal ? "chevron-down" : "arrow-forward"}
            size={16}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>
      {!compact && savedMeals.length > 0 && recent.length > 0 ? (
        <SegmentedControl
          value={active}
          onChange={setTab}
          accessibilityLabel="Источник повтора"
          options={[
            { id: "recent", label: "Недавние" },
            { id: "saved", label: "Мои приёмы" },
          ]}
        />
      ) : null}
      <View>
        {active === "saved"
          ? savedMeals.slice(0, maxItems).map((m) => (
              <Pressable
                key={m.id}
                style={styles.row}
                onPress={() => onLogSaved(m)}
                accessibilityRole="button"
                accessibilityLabel={`Добавить приём ${m.name}`}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={18}
                  color={colors.ink}
                />
                <View style={styles.copy}>
                  <AppText variant="body" numberOfLines={2}>
                    {m.name}
                  </AppText>
                  <AppText variant="caption" tone="secondary">
                    {m.items.length} поз. · в выбранный приём
                  </AppText>
                </View>
                <Ionicons name="add" size={20} color={colors.ink} />
              </Pressable>
            ))
          : recent.slice(0, maxItems).map((e) => (
              <View key={e.id} style={styles.row}>
                <Pressable
                  style={styles.main}
                  onPress={() => onRecentConfirm(e)}
                  accessibilityRole="button"
                  accessibilityLabel={`Повторить с другой порцией: ${e.displayName}`}
                  testID={`recent-portion-${e.id}`}
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <View style={styles.copy}>
                    <AppText variant="body" numberOfLines={2}>
                      {e.displayName}
                    </AppText>
                    <AppText variant="caption" tone="secondary">
                      {entryAmountLabel(e)} ·{" "}
                      {e.energyKcal == null ? "—" : Math.round(e.energyKcal)}{" "}
                      ккал
                    </AppText>
                  </View>
                </Pressable>
                <Pressable
                  style={styles.add}
                  onPress={() => onRecentQuick(e)}
                  accessibilityRole="button"
                  accessibilityLabel={`Быстро добавить ${e.displayName}`}
                  testID={`recent-quick-${e.id}`}
                >
                  <Ionicons name="add" size={21} color={colors.ink} />
                </Pressable>
              </View>
            ))}
      </View>
      <AppText variant="caption" tone="muted">
        «+» — та же порция. Нажми на название, чтобы изменить её.
      </AppText>
      {meal && onPickMeal ? (
        <>
          <Pressable
            style={styles.more}
            onPress={
              active === "saved" ? onOpenSavedInSheet : onOpenRecentInSheet
            }
            accessibilityRole="button"
            accessibilityLabel="Все варианты быстрого повтора"
          >
            <AppText variant="caption">Все варианты</AppText>
            <Ionicons name="arrow-forward" size={16} color={colors.ink} />
          </Pressable>
          <ActionMenuSheet
            visible={mealOpen}
            onClose={() => setMealOpen(false)}
            title="Добавить в"
            actions={MEALS.map((m) => ({
              id: `meal-${m}`,
              label: MEAL_LABELS[m],
              onPress: () => onPickMeal(m),
            }))}
          />
        </>
      ) : null}
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
  more: {
    minHeight: touchMin,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    minHeight: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  main: {
    flex: 1,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.sm,
  },
  copy: { flex: 1, gap: space.xs, minWidth: 0 },
  add: {
    minHeight: touchMin,
    minWidth: touchMin,
    alignItems: "center",
    justifyContent: "center",
  },
});

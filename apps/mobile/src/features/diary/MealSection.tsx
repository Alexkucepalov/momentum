import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  entryAmountLabel,
  MEAL_LABELS,
} from "../../../../../src/domain/diaryEntry";
import type { FoodEntry, MealSlot } from "../../../../../src/storage/types";
import { ActionMenuSheet } from "@/src/components/ActionMenuSheet";
import { AppText, colors, space, touchMin } from "@/src/design-system";
const fmt = (n: number | null) =>
  n == null ? "—" : Math.round(n).toLocaleString("ru-RU");
export function MealSection({
  meal,
  entries,
  onEditGrams,
  onEntryActions,
  onAdd,
  onRepeatMeal,
  onSaveMeal,
}: {
  meal: MealSlot;
  entries: FoodEntry[];
  onEditGrams: (entry: FoodEntry) => void;
  onEntryActions: (entry: FoodEntry) => void;
  onAdd: () => void;
  onRepeatMeal: () => void;
  onSaveMeal: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const kcal = entries.some((e) => e.energyKcal == null)
    ? null
    : entries.reduce((sum, e) => sum + e.energyKcal!, 0);
  const canSave = entries.some((e) => e.productId || e.recipeId);
  return (
    <View style={styles.section} testID={`meal-section-${meal}`}>
      <View style={styles.head}>
        <View style={styles.heading}>
          <AppText variant="subtitle">{MEAL_LABELS[meal]}</AppText>
          <AppText variant="caption" tone="secondary">
            {entries.length
              ? `${fmt(kcal)} ккал · ${entries.length} поз.`
              : "Пока без записей"}
          </AppText>
        </View>
        {entries.length ? (
          <Pressable
            style={styles.icon}
            onPress={() => setMenu(true)}
            accessibilityRole="button"
            accessibilityLabel={`Действия с приёмом ${MEAL_LABELS[meal]}`}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
        <Pressable
          style={styles.icon}
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={`Добавить в ${MEAL_LABELS[meal]}`}
          testID={`meal-add-${meal}`}
        >
          <Ionicons name="add" size={23} color={colors.ink} />
        </Pressable>
      </View>
      {entries.map((entry) => (
        <View
          key={entry.id}
          style={styles.row}
          testID={`diary-entry-${entry.id}`}
        >
          <Pressable
            style={styles.main}
            onPress={() => onEditGrams(entry)}
            accessibilityRole="button"
            accessibilityLabel={`${entry.displayName}, ${entryAmountLabel(entry)}, ${fmt(entry.energyKcal)} ккал. Изменить порцию`}
          >
            <AppText variant="body" numberOfLines={2}>
              {entry.displayName}
            </AppText>
            <AppText variant="caption" tone="secondary">
              {entryAmountLabel(entry)} · Б {fmt(entry.proteinG)} · Ж{" "}
              {fmt(entry.fatG)} · У {fmt(entry.carbG)}
            </AppText>
          </Pressable>
          <View style={styles.energy}>
            <AppText variant="body">{fmt(entry.energyKcal)}</AppText>
            <AppText variant="label" tone="muted">
              ккал
            </AppText>
          </View>
          <Pressable
            style={styles.icon}
            onPress={() => onEntryActions(entry)}
            accessibilityRole="button"
            accessibilityLabel={`Действия: ${entry.displayName}`}
            testID={`entry-menu-${entry.id}`}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={19}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>
      ))}
      <ActionMenuSheet
        visible={menu}
        onClose={() => setMenu(false)}
        title={MEAL_LABELS[meal]}
        actions={[
          {
            id: "repeat-meal",
            label: "Повторить этот приём",
            detail: "Сохранённые порции и КБЖУ",
            onPress: onRepeatMeal,
          },
          ...(canSave
            ? [
                {
                  id: "save-meal",
                  label: "Сохранить как мой приём",
                  detail: "Продукты и рецепты для следующих добавлений",
                  onPress: onSaveMeal,
                },
              ]
            : []),
        ]}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  section: {
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  head: { flexDirection: "row", alignItems: "center", gap: space.xs },
  heading: { flex: 1, minWidth: 0, gap: space.xs },
  icon: {
    width: touchMin,
    minHeight: touchMin,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingVertical: space.xs,
  },
  main: {
    flex: 1,
    minWidth: 0,
    minHeight: touchMin,
    justifyContent: "center",
    gap: space.xs,
    paddingVertical: space.sm,
  },
  energy: { alignItems: "flex-end", gap: 2 },
});

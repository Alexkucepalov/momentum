import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type {
  PlannedActivity,
  TrainingCycle,
  TrainingCycleSlot,
} from "../../../../../src/domain/strength/types";
import { PERSONAL_PROGRAM_WEEK } from "../../../../../src/domain/strength/personalProgramWeek";
import {
  datesInWeekFromStart,
  HABIT_WEEKDAY_LABELS_RU,
} from "../../../../../src/domain/habitWeek";
import { SwipeToDismissSheet } from "@/src/components/SwipeToDismissSheet";
import {
  AppButton,
  AppText,
  Field,
  colors,
  radius,
  space,
  touchMin,
} from "@/src/design-system";
import { useData } from "@/src/state/DataContext";
import { AddPlannedStrengthSheet } from "./AddPlannedStrengthSheet";

export function TrainingCycleSheet({
  visible,
  monday,
  onClose,
  onSaved,
}: {
  visible: boolean;
  monday: string;
  onClose: () => void;
  onSaved: (previous: TrainingCycle | null) => void;
}) {
  const { repo } = useData();
  const [name, setName] = useState("Мой недельный цикл");
  const [slots, setSlots] = useState<TrainingCycleSlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<{
    index: number | null;
    day: number;
  } | null>(null);
  useEffect(() => {
    if (!visible) return;
    const saved = repo.getTrainingCycle();
    const dates = datesInWeekFromStart(monday);
    const plan = repo.listPlannedActivitiesInWeek(monday);
    setName(saved?.name ?? "Мой недельный цикл");
    setSlots(
      saved?.slots ??
        (plan.length
          ? plan.map((a) => ({
              kind: a.kind,
              title: a.title,
              subtitle: a.subtitle,
              timeLocal: a.timeLocal,
              cardioMinutes: a.cardioMinutes,
              templateId: a.templateId,
              sortOrder: a.sortOrder,
              weekdayIndex: dates.indexOf(a.dateLocal),
            }))
          : PERSONAL_PROGRAM_WEEK.map((a, i) => ({ ...a, sortOrder: i }))),
    );
    setError(null);
    setEditor(null);
  }, [visible, monday, repo]);
  const current = editor?.index != null ? slots[editor.index] : null;
  const draft = useMemo<PlannedActivity | undefined>(
    () =>
      current
        ? {
            ...current,
            id: "cycle-draft",
            dateLocal: datesInWeekFromStart(monday)[current.weekdayIndex]!,
            createdAt: "",
            deletedAt: null,
          }
        : undefined,
    [current, monday],
  );
  return (
    <>
      <SwipeToDismissSheet
        visible={visible && !editor}
        onClose={onClose}
        maxHeightRatio={0.94}
        testID="training-cycle-sheet"
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <AppText variant="title" style={{ flex: 1 }}>
              Шаблон недели
            </AppText>
            <Pressable
              onPress={onClose}
              style={styles.icon}
              accessibilityRole="button"
              accessibilityLabel="Закрыть шаблон недели"
            >
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <AppText variant="caption" tone="secondary">
            Настрой повторяющийся цикл. Изменения конкретной недели сохраняются
            отдельно; этот шаблон применяется по твоей команде.
          </AppText>
          <Field
            label="Название цикла"
            value={name}
            onChangeText={setName}
            maxLength={100}
          />
          {HABIT_WEEKDAY_LABELS_RU.map((label, day) => (
            <View key={day} style={styles.day}>
              <View style={styles.header}>
                <AppText variant="subtitle" style={{ flex: 1 }}>
                  {label}
                </AppText>
                <Pressable
                  style={styles.icon}
                  onPress={() => setEditor({ index: null, day })}
                  accessibilityRole="button"
                  accessibilityLabel={`Добавить в шаблон: ${label}`}
                >
                  <Ionicons name="add" size={20} color={colors.ink} />
                </Pressable>
              </View>
              {slots.map((slot, index) =>
                slot.weekdayIndex === day ? (
                  <View
                    key={index}
                    style={[
                      styles.row,
                      {
                        backgroundColor:
                          slot.kind === "cardio"
                            ? colors.trainingCycling
                            : slot.kind === "strength"
                              ? colors.trainingStrength
                              : colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Pressable
                      style={styles.copy}
                      onPress={() => setEditor({ index, day })}
                      accessibilityRole="button"
                      accessibilityLabel={`Изменить в шаблоне: ${slot.title}`}
                    >
                      <AppText variant="body">{slot.title}</AppText>
                      <AppText variant="caption" tone="secondary">
                        {[
                          slot.timeLocal,
                          slot.cardioMinutes != null
                            ? `${slot.cardioMinutes} мин`
                            : slot.subtitle,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Без времени"}
                      </AppText>
                    </Pressable>
                    <Pressable
                      style={styles.icon}
                      onPress={() =>
                        setSlots((items) => items.filter((_, i) => i !== index))
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Убрать из шаблона: ${slot.title}`}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  </View>
                ) : null,
              )}
            </View>
          ))}
          {error ? (
            <AppText variant="caption" tone="danger" accessibilityRole="alert">
              {error}
            </AppText>
          ) : null}
          <AppButton
            label="Сохранить шаблон недели"
            testID="cycle-save"
            onPress={() => {
              try {
                const previous = repo.getTrainingCycle();
                repo.saveTrainingCycle({ name, slots });
                onSaved(previous);
                onClose();
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "Не удалось сохранить шаблон",
                );
              }
            }}
          />
          <AppText variant="caption" tone="muted">
            Сохранение не меняет уже запланированные недели и выполненные
            тренировки.
          </AppText>
        </ScrollView>
      </SwipeToDismissSheet>
      <AddPlannedStrengthSheet
        visible={!!editor}
        activity={draft}
        dateLabel={
          editor ? HABIT_WEEKDAY_LABELS_RU[editor.day] + " · шаблон" : ""
        }
        templates={repo.listWorkoutTemplates()}
        onClose={() => setEditor(null)}
        onSave={(input) => {
          if (!editor) return;
          const next = {
            ...input,
            weekdayIndex: editor.day,
            sortOrder: editor.index ?? slots.length,
          };
          setSlots((items) =>
            editor.index == null
              ? [...items, next]
              : items.map((a, i) => (i === editor.index ? next : a)),
          );
          setEditor(null);
        }}
      />
    </>
  );
}
const styles = StyleSheet.create({
  content: { padding: space.screen, gap: space.md },
  header: { flexDirection: "row", alignItems: "center", gap: space.sm },
  icon: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: "center",
    justifyContent: "center",
  },
  day: { gap: space.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    paddingLeft: space.md,
    gap: space.sm,
  },
  copy: {
    flex: 1,
    minHeight: touchMin,
    paddingVertical: space.sm,
    gap: space.xs,
  },
});

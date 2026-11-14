import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PERSONAL_PROGRAM_WEEK } from "../../../../src/domain/strength";
import { repsRangeLabel } from "../../../../src/domain/strength/sessionReview";
import { FormScrollView } from "@/src/components/FormScrollView";
import { strengthTemplateHref } from "@/src/features/strength/StrengthEntryCard";
import {
  AppButton,
  AppCard,
  AppText,
  colors,
  radius,
  space,
  touchMin,
} from "@/src/design-system";
import { useActivityRevision, useData } from "@/src/state/DataContext";
const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const GUIDANCE = [
  {
    title: "Перед началом",
    body: "5–8 минут лёгкой активности и разминочные подходы перед рабочими.",
  },
  {
    title: "Рабочие подходы",
    body: "В базовых шаблонах — по два подхода. Количество и диапазон повторений можно изменить под свой план.",
  },
  {
    title: "Отдых и интенсивность",
    body: "Ориентир плана: 90–120 с в основных упражнениях, 60–90 с в изолирующих; примерно 2–3 повтора в запасе. Таймер можно продлить или пропустить.",
  },
  {
    title: "Следующее занятие",
    body: "Сравнивай фактический вес и повторы. В плане увеличение веса предусмотрено после уверенного выполнения всех подходов на верхней границе диапазона.",
  },
];
export default function TrainingProgramScreen() {
  const { repo } = useData();
  useActivityRevision();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null),
    [rulesOpen, setRulesOpen] = useState(false);
  const cycle = repo.getTrainingCycle();
  const slots = cycle?.slots ?? PERSONAL_PROGRAM_WEEK;
  const templates = repo.listWorkoutTemplates();
  const template = templates.find((t) => t.id === selected) ?? templates[0];
  const lines = template ? repo.listTemplateExercises(template.id) : [];
  return (
    <FormScrollView
      contentContainerStyle={styles.content}
      testID="training-program"
    >
      <AppText variant="label" tone="secondary">
        {cycle ? "ТВОЙ НЕДЕЛЬНЫЙ ЦИКЛ" : "БАЗОВЫЙ НЕДЕЛЬНЫЙ ЦИКЛ"}
      </AppText>
      <AppText variant="title">Сильнее, шаг за шагом</AppText>
      <AppText variant="body" tone="secondary">
        Расписание, содержание занятий и ориентиры — в одном месте.
      </AppText>
      <View style={styles.week}>
        {DAYS.map((day, index) => {
          const entries = slots.filter((s) => s.weekdayIndex === index);
          return (
            <View key={day} style={styles.day}>
              <AppText variant="caption" tone="secondary">
                {day}
              </AppText>
              <View
                style={[
                  styles.dayMark,
                  entries.some((s) => s.kind === "strength")
                    ? styles.strength
                    : entries.some((s) => s.kind === "cardio")
                      ? styles.cardio
                      : styles.rest,
                ]}
              >
                <Ionicons
                  name={
                    entries.some((s) => s.kind === "strength")
                      ? "barbell-outline"
                      : entries.some((s) => s.kind === "cardio")
                        ? "bicycle-outline"
                        : "leaf-outline"
                  }
                  size={18}
                  color={colors.ink}
                />
              </View>
            </View>
          );
        })}
      </View>
      <AppText variant="caption" tone="secondary">
        {slots.filter((s) => s.kind === "strength").length} силовые ·{" "}
        {slots.filter((s) => s.kind === "cardio").length} кардио ·{" "}
        {slots.filter((s) => s.kind === "rest").length} дня отдыха
      </AppText>
      <AppButton
        label="Управлять расписанием"
        variant="secondary"
        onPress={() => router.push("/activity")}
      />
      <AppText variant="subtitle">Содержание занятий</AppText>
      <View style={styles.choices}>
        {templates.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setSelected(t.id)}
            style={[styles.choice, template?.id === t.id && styles.choiceOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: template?.id === t.id }}
            accessibilityLabel={`План: ${t.name}`}
          >
            <AppText
              variant="caption"
              tone={template?.id === t.id ? "inverse" : "ink"}
            >
              {t.name}
            </AppText>
          </Pressable>
        ))}
      </View>
      {template ? (
        <AppCard style={styles.plan}>
          <View style={styles.head}>
            <View style={styles.copy}>
              <AppText variant="subtitle">{template.name}</AppText>
              <AppText variant="caption" tone="secondary">
                {lines.length} упражнений ·{" "}
                {lines.reduce((sum, l) => sum + l.targetSets, 0)} рабочих
                подходов
              </AppText>
            </View>
            <Ionicons name="barbell-outline" size={24} color={colors.ink} />
          </View>
          {template.notes ? (
            <AppText variant="body" tone="secondary">
              {template.notes}
            </AppText>
          ) : template.subtitle ? (
            <AppText variant="caption" tone="secondary">
              {template.subtitle}
            </AppText>
          ) : null}
          {lines.map((line, index) => (
            <View key={line.id} style={styles.line}>
              <AppText variant="caption" tone="secondary">
                {String(index + 1).padStart(2, "0")}
              </AppText>
              <View style={styles.copy}>
                <AppText variant="body">
                  {repo.getStrengthExercise(line.exerciseId)?.name ??
                    "Упражнение"}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  {line.targetSets} × {repsRangeLabel(line)} · отдых{" "}
                  {line.restSec ?? 90} с{line.notes ? ` · ${line.notes}` : ""}
                </AppText>
              </View>
            </View>
          ))}
          <AppButton
            label="Настроить занятие и заметки"
            variant="secondary"
            onPress={() => router.push(strengthTemplateHref(template.id))}
          />
        </AppCard>
      ) : (
        <AppText variant="body" tone="secondary">
          Добавь шаблон в разделе «Силовые».
        </AppText>
      )}
      <Pressable
        onPress={() => setRulesOpen((v) => !v)}
        style={styles.disclosure}
        accessibilityRole="button"
        accessibilityState={{ expanded: rulesOpen }}
        accessibilityLabel="Ориентиры базового плана"
      >
        <AppText variant="subtitle" style={styles.copy}>
          Ориентиры базового плана
        </AppText>
        <Ionicons
          name={rulesOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.ink}
        />
      </Pressable>
      {rulesOpen
        ? GUIDANCE.map((item) => (
            <View key={item.title} style={styles.guidance}>
              <AppText variant="body">{item.title}</AppText>
              <AppText variant="caption" tone="secondary">
                {item.body}
              </AppText>
            </View>
          ))
        : null}
      <AppText variant="caption" tone="secondary">
        План задаёт ориентиры. В сводке учитываются записанные подходы;
        дополнительные подходы не меняют шаблон следующей недели.
      </AppText>
    </FormScrollView>
  );
}
const styles = StyleSheet.create({
  content: { padding: space.screen, gap: space.lg },
  week: { flexDirection: "row", gap: space.xs },
  day: { flex: 1, minWidth: 0, alignItems: "center", gap: space.sm },
  dayMark: {
    width: 32,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  strength: { backgroundColor: colors.trainingStrength },
  cardio: { backgroundColor: colors.trainingCycling },
  rest: { backgroundColor: colors.surfaceMuted },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  choice: {
    minHeight: touchMin,
    paddingHorizontal: space.lg,
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
  },
  choiceOn: { backgroundColor: colors.ink },
  plan: { gap: space.md },
  head: { flexDirection: "row", gap: space.md, alignItems: "center" },
  copy: { flex: 1, minWidth: 0, gap: space.xs },
  line: {
    flexDirection: "row",
    gap: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  disclosure: {
    minHeight: touchMin,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  guidance: { gap: space.sm },
});

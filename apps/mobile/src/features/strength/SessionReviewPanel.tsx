import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  formatSetPerformance,
  repsRangeLabel,
  type SessionReview,
} from "../../../../../src/domain/strength/sessionReview";
import { AppCard, AppText, colors, space, touchMin } from "@/src/design-system";

export function SessionReviewPanel({
  review,
  names,
  compact = false,
}: {
  review: SessionReview;
  names: Record<string, string>;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <View style={styles.root} testID="session-review">
      <AppCard style={styles.metrics}>
        <Metric
          label="Подходов"
          value={`${review.completedSets}/${review.totalSets}`}
        />
        <Metric
          label="Упражнений"
          value={`${review.completedExercises}/${review.totalExercises}`}
        />
        <Metric
          label="Повторов"
          value={
            review.repetitions == null
              ? "—"
              : `${review.incompleteReps ? "≥" : ""}${review.repetitions}`
          }
        />
      </AppCard>
      {review.incompleteReps ? (
        <AppText variant="caption" tone="secondary">
          Повторы известны в {review.knownRepSets} из {review.completedSets}{" "}
          записанных подходов.
        </AppText>
      ) : null}
      {!compact && (
        <>
          <AppText variant="subtitle">По упражнениям</AppText>
          <AppText variant="caption" tone="secondary">
            Сравнение с предыдущим занятием. Вес указан так, как ты его записал;
            для гантелей используй один способ учёта.
          </AppText>
          {review.exercises.map((ex) => (
            <View key={ex.exerciseId} style={styles.exercise}>
              <Pressable
                onPress={() =>
                  setExpanded((value) =>
                    value === ex.exerciseId ? null : ex.exerciseId,
                  )
                }
                accessibilityRole="button"
                accessibilityState={{ expanded: expanded === ex.exerciseId }}
                accessibilityLabel={`Результаты: ${ex.plan?.name ?? names[ex.exerciseId] ?? "Упражнение"}`}
                style={styles.head}
              >
                <View style={styles.copy}>
                  <AppText variant="body">
                    {ex.plan?.name ?? names[ex.exerciseId] ?? "Упражнение"}
                  </AppText>
                  <AppText variant="caption" tone="secondary">
                    {ex.completed} из {ex.sets.length} подходов
                    {ex.inRange != null
                      ? ` · в диапазоне ${repsRangeLabel(ex.plan)}: ${ex.inRange}/${ex.checkedRangeSets}`
                      : ""}
                  </AppText>
                </View>
                <Ionicons
                  name={
                    expanded === ex.exerciseId ? "chevron-up" : "chevron-down"
                  }
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
              {expanded === ex.exerciseId && (
                <View style={styles.details}>
                  <View style={styles.columns}>
                    <AppText
                      variant="label"
                      tone="secondary"
                      style={styles.index}
                    >
                      №
                    </AppText>
                    <AppText
                      variant="label"
                      tone="secondary"
                      style={styles.column}
                    >
                      СЕЙЧАС
                    </AppText>
                    <AppText
                      variant="label"
                      tone="secondary"
                      style={styles.column}
                    >
                      ПРОШЛЫЙ РАЗ
                    </AppText>
                  </View>
                  {ex.sets.map((row) => {
                    const previous = ex.previous?.sets.find(
                      (p) => p.setIndex === row.setIndex,
                    );
                    return (
                      <View key={row.id} style={styles.columns}>
                        <AppText
                          variant="caption"
                          tone="secondary"
                          style={styles.index}
                        >
                          {row.setIndex}
                        </AppText>
                        <AppText variant="caption" style={styles.column}>
                          {row.completed
                            ? formatSetPerformance(row)
                            : "Не записан"}
                        </AppText>
                        <AppText
                          variant="caption"
                          tone="secondary"
                          style={styles.column}
                        >
                          {previous ? formatSetPerformance(previous) : "—"}
                        </AppText>
                      </View>
                    );
                  })}
                  <AppText variant="caption" tone="secondary">
                    {ex.previous
                      ? `Предыдущее занятие: ${new Date(`${ex.previous.session.dateLocal}T12:00:00Z`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" })}`
                      : "Первое записанное занятие с этим упражнением."}
                  </AppText>
                </View>
              )}
            </View>
          ))}
        </>
      )}
    </View>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText variant="subtitle">{value}</AppText>
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { gap: space.md },
  metrics: { flexDirection: "row", gap: space.sm },
  metric: { flex: 1, minWidth: 0, gap: space.sm },
  exercise: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  head: {
    minHeight: touchMin,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.md,
  },
  copy: { flex: 1, gap: space.xs },
  details: { gap: space.md, paddingBottom: space.lg },
  columns: { flexDirection: "row", gap: space.sm },
  column: { flex: 1, minWidth: 0 },
  index: { width: 20 },
});

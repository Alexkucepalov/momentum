import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import type {
  PlannedActivity,
  WorkoutSession,
} from "../../../../../src/domain/strength/types";
import { AppText, colors, radius, space, touchMin } from "@/src/design-system";
import { strengthSessionHref } from "./StrengthEntryCard";
import { useData } from "@/src/state/DataContext";

export function TodayTrainingCard({
  inProgress,
  todayPlan,
  onStart,
}: {
  inProgress: WorkoutSession[];
  todayPlan: PlannedActivity[];
  onStart: (activity: PlannedActivity) => void;
}) {
  const router = useRouter();
  const { repo } = useData();
  const draft = inProgress[0];
  const strength = todayPlan.find(
    (a) =>
      a.kind === "strength" &&
      repo.getWorkoutSessionForPlan(a.id)?.status !== "completed",
  );
  const finished = todayPlan
    .map((a) => repo.getWorkoutSessionForPlan(a.id))
    .find((s) => s?.status === "completed");
  const cardioPlans = todayPlan.filter((a) => a.kind === "cardio");
  const cardio =
    cardioPlans.find(
      (a) => !a.linkedWorkoutId || !repo.getWorkoutById(a.linkedWorkoutId),
    ) ?? cardioPlans[0];
  const rest =
    todayPlan.length > 0 && todayPlan.every((a) => a.kind === "rest");
  const plan = strength ?? cardio;
  const candidateRide = plan?.linkedWorkoutId
    ? repo.getWorkoutById(plan.linkedWorkoutId)
    : null;
  const ride =
    candidateRide?.source === "garmin" && candidateRide.type === "cycling"
      ? candidateRide
      : null;
  const title =
    draft?.title ??
    plan?.title ??
    finished?.title ??
    (rest ? "Восстановление" : "Твой недельный цикл");
  const subtitle =
    ride && !draft
      ? `Garmin · ${Math.round(ride.durationSec / 60)} мин · ${new Date(ride.dateLocal + "T12:00:00Z").toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" })}`
      : draft
        ? "Продолжить с последнего подхода"
        : plan
          ? [
              plan.timeLocal,
              plan.subtitle,
              plan.cardioMinutes != null ? `${plan.cardioMinutes} мин` : null,
            ]
              .filter(Boolean)
              .join(" · ")
          : rest
            ? "День без запланированной нагрузки"
            : "Силовые, вело и дни отдыха";
  const action = () =>
    draft
      ? router.push(strengthSessionHref(draft.id))
      : strength
        ? onStart(strength)
        : ride
          ? router.push(
              `/garmin/workout/${encodeURIComponent(ride.id)}` as Href,
            )
          : finished && !plan
            ? router.push(strengthSessionHref(finished.id))
            : router.push("/(tabs)/activity" as Href);
  return (
    <View style={styles.section} testID="today-training-card">
      <View style={styles.head}>
        <AppText variant="subtitle">Твой план</AppText>
        <Pressable
          onPress={() => router.push("/activity")}
          accessibilityRole="button"
          accessibilityLabel="Открыть план недели"
          style={styles.weekLink}
        >
          <AppText variant="caption" tone="secondary">
            Неделя
          </AppText>
          <Ionicons
            name="arrow-forward"
            size={14}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>
      <Pressable
        onPress={action}
        style={({ pressed }) => [
          styles.hero,
          plan?.kind === "cardio" && !draft && styles.cycling,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          draft
            ? `Продолжить ${title}`
            : strength
              ? `Начать ${title}`
              : ride
                ? `Открыть поездку Garmin: ${title}`
                : "Открыть недельный цикл"
        }
        testID={
          draft
            ? "today-continue-session"
            : strength
              ? "today-start-strength"
              : ride
                ? "today-open-ride"
                : "today-open-cycle"
        }
      >
        <View style={styles.copy}>
          <AppText variant="label" tone="secondary" style={styles.eyebrow}>
            {draft
              ? "В процессе"
              : ride
                ? "Выполнено"
                : plan
                  ? "Сегодня в плане"
                  : "Движение"}
          </AppText>
          <AppText style={styles.title}>{title}</AppText>
          {subtitle ? (
            <AppText variant="caption" tone="secondary" numberOfLines={2}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <View style={styles.arrow}>
          <Ionicons
            name={draft ? "play" : "arrow-up"}
            size={20}
            color={colors.onPrimary}
            style={!draft ? { transform: [{ rotate: "45deg" }] } : undefined}
          />
        </View>
      </Pressable>
      <Pressable
        onPress={() => router.push("/strength/program" as Href)}
        style={styles.planLink}
        accessibilityRole="button"
        accessibilityLabel="Содержание тренировочного плана"
      >
        <AppText variant="caption" tone="secondary">
          Содержание и ориентиры плана
        </AppText>
        <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  planLink: {
    minHeight: touchMin,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  section: { gap: space.sm, marginTop: space.md },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekLink: {
    minHeight: touchMin,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    paddingLeft: space.md,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.trainingStrength,
    padding: space.screen,
    minHeight: 118,
  },
  cycling: { backgroundColor: colors.trainingCycling },
  copy: { flex: 1, gap: space.sm, minWidth: 0 },
  eyebrow: { textTransform: "uppercase", letterSpacing: 1 },
  title: {
    fontSize: 23,
    lineHeight: 30,
    letterSpacing: -0.7,
    fontWeight: "500",
  },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.8 },
});

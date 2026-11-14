import { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  buildSessionReview,
  formatSetPerformance,
  repsRangeLabel,
} from "../../../../../src/domain/strength/sessionReview";
import type { WorkoutSet } from "../../../../../src/domain/strength/types";
import { SessionFinishSheet } from "@/src/features/strength/SessionFinishSheet";
import { SetLogRow } from "@/src/features/strength/SetLogRow";
import { SessionReviewPanel } from "@/src/features/strength/SessionReviewPanel";
import { FormScrollView } from "@/src/components/FormScrollView";
import { SwipeToDismissSheet } from "@/src/components/SwipeToDismissSheet";
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
import { confirmAction } from "@/src/utils/confirmAction";

export default function StrengthSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { repo, refresh, showFlash, setUndo, undo } = useData();
  useActivityRevision();
  const [finishOpen, setFinishOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [editingSet, setEditingSet] = useState<string | null>(null);
  const lastAddedAt = useRef(0);
  const scroll = useRef<ScrollView>(null);
  const lastRecorded = useRef<{ id: string; at: number } | null>(null);
  const session = id ? repo.getWorkoutSession(String(id)) : null;
  const sets = session ? repo.listWorkoutSets(session.id) : [];
  const snapshot = useMemo(
    () => repo.getStrengthHistory(),
    [repo, id, session?.status],
  );
  const review = session
    ? buildSessionReview(session, sets, snapshot.sessions, snapshot.sets)
    : null;
  const groups = review?.exercises ?? [];
  const active =
    groups.find((g) => g.exerciseId === selectedExercise) ??
    groups.find((g) => g.sets.some((s) => !s.completed)) ??
    groups[0];
  const activeIndex = groups.findIndex(
    (g) => g.exerciseId === active?.exerciseId,
  );
  const plan = active?.plan;
  const exercise = active ? repo.getStrengthExercise(active.exerciseId) : null;
  const name = plan?.name ?? exercise?.name ?? "Упражнение";
  const current =
    active?.sets.find((s) => s.id === editingSet) ??
    active?.sets.find((s) => !s.completed) ??
    null;
  const isLive = session?.status === "in_progress";
  const names: Record<string, string> = Object.assign(
    Object.create(null),
    Object.fromEntries(
      repo.listStrengthExercises().map((ex) => [ex.id, ex.name]),
    ),
  );

  /** Timer UI removed — clear any leftover rest deadline so it cannot resurrect. */
  useEffect(() => {
    if (!id) return;
    const row = repo.getWorkoutSession(String(id));
    if (row?.status === "in_progress" && row.restUntilAt) {
      repo.setSessionRestDeadline(String(id), null);
      refresh("activity");
    }
  }, [id, repo, refresh]);

  const select = (index: number) => {
    const group = groups[index];
    if (group) {
      setSelectedExercise(group.exerciseId);
      setEditingSet(null);
      setListOpen(false);
      scroll.current?.scrollTo({ y: 0, animated: false });
    }
  };

  if (!session || !review) {
    return (
      <View style={styles.content}>
        <AppText variant="subtitle">Тренировка не найдена</AppText>
        <AppButton label="Назад" onPress={() => router.back()} />
      </View>
    );
  }

  const finish = () => setFinishOpen(true);
  const record = (
    set: WorkoutSet,
    values: { weightKg: number | null; reps: number | null },
  ) => {
    if (
      lastRecorded.current?.id === set.id &&
      Date.now() - lastRecorded.current.at < 500
    ) {
      return;
    }
    const before = repo
      .listWorkoutSets(session.id)
      .find((row) => row.id === set.id);
    if (!before) throw new Error("Подход не найден");
    repo.completeWorkoutSet(set.id, values);
    lastRecorded.current = { id: set.id, at: Date.now() };
    refresh("activity");
    setEditingSet(null);
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync().catch(() => undefined);
    }
    setUndo({
      message: `${name} · подход ${set.setIndex} записан`,
      ownerId: session.id,
      scope: "activity",
      action: () => {
        repo.restoreWorkoutSet(before);
        setSelectedExercise(set.exerciseId);
        setEditingSet(before.completed ? before.id : null);
      },
    });
  };

  if (!isLive) {
    return (
      <FormScrollView
        contentContainerStyle={styles.content}
        testID="strength-session"
      >
        <View style={styles.summaryHead}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name={session.status === "completed" ? "checkmark" : "pause"}
              color={colors.ink}
              size={30}
            />
          </View>
          <AppText variant="label" tone="secondary">
            {session.status === "completed"
              ? "СОХРАНЕНО"
              : "ПРЕРВАНО"}
          </AppText>
          <AppText variant="title">{session.title}</AppText>
          <AppText variant="caption" tone="secondary">
            {review.durationSec == null
              ? "Время неизвестно"
              : review.durationSec < 60
                ? `${Math.floor(review.durationSec)} с`
                : `${Math.floor(review.durationSec / 60)} мин`}
            {session.feelingRpe != null
              ? ` · сложность ${session.feelingRpe}/10`
              : ""}
          </AppText>
        </View>
        <SessionReviewPanel review={review} names={names} />
        {session.feelingNote ? (
          <AppCard>
            <AppText variant="label" tone="secondary">
              ЗАМЕТКА
            </AppText>
            <AppText variant="body">{session.feelingNote}</AppText>
          </AppCard>
        ) : null}
        <AppButton label="Готово" onPress={() => router.back()} />
      </FormScrollView>
    );
  }

  const progressPct = review.totalSets
    ? (review.completedSets / review.totalSets) * 100
    : 0;

  return (
    <View style={styles.root}>
      <FormScrollView
        ref={scroll}
        contentContainerStyle={styles.content}
        testID="strength-session"
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.flex}>
              <AppText variant="label" tone="muted" style={styles.eyebrow}>
                {session.title}
              </AppText>
              <AppText variant="subtitle">
                {review.completedSets} / {review.totalSets} подходов
              </AppText>
            </View>
            <Pressable
              onPress={() => setListOpen(true)}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Список упражнений"
              testID="session-exercise-list"
            >
              <Ionicons name="list-outline" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <View
            style={styles.progressTrack}
            accessibilityRole="progressbar"
            accessibilityLabel="Прогресс тренировки"
            accessibilityValue={{
              min: 0,
              max: Math.max(1, review.totalSets),
              now: review.completedSets,
            }}
          >
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        </View>

        {active ? (
          <>
            <View style={styles.exerciseBlock}>
              <AppText variant="caption" tone="secondary">
                Упражнение {activeIndex + 1} из {groups.length}
              </AppText>
              <AppText variant="title" style={styles.exerciseTitle}>
                {name}
              </AppText>
              <AppText variant="caption" tone="secondary">
                {plan
                  ? `Ориентир ${plan.targetSets} × ${repsRangeLabel(plan)}`
                  : "Ориентиры сессии не сохранены"}
                {active.previous
                  ? ` · было ${active.previous.sets.map(formatSetPerformance).join(" · ")}`
                  : " · первая запись"}
              </AppText>
            </View>

            {current ? (
              <SetLogRow
                key={current.id}
                set={current}
                exerciseName={name}
                onComplete={(values) => record(current, values)}
                onDraft={(input) => {
                  repo.saveWorkoutSetDraft(current.id, input);
                  refresh("activity");
                }}
              />
            ) : (
              <AppCard style={styles.exerciseDone}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={28}
                  color={colors.success}
                />
                <AppText variant="subtitle">Упражнение записано</AppText>
                <AppText variant="caption" tone="secondary">
                  Выбери подход ниже, чтобы поправить, или иди дальше.
                </AppText>
              </AppCard>
            )}

            <View style={styles.sets}>
              {active.sets.map((set) => (
                <Pressable
                  key={set.id}
                  onPress={() => setEditingSet(set.id)}
                  style={[
                    styles.setPill,
                    set.id === current?.id && styles.setPillCurrent,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${name}, подход ${set.setIndex}${set.completed ? ", записан, изменить" : ", открыть"}`}
                  accessibilityState={{ selected: set.id === current?.id }}
                >
                  <AppText
                    variant="caption"
                    tone={set.id === current?.id ? "inverse" : "ink"}
                  >
                    {set.setIndex}
                  </AppText>
                  {set.completed ? (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={
                        set.id === current?.id
                          ? colors.onPrimary
                          : colors.success
                      }
                    />
                  ) : null}
                </Pressable>
              ))}
              <Pressable
                style={styles.setPill}
                accessibilityRole="button"
                accessibilityLabel="Добавить подход"
                onPress={() => {
                  if (Date.now() - lastAddedAt.current < 500) return;
                  const added = repo.upsertWorkoutSet({
                    sessionId: session.id,
                    exerciseId: active.exerciseId,
                    setIndex:
                      Math.max(0, ...active.sets.map((s) => s.setIndex)) + 1,
                    targetReps: plan?.targetRepsMin ?? null,
                  });
                  refresh("activity");
                  lastAddedAt.current = Date.now();
                  setEditingSet(added.id);
                  setUndo({
                    message: "Подход добавлен",
                    ownerId: session.id,
                    scope: "activity",
                    action: () => {
                      repo.softDeleteWorkoutSet(added.id);
                      setEditingSet(null);
                    },
                  });
                }}
              >
                <Ionicons name="add" size={18} color={colors.ink} />
              </Pressable>
            </View>

            <View style={styles.navigation}>
              <AppButton
                label="Назад"
                variant="secondary"
                disabled={activeIndex <= 0}
                onPress={() => select(activeIndex - 1)}
                style={styles.flex}
              />
              <AppButton
                label={
                  activeIndex < groups.length - 1 ? "Дальше" : "К итогам"
                }
                onPress={() =>
                  activeIndex < groups.length - 1
                    ? select(activeIndex + 1)
                    : finish()
                }
                style={styles.flex}
              />
            </View>
          </>
        ) : (
          <View style={styles.emptySession} testID="session-empty-exercises">
            <AppText variant="body" tone="secondary">
              В этой сессии нет упражнений.
            </AppText>
            {session.templateId ? (
              <AppButton
                label="Добавить в шаблон"
                onPress={() =>
                  router.push(`/strength/template/${session.templateId}`)
                }
                testID="session-edit-template"
              />
            ) : (
              <AppButton
                label="К шаблонам"
                variant="secondary"
                onPress={() => router.push("/strength")}
              />
            )}
          </View>
        )}

        <AppButton
          label="Завершить"
          variant="ghost"
          onPress={finish}
          testID="strength-finish"
        />
      </FormScrollView>

      <SwipeToDismissSheet
        visible={listOpen}
        onClose={() => setListOpen(false)}
        testID="session-exercise-sheet"
      >
        <FormScrollView variant="sheet" contentContainerStyle={styles.sheet}>
          <AppText variant="title">Упражнения</AppText>
          {groups.map((group, index) => (
            <Pressable
              key={group.exerciseId}
              onPress={() => select(index)}
              style={styles.listRow}
              accessibilityRole="button"
              accessibilityLabel={`Открыть упражнение ${index + 1}: ${group.plan?.name ?? names[group.exerciseId] ?? "Упражнение"}`}
            >
              <AppText variant="caption" tone="secondary">
                {String(index + 1).padStart(2, "0")}
              </AppText>
              <View style={styles.flex}>
                <AppText variant="body">
                  {group.plan?.name ?? names[group.exerciseId] ?? "Упражнение"}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  {group.completed}/{group.sets.length}
                </AppText>
              </View>
              <Ionicons name="arrow-forward" size={18} color={colors.ink} />
            </Pressable>
          ))}
          <AppButton
            label="Завершить"
            variant="secondary"
            onPress={() => {
              setListOpen(false);
              finish();
            }}
          />
          <AppButton
            label="Прервать тренировку"
            variant="ghost"
            testID="strength-abandon"
            onPress={() =>
              confirmAction(
                "Прервать тренировку?",
                "Записанные подходы останутся. Продолжить можно с карточки в неделе.",
                {
                  destructive: true,
                  confirmLabel: "Прервать",
                  onConfirm: () => {
                    repo.abandonWorkoutSession(session.id);
                    if (undo?.ownerId === session.id) setUndo(null);
                    refresh("activity");
                    setListOpen(false);
                    showFlash("Тренировка прервана");
                  },
                },
              )
            }
          />
        </FormScrollView>
      </SwipeToDismissSheet>

      <SessionFinishSheet
        visible={finishOpen}
        title={session.title}
        completedCount={review.completedSets}
        totalCount={review.totalSets}
        review={review}
        onClose={() => setFinishOpen(false)}
        onConfirm={(values) => {
          repo.completeWorkoutSession(session.id, values);
          if (undo?.ownerId === session.id) setUndo(null);
          setFinishOpen(false);
          refresh("activity");
          showFlash("Тренировка сохранена");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.screen, gap: space.lg, paddingBottom: space.xxl },
  emptySession: { gap: space.sm },
  flex: { flex: 1, minWidth: 0, gap: space.xs },
  hero: {
    gap: space.md,
    paddingBottom: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: space.sm },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  progressTrack: {
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.ink },
  exerciseBlock: { gap: space.xs },
  exerciseTitle: { letterSpacing: -0.5 },
  iconButton: {
    width: touchMin,
    minHeight: touchMin,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  sets: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  setPill: {
    minWidth: touchMin,
    minHeight: touchMin,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
  },
  setPillCurrent: { backgroundColor: colors.ink },
  navigation: { flexDirection: "row", gap: space.sm },
  exerciseDone: { gap: space.sm, alignItems: "center" },
  sheet: { padding: space.screen, gap: space.md },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    minHeight: touchMin,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  summaryHead: {
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.lg,
  },
  summaryIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.trainingStrength,
    justifyContent: "center",
    alignItems: "center",
  },
});

import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { PlannedActivity } from "../../../../../src/domain/strength/types";
import { SwipeToDismissSheet } from "@/src/components/SwipeToDismissSheet";
import {
  AppButton,
  AppText,
  Field,
  colors,
  space,
  touchMin,
} from "@/src/design-system";
import { useActivityRevision, useData } from "@/src/state/DataContext";
export function LinkCyclingSheet({
  activity,
  onClose,
  onLinked,
}: {
  activity: PlannedActivity | null;
  onClose: () => void;
  onLinked: (previousId: string | null) => void;
}) {
  const { repo } = useData();
  const revision = useActivityRevision();
  const [query, setQuery] = useState("");
  const rides = useMemo(
    () =>
      activity
        ? repo
            .listIntegratedWorkouts("garmin", Number.MAX_SAFE_INTEGER)
            .filter((w) => w.type === "cycling")
        : [],
    [repo, activity, revision],
  );
  const filtered = useMemo(
    () =>
      rides.filter((w) =>
        `${w.dateLocal} ${new Date(w.dateLocal + "T12:00:00Z").toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" })}`
          .toLocaleLowerCase("ru-RU")
          .includes(query.trim().toLocaleLowerCase("ru-RU")),
      ),
    [rides, query],
  );
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setError(null);
    setQuery("");
  }, [activity?.id]);
  const link = (id: string | null) => {
    if (!activity) return;
    try {
      const previous = activity.linkedWorkoutId ?? null;
      repo.linkPlannedCycling(activity.id, id);
      onLinked(previous);
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не удалось связать тренировку",
      );
    }
  };
  return (
    <SwipeToDismissSheet
      visible={!!activity}
      onClose={onClose}
      maxHeightRatio={0.9}
      testID="link-cycling-sheet"
    >
      <View style={styles.content}>
        <View style={styles.head}>
          <AppText variant="title" style={{ flex: 1 }}>
            Выполненная поездка
          </AppText>
          <Pressable
            style={styles.icon}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Закрыть выбор поездки"
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>
        <AppText variant="caption" tone="secondary">
          Выбери запись Garmin для «{activity?.title}». Дата и показатели
          поездки сохранятся.
        </AppText>
        {error ? (
          <AppText variant="caption" tone="danger" accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}
        <Field
          label="Поиск по дате"
          value={query}
          onChangeText={setQuery}
          placeholder="Например, 13 ноября или 2026-11"
        />
        <FlatList
          data={filtered}
          keyExtractor={(w) => w.id}
          style={styles.list}
          ListEmptyComponent={
            <AppText variant="body" tone="secondary">
              {query.trim()
                ? "По этой дате поездки не найдены."
                : "Пока нет выполненных велотренировок Garmin. Сначала синхронизируй записи."}
            </AppText>
          }
          renderItem={({ item: w }) => (
            <Pressable
              style={styles.ride}
              accessibilityRole="button"
              accessibilityLabel={`Связать поездку ${w.dateLocal}, ${Math.round(w.durationSec / 60)} минут`}
              testID={`link-ride-${w.id}`}
              onPress={() => link(w.id)}
            >
              <Ionicons name="bicycle-outline" size={20} color={colors.ink} />
              <View style={{ flex: 1, gap: space.xs }}>
                <AppText variant="body">
                  {new Date(w.dateLocal + "T12:00:00Z").toLocaleDateString(
                    "ru-RU",
                    { day: "numeric", month: "long", timeZone: "UTC" },
                  )}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  {Math.round(w.durationSec / 60)} мин
                  {w.distanceM != null
                    ? ` · ${(w.distanceM / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} км`
                    : ""}
                </AppText>
              </View>
              {activity?.linkedWorkoutId === w.id ? (
                <Ionicons name="checkmark" size={20} color={colors.success} />
              ) : null}
            </Pressable>
          )}
        />
        {activity?.linkedWorkoutId ? (
          <AppButton
            label="Убрать связь с поездкой"
            variant="secondary"
            onPress={() => link(null)}
          />
        ) : null}
        <AppText variant="caption" tone="muted">
          Показаны выполненные велотренировки Garmin. Связать поездку можно
          только с одним пунктом плана.
        </AppText>
      </View>
    </SwipeToDismissSheet>
  );
}
const styles = StyleSheet.create({
  content: { padding: space.screen, gap: space.md, maxHeight: "100%" },
  head: { flexDirection: "row", alignItems: "center", gap: space.sm },
  icon: {
    minWidth: touchMin,
    minHeight: touchMin,
    justifyContent: "center",
    alignItems: "center",
  },
  list: { flexGrow: 0 },
  ride: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    minHeight: touchMin,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});

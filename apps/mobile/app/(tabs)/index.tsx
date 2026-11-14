import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter, type Href } from "expo-router";
import { formatHabitWeekLabel } from "../../../../src/domain/habitWeek";
import { MEAL_LABELS } from "../../../../src/domain/diaryEntry";
import { localDateKey } from "../../../../src/storage/validation";
import type { FlexibleHabit } from "../../../../src/storage/types";
import { CopyYesterdayButton } from "@/src/components/CopyYesterdayButton";
import { DaySwipeArea } from "@/src/components/DaySwipeArea";
import { FormScrollView } from "@/src/components/FormScrollView";
import { KcalRing } from "@/src/components/KcalRing";
import { ScreenFooter } from "@/src/components/ScreenFooter";
import { StatCards } from "@/src/components/StatCards";
import { TodayChecklist } from "@/src/components/TodayChecklist";
import { DayCalendarSheet } from "@/src/features/calendar/DayCalendarSheet";
import { AddFoodSheet } from "@/src/features/diary/AddFoodSheet";
import { BarcodeLookupSheet } from "@/src/features/diary/BarcodeLookupSheet";
import { DiaryDayHeader } from "@/src/features/diary/DiaryDayHeader";
import { FoodQuickStrips } from "@/src/features/diary/FoodQuickStrips";
import { EntryAmountSheet } from "@/src/features/diary/EntryAmountSheet";
import { WaterEntrySheet } from "@/src/features/diary/WaterEntrySheet";
import { HabitDayValueSheet } from "@/src/features/habits/HabitDayValueSheet";
import { useQuickFood } from "@/src/features/diary/useQuickFood";
import type { AddFoodTab } from "@/src/features/diary/addFood/types";
import { strengthSessionHref } from "@/src/features/strength/StrengthEntryCard";
import { TodayTrainingCard } from "@/src/features/strength/TodayTrainingCard";
import {
  useActivityRevision,
  useData,
  useDiaryRevision,
} from "@/src/state/DataContext";
import {
  AppButton,
  AppText,
  colors,
  radius,
  space,
  touchMin,
} from "@/src/design-system";

/** Daily overview; detailed entry management lives in Food. */
export default function TodayScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const {
    repo,
    dateLocal,
    setDateLocal,
    meal,
    setMeal,
    refresh,
    showFlash,
    setUndo,
  } = useData();
  const diaryRevision = useDiaryRevision();
  const activityRevision = useActivityRevision();
  const quick = useQuickFood();
  const [open, setOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<AddFoodTab>("recent");
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [waterOpen, setWaterOpen] = useState(false);
  const [habit, setHabit] = useState<FlexibleHabit | null>(null);
  const profile = repo.getProfile();
  const today = localDateKey(new Date(), profile.timezone);
  const totals = repo.dailyTotals(dateLocal);
  const recent = useMemo(
    () => repo.listRecentEntries(16),
    [repo, diaryRevision],
  );
  const saved = useMemo(() => repo.listSavedMeals(), [repo, diaryRevision]);
  const flexibleRows = useMemo(
    () =>
      repo
        .listFlexibleHabits()
        .filter((h) => !h.pausedAt)
        .map((h) => {
          const stats = repo.flexibleHabitWeekStats(h.id, dateLocal);
          return {
            id: h.id,
            name: h.name,
            kind: h.kind,
            unit: h.unit,
            loggedToday: repo.isFlexibleHabitLogged(h.id, dateLocal),
            dayValue: repo.flexibleHabitDayValue(h.id, dateLocal),
            weekLabel: formatHabitWeekLabel(
              stats.completed,
              stats.target,
              h.kind === "quantity" ? h.unit : null,
            ),
            completed: stats.completed,
            target: stats.target,
          };
        }),
    [repo, dateLocal, diaryRevision, activityRevision],
  );
  useEffect(() => {
    repo.ensureStrengthCatalog();
  }, [repo]);
  const inProgress = useMemo(
    () => repo.listInProgressWorkoutSessions(),
    [repo, activityRevision],
  );
  const plan = useMemo(
    () => repo.listPlannedActivitiesForDate(dateLocal),
    [repo, dateLocal, activityRevision],
  );
  const add = (tab: AddFoodTab = "recent") => {
    setInitialTab(tab);
    setOpen(true);
  };
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          style={styles.icon}
          accessibilityRole="button"
          accessibilityLabel="План питания"
          onPress={() => router.push("/plan")}
        >
          <Ionicons name="compass-outline" size={22} color={colors.ink} />
        </Pressable>
      ),
    });
  }, [navigation, router]);
  const saveHabit = (selected: FlexibleHabit, value: number) => {
    const previous = repo.flexibleHabitDayValue(selected.id, dateLocal);
    repo.setFlexibleHabitDayValue(selected.id, dateLocal, value);
    const message = value
      ? `Записано: ${selected.name}`
      : `Убрано: ${selected.name}`;
    refresh("diary");
    showFlash(message);
    setUndo({
      message,
      action: () =>
        repo.setFlexibleHabitDayValue(selected.id, dateLocal, previous),
    });
  };
  return (
    <View style={styles.root} testID="today-screen">
      <DaySwipeArea dateLocal={dateLocal} onDateChange={setDateLocal}>
        <FormScrollView contentContainerStyle={styles.content}>
          <DiaryDayHeader
            dateLocal={dateLocal}
            today={today}
            onSelect={setDateLocal}
            onOpenCalendar={() => setCalendarOpen(true)}
          />
          <KcalRing
            totals={totals}
            targets={{
              energyKcal: profile.dailyEnergyKcal,
              proteinG: profile.dailyProteinG,
              fatG: profile.dailyFatG,
              carbG: profile.dailyCarbG,
            }}
            onSetTarget={() => router.push("/profile?section=goals")}
          />
          <Pressable
            style={styles.diary}
            onPress={() => router.push("/food?segment=diary")}
            accessibilityRole="button"
            accessibilityLabel="Открыть дневник питания"
            testID="today-open-diary"
          >
            <View style={{ flex: 1, gap: space.xs }}>
              <AppText variant="body">Дневник питания</AppText>
              <AppText variant="caption" tone="secondary">
                {totals.entryCount
                  ? `${totals.entryCount} поз. записано за день`
                  : "Продукты, рецепты и быстрый ввод"}
              </AppText>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.ink} />
          </Pressable>
          {recent.length || saved.length ? (
            <View style={styles.repeat}>
              <FoodQuickStrips
                compact
                maxItems={2}
                meal={meal}
                onPickMeal={setMeal}
                recent={recent}
                savedMeals={saved}
                onRecentConfirm={quick.setRepeating}
                onRecentQuick={quick.quickRepeat}
                onLogSaved={quick.logSaved}
                onOpenRecentInSheet={() => add()}
                onOpenSavedInSheet={() => add("meals")}
              />
              <CopyYesterdayButton testID="today-copy-yesterday" />
            </View>
          ) : null}
          <TodayTrainingCard
            inProgress={inProgress}
            todayPlan={plan}
            onStart={(activity) => {
              try {
                const session = repo.startWorkoutSession({
                  dateLocal: activity.dateLocal,
                  title: activity.title,
                  templateId: activity.templateId,
                  plannedActivityId: activity.id,
                });
                refresh("activity");
                showFlash(
                  session.status === "completed"
                    ? "Открыт результат"
                    : session.status === "in_progress"
                      ? "Продолжаем тренировку"
                      : "Сессия начата",
                );
                router.push(strengthSessionHref(session.id) as Href);
              } catch (e) {
                showFlash(
                  e instanceof Error
                    ? e.message
                    : "Не удалось открыть тренировку",
                );
              }
            }}
          />
          <StatCards
            waterMl={repo.waterMlForDate(dateLocal)}
            waterTargetMl={profile.waterTargetMl}
            activityMinutes={repo.activityMinutesForDate(dateLocal)}
            steps={repo.getDailyActivityStats(dateLocal)?.steps ?? null}
            sleepSec={repo.getSleepForDate(dateLocal)?.sleepSec ?? null}
            onOpenWater={() => setWaterOpen(true)}
            onAddWater={(ml) => {
              const row = repo.addWater(dateLocal, ml);
              const message = `Добавлено ${ml} мл воды`;
              refresh("diary");
              showFlash(message);
              setUndo({
                message,
                action: () => {
                  repo.removeWater(row.id);
                },
              });
            }}
          />
          <TodayChecklist
            flexibleHabits={flexibleRows}
            onManageHabits={() => router.push("/progress")}
            onToggleFlexible={(id) => {
              const selected = repo
                .listFlexibleHabits()
                .find((h) => h.id === id);
              if (!selected) return;
              if (selected.kind === "quantity") {
                setHabit(selected);
                return;
              }
              try {
                saveHabit(
                  selected,
                  repo.isFlexibleHabitLogged(id, dateLocal) ? 0 : 1,
                );
              } catch (e) {
                showFlash(
                  e instanceof Error
                    ? e.message
                    : "Не удалось записать привычку",
                );
              }
            }}
          />
        </FormScrollView>
      </DaySwipeArea>
      <ScreenFooter>
        <AppButton
          label="Добавить еду"
          onPress={() => add()}
          style={{ flex: 1 }}
          testID="today-add-cta"
        />
        <Pressable
          style={styles.scan}
          onPress={() => setBarcodeOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Сканировать штрихкод"
          testID="today-scan-cta"
        >
          <Ionicons name="barcode-outline" size={22} color={colors.ink} />
        </Pressable>
      </ScreenFooter>
      <AddFoodSheet
        visible={open}
        onClose={() => setOpen(false)}
        initialTab={initialTab}
      />
      <BarcodeLookupSheet
        visible={barcodeOpen}
        onClose={() => setBarcodeOpen(false)}
      />
      <DayCalendarSheet
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />
      <WaterEntrySheet
        visible={waterOpen}
        onClose={() => setWaterOpen(false)}
      />
      <EntryAmountSheet
        entry={quick.repeating}
        mode="repeat"
        context={`${MEAL_LABELS[meal]} · ${dateLocal}`}
        onClose={() => quick.setRepeating(null)}
        onSave={(amount) => {
          if (quick.repeating) quick.repeat(quick.repeating, amount);
        }}
      />
      <HabitDayValueSheet
        habit={habit}
        value={habit ? repo.flexibleHabitDayValue(habit.id, dateLocal) : 0}
        onClose={() => setHabit(null)}
        onSave={(value) => {
          if (habit) {
            saveHabit(habit, value);
            setHabit(null);
          }
        }}
      />


    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.screen, paddingBottom: 112, gap: space.sm },
  icon: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: "center",
    justifyContent: "center",
    marginRight: space.sm,
  },
  scan: {
    width: touchMin,
    height: touchMin,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  diary: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    minHeight: touchMin,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  repeat: { marginTop: space.md, gap: space.sm },
});

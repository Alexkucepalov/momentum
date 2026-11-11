import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter, type Href } from 'expo-router';

import {
  datesInWeekFromStart,
  HABIT_WEEKDAY_LABELS_RU,
  weekStartMonday,
} from '../../../../src/domain/habitWeek';
import { buildStrengthWeekDays } from '../../../../src/domain/strength';
import type { PlannedActivity } from '../../../../src/domain/strength/types';
import { shiftDateLocal } from '../../../../src/domain/repeatMeal';
import type { WorkoutType } from '../../../../src/storage/types';
import { localDateKey } from '../../../../src/storage/validation';
import { DayStrip } from '@/src/components/DayStrip';
import { DaySwipeArea } from '@/src/components/DaySwipeArea';
import { EmptyState } from '@/src/components/EmptyState';
import { WeekBarChart } from '@/src/components/WeekBarChart';
import { formatWeekRangeRu } from '@/src/components/weekFormat';
import { ActivityDaySummary } from '@/src/features/activity/ActivityDaySummary';
import { WorkoutFormSheet } from '@/src/features/activity/WorkoutFormSheet';
import { WorkoutRow } from '@/src/features/activity/WorkoutRow';
import { DayCalendarSheet } from '@/src/features/calendar/DayCalendarSheet';
import { SleepDayPanel } from '@/src/features/sleep/SleepDayPanel';
import { AddPlannedStrengthSheet } from '@/src/features/strength/AddPlannedStrengthSheet';
import { MoveCopyActivitySheet } from '@/src/features/strength/MoveCopyActivitySheet';
import {
  StrengthEntryCard,
  strengthHubHref,
  strengthSessionHref,
} from '@/src/features/strength/StrengthEntryCard';
import { StrengthWeekBoard } from '@/src/features/strength/StrengthWeekBoard';
import { useData, useActivityRevision } from '@/src/state/DataContext';
import { confirmAction } from '@/src/utils/confirmAction';
import {
  AppText,
  SegmentedControl,
  colors,
  radius,
  space,
  touchMin,
} from '@/src/design-system';

type MovementTab = 'activity' | 'sleep';

const TYPE_META: Array<{ type: WorkoutType; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { type: 'walking', label: 'Ходьба', icon: 'walk-outline' },
  { type: 'cycling', label: 'Вело', icon: 'bicycle-outline' },
  { type: 'strength', label: 'Сила', icon: 'barbell-outline' },
  { type: 'football', label: 'Футбол', icon: 'football-outline' },
  { type: 'other', label: 'Ещё', icon: 'fitness-outline' },
];

/** Movement hub: Activity | Sleep share dateLocal (Stage 3 / C1–C3). */
export default function MovementScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams<{ segment?: string }>();
  const { repo, dateLocal, setDateLocal, refresh, showFlash } = useData();
  const activityRevision = useActivityRevision();
  const [segment, setSegment] = useState<MovementTab>(
    params.segment === 'sleep' ? 'sleep' : 'activity',
  );
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<WorkoutType>('walking');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [weekOpen, setWeekOpen] = useState(false);
  const [addPlanOpen, setAddPlanOpen] = useState(false);
  const [moveCopy, setMoveCopy] = useState<{
    activity: PlannedActivity;
    mode: 'move' | 'copy';
  } | null>(null);

  useEffect(() => {
    if (params.segment === 'sleep') setSegment('sleep');
    if (params.segment === 'activity') setSegment('activity');
  }, [params.segment]);

  const openForm = (type: WorkoutType = 'walking') => {
    setFormType(type);
    setFormOpen(true);
  };

  const profile = repo.getProfile();
  useEffect(() => {
    const before = repo.listWorkoutTemplates().length;
    repo.ensureStrengthCatalog();
    if (repo.listWorkoutTemplates().length !== before) refresh('activity');
  }, [repo, refresh]);
  const strengthTemplates = repo.listWorkoutTemplates();
  const strengthInProgress = repo.listInProgressWorkoutSessions();
  const weekStart = weekStartMonday(dateLocal);
  const weekDates = useMemo(() => datesInWeekFromStart(weekStart), [weekStart]);
  const plannedWeek = useMemo(
    () => repo.listPlannedActivitiesInWeek(weekStart),
    [repo, weekStart, activityRevision],
  );
  const strengthWeekDays = useMemo(
    () => buildStrengthWeekDays({ weekDates, activities: plannedWeek }),
    [weekDates, plannedWeek],
  );
  const moveDayOptions = useMemo(
    () =>
      weekDates.map((d, i) => ({
        dateLocal: d,
        label: `${HABIT_WEEKDAY_LABELS_RU[i]} ${Number(d.slice(8, 10))}`,
      })),
    [weekDates],
  );
  const workouts = repo.listWorkoutsForDate(dateLocal);
  const totalMin = repo.activityMinutesForDate(dateLocal);
  const activityKcal = repo.activityEnergyKcalForDate(dateLocal);
  const dayStats = repo.getDailyActivityStats(dateLocal);
  const daySteps = dayStats?.steps ?? null;
  const dayDistanceM = dayStats?.distanceM ?? null;
  const dayActiveKcal = dayStats?.activeKcal ?? null;
  const workoutCalories = (() => {
    let sum = 0;
    let any = false;
    for (const w of workouts) {
      if (w.calories != null) {
        sum += w.calories;
        any = true;
      }
    }
    return any ? Math.round(sum) : null;
  })();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Движение',
      headerRight: () => (
        <Pressable
          onPress={() => (segment === 'activity' ? openForm('walking') : setCalendarOpen(true))}
          accessibilityRole="button"
          accessibilityLabel={segment === 'activity' ? 'Добавить тренировку' : 'Календарь'}
          style={styles.headerBtn}
          hitSlop={8}
        >
          <Ionicons
            name={segment === 'activity' ? 'add' : 'calendar-outline'}
            size={segment === 'activity' ? 26 : 22}
            color={colors.ink}
          />
        </Pressable>
      ),
    });
  }, [navigation, segment]);

  const weekMinutes = useMemo(() => {
    const start = weekStartMonday(dateLocal);
    const dates = datesInWeekFromStart(start);
    let sum = 0;
    const days = dates.map((d, weekdayIndex) => {
      const min = repo.activityMinutesForDate(d);
      sum += min;
      return { date: d, min, weekdayIndex };
    });
    return { start, end: dates[6] ?? start, sum, days };
  }, [repo, dateLocal]);
  const todayKey = localDateKey(new Date(), profile.timezone);
  const isEmptyWeek = workouts.length === 0 && weekMinutes.sum === 0;

  const repeatYesterday = () => {
    const yesterday = shiftDateLocal(dateLocal, -1);
    const prev = repo
      .listWorkoutsForDate(yesterday)
      .filter((w) => w.source === 'user' && w.deletedAt == null);
    if (prev.length === 0) {
      showFlash('Вчера нет своих тренировок для повтора');
      return;
    }
    for (const w of prev) {
      repo.addWorkout({
        dateLocal,
        type: w.type,
        durationSec: w.durationSec,
        distanceM: w.distanceM,
        notes: w.notes,
      });
    }
    refresh('activity');
    showFlash(`Повторено тренировок: ${prev.length}`);
  };

  return (
    <View style={styles.root} testID="movement-screen">
      <DaySwipeArea dateLocal={dateLocal} onDateChange={setDateLocal}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          testID="activity-screen"
        >
          <DayStrip
            selected={dateLocal}
            today={todayKey}
            onSelect={setDateLocal}
            onOpenCalendar={() => setCalendarOpen(true)}
          />

          <SegmentedControl<MovementTab>
            accessibilityLabel="Раздел движения"
            value={segment}
            onChange={setSegment}
            options={[
              { id: 'activity', label: 'Активность' },
              { id: 'sleep', label: 'Сон' },
            ]}
          />

          {segment === 'sleep' ? (
            <SleepDayPanel todayKey={todayKey} />
          ) : (
            <>
              <ActivityDaySummary
                totalMinutes={totalMin}
                activityKcal={activityKcal}
                steps={daySteps}
                distanceM={dayDistanceM}
                activeKcal={dayActiveKcal}
                workoutCount={workouts.length}
                workoutCalories={workoutCalories}
              />

              <StrengthWeekBoard
                days={strengthWeekDays}
                selectedDate={dateLocal}
                onSelectDate={setDateLocal}
                onAdd={() => setAddPlanOpen(true)}
                onMenu={(activity) => {
                  Alert.alert(activity.title, 'План ≠ факт. Перенос не меняет историю подходов.', [
                    {
                      text: 'Перенести',
                      onPress: () => setMoveCopy({ activity, mode: 'move' }),
                    },
                    {
                      text: 'Копировать',
                      onPress: () => setMoveCopy({ activity, mode: 'copy' }),
                    },
                    {
                      text: 'Удалить из плана',
                      style: 'destructive',
                      onPress: () => {
                        confirmAction('Убрать из плана?', 'Факт тренировок не затронется.', {
                          confirmLabel: 'Удалить',
                          destructive: true,
                          onConfirm: () => {
                            repo.softDeletePlannedActivity(activity.id);
                            refresh('activity');
                            showFlash('Убрано из плана');
                          },
                        });
                      },
                    },
                    { text: 'Отмена', style: 'cancel' },
                  ]);
                }}
                onStart={(activity) => {
                  const session = repo.startWorkoutSession({
                    dateLocal: activity.dateLocal,
                    title: activity.title,
                    templateId: activity.templateId,
                    plannedActivityId: activity.id,
                  });
                  refresh('activity');
                  showFlash('Сессия начата');
                  router.push(strengthSessionHref(session.id));
                }}
              />

              <StrengthEntryCard
                templates={strengthTemplates}
                inProgress={strengthInProgress}
                onOpenHub={() => router.push(strengthHubHref())}
                onContinue={(sessionId) => router.push(strengthSessionHref(sessionId))}
                onStartTemplate={(templateId) => {
                  const tmpl = repo.getWorkoutTemplate(templateId);
                  if (!tmpl) {
                    showFlash('Шаблон не найден');
                    return;
                  }
                  const planned = repo.addPlannedActivity({
                    dateLocal,
                    kind: 'strength',
                    title: tmpl.name,
                    subtitle: tmpl.subtitle,
                    templateId: tmpl.id,
                  });
                  const session = repo.startWorkoutSession({
                    dateLocal,
                    title: tmpl.name,
                    templateId: tmpl.id,
                    plannedActivityId: planned.id,
                  });
                  refresh('activity');
                  showFlash('Сессия начата');
                  router.push(strengthSessionHref(session.id));
                }}
              />

              <View style={styles.quickRow}>
                {TYPE_META.map((t) => (
                  <Pressable
                    key={t.type}
                    style={({ pressed }) => [styles.quickChip, pressed && styles.pressed]}
                    onPress={() => openForm(t.type)}
                    accessibilityRole="button"
                    accessibilityLabel={`Добавить ${t.label}`}
                  >
                    <Ionicons name={t.icon} size={16} color={colors.ink} />
                    <AppText variant="caption" style={styles.quickChipText}>
                      {t.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <AppText variant="label" tone="muted" style={styles.listLabel}>
                Тренировки дня
              </AppText>
              {workouts.length === 0 ? (
                <EmptyState
                  compact
                  icon="fitness-outline"
                  title={isEmptyWeek ? 'Пока пусто' : 'В этот день пусто'}
                  body={
                    isEmptyWeek
                      ? 'Добавь тренировку вручную или подключи Garmin.'
                      : 'Свайпни день или выбери дату выше.'
                  }
                  actionLabel="+ Тренировка"
                  onAction={() => openForm('walking')}
                  secondaryActionLabel={isEmptyWeek ? 'Garmin' : undefined}
                  onSecondaryAction={
                    isEmptyWeek ? () => router.push('/garmin' as Href) : undefined
                  }
                />
              ) : (
                <View style={styles.list}>
                  {workouts.map((w) => (
                    <WorkoutRow
                      key={w.id}
                      workout={w}
                      onPress={
                        w.source === 'garmin'
                          ? () => router.push(`/garmin/workout/${w.id}` as Href)
                          : undefined
                      }
                      onDelete={() => {
                        repo.softDeleteWorkout(w.id);
                        refresh('activity');
                        showFlash('Тренировка удалена');
                      }}
                    />
                  ))}
                </View>
              )}

              <Pressable
                onPress={() => setWeekOpen((v) => !v)}
                style={({ pressed }) => [styles.moreRow, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{ expanded: weekOpen }}
                accessibilityLabel="Неделя активности"
              >
                <AppText variant="body" style={styles.moreTitle}>
                  Неделя
                </AppText>
                <AppText variant="caption" tone="muted" style={styles.moreMeta}>
                  {weekMinutes.sum > 0 ? `${weekMinutes.sum} мин` : 'нет минут'}
                </AppText>
                <Ionicons
                  name={weekOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
              {weekOpen ? (
                <WeekBarChart
                  title="Минуты по дням"
                  subtitle={formatWeekRangeRu(weekMinutes.start, weekMinutes.end)}
                  selectedDate={dateLocal}
                  todayDate={todayKey}
                  onSelectDate={setDateLocal}
                  footnote="Пустой день — нет записей, не «ноль»."
                  days={weekMinutes.days.map((d) => ({
                    dateLocal: d.date,
                    weekdayIndex: d.weekdayIndex,
                    value: d.min,
                    valueLabel: d.min === 0 ? '·' : String(d.min),
                  }))}
                />
              ) : null}

              <Pressable
                onPress={repeatYesterday}
                style={({ pressed }) => [styles.moreRow, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Повторить вчерашние тренировки"
                testID="activity-repeat-yesterday"
              >
                <AppText variant="body" style={styles.moreTitle}>
                  Повторить вчера
                </AppText>
                <AppText variant="caption" tone="muted" style={styles.moreMeta}>
                  свои тренировки
                </AppText>
                <Ionicons name="copy-outline" size={18} color={colors.textMuted} />
              </Pressable>
            </>
          )}
        </ScrollView>
      </DaySwipeArea>

      <WorkoutFormSheet
        visible={formOpen}
        initialType={formType}
        onClose={() => setFormOpen(false)}
        onSave={(input) => {
          repo.addWorkout({
            dateLocal,
            type: input.type,
            durationSec: input.durationSec,
            distanceM: input.distanceM,
            notes: input.notes,
          });
          refresh('activity');
          showFlash('Тренировка сохранена');
        }}
      />
      <DayCalendarSheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} />
      <AddPlannedStrengthSheet
        visible={addPlanOpen}
        dateLabel={`${HABIT_WEEKDAY_LABELS_RU[weekDates.indexOf(dateLocal)] ?? ''} ${Number(dateLocal.slice(8, 10))}`}
        templates={strengthTemplates}
        onClose={() => setAddPlanOpen(false)}
        onPickTemplate={(templateId) => {
          const tmpl = repo.getWorkoutTemplate(templateId);
          if (!tmpl) return;
          repo.addPlannedActivity({
            dateLocal,
            kind: 'strength',
            title: tmpl.name,
            subtitle: tmpl.subtitle,
            templateId: tmpl.id,
          });
          setAddPlanOpen(false);
          refresh('activity');
          showFlash('Добавлено в план');
        }}
        onAddCardio={() => {
          repo.addPlannedActivity({
            dateLocal,
            kind: 'cardio',
            title: 'Кардио',
            cardioMinutes: 30,
          });
          setAddPlanOpen(false);
          refresh('activity');
          showFlash('Кардио в плане');
        }}
        onAddRest={() => {
          repo.addPlannedActivity({
            dateLocal,
            kind: 'rest',
            title: 'Отдых',
          });
          setAddPlanOpen(false);
          refresh('activity');
          showFlash('Отдых в плане');
        }}
      />
      <MoveCopyActivitySheet
        visible={moveCopy != null}
        mode={moveCopy?.mode ?? 'move'}
        activityTitle={moveCopy?.activity.title ?? ''}
        days={moveDayOptions}
        onClose={() => setMoveCopy(null)}
        onPick={(targetDate) => {
          if (!moveCopy) return;
          if (moveCopy.mode === 'move') {
            repo.movePlannedActivity(moveCopy.activity.id, { dateLocal: targetDate });
            showFlash('Перенесено');
          } else {
            repo.copyPlannedActivity(moveCopy.activity.id, { dateLocal: targetDate });
            showFlash('Скопировано');
          }
          setMoveCopy(null);
          refresh('activity');
          setDateLocal(targetDate);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: 48,
    gap: space.sm,
  },
  headerBtn: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.sm,
  },
  pressed: { opacity: 0.88 },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  quickChipText: { fontWeight: '600' },
  listLabel: {
    marginTop: space.sm,
    marginBottom: space.xs,
    paddingHorizontal: space.xs,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  list: { gap: space.sm },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  moreTitle: { fontWeight: '700' },
  moreMeta: { flex: 1 },
});

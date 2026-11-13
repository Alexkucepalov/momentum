import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter, type Href } from 'expo-router';

import {
  datesInWeekFromStart,
  HABIT_WEEKDAY_LABELS_RU,
  weekStartMonday,
} from '../../../../src/domain/habitWeek';
import { buildStrengthWeekDays } from '../../../../src/domain/strength';
import type { PlannedActivity } from '../../../../src/domain/strength/types';
import type { WorkoutType } from '../../../../src/storage/types';
import { localDateKey } from '../../../../src/storage/validation';
import { DayStrip } from '@/src/components/DayStrip';
import { DaySwipeArea } from '@/src/components/DaySwipeArea';
import { WorkoutFormSheet } from '@/src/features/activity/WorkoutFormSheet';
import { WorkoutRow } from '@/src/features/activity/WorkoutRow';
import { DayCalendarSheet } from '@/src/features/calendar/DayCalendarSheet';
import { SleepDayPanel } from '@/src/features/sleep/SleepDayPanel';
import { AddPlannedStrengthSheet } from '@/src/features/strength/AddPlannedStrengthSheet';
import { DraftSessionBanner } from '@/src/features/strength/DraftSessionBanner';
import { MoveCopyActivitySheet } from '@/src/features/strength/MoveCopyActivitySheet';
import {
  strengthHubHref,
  strengthSessionHref,
  strengthTemplateHref,
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

/** Movement: plan a day → start session. Fact/Garmin stays secondary. */
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
  const [addPlanOpen, setAddPlanOpen] = useState(false);
  const [draggingPlan, setDraggingPlan] = useState(false);
  const [moveUndo, setMoveUndo] = useState<{ message: string; undo: () => void } | null>(null);
  useEffect(() => {
    if (!moveUndo) return;
    const timer = setTimeout(() => setMoveUndo(null), 6500);
    return () => clearTimeout(timer);
  }, [moveUndo]);
  const [moveCopy, setMoveCopy] = useState<{
    activity: PlannedActivity;
    mode: 'move' | 'copy';
  } | null>(null);

  useEffect(() => {
    if (params.segment === 'sleep') setSegment('sleep');
    if (params.segment === 'activity') setSegment('activity');
  }, [params.segment]);

  const profile = repo.getProfile();
  useEffect(() => {
    const before = repo.listWorkoutTemplates().length;
    repo.ensureStrengthCatalog();
    if (repo.listWorkoutTemplates().length !== before) refresh('activity');
  }, [repo, refresh]);

  const strengthTemplates = repo.listWorkoutTemplates();
  const draft = repo.listInProgressWorkoutSessions()[0] ?? null;
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
  const todayKey = localDateKey(new Date(), profile.timezone);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Движение',
      headerRight: () => (
        <Pressable
          onPress={() =>
            segment === 'activity' ? setAddPlanOpen(true) : setCalendarOpen(true)
          }
          accessibilityRole="button"
          accessibilityLabel={segment === 'activity' ? 'Добавить в план' : 'Календарь'}
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

  const applyProgram = () => {
    const hasCards = strengthWeekDays.some((d) => d.activities.length > 0);
    const run = (replace: boolean) => {
      try {
        const { created } = repo.applyStrengthProgramWeek(weekStart, { replace });
        refresh('activity');
        showFlash(
          replace
            ? `Программа на неделю обновлена (${created})`
            : `Программа добавлена (${created})`,
        );
      } catch (e) {
        showFlash(e instanceof Error ? e.message : 'Не удалось применить программу');
      }
    };
    if (!hasCards) {
      run(false);
      return;
    }
    Alert.alert(
      'Программа на неделю',
      'Заменить текущие карточки планом? История выполненных тренировок не изменится.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Добавить сверху', onPress: () => run(false) },
        { text: 'Заменить', style: 'destructive', onPress: () => run(true) },
      ],
    );
  };

  const openPlanMenu = (activity: PlannedActivity) => {
    if (Platform.OS === 'web') {
      setMoveCopy({ activity, mode: 'move' });
      return;
    }
    const dayCards = repo.listPlannedActivitiesForDate(activity.dateLocal);
    const idx = dayCards.findIndex((a) => a.id === activity.id);
    Alert.alert(activity.title, 'План ≠ факт. Перенос не меняет историю.', [
      { text: 'Перенести', onPress: () => setMoveCopy({ activity, mode: 'move' }) },
      { text: 'Копировать', onPress: () => setMoveCopy({ activity, mode: 'copy' }) },
      ...(idx > 0
        ? [
            {
              text: 'Выше',
              onPress: () => {
                repo.reorderPlannedActivity(activity.id, 'up');
                refresh('activity');
              },
            },
          ]
        : []),
      ...(idx >= 0 && idx < dayCards.length - 1
        ? [
            {
              text: 'Ниже',
              onPress: () => {
                repo.reorderPlannedActivity(activity.id, 'down');
                refresh('activity');
              },
            },
          ]
        : []),
      ...(activity.templateId
        ? [
            {
              text: 'Изменить шаблон',
              onPress: () => router.push(strengthTemplateHref(activity.templateId!)),
            },
          ]
        : []),
      {
        text: 'Удалить из плана',
        style: 'destructive' as const,
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
      { text: 'Отмена', style: 'cancel' as const },
    ]);
  };

  const startPlanned = (activity: PlannedActivity) => {
    const session = repo.startWorkoutSession({
      dateLocal: activity.dateLocal,
      title: activity.title,
      templateId: activity.templateId,
      plannedActivityId: activity.id,
    });
    refresh('activity');
    showFlash('Сессия начата');
    router.push(strengthSessionHref(session.id));
  };

  return (
    <View style={styles.root} testID="movement-screen">
      <DaySwipeArea dateLocal={dateLocal} onDateChange={setDateLocal}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!draggingPlan}
          testID="activity-screen"
        >
          <SegmentedControl<MovementTab>
            accessibilityLabel="Раздел движения"
            value={segment}
            onChange={setSegment}
            options={[
              { id: 'activity', label: 'Тренировки' },
              { id: 'sleep', label: 'Сон' },
            ]}
          />

          {segment === 'sleep' ? (
            <SleepDayPanel todayKey={todayKey} />
          ) : (
            <>
              {draft ? (
                <DraftSessionBanner
                  session={draft}
                  onContinue={() => router.push(strengthSessionHref(draft.id))}
                />
              ) : null}

              <StrengthWeekBoard
                days={strengthWeekDays}
                selectedDate={dateLocal}
                todayDate={todayKey}
                onSelectDate={setDateLocal}
                onAdd={() => setAddPlanOpen(true)}
                onApplyProgram={applyProgram}
                onOpenTemplates={() => router.push(strengthHubHref())}
                onMenu={openPlanMenu}
                onStart={startPlanned}
                onDraggingChange={setDraggingPlan}
                workouts={weekDates.flatMap(d => repo.listWorkoutsForDate(d))}
                onOpenWorkout={w => {
                  if (w.source === 'garmin') router.push(`/garmin/workout/${w.id}` as Href);
                  else setDateLocal(w.dateLocal);
                }}
                onDrop={(activity, target) => {
                  try {
                    const other = target.activityId && target.activityId !== activity.id
                      ? plannedWeek.find(a => a.id === target.activityId)
                      : undefined;
                    if (other) {
                      repo.swapPlannedActivities(activity.id, other.id);
                      setMoveUndo({ message: 'Тренировки поменялись местами', undo: () => { repo.swapPlannedActivities(activity.id, other.id); } });
                    } else if (activity.dateLocal !== target.dateLocal) {
                      repo.movePlannedActivity(activity.id, { dateLocal: target.dateLocal });
                      setMoveUndo({ message: 'Тренировка перенесена', undo: () => { repo.movePlannedActivity(activity.id, { dateLocal: activity.dateLocal, sortOrder: activity.sortOrder }); } });
                    }
                    refresh('activity');
                  } catch (e) { showFlash(e instanceof Error ? e.message : 'Не удалось перенести тренировку'); }
                }}
              />

              <View style={styles.logSection}>
                <View style={styles.logHead}>
                  <AppText variant="label" tone="muted" style={styles.logLabel}>
                    Записи
                  </AppText>
                  <Pressable
                    onPress={() => {
                      setFormType('walking');
                      setFormOpen(true);
                    }}
                    style={({ pressed }) => [styles.logAdd, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Записать активность"
                    testID="activity-log-add"
                  >
                    <Ionicons name="add" size={18} color={colors.ink} />
                    <AppText variant="caption">Записать</AppText>
                  </Pressable>
                </View>

                {workouts.length === 0 ? (
                  <AppText variant="caption" tone="muted" style={styles.logEmpty}>
                    Нет записей за выбранный день. Добавь активность или синхронизируй Garmin.
                  </AppText>
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
                  onPress={() => router.push('/garmin' as Href)}
                  style={({ pressed }) => [styles.garminLink, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Garmin"
                >
                  <AppText variant="caption" tone="secondary">
                    Garmin
                  </AppText>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </Pressable>
              </View>
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
            title: 'Вело',
            cardioMinutes: 30,
          });
          setAddPlanOpen(false);
          refresh('activity');
          showFlash('Велотренировка в плане');
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
            const previous = moveCopy.activity;
            setMoveUndo({ message: 'Тренировка перенесена', undo: () => { repo.movePlannedActivity(previous.id, { dateLocal: previous.dateLocal, sortOrder: previous.sortOrder }); } });
          } else {
            repo.copyPlannedActivity(moveCopy.activity.id, { dateLocal: targetDate });
            showFlash('Скопировано');
          }
          setMoveCopy(null);
          refresh('activity');
          setDateLocal(targetDate);
        }}
      />
      {moveUndo ? <View style={styles.moveNotice} accessibilityRole="alert"><AppText variant="caption" tone="inverse" style={{ flex: 1 }}>{moveUndo.message}</AppText><Pressable accessibilityRole="button" accessibilityLabel="Отменить перенос тренировки" onPress={() => { try { moveUndo.undo(); refresh('activity'); } catch (e) { showFlash(e instanceof Error ? e.message : 'Не удалось отменить'); } setMoveUndo(null); }} style={styles.undoButton}><AppText variant="caption" tone="inverse">Отменить</AppText></Pressable></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingHorizontal: space.screen,
    paddingTop: space.sm,
    paddingBottom: 48,
    gap: space.md,
  },
  headerBtn: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.sm,
  },
  logSection: {
    gap: space.sm,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  logHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logLabel: {
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  logAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: touchMin - 8,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  logEmpty: { paddingVertical: space.xs },
  list: { gap: space.sm },
  garminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchMin - 8,
  },
  pressed: { opacity: 0.85 },
  moveNotice: { position: 'absolute', left: space.screen, right: space.screen, bottom: space.md, paddingLeft: space.lg, paddingRight: space.sm, borderRadius: radius.lg, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  undoButton: { minHeight: touchMin, paddingHorizontal: space.sm, justifyContent: 'center' },
});

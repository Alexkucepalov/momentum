import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter, type Href } from 'expo-router';
import { datesInWeekFromStart, HABIT_WEEKDAY_LABELS_RU, weekStartMonday } from '../../../../src/domain/habitWeek';
import { buildStrengthWeekDays } from '../../../../src/domain/strength';
import type { PlannedActivity } from '../../../../src/domain/strength/types';
import type { WorkoutType } from '../../../../src/storage/types';
import { localDateKey } from '../../../../src/storage/validation';
import { DaySwipeArea } from '@/src/components/DaySwipeArea';
import { ActionMenuSheet, type MenuAction } from '@/src/components/ActionMenuSheet';
import { WorkoutFormSheet } from '@/src/features/activity/WorkoutFormSheet';
import { WorkoutRow } from '@/src/features/activity/WorkoutRow';
import { DayCalendarSheet } from '@/src/features/calendar/DayCalendarSheet';
import { SleepDayPanel } from '@/src/features/sleep/SleepDayPanel';
import { AddPlannedStrengthSheet } from '@/src/features/strength/AddPlannedStrengthSheet';
import { DraftSessionBanner } from '@/src/features/strength/DraftSessionBanner';
import { MoveCopyActivitySheet } from '@/src/features/strength/MoveCopyActivitySheet';
import { strengthHubHref, strengthSessionHref, strengthTemplateHref } from '@/src/features/strength/StrengthEntryCard';
import { StrengthWeekBoard } from '@/src/features/strength/StrengthWeekBoard';
import { TrainingCycleSheet } from '@/src/features/strength/TrainingCycleSheet';
import { LinkCyclingSheet } from '@/src/features/strength/LinkCyclingSheet';
import { useData, useActivityRevision } from '@/src/state/DataContext';
import { confirmAction } from '@/src/utils/confirmAction';
import { AppText, SegmentedControl, colors, radius, space, touchMin } from '@/src/design-system';

type MovementTab = 'activity' | 'sleep';
export default function MovementScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams<{ segment?: string }>();
  const { repo, dateLocal, setDateLocal, refresh, showFlash, setUndo } = useData();
  const revision = useActivityRevision();
  const [segment, setSegment] = useState<MovementTab>(params.segment === 'sleep' ? 'sleep' : 'activity');
  const [formOpen, setFormOpen] = useState(false);
  const [formType] = useState<WorkoutType>('walking');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [editor, setEditor] = useState<{ date: string; activity?: PlannedActivity } | null>(null);
  const [menu, setMenu] = useState<PlannedActivity | null>(null);
  const [weekMenu, setWeekMenu] = useState<'week' | 'program' | null>(null);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [linking, setLinking] = useState<PlannedActivity | null>(null);
  const [draggingPlan, setDraggingPlan] = useState(false);
  const [moveCopy, setMoveCopy] = useState<{ activity: PlannedActivity; mode: 'move' | 'copy' } | null>(null);
  const scroll = useRef<ScrollView>(null);
  const scrollViewport = useRef<View>(null);
  const scrollY = useRef(0);
  const scrollBox = useRef({ top: 0, bottom: 0, max: 0 });
  const contentHeight = useRef(0);
  const viewportHeight = useRef(0);
  useEffect(() => { if (params.segment === 'sleep' || params.segment === 'activity') setSegment(params.segment); }, [params.segment]);
  useEffect(() => { repo.ensureStrengthCatalog(); }, [repo]);
  const profile = repo.getProfile();
  const templates = repo.listWorkoutTemplates();
  const drafts = repo.listInProgressWorkoutSessions();
  const weekStart = weekStartMonday(dateLocal);
  const weekDates = useMemo(() => datesInWeekFromStart(weekStart), [weekStart]);
  const plannedWeek = useMemo(() => repo.listPlannedActivitiesInWeek(weekStart), [repo, weekStart, revision]);
  const days = useMemo(() => buildStrengthWeekDays({ weekDates, activities: plannedWeek }), [weekDates, plannedWeek]);
  const weekSessions = weekDates.flatMap(d => repo.listWorkoutSessionsForDate(d));
  for (const activity of plannedWeek) {
    const linked = repo.getWorkoutSessionForPlan(activity.id);
    if (linked && !weekSessions.some(s => s.id === linked.id)) weekSessions.push(linked);
  }
  const workouts = repo.listWorkoutsForDate(dateLocal);
  const boardWorkouts = weekDates.flatMap(d => repo.listWorkoutsForDate(d));
  for (const card of plannedWeek) {
    const linked = card.linkedWorkoutId ? repo.getWorkoutById(card.linkedWorkoutId) : null;
    if (linked && !boardWorkouts.some(w => w.id === linked.id)) boardWorkouts.push(linked);
  }
  const todayKey = localDateKey(new Date(), profile.timezone);
  const options = weekDates.map((d, i) => ({ dateLocal: d, label: `${HABIT_WEEKDAY_LABELS_RU[i]} ${Number(d.slice(8, 10))}` }));
  const feedback = (message: string, undo: () => void) => {
    setUndo({ message, action: undo, scope: 'activity' });
    refresh('activity');
  };
  const attempt = (action: () => void) => { try { action(); } catch (e) { showFlash(e instanceof Error ? e.message : 'Не удалось выполнить действие'); } };
  const openEditor = (date = dateLocal, activity?: PlannedActivity) => setEditor({ date, activity });
  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Движение', headerRight: () => <Pressable onPress={() => segment === 'activity' ? openEditor(dateLocal) : setCalendarOpen(true)} accessibilityRole="button" accessibilityLabel={segment === 'activity' ? 'Добавить в план' : 'Календарь'} style={styles.headerBtn}><Ionicons name={segment === 'activity' ? 'add' : 'calendar-outline'} size={24} color={colors.ink} /></Pressable> });
  }, [navigation, segment, dateLocal]);
  const start = (activity: PlannedActivity) => attempt(() => {
    const existing = repo.getWorkoutSessionForPlan(activity.id);
    const session = repo.startWorkoutSession({ dateLocal: activity.dateLocal, title: activity.title, templateId: activity.templateId, plannedActivityId: activity.id });
    refresh('activity');
    showFlash(session.status === 'completed' ? 'Открыт результат тренировки' : existing ? 'Продолжаем тренировку' : 'Сессия начата');
    router.push(strengthSessionHref(session.id));
  });
  const applyProgram = (replace: boolean, fromCycle = false) => attempt(() => {
    const before = repo.listPlannedActivitiesInWeek(weekStart);
    if (fromCycle) repo.applyTrainingCycleWeek(weekStart, { replace });
    else repo.applyStrengthProgramWeek(weekStart, { replace });
    const ids = new Set(before.map(a => a.id));
    const created = repo.listPlannedActivitiesInWeek(weekStart).filter(a => !ids.has(a.id));
    feedback(fromCycle ? 'Шаблон применён к неделе' : 'Программа добавлена в неделю', () => { created.forEach(a => repo.softDeletePlannedActivity(a.id)); if (replace) before.forEach(a => repo.restorePlannedActivity(a.id)); });
  });
  const repeatWeek = () => {
    const run = () => attempt(() => {
      const d = new Date(`${weekStart}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - 7);
      const copies = repo.repeatTrainingWeek(d.toISOString().slice(0, 10), weekStart);
      feedback(`Прошлый план повторён · ${copies.length}`, () => copies.forEach(a => repo.softDeletePlannedActivity(a.id)));
    });
    if (plannedWeek.length) confirmAction('Добавить прошлую неделю?', 'Текущие карточки сохранятся. Появятся копии плана прошлой недели с новыми датами.', { confirmLabel: 'Добавить', onConfirm: run });
    else run();
  };
  let actions: MenuAction[] = [];
  if (menu) {
    const activity = menu;
    const linked = repo.getWorkoutSessionForPlan(activity.id) || (activity.linkedWorkoutId ? repo.getWorkoutById(activity.linkedWorkoutId) : null);
    const sameDay = repo.listPlannedActivitiesForDate(activity.dateLocal);
    const index = sameDay.findIndex(a => a.id === activity.id);
    actions = [
      { id: 'edit', label: 'Изменить план', detail: 'Название, начало и длительность', onPress: () => openEditor(activity.dateLocal, activity) },
      ...(!linked ? [{ id: 'move', label: 'Перенести', onPress: () => setMoveCopy({ activity, mode: 'move' as const }) }] : []),
      { id: 'copy', label: 'Копировать', onPress: () => setMoveCopy({ activity, mode: 'copy' }) },
      ...(activity.kind === 'cardio' ? [{ id: 'link-ride', label: activity.linkedWorkoutId ? 'Изменить связь с Garmin' : 'Связать с поездкой Garmin', detail: 'Выбрать выполненную велотренировку', onPress: () => setLinking(activity) }] : []),
      ...(activity.templateId ? [{ id: 'exercises', label: 'Изменить упражнения', detail: 'Шаблон для следующих сессий', onPress: () => router.push(strengthTemplateHref(activity.templateId!)) }] : []),
      ...(!linked && index > 0 ? [{ id: 'up', label: 'Выше в этом дне', onPress: () => attempt(() => { repo.reorderPlannedActivity(activity.id, 'up'); refresh('activity'); }) }] : []),
      ...(!linked && index < sameDay.length - 1 ? [{ id: 'down', label: 'Ниже в этом дне', onPress: () => attempt(() => { repo.reorderPlannedActivity(activity.id, 'down'); refresh('activity'); }) }] : []),
      { id: 'delete', label: 'Убрать из плана', detail: 'Выполненная тренировка сохранится', destructive: true, onPress: () => attempt(() => { repo.softDeletePlannedActivity(activity.id); feedback('Убрано из плана', () => { repo.restorePlannedActivity(activity.id); }); }) },
    ];
  }
  const weekActions: MenuAction[] = weekMenu === 'program' ? [
    { id: 'program-add', label: 'Добавить к текущему плану', onPress: () => applyProgram(false) },
    { id: 'program-replace', label: 'Заменить план недели', detail: 'Выполненные тренировки сохранятся', destructive: true, onPress: () => applyProgram(true) },
  ] : [
    { id: 'edit-cycle', label: 'Редактировать шаблон недели', detail: repo.getTrainingCycle()?.name ?? 'Силовые, вело и отдых', onPress: () => setCycleOpen(true) },
    ...(repo.getTrainingCycle() ? [{ id: 'apply-cycle', label: 'Применить мой шаблон', detail: 'Добавить карточки, сохранив изменения этой недели', onPress: () => applyProgram(false, true) }] : []),
    ...(repo.getTrainingCycle() ? [{ id: 'fill-cycle', label: 'Запланировать 4 недели', detail: 'Заполнить пустые недели; существующие планы сохранятся', onPress: () => confirmAction('Запланировать 4 недели?', 'Пустые недели начиная с выбранной будут заполнены твоим шаблоном. Недели с существующим планом пропускаются.', { confirmLabel: 'Запланировать', onConfirm: () => attempt(() => { const result = repo.fillTrainingCycleWeeks(weekStart, 4); feedback(`Добавлено: ${result.createdIds.length} · сохранено недель: ${result.skippedWeeks}`, () => result.createdIds.forEach(id => repo.softDeletePlannedActivity(id))); }) }) }] : []),
    { id: 'repeat-week', label: 'Повторить прошлую неделю', detail: 'Копия плана с изменениями прошлой недели', onPress: repeatWeek },
    { id: 'program', label: 'Заполнить из программы', onPress: () => plannedWeek.length ? setWeekMenu('program') : applyProgram(false) },
    { id: 'templates', label: 'Шаблоны упражнений', onPress: () => router.push(strengthHubHref()) },
    { id: 'calendar', label: 'Выбрать дату в календаре', onPress: () => setCalendarOpen(true) },
    { id: 'today', label: 'Вернуться к текущей неделе', onPress: () => setDateLocal(todayKey) },
  ];
  return <View ref={scrollViewport} collapsable={false} style={styles.root} testID="movement-screen">
    <DaySwipeArea dateLocal={dateLocal} onDateChange={setDateLocal}>
      <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" scrollEnabled={!draggingPlan} testID="activity-screen" scrollEventThrottle={16}
        onScroll={e => { scrollY.current = e.nativeEvent.contentOffset.y; }}
        onContentSizeChange={(_, h) => { contentHeight.current = h; scrollBox.current.max = Math.max(0, h - viewportHeight.current); }}
        onLayout={e => { viewportHeight.current = e.nativeEvent.layout.height; scrollBox.current.max = Math.max(0, contentHeight.current - viewportHeight.current); scrollViewport.current?.measureInWindow((_, y, _w, h) => { scrollBox.current.top = y; scrollBox.current.bottom = y + h; }); }}>
        <SegmentedControl<MovementTab> accessibilityLabel="Раздел движения" value={segment} onChange={setSegment} options={[{ id: 'activity', label: 'Тренировки' }, { id: 'sleep', label: 'Сон' }]} />
        {segment === 'sleep' ? <SleepDayPanel todayKey={todayKey} onUndo={feedback} /> : <>
          {drafts.map(draft => <DraftSessionBanner key={draft.id} session={draft} onContinue={() => router.push(strengthSessionHref(draft.id))} />)}
          <StrengthWeekBoard days={days} selectedDate={dateLocal} todayDate={todayKey} sessions={weekSessions} onSelectDate={setDateLocal} onAdd={date => openEditor(date ?? dateLocal)} onApplyProgram={() => setWeekMenu('week')} onOpenTemplates={() => router.push(strengthHubHref())} onOpenCalendar={() => setCalendarOpen(true)} onMenu={setMenu} onStart={start} onDraggingChange={setDraggingPlan}
            onAutoScroll={pointerY => { const box = scrollBox.current; const delta = pointerY < box.top + 64 ? -16 : pointerY > box.bottom - 64 ? 16 : 0; const next = Math.max(0, Math.min(box.max, scrollY.current + delta)); if (!delta || next === scrollY.current) return false; scrollY.current = next; scroll.current?.scrollTo({ y: next, animated: false }); return true; }}
            workouts={boardWorkouts} onOpenSession={session => router.push(strengthSessionHref(session.id))}
            onOpenWorkout={w => { if (w.source === 'garmin') router.push(`/garmin/workout/${encodeURIComponent(w.id)}` as Href); else setDateLocal(w.dateLocal); }}
            onDrop={(activity, target) => attempt(() => {
              const other = target.activityId && target.activityId !== activity.id ? plannedWeek.find(a => a.id === target.activityId) : undefined;
              if (other) { repo.swapPlannedActivities(activity.id, other.id); feedback('Тренировки поменялись местами', () => { repo.swapPlannedActivities(activity.id, other.id); }); }
              else if (activity.dateLocal !== target.dateLocal) { repo.movePlannedActivity(activity.id, { dateLocal: target.dateLocal }); feedback('Тренировка перенесена', () => { repo.movePlannedActivity(activity.id, { dateLocal: activity.dateLocal, sortOrder: activity.sortOrder }); }); }
            })} />
          <View style={styles.logSection}>
            <View style={styles.logHead}><AppText variant="subtitle">Записи за день</AppText><Pressable onPress={() => setFormOpen(true)} style={styles.logAdd} accessibilityRole="button" accessibilityLabel="Записать активность" testID="activity-log-add"><Ionicons name="add" size={18} color={colors.ink} /><AppText variant="caption">Записать</AppText></Pressable></View>
            <AppText variant="caption" tone="secondary">{new Date(`${dateLocal}T12:00:00Z`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' })}</AppText>
            {workouts.length === 0 ? <AppText variant="caption" tone="muted">Пока без записей активности. Силовые сессии видны выше в недельном цикле.</AppText> : workouts.map(w => <WorkoutRow key={w.id} workout={w} onPress={w.source === 'garmin' ? () => router.push(`/garmin/workout/${encodeURIComponent(w.id)}` as Href) : undefined} onDelete={() => attempt(() => { repo.softDeleteWorkout(w.id); feedback('Запись удалена', () => { repo.restoreWorkout(w.id); }); })} />)}
            <Pressable onPress={() => router.push('/garmin' as Href)} style={styles.garminLink} accessibilityRole="button" accessibilityLabel="Синхронизация Garmin"><AppText variant="caption">Синхронизация Garmin</AppText><Ionicons name="arrow-forward" size={16} color={colors.textMuted} /></Pressable>
          </View>
        </>}
      </ScrollView>
    </DaySwipeArea>
    <WorkoutFormSheet visible={formOpen} initialType={formType} onClose={() => setFormOpen(false)} onSave={input => attempt(() => { const row = repo.addWorkout({ dateLocal, type: input.type, durationSec: input.durationSec, distanceM: input.distanceM, notes: input.notes }); feedback('Активность записана', () => { repo.softDeleteWorkout(row.id); }); })} />
    <DayCalendarSheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} />
    <AddPlannedStrengthSheet visible={editor != null} activity={editor?.activity} dateLabel={new Date(`${editor?.date ?? dateLocal}T12:00:00Z`).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' })} templates={templates} onClose={() => setEditor(null)} onSave={input => {
      if (!editor) return;
      if (editor.activity) { const previous = editor.activity; repo.updatePlannedActivity(previous.id, input); feedback('План обновлён', () => { repo.updatePlannedActivity(previous.id, previous); }); }
      else { const row = repo.addPlannedActivity({ ...input, dateLocal: editor.date }); feedback('Добавлено в план', () => { repo.softDeletePlannedActivity(row.id); }); }
      setEditor(null);
    }} />
    <ActionMenuSheet visible={menu != null} title={menu?.title ?? ''} description="План ≠ факт. Изменения плана не переписывают выполненную тренировку." actions={actions} onClose={() => setMenu(null)} />
    <ActionMenuSheet visible={weekMenu != null} title={weekMenu === 'program' ? 'Программа на неделю' : 'Управление неделей'} actions={weekActions} onClose={() => setWeekMenu(null)} />
    <TrainingCycleSheet visible={cycleOpen} monday={weekStart} onClose={() => setCycleOpen(false)} onSaved={previous => feedback('Шаблон недели сохранён', () => repo.restoreTrainingCycle(previous))} />
    <LinkCyclingSheet activity={linking} onClose={() => setLinking(null)} onLinked={previousId => { if (!linking) return; const id = linking.id; feedback('Связь с поездкой обновлена', () => { repo.linkPlannedCycling(id, previousId); }); }} />
    <MoveCopyActivitySheet visible={moveCopy != null} mode={moveCopy?.mode ?? 'move'} activityTitle={moveCopy?.activity.title ?? ''} days={options} onClose={() => setMoveCopy(null)} onPick={targetDate => attempt(() => {
      if (!moveCopy) return;
      const previous = moveCopy.activity;
      if (moveCopy.mode === 'move') { repo.movePlannedActivity(previous.id, { dateLocal: targetDate }); feedback('Тренировка перенесена', () => { repo.movePlannedActivity(previous.id, { dateLocal: previous.dateLocal, sortOrder: previous.sortOrder }); setDateLocal(previous.dateLocal); }); }
      else { const copy = repo.copyPlannedActivity(previous.id, { dateLocal: targetDate }); feedback('План скопирован', () => { repo.softDeletePlannedActivity(copy.id); }); }
      setMoveCopy(null); setDateLocal(targetDate);
    })} />

  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas }, content: { paddingHorizontal: space.screen, paddingTop: space.sm, paddingBottom: 96, gap: space.md },
  headerBtn: { minWidth: touchMin, minHeight: touchMin, alignItems: 'center', justifyContent: 'center', marginRight: space.sm },
  logSection: { gap: space.sm, paddingTop: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }, logHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logAdd: { minHeight: touchMin, flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingLeft: space.md }, garminLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: touchMin },
});

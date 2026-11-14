import { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HABIT_WEEKDAY_LABELS_RU } from '../../../../../src/domain/habitWeek';
import type { PlannedActivity } from '../../../../../src/domain/strength/types';
import type { StrengthWeekDay } from '../../../../../src/domain/strength/weekBoard';
import type { Workout } from '../../../../../src/storage/types';
import { formatWeekRangeRu } from '@/src/components/weekFormat';
import { AppButton, AppText, colors, radius, space, touchMin } from '@/src/design-system';

type Drop = { dateLocal: string; activityId?: string };
type Box = Drop & { top: number; bottom: number };
type Props = {
  days: StrengthWeekDay[]; selectedDate: string; todayDate?: string;
  onSelectDate?: (date: string) => void; onAdd: () => void;
  onApplyProgram?: () => void; onOpenTemplates?: () => void;
  onMenu: (activity: PlannedActivity) => void; onStart: (activity: PlannedActivity) => void;
  onDrop?: (activity: PlannedActivity, target: Drop) => void;
  onDraggingChange?: (dragging: boolean) => void;
  workouts?: Workout[]; onOpenWorkout?: (workout: Workout) => void;
};

/** Full week: planned cards move; imported facts retain their source date. */
export function StrengthWeekBoard({ days, selectedDate, todayDate, onSelectDate, onAdd, onApplyProgram, onOpenTemplates, onMenu, onStart, onDrop, onDraggingChange, workouts = [], onOpenWorkout }: Props) {
  const refs = useRef(new Map<string, { node: View; target: Drop }>());
  const boxes = useRef<Box[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const count = days.reduce((n, d) => n + d.activities.filter(a => a.kind !== 'rest').length, 0);
  const measure = () => {
    boxes.current = [];
    refs.current.forEach(({ node, target }) => node.measureInWindow((_x, y, _w, h) => {
      if (h > 0) boxes.current.push({ ...target, top: y, bottom: y + h });
    }));
  };
  const register = (key: string, target: Drop) => (node: View | null) => {
    if (node) refs.current.set(key, { node, target }); else refs.current.delete(key);
  };
  const targetAt = (y: number, id: string): Drop | undefined => {
    const matches = boxes.current.filter(b => b.top <= y && b.bottom >= y && b.activityId !== id);
    return matches.find(b => b.activityId != null) ?? matches.find(b => b.activityId == null);
  };
  const shiftWeek = (n: number) => {
    const dt = new Date(`${days[0]?.dateLocal ?? selectedDate}T12:00:00Z`);
    dt.setUTCDate(dt.getUTCDate() + n * 7);
    onSelectDate?.(dt.toISOString().slice(0, 10));
  };
  return (
    <View style={styles.wrap} testID="strength-week-board">
      <View style={styles.head}>
        <View style={styles.heading}><AppText variant="subtitle">Недельный цикл</AppText><AppText variant="caption" tone="secondary">{formatWeekRangeRu(days[0]?.dateLocal ?? selectedDate, days[6]?.dateLocal ?? selectedDate)}</AppText></View>
        <Pressable onPress={() => shiftWeek(-1)} style={styles.icon} accessibilityRole="button" accessibilityLabel="Предыдущая неделя"><Ionicons name="chevron-back" size={18} color={colors.ink} /></Pressable>
        <Pressable onPress={() => shiftWeek(1)} style={styles.icon} accessibilityRole="button" accessibilityLabel="Следующая неделя"><Ionicons name="chevron-forward" size={18} color={colors.ink} /></Pressable>
      </View>
      <View style={styles.summary}><AppText variant="caption" tone="secondary">{count === 0 ? 'Пока без запланированных тренировок' : `Тренировок в плане · ${count}`}</AppText>{onOpenTemplates ? <Pressable onPress={onOpenTemplates} accessibilityRole="button" accessibilityLabel="Шаблоны и редактор" testID="strength-open-templates" style={styles.templateLink}><AppText variant="caption">Шаблоны</AppText><Ionicons name="arrow-forward" size={14} color={colors.ink} /></Pressable> : null}</View>
      <View style={styles.week}>
        {days.map(day => {
          const facts = workouts.filter(w => w.dateLocal === day.dateLocal);
          return (
            <View key={day.dateLocal} ref={register(`day:${day.dateLocal}`, { dateLocal: day.dateLocal })} collapsable={false} style={[styles.day, hover === day.dateLocal && styles.hover, day.activities.some(a => a.id === activeId) && styles.lifted]} testID={`cycle-day-${day.dateLocal}`}>
              <Pressable style={styles.date} onPress={() => onSelectDate?.(day.dateLocal)} accessibilityRole="button" accessibilityLabel={`${HABIT_WEEKDAY_LABELS_RU[day.weekdayIndex]} ${Number(day.dateLocal.slice(8, 10))}`} accessibilityState={{ selected: selectedDate === day.dateLocal }}>
                <AppText variant="label" tone="muted">{HABIT_WEEKDAY_LABELS_RU[day.weekdayIndex]}</AppText>
                <AppText variant="body" style={[styles.dayNumber, day.dateLocal === todayDate && { color: colors.sageInk }]}>{Number(day.dateLocal.slice(8, 10))}</AppText>
                {selectedDate === day.dateLocal ? <View style={styles.dateDot} /> : null}
              </Pressable>
              <View style={styles.dayBody}>
                {day.activities.map(activity => (
                  <View key={activity.id} ref={register(`card:${activity.id}`, { dateLocal: day.dateLocal, activityId: activity.id })} collapsable={false} style={activeId === activity.id ? styles.lifted : undefined}>
                    <DragCard activity={activity} onMenu={() => onMenu(activity)} onStart={activity.kind === 'strength' ? () => onStart(activity) : undefined} draggable={onDrop != null}
                      onBegin={() => { measure(); setActiveId(activity.id); onDraggingChange?.(true); }}
                      onMove={y => setHover(targetAt(y, activity.id)?.dateLocal ?? null)}
                      onEnd={y => { const target = y == null ? undefined : targetAt(y, activity.id); setHover(null); setActiveId(null); onDraggingChange?.(false); if (target) onDrop?.(activity, target); }} />
                  </View>
                ))}
                {facts.map(w => (
                  <Pressable key={w.id} onPress={() => onOpenWorkout?.(w)} disabled={!onOpenWorkout} accessibilityRole="button" accessibilityLabel={`${w.type === 'cycling' ? 'Вело' : 'Активность'}, выполнено, ${w.source === 'garmin' ? 'Garmin' : 'ручная запись'}`} style={styles.fact} testID={`cycle-fact-${w.id}`}>
                    <Ionicons name={w.type === 'cycling' ? 'bicycle-outline' : 'fitness-outline'} size={18} color={colors.ink} />
                    <View style={styles.factText}><AppText variant="body" style={styles.cardTitle}>{w.type === 'cycling' ? 'Вело' : w.type === 'strength' ? 'Силовая' : 'Активность'}</AppText><AppText variant="label" tone="muted">{w.source === 'garmin' ? 'Garmin' : 'Выполнено'} · {Math.round(w.durationSec / 60)} мин{w.distanceM != null ? ` · ${(w.distanceM / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} км` : ''}</AppText></View>
                    <Ionicons name="checkmark" size={17} color={colors.success} />
                  </Pressable>
                ))}
                {day.activities.length === 0 && facts.length === 0 ? <Pressable onPress={() => { onSelectDate?.(day.dateLocal); onAdd(); }} style={styles.emptyDay} accessibilityRole="button" accessibilityLabel={`Добавить тренировку ${day.dateLocal}`}><View style={styles.restLine} /><AppText variant="label" tone="muted">Свободный день</AppText></Pressable> : null}
              </View>
            </View>
          );
        })}
      </View>
      <AppButton label="Добавить тренировку" onPress={onAdd} testID="strength-week-add" />
      {onApplyProgram ? <AppButton label={count === 0 ? 'Заполнить неделю из программы' : 'Повторить программу'} variant="ghost" onPress={onApplyProgram} testID="strength-week-apply-program" /> : null}
    </View>
  );
}

function DragCard({ activity, onMenu, onStart, draggable, onBegin, onMove, onEnd }: {
  activity: PlannedActivity; onMenu: () => void; onStart?: () => void; draggable: boolean;
  onBegin: () => void; onMove: (y: number) => void; onEnd: (y: number | null) => void;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const [dragging, setDragging] = useState(false);
  const latest = useRef({ onMenu, onBegin, onMove, onEnd });
  latest.current = { onMenu, onBegin, onMove, onEnd };
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: () => draggable,
    onStartShouldSetPanResponder: () => draggable,
    onMoveShouldSetPanResponder: () => draggable,
    onPanResponderGrant: () => { setDragging(true); latest.current.onBegin(); },
    onPanResponderMove: (_, g) => { translateY.setValue(g.dy); latest.current.onMove(g.moveY); },
    onPanResponderRelease: (_, g) => {
      const moved = Math.abs(g.dy) > 8;
      setDragging(false); translateY.setValue(0); latest.current.onEnd(moved ? g.moveY : null);
      if (!moved) latest.current.onMenu();
    },
    onPanResponderTerminate: () => { setDragging(false); translateY.setValue(0); latest.current.onEnd(null); },
    onPanResponderTerminationRequest: () => false,
  }), [draggable, translateY]);
  return (
    <Animated.View style={[styles.card, activity.kind === 'cardio' && styles.cycling, activity.kind === 'rest' && styles.rest, dragging && styles.dragging, { transform: [{ translateY }] }]} testID={`planned-activity-${activity.id}`}>
      <Ionicons name={activity.kind === 'strength' ? 'barbell-outline' : activity.kind === 'cardio' ? 'bicycle-outline' : 'leaf-outline'} size={19} color={colors.ink} />
      <Pressable onPress={onStart ?? onMenu} style={styles.cardBody} accessibilityRole="button" accessibilityLabel={onStart ? `Начать ${activity.title}` : activity.title} testID={onStart ? `planned-start-${activity.id}` : undefined}>
        <AppText variant="body" style={styles.cardTitle}>{activity.title}</AppText>
        {[activity.timeLocal, activity.cardioMinutes != null ? `${activity.cardioMinutes} мин` : activity.subtitle].filter(Boolean).length ? <AppText variant="label" tone="secondary" numberOfLines={2}>{[activity.timeLocal, activity.cardioMinutes != null ? `${activity.cardioMinutes} мин` : activity.subtitle].filter(Boolean).join(' · ')}</AppText> : null}
      </Pressable>
      <View {...pan.panHandlers}><Pressable onPress={onMenu} style={styles.handle} accessibilityRole="button" accessibilityLabel={`Перенести ${activity.title}. Потяните или откройте меню`} testID={`planned-menu-${activity.id}`}><Ionicons name="reorder-two-outline" size={20} color={colors.textSecondary} /></Pressable></View>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  wrap: { gap: space.md }, head: { flexDirection: 'row', alignItems: 'center', gap: space.xs }, heading: { flex: 1, gap: space.xs }, icon: { minWidth: touchMin, minHeight: touchMin, alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingBottom: space.sm }, templateLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: space.xs, justifyContent: 'center' },
  week: { gap: space.xs }, day: { flexDirection: 'row', gap: space.sm, paddingVertical: 3, borderRadius: radius.md, overflow: 'visible' }, hover: { backgroundColor: colors.surfaceMuted },
  date: { width: 36, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 3 }, dayNumber: { fontWeight: '600' }, dateDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.ink },
  dayBody: { flex: 1, minWidth: 0, gap: space.xs }, lifted: { zIndex: 20 }, card: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingLeft: space.md, paddingVertical: space.sm, paddingRight: space.xs, backgroundColor: colors.trainingStrength, borderRadius: radius.lg, minHeight: 64 },
  cycling: { backgroundColor: colors.trainingCycling }, rest: { backgroundColor: colors.surfaceMuted }, dragging: { opacity: 0.9, elevation: 5, shadowColor: colors.shadow, shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  cardBody: { flex: 1, minWidth: 0, gap: 3, justifyContent: 'center', minHeight: touchMin }, cardTitle: { fontWeight: '600' }, handle: { minWidth: touchMin, minHeight: touchMin, justifyContent: 'center', alignItems: 'center' },
  emptyDay: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md }, restLine: { width: 18, height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },
  fact: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, minHeight: 64, backgroundColor: colors.surface, borderRadius: radius.lg }, factText: { flex: 1, minWidth: 0, gap: 3 },
});

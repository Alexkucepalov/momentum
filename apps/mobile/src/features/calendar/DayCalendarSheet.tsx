import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  addMonths,
  buildMonthCells,
  monthTitleRu,
  parseDateLocal,
  weightKgForDateLocal,
} from '../../../../../src/domain/calendarMonth';
import { localDateKey } from '../../../../../src/storage/validation';
import type { FoodEntry, MealSlot, Workout, WorkoutType } from '../../../../../src/storage/types';
import { useData, useAnyRevision } from '../../state/DataContext';
import { colors, radius, space, touchMin, type } from '../../theme/tokens';
import { AppButton } from '@/src/design-system';

const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'] as const;

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

const WORKOUT_LABEL: Record<WorkoutType, string> = {
  walking: 'Ходьба',
  cycling: 'Вело',
  strength: 'Сила',
  football: 'Футбол',
  other: 'Другое',
};

const MEALS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function fmtKcal(n: number | null): string {
  if (n === null) return '—';
  return String(Math.round(n));
}

export function DayCalendarSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { repo, dateLocal, setDateLocal } = useData();
  const revision = useAnyRevision();
  void revision;
  const profile = repo.getProfile();
  const today = localDateKey(new Date(), profile.timezone);

  const [cursor, setCursor] = useState(dateLocal);
  const [preview, setPreview] = useState(dateLocal);

  useEffect(() => {
    if (!visible) return;
    setCursor(dateLocal);
    setPreview(dateLocal);
  }, [visible, dateLocal]);

  const { y, m0 } = parseDateLocal(cursor);
  const cells = useMemo(() => buildMonthCells(y, m0), [y, m0]);

  const weights = useMemo(() => repo.listWeights(200), [repo]);

  const markers = useMemo(() => {
    const map = new Map<
      string,
      { hasFood: boolean; hasActivity: boolean; hasWeight: boolean }
    >();
    for (const iso of cells) {
      if (!iso) continue;
      const entries = repo.listEntriesForDate(iso);
      const workouts = repo.listWorkoutsForDate(iso);
      const kg = weightKgForDateLocal(weights, iso, (instant) =>
        localDateKey(new Date(instant), profile.timezone),
      );
      map.set(iso, {
        hasFood: entries.length > 0,
        hasActivity: workouts.length > 0,
        hasWeight: kg != null,
      });
    }
    return map;
  }, [cells, repo, weights, profile.timezone]);

  const dayEntries = repo.listEntriesForDate(preview);
  const dayWorkouts = repo.listWorkoutsForDate(preview);
  const daySteps = repo.getDailyActivityStats(preview)?.steps ?? null;
  const dayWeight = weightKgForDateLocal(weights, preview, (instant) =>
    localDateKey(new Date(instant), profile.timezone),
  );
  const dayTotals = repo.dailyTotals(preview);

  const mealGroups = useMemo(() => {
    const map: Record<MealSlot, FoodEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const e of dayEntries) map[e.meal].push(e);
    return map;
  }, [dayEntries]);

  const openMonth = (iso: string) => {
    setCursor(iso);
    setPreview(iso);
  };

  const applyDay = () => {
    setDateLocal(preview);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" accessibilityViewIsModal onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Календарь
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Закрыть"
            style={styles.closeBtn}
            hitSlop={8}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.monthNav}>
            <Pressable
              onPress={() => openMonth(addMonths(cursor, -1))}
              accessibilityRole="button"
              accessibilityLabel="Предыдущий месяц"
              style={({ pressed }) => [styles.navArrow, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.monthTitle}>{monthTitleRu(y, m0)}</Text>
            <Pressable
              onPress={() => openMonth(addMonths(cursor, 1))}
              accessibilityRole="button"
              accessibilityLabel="Следующий месяц"
              style={({ pressed }) => [styles.navArrow, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-forward" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekday}>
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((iso, idx) => {
              if (!iso) {
                return <View key={`pad-${idx}`} style={styles.cell} />;
              }
              const m = markers.get(iso);
              const selected = iso === preview;
              const isToday = iso === today;
              return (
                <Pressable
                  key={iso}
                  onPress={() => setPreview(iso)}
                  style={({ pressed }) => [
                    styles.cell,
                    selected && styles.cellOn,
                    isToday && !selected && styles.cellToday,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${iso}${m?.hasFood ? ', еда' : ''}${m?.hasActivity ? ', активность' : ''}${m?.hasWeight ? ', вес' : ''}`}
                >
                  <Text style={[styles.cellNum, selected && styles.cellNumOn]}>
                    {Number(iso.slice(8, 10))}
                  </Text>
                  <View style={styles.dots}>
                    {m?.hasFood ? <View style={[styles.dot, styles.dotFood]} /> : null}
                    {m?.hasActivity ? <View style={[styles.dot, styles.dotActivity]} /> : null}
                    {m?.hasWeight ? <View style={[styles.dot, styles.dotWeight]} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.legend}>
            <LegendDot color={colors.text} label="Еда" />
            <LegendDot color={colors.textMuted} label="Тренировка" />
            <LegendDot color={colors.success} label="Вес" />
          </View>

          <DayDetail
            dateLocal={preview}
            today={today}
            totals={dayTotals}
            mealGroups={mealGroups}
            workouts={dayWorkouts}
            steps={daySteps}
            weightKg={dayWeight}
          />
        </ScrollView>

        <View style={styles.footer}>
          {preview !== today ? (
            <Pressable
              onPress={() => openMonth(today)}
              style={styles.todayLink}
              accessibilityRole="button"
              accessibilityLabel="Перейти к сегодня"
            >
              <Text style={styles.todayLinkText}>К сегодня</Text>
            </Pressable>
          ) : (
            <View style={styles.todayLink} />
          )}
          <View style={styles.footerBtn}>
            <AppButton label="Открыть этот день" onPress={applyDay} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function DayDetail({
  dateLocal,
  today,
  totals,
  mealGroups,
  workouts,
  steps,
  weightKg,
}: {
  dateLocal: string;
  today: string;
  totals: { energyKcal: number | null; entryCount: number; hasUnknownFields: boolean };
  mealGroups: Record<MealSlot, FoodEntry[]>;
  workouts: Workout[];
  steps: number | null;
  weightKg: number | null;
}) {
  const [y, m, d] = dateLocal.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const heading = dt.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  const cap = heading.charAt(0).toUpperCase() + heading.slice(1);
  const suffix = dateLocal === today ? ' · сегодня' : '';

  return (
    <View style={styles.detail} accessibilityRole="summary">
      <Text style={styles.detailTitle}>
        {cap}
        {suffix}
      </Text>
      <Text style={styles.detailSub}>
        Еда: {totals.entryCount} зап. · {fmtKcal(totals.energyKcal)} ккал
        {totals.hasUnknownFields ? ' · часть неизвестна' : ''}
      </Text>

      <Text style={styles.blockTitle}>Приёмы пищи</Text>
      {totals.entryCount === 0 ? (
        <Text style={styles.emptyLine}>Записей нет</Text>
      ) : (
        MEALS.map((slot) => {
          const list = mealGroups[slot];
          if (list.length === 0) return null;
          const slotKcal = list.some((e) => e.energyKcal === null)
            ? null
            : list.reduce((s, e) => s + (e.energyKcal as number), 0);
          return (
            <View key={slot} style={styles.mealBlock}>
              <Text style={styles.mealHead}>
                {MEAL_LABELS[slot]} · {fmtKcal(slotKcal)} ккал
              </Text>
              {list.map((e) => (
                <Text key={e.id} style={styles.mealLine} numberOfLines={1}>
                  {e.displayName} · {e.grams} г
                </Text>
              ))}
            </View>
          );
        })
      )}

      <Text style={styles.blockTitle}>Активность</Text>
      <Text style={styles.mealLine}>
        Шаги:{' '}
        {steps == null ? 'нет данных Garmin' : `${steps.toLocaleString('ru-RU')}`}
      </Text>
      {workouts.length === 0 ? (
        <Text style={styles.emptyLine}>Тренировок нет</Text>
      ) : (
        workouts.map((w) => (
          <Text key={w.id} style={styles.mealLine}>
            {WORKOUT_LABEL[w.type]}
            {w.source === 'garmin' ? ' · Garmin' : ''} · {Math.round(w.durationSec / 60)} мин
            {w.distanceM != null ? ` · ${(w.distanceM / 1000).toFixed(1)} км` : ''}
            {w.calories != null ? ` · ${Math.round(w.calories)} ккал` : ''}
            {w.notes?.trim() ? ` · ${w.notes.trim()}` : ''}
          </Text>
        ))
      )}

      <Text style={styles.blockTitle}>Вес</Text>
      <Text style={styles.mealLine}>
        {weightKg != null ? `${weightKg} кг` : 'Нет измерения в этот день'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
  },
  title: { fontSize: type.title, fontWeight: '800', color: colors.text },
  closeBtn: {
    width: touchMin,
    height: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scroll: { paddingHorizontal: space.lg, paddingBottom: 120 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  navArrow: {
    width: touchMin,
    height: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: { fontSize: type.subtitle, fontWeight: '700', color: colors.text },
  weekdayRow: { flexDirection: 'row', marginBottom: space.xs },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'lowercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  cellOn: { backgroundColor: colors.primaryButton },
  cellToday: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cellNum: { fontSize: type.body, fontWeight: '700', color: colors.text },
  cellNumOn: { color: colors.primaryButtonText },
  dots: { flexDirection: 'row', gap: 3, marginTop: 4, minHeight: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotFood: { backgroundColor: colors.text },
  dotActivity: { backgroundColor: colors.textMuted },
  dotWeight: { backgroundColor: colors.success },
  legend: {
    flexDirection: 'row',
    gap: space.lg,
    marginTop: space.md,
    marginBottom: space.lg,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLabel: { fontSize: type.micro, color: colors.textSecondary, fontWeight: '600' },
  detail: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  detailTitle: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  detailSub: {
    marginTop: 4,
    marginBottom: space.md,
    fontSize: type.caption,
    color: colors.textSecondary,
  },
  blockTitle: {
    marginTop: space.md,
    marginBottom: space.xs,
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  emptyLine: { fontSize: type.caption, color: colors.textMuted },
  mealBlock: { marginBottom: space.sm },
  mealHead: { fontSize: type.body, fontWeight: '700', color: colors.text, marginBottom: 2 },
  mealLine: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.lg,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  todayLink: { minWidth: 88, justifyContent: 'center' },
  todayLinkText: { fontWeight: '700', color: colors.textMuted, fontSize: type.caption },
  footerBtn: { flex: 1 },
  pressed: { opacity: 0.85 },
});

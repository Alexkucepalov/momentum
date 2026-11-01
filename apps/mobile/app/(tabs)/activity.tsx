import { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter, type Href } from 'expo-router';

import { datesInWeekFromStart, weekStartMonday } from '../../../../src/domain/habitWeek';
import type { WorkoutType } from '../../../../src/storage/types';
import { localDateKey } from '../../../../src/storage/validation';
import { DayStrip } from '@/src/components/DayStrip';
import { DaySwipeArea } from '@/src/components/DaySwipeArea';
import { EmptyState } from '@/src/components/EmptyState';
import { SectionHeader } from '@/src/components/SectionHeader';
import { WeekBarChart } from '@/src/components/WeekBarChart';
import { formatWeekRangeRu } from '@/src/components/weekFormat';
import { ActivityDaySummary } from '@/src/features/activity/ActivityDaySummary';
import { WorkoutFormSheet } from '@/src/features/activity/WorkoutFormSheet';
import { WorkoutRow } from '@/src/features/activity/WorkoutRow';
import { DayCalendarSheet } from '@/src/features/calendar/DayCalendarSheet';
import { useData } from '@/src/state/DataContext';
import {
  AppButton,
  AppCard,
  AppText,
  colors,
  radius,
  space,
  touchMin,
} from '@/src/design-system';

const TYPE_META: Array<{ type: WorkoutType; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { type: 'walking', label: 'Ходьба', icon: 'walk-outline' },
  { type: 'cycling', label: 'Вело', icon: 'bicycle-outline' },
  { type: 'strength', label: 'Сила', icon: 'barbell-outline' },
  { type: 'football', label: 'Футбол', icon: 'football-outline' },
  { type: 'other', label: 'Другое', icon: 'fitness-outline' },
];

export default function ActivityScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { repo, dateLocal, setDateLocal, refresh, revision, showFlash } = useData();
  void revision;
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<WorkoutType>('walking');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const openForm = (type: WorkoutType = 'walking') => {
    setFormType(type);
    setFormOpen(true);
  };

  const profile = repo.getProfile();
  const workouts = repo.listWorkoutsForDate(dateLocal);
  const totalMin = repo.activityMinutesForDate(dateLocal);
  const activityKcal = repo.activityEnergyKcalForDate(dateLocal);
  const daySteps = repo.getDailyActivityStats(dateLocal)?.steps ?? null;
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
      headerRight: () => (
        <Pressable
          onPress={() => openForm('walking')}
          accessibilityRole="button"
          accessibilityLabel="Добавить тренировку"
          style={styles.headerBtn}
          hitSlop={8}
        >
          <Ionicons name="add" size={26} color={colors.ink} />
        </Pressable>
      ),
    });
  }, [navigation]);

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
  }, [repo, dateLocal, revision]);
  const todayKey = localDateKey(new Date(), profile.timezone);
  const isEmptyWeek = workouts.length === 0 && weekMinutes.sum === 0;

  return (
    <View style={styles.root} testID="activity-screen">
      <DaySwipeArea dateLocal={dateLocal} onDateChange={setDateLocal}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <DayStrip
            selected={dateLocal}
            today={todayKey}
            onSelect={setDateLocal}
            onOpenCalendar={() => setCalendarOpen(true)}
          />
          <AppText variant="caption" tone="muted" style={styles.swipeHint}>
            Свайп влево / вправо — другой день
          </AppText>

          <ActivityDaySummary
            totalMinutes={totalMin}
            activityKcal={activityKcal}
            steps={daySteps}
            workoutCount={workouts.length}
            workoutCalories={workoutCalories}
          />

          {!isEmptyWeek ? (
            <WeekBarChart
              title="Неделя"
              subtitle={`${formatWeekRangeRu(weekMinutes.start, weekMinutes.end)} · ${weekMinutes.sum} мин`}
              selectedDate={dateLocal}
              todayDate={todayKey}
              onSelectDate={setDateLocal}
              footnote="Столбик — минуты. Пустой день — нет записей, не «ноль»."
              days={weekMinutes.days.map((d) => ({
                dateLocal: d.date,
                weekdayIndex: d.weekdayIndex,
                value: d.min,
                valueLabel: d.min === 0 ? '·' : String(d.min),
              }))}
            />
          ) : null}

          <AppButton label="+ Тренировка" onPress={() => openForm('walking')} />

          <SectionHeader title="Записи дня" />
          {workouts.length === 0 ? (
            <EmptyState
              compact
              icon="fitness-outline"
              title={isEmptyWeek ? 'Пока пусто' : 'В этот день пусто'}
              body={
                isEmptyWeek
                  ? 'Добавь тренировку или синхронизируй Garmin в Профиле.'
                  : 'Свайпни день или выбери дату на неделе.'
              }
              actionLabel="+ Тренировка"
              onAction={() => openForm('walking')}
            />
          ) : (
            workouts.map((w) => (
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
                  refresh();
                  showFlash('Тренировка удалена');
                }}
              />
            ))
          )}

          <AppText variant="label" tone="secondary" style={styles.quickLabel}>
            Быстрый тип
          </AppText>
          <View style={styles.quickRow}>
            {TYPE_META.map((t) => (
              <Pressable
                key={t.type}
                style={({ pressed }) => [pressed && styles.pressed]}
                onPress={() => openForm(t.type)}
                accessibilityRole="button"
                accessibilityLabel={`Добавить ${t.label}`}
              >
                <AppCard style={styles.quickChip}>
                  <Ionicons name={t.icon} size={18} color={colors.ink} />
                  <AppText variant="caption" style={styles.quickChipText}>
                    {t.label}
                  </AppText>
                </AppCard>
              </Pressable>
            ))}
          </View>
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
          refresh();
          showFlash('Тренировка сохранена');
        }}
      />
      <DayCalendarSheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.lg, paddingBottom: 48, gap: space.sm },
  swipeHint: { marginBottom: space.xs },
  headerBtn: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.sm,
  },
  pressed: { opacity: 0.88 },
  quickLabel: {
    marginBottom: space.sm,
    marginTop: space.md,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.card,
  },
  quickChipText: {
    fontWeight: '700',
  },
});

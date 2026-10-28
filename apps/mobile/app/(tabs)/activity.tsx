import { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';

import { datesInWeekFromStart, weekStartMonday } from '../../../../src/domain/habitWeek';
import type { WorkoutType } from '../../../../src/storage/types';
import { localDateKey } from '../../../../src/storage/validation';
import { DateSwitcher } from '@/src/components/DateSwitcher';
import { EmptyState } from '@/src/components/EmptyState';
import { WeekBarChart } from '@/src/components/WeekBarChart';
import { formatWeekRangeRu } from '@/src/components/weekFormat';
import { WorkoutFormSheet } from '@/src/features/activity/WorkoutFormSheet';
import { WorkoutRow } from '@/src/features/activity/WorkoutRow';
import { DayCalendarSheet } from '@/src/features/calendar/DayCalendarSheet';
import { useData } from '@/src/state/DataContext';
import { colors, space, touchMin, type } from '@/src/theme/tokens';
import { AppCard } from '@/src/ui/AppCard';
import { Fab } from '@/src/ui/Fab';
import { IconTile } from '@/src/ui/IconTile';
import { ProgressRing } from '@/src/ui/ProgressRing';
import { SectionTitle } from '@/src/ui/SectionTitle';
import { SoftMetricCard } from '@/src/ui/SoftMetricCard';

const TYPE_META: Array<{ type: WorkoutType; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { type: 'walking', label: 'Ходьба', icon: 'walk-outline' },
  { type: 'cycling', label: 'Вело', icon: 'bicycle-outline' },
  { type: 'strength', label: 'Сила', icon: 'barbell-outline' },
  { type: 'football', label: 'Футбол', icon: 'football-outline' },
  { type: 'other', label: 'Другое', icon: 'fitness-outline' },
];

/** Activity = soft mono masonry (ref 10) + quick tiles (ref 09). */
export default function ActivityScreen() {
  const navigation = useNavigation();
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
          <Ionicons name="add" size={26} color={colors.text} />
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

  /** Observational: today's share of this week's logged minutes — not a goal. */
  const dayShareOfWeek =
    weekMinutes.sum > 0 ? Math.min(1, totalMin / weekMinutes.sum) : totalMin > 0 ? 1 : 0;

  const emptyWeek = workouts.length === 0 && weekMinutes.sum === 0;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <DateSwitcher
          selected={dateLocal}
          timeZone={profile.timezone}
          onSelect={setDateLocal}
          onOpenCalendar={() => setCalendarOpen(true)}
        />

        <SectionTitle title="Моя активность" />

        <View style={styles.masonryTop}>
          <AppCard style={styles.heroCard} accessibilityLabel={`Минуты сегодня: ${totalMin}`}>
            <Text style={styles.heroLabel}>Минуты</Text>
            <ProgressRing
              ratio={dayShareOfWeek}
              center={String(totalMin)}
              caption="сегодня"
              size={120}
              stroke={14}
            />
            <Text style={styles.heroMeta}>
              {weekMinutes.sum > 0
                ? `${weekMinutes.sum} мин за неделю · доля дня`
                : 'пока только этот день'}
            </Text>
          </AppCard>

          <View style={styles.sideCol}>
            <SoftMetricCard
              label="Тренировки"
              value={String(workouts.length)}
              meta="сегодня"
              tall
              visual={<Ionicons name="barbell-outline" size={22} color={colors.textMuted} />}
            />
            <SoftMetricCard
              label="Оценка"
              value={activityKcal != null ? String(activityKcal) : '—'}
              meta="ккал MET"
              tall
              visual={<Ionicons name="flame-outline" size={22} color={colors.textMuted} />}
            />
          </View>
        </View>

        <SoftMetricCard
          label="Неделя"
          value={`${weekMinutes.sum}`}
          meta={`мин · ${formatWeekRangeRu(weekMinutes.start, weekMinutes.end)}`}
          wide
          accessibilityLabel={`Неделя: ${weekMinutes.sum} минут`}
        />

        <Text style={styles.summaryHint}>
          Ккал тренировок не вычитаются из еды — только факт движения
        </Text>

        {emptyWeek ? (
          <EmptyState
            compact
            icon="fitness-outline"
            title="Начни с первой активности"
            body="Запись останется на устройстве."
          />
        ) : (
          <WeekBarChart
            title="Неделя активности"
            subtitle={`${formatWeekRangeRu(weekMinutes.start, weekMinutes.end)} · ${weekMinutes.sum} мин`}
            selectedDate={dateLocal}
            todayDate={todayKey}
            onSelectDate={setDateLocal}
            footnote="Столбик — минуты тренировок за день. Пустой день — просто нет записей."
            days={weekMinutes.days.map((d) => ({
              dateLocal: d.date,
              weekdayIndex: d.weekdayIndex,
              value: d.min,
              valueLabel: d.min === 0 ? '·' : String(d.min),
            }))}
          />
        )}

        <SectionTitle title="Быстрый старт" />
        <View style={styles.tileGrid}>
          {TYPE_META.map((t) => (
            <IconTile
              key={t.type}
              icon={t.icon}
              label={t.label}
              onPress={() => openForm(t.type)}
              accessibilityLabel={`Добавить ${t.label}`}
            />
          ))}
        </View>

        <SectionTitle title="Записи дня" />
        {workouts.length === 0 ? (
          <AppCard style={styles.emptyDay}>
            <Text style={styles.emptyDayText}>В этот день пока пусто</Text>
          </AppCard>
        ) : (
          workouts.map((w) => (
            <WorkoutRow
              key={w.id}
              workout={w}
              onDelete={() => {
                repo.softDeleteWorkout(w.id);
                refresh();
                showFlash('Тренировка удалена');
              }}
            />
          ))
        )}
      </ScrollView>

      <Fab onPress={() => openForm('walking')} accessibilityLabel="Добавить тренировку" />

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
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, paddingBottom: 120 },
  headerBtn: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.sm,
  },
  masonryTop: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.sm,
  },
  heroCard: {
    flex: 1.35,
    minHeight: 220,
    alignItems: 'center',
    gap: space.sm,
  },
  heroLabel: {
    alignSelf: 'flex-start',
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textMuted,
  },
  heroMeta: {
    fontSize: type.micro,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sideCol: { flex: 1, gap: space.sm },
  summaryHint: {
    marginBottom: space.md,
    marginTop: space.sm,
    fontSize: type.caption,
    color: colors.textMuted,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.md,
  },
  emptyDay: {
    padding: space.lg,
    marginBottom: space.md,
  },
  emptyDayText: {
    fontSize: type.body,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
});

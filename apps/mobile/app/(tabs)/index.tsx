import { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';

import {
  buildHabitWeekMarks,
  formatHabitWeekLabel,
} from '../../../../src/domain/habitWeek';
import { foodLogStreak } from '../../../../src/domain/foodLogStreak';
import { localDateKey } from '../../../../src/storage/validation';
import { CopyYesterdayButton } from '@/src/components/CopyYesterdayButton';
import { DayStrip } from '@/src/components/DayStrip';
import { DaySwipeArea } from '@/src/components/DaySwipeArea';
import { FlashBar } from '@/src/components/FlashBar';
import { FormScrollView } from '@/src/components/FormScrollView';
import { KcalRing } from '@/src/components/KcalRing';
import { ScreenFooter } from '@/src/components/ScreenFooter';
import { StatCards } from '@/src/components/StatCards';
import { TodayChecklist } from '@/src/components/TodayChecklist';
import { UndoBar } from '@/src/components/UndoBar';
import { DayCalendarSheet } from '@/src/features/calendar/DayCalendarSheet';
import { AddFoodSheet } from '@/src/features/diary/AddFoodSheet';
import { BarcodeLookupSheet } from '@/src/features/diary/BarcodeLookupSheet';
import { FoodLogStreakCard } from '@/src/features/diary/FoodLogStreakCard';
import { useData } from '@/src/state/DataContext';
import {
  AppButton,
  AppText,
  colors,
  radius,
  space,
  touchMin,
} from '@/src/design-system';

/** Compact date line under tab title «Сегодня» — no second hero headline. */
function formatDateLine(iso: string, today: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const weekday = dt.toLocaleDateString('ru-RU', { weekday: 'long', timeZone: 'UTC' });
  const dayMonth = dt.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  if (iso === today) return `${cap} · ${dayMonth}`;
  if (iso < today) return `${cap} · ${dayMonth} · прошлый день`;
  return `${cap} · ${dayMonth} · будущий день`;
}

/**
 * Today: day status + copy yesterday + habits.
 * Fast recent/favorites live on Food tab.
 */
export default function TodayScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { repo, dateLocal, setDateLocal, refresh, revision, showFlash } = useData();
  void revision;
  const [open, setOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const totals = repo.dailyTotals(dateLocal);
  const waterMl = repo.waterMlForDate(dateLocal);
  const profile = repo.getProfile();
  const today = localDateKey(new Date(), profile.timezone);
  const activityMinutes = repo.activityMinutesForDate(dateLocal);
  const activityKcal = repo.activityEnergyKcalForDate(dateLocal);
  const daySteps = repo.getDailyActivityStats(dateLocal)?.steps ?? null;
  const sleepSec = repo.getSleepForDate(dateLocal)?.sleepSec ?? null;
  const dateLine = formatDateLine(dateLocal, today);
  const streak = useMemo(
    () =>
      foodLogStreak({
        endDateLocal: dateLocal,
        hasLog: (d) => repo.dailyTotals(d).entryCount > 0,
      }),
    [repo, dateLocal, revision],
  );

  const flexibleRows = useMemo(() => {
    return repo
      .listFlexibleHabits()
      .filter((h) => h.pausedAt == null)
      .map((h) => {
        const stats = repo.flexibleHabitWeekStats(h.id, dateLocal);
        return {
          id: h.id,
          name: h.name,
          loggedToday: repo.isFlexibleHabitLogged(h.id, dateLocal),
          weekLabel: formatHabitWeekLabel(
            stats.completed,
            stats.target,
            h.kind === 'quantity' ? h.unit : null,
          ),
          completed: stats.completed,
          target: stats.target,
          marks: buildHabitWeekMarks({
            dateLocal,
            isLogged: (day) => repo.isFlexibleHabitLogged(h.id, day),
          }),
        };
      });
  }, [repo, dateLocal, revision]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => router.push('/plan')}
          accessibilityRole="button"
          accessibilityLabel="План питания, черновик, не дневник"
          style={styles.headerBtn}
          hitSlop={8}
        >
          <Ionicons name="compass-outline" size={22} color={colors.accent} />
        </Pressable>
      ),
    });
  }, [navigation, router]);

  return (
    <View style={styles.root} testID="today-screen">
      <DaySwipeArea dateLocal={dateLocal} onDateChange={setDateLocal}>
        <FormScrollView contentContainerStyle={styles.content}>
          <View style={styles.dateRow}>
            <AppText variant="body" tone="secondary" style={styles.dateLine}>
              {dateLine}
            </AppText>
            {dateLocal !== today ? (
              <Pressable
                onPress={() => setDateLocal(today)}
                accessibilityRole="button"
                accessibilityLabel="К сегодня"
                hitSlop={8}
                style={styles.todayJumpHit}
              >
                <AppText variant="caption" style={styles.todayJump}>
                  Сегодня
                </AppText>
              </Pressable>
            ) : null}
          </View>

          <DayStrip
            selected={dateLocal}
            today={today}
            onSelect={setDateLocal}
            onOpenCalendar={() => setCalendarOpen(true)}
          />

          <KcalRing
            variant="compact"
            pulseKey={totals.entryCount}
            totals={totals}
            targets={{
              energyKcal: profile.dailyEnergyKcal,
              proteinG: profile.dailyProteinG,
              fatG: profile.dailyFatG,
              carbG: profile.dailyCarbG,
            }}
            activityKcal={activityKcal}
            activityMinutes={activityMinutes}
            onSetTarget={() => router.push('/profile')}
          />

          <CopyYesterdayButton testID="today-copy-yesterday" />

          <StatCards
            waterMl={waterMl}
            waterTargetMl={profile.waterTargetMl}
            activityMinutes={activityMinutes}
            steps={daySteps}
            sleepSec={sleepSec}
            onAddWater={(ml) => {
              repo.addWater(dateLocal, ml);
              refresh();
              showFlash(`+${ml} мл воды`);
            }}
          />

          <FoodLogStreakCard streak={streak} />

          <TodayChecklist
            flexibleHabits={flexibleRows}
            onManageHabits={() => router.push('/progress')}
            onToggleFlexible={(habitId) => {
              const habit = repo.listFlexibleHabits().find((h) => h.id === habitId);
              if (repo.isFlexibleHabitLogged(habitId, dateLocal)) {
                repo.unlogFlexibleHabit(habitId, dateLocal);
                refresh();
                showFlash(habit ? `Снято: ${habit.name}` : 'Отметка снята');
              } else {
                repo.logFlexibleHabit(habitId, dateLocal);
                refresh();
                showFlash(habit ? `Отмечено: ${habit.name}` : 'Отмечено');
              }
            }}
          />
        </FormScrollView>
      </DaySwipeArea>

      <ScreenFooter>
        <View style={styles.footerBtn}>
          <AppButton label="Добавить еду" onPress={() => setOpen(true)} />
        </View>
        <Pressable
          style={({ pressed }) => [styles.footerScan, pressed && styles.pressed]}
          onPress={() => setBarcodeOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Сканировать штрихкод"
          testID="today-scan-cta"
        >
          <Ionicons name="barcode-outline" size={22} color={colors.ink} />
        </Pressable>
      </ScreenFooter>

      <AddFoodSheet visible={open} onClose={() => setOpen(false)} />
      <BarcodeLookupSheet visible={barcodeOpen} onClose={() => setBarcodeOpen(false)} />
      <DayCalendarSheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} />
      <FlashBar />
      <UndoBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.lg, paddingBottom: 140, gap: space.sm },
  headerBtn: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  dateLine: {
    flex: 1,
    fontWeight: '600',
  },
  todayJumpHit: { minHeight: touchMin, justifyContent: 'center' },
  todayJump: {
    fontWeight: '700',
    color: colors.accent,
  },
  footerScan: {
    width: touchMin,
    height: touchMin,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtn: { flex: 1 },
  pressed: { opacity: 0.88 },
});

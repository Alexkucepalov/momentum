import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
  buildHabitWeekMarks,
  formatHabitWeekLabel,
} from '../../../../src/domain/habitWeek';
import { localDateKey } from '../../../../src/storage/validation';
import {
  repeatableDayFromEntries,
  shiftDateLocal,
} from '../../../../src/domain/repeatMeal';
import { shouldShowTargetsOnboarding } from '../../../../src/domain/targetsOnboarding';
import { AddFoodBlock } from '@/src/components/AddFoodBlock';
import { DayStrip } from '@/src/components/DayStrip';
import { FlashBar } from '@/src/components/FlashBar';
import { FormScrollView } from '@/src/components/FormScrollView';
import {
  NothingKicker,
  NothingScreen,
} from '@/src/components/nothing/NothingChrome';
import { TodayPlanStrip } from '@/src/features/plan/TodayPlanStrip';
import { KcalRing } from '@/src/components/KcalRing';
import { ScreenFooter } from '@/src/components/ScreenFooter';
import { StatCards } from '@/src/components/StatCards';
import { TodayChecklist } from '@/src/components/TodayChecklist';
import { UndoBar } from '@/src/components/UndoBar';
import { DayCalendarSheet } from '@/src/features/calendar/DayCalendarSheet';
import { AddFoodSheet } from '@/src/features/diary/AddFoodSheet';
import { BarcodeLookupSheet } from '@/src/features/diary/BarcodeLookupSheet';
import { TargetsOnboardingSheet } from '@/src/features/diary/TargetsOnboardingSheet';
import { useAddGuard } from '@/src/hooks/useAddGuard';
import { useData } from '@/src/state/DataContext';
import { nothing, nothingRadius, nothingSpace, nothingType } from '@/src/theme/nothing';
import { touchMin } from '@/src/theme/tokens';

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

export default function TodayScreen() {
  const router = useRouter();
  const { repo, dateLocal, setDateLocal, meal, setMeal, refresh, revision, showFlash } = useData();
  void revision;
  const allowAdd = useAddGuard();
  const [open, setOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const totals = repo.dailyTotals(dateLocal);
  const todayEntries = repo.listEntriesForDate(dateLocal);
  const recent = repo.listRecentEntries(6);
  const waterMl = repo.waterMlForDate(dateLocal);
  const profile = repo.getProfile();
  const showTargetsOnboarding = shouldShowTargetsOnboarding(profile);
  const today = localDateKey(new Date(), profile.timezone);
  const activityMinutes = repo.activityMinutesForDate(dateLocal);
  const activityKcal = repo.activityEnergyKcalForDate(dateLocal);
  const dateLine = formatDateLine(dateLocal, today);
  const yesterdayCount = repo.listEntriesForDate(shiftDateLocal(dateLocal, -1)).length;

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

  const repeat = (e: (typeof recent)[number]) => {
    if (!allowAdd()) return;
    if (e.productId) {
      repo.addEntryFromProduct({
        productId: e.productId,
        dateLocal,
        meal,
        grams: e.grams,
      });
    } else if (e.recipeId) {
      repo.addEntryFromRecipe({
        recipeId: e.recipeId,
        dateLocal,
        meal,
        grams: e.grams,
      });
    } else {
      return;
    }
    refresh();
    showFlash(`Добавлено: ${e.displayName}`);
  };

  return (
    <NothingScreen>
      <FormScrollView contentContainerStyle={styles.content}>
        <NothingKicker label="Today" dots={6} />
        <Text style={styles.dateLine}>{dateLine}</Text>

        <DayStrip
          selected={dateLocal}
          today={today}
          onSelect={setDateLocal}
          onOpenCalendar={() => setCalendarOpen(true)}
        />

        <View style={styles.panel}>
          <KcalRing
            variant="compact"
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
        </View>

        <AddFoodBlock
          tone="nothing"
          meal={meal}
          onChangeMeal={setMeal}
          showMealChips={false}
          todayEntries={todayEntries}
          quickRepeats={recent.map((e) => ({
            id: e.id,
            displayName: e.displayName,
            grams: e.grams,
          }))}
          onRepeat={(id) => {
            const e = recent.find((r) => r.id === id);
            if (e) repeat(e);
          }}
          onAddFood={() => setOpen(true)}
          onCopyYesterday={
            yesterdayCount > 0
              ? () => {
                  if (!allowAdd()) return;
                  const yesterday = shiftDateLocal(dateLocal, -1);
                  const items = repeatableDayFromEntries(repo.listEntriesForDate(yesterday));
                  if (items.length === 0) {
                    showFlash('Вчерашний рацион пуст или без продукта/рецепта');
                    return;
                  }
                  for (const item of items) {
                    if (item.kind === 'product') {
                      repo.addEntryFromProduct({
                        productId: item.productId,
                        dateLocal,
                        meal: item.meal,
                        grams: item.grams,
                      });
                    } else {
                      repo.addEntryFromRecipe({
                        recipeId: item.recipeId,
                        dateLocal,
                        meal: item.meal,
                        grams: item.grams,
                      });
                    }
                  }
                  refresh();
                  showFlash(`Повторили вчера · ${items.length}`);
                }
              : undefined
          }
          onOpenDiary={() => router.push('/(tabs)/food')}
        />

        <TodayPlanStrip tone="nothing" />

        <TodayChecklist
          tone="nothing"
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

        <StatCards
          tone="nothing"
          waterMl={waterMl}
          waterTargetMl={profile.waterTargetMl}
          activityMinutes={activityMinutes}
          onAddWater={(ml) => {
            repo.addWater(dateLocal, ml);
            refresh();
            showFlash(`+${ml} мл воды`);
          }}
        />
      </FormScrollView>

      <ScreenFooter>
        <Pressable
          style={({ pressed }) => [styles.footerScan, pressed && styles.pressed]}
          onPress={() => setBarcodeOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Сканировать штрихкод"
        >
          <Ionicons name="barcode-outline" size={22} color={nothing.display} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.footerEatNow, pressed && styles.pressed]}
          onPress={() => router.push('/plan/eat-now')}
          accessibilityRole="button"
          accessibilityLabel="Что съесть сейчас"
        >
          <Text style={styles.footerEatNowText}>Что съесть сейчас</Text>
        </Pressable>
      </ScreenFooter>

      <TargetsOnboardingSheet
        visible={showTargetsOnboarding}
        onSkip={() => {
          repo.dismissTargetsOnboardingPrompt();
          refresh();
          showFlash('Цели можно задать в Профиле');
        }}
        onSave={(values) => {
          repo.setDailyNutritionTargets(values);
          refresh();
          showFlash('Цели сохранены');
        }}
      />
      <AddFoodSheet visible={open} onClose={() => setOpen(false)} />
      <BarcodeLookupSheet visible={barcodeOpen} onClose={() => setBarcodeOpen(false)} />
      <DayCalendarSheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} />
      <FlashBar />
      <UndoBar />
    </NothingScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: nothingSpace.lg, paddingBottom: 140 },
  dateLine: {
    marginBottom: nothingSpace.md,
    fontSize: nothingType.caption,
    color: nothing.secondary,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  panel: {
    backgroundColor: nothing.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: nothing.lineStrong,
    borderRadius: nothingRadius.md,
    padding: nothingSpace.md,
    marginBottom: nothingSpace.md,
  },
  pressed: { opacity: 0.8 },
  footerScan: {
    width: touchMin,
    height: touchMin,
    borderRadius: nothingRadius.sm,
    borderWidth: 1,
    borderColor: nothing.display,
    backgroundColor: nothing.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerEatNow: {
    flex: 1,
    minHeight: touchMin,
    borderRadius: nothingRadius.sm,
    borderWidth: 1,
    borderColor: nothing.display,
    backgroundColor: nothing.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: nothingSpace.md,
  },
  footerEatNowText: {
    fontSize: nothingType.body,
    fontWeight: '700',
    color: nothing.display,
    letterSpacing: 0.4,
  },
});

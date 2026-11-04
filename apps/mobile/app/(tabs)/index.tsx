import { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';

import {
  buildHabitWeekMarks,
  formatHabitWeekLabel,
} from '../../../../src/domain/habitWeek';
import { foodLogStreak } from '../../../../src/domain/foodLogStreak';
import { portion } from '../../../../src/domain/nutrition';
import type { FoodEntry, FoodProduct } from '../../../../src/storage/types';
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
import {
  ConfirmPortionSheet,
  type PortionTarget,
} from '@/src/features/diary/ConfirmPortionSheet';
import { FoodLogStreakCard } from '@/src/features/diary/FoodLogStreakCard';
import { TodayRecentStrip } from '@/src/features/today/TodayRecentStrip';
import { useAddGuard } from '@/src/hooks/useAddGuard';
import { useData } from '@/src/state/DataContext';
import {
  AppButton,
  AppText,
  colors,
  radius,
  space,
  touchMin,
} from '@/src/design-system';

const MEAL_LABELS = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
} as const;

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
 * Today fold: status + copy yesterday + recent (fast log) + habits.
 */
export default function TodayScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { repo, dateLocal, setDateLocal, meal, refresh, revision, showFlash, setUndo } = useData();
  void revision;
  const allowAdd = useAddGuard();
  const [open, setOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [portionTarget, setPortionTarget] = useState<{
    target: PortionTarget;
    initialGrams: number;
  } | null>(null);

  const totals = repo.dailyTotals(dateLocal);
  const recent = useMemo(() => repo.listRecentEntries(6), [repo, revision]);
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

  const openRecentConfirm = (e: FoodEntry) => {
    if (e.productId) {
      const product = repo.listProducts().find((p) => p.id === e.productId);
      if (!product) return;
      setPortionTarget({ target: { kind: 'product', product }, initialGrams: e.grams });
      return;
    }
    if (e.recipeId) {
      const recipe = repo.getRecipe(e.recipeId);
      if (!recipe) return;
      const ingredients = repo.getRecipeIngredients(recipe.id);
      setPortionTarget({
        target: { kind: 'recipe', recipe, ingredients },
        initialGrams: e.grams,
      });
    }
  };

  const quickAddRecent = (e: FoodEntry) => {
    if (!allowAdd()) return;
    let created: FoodEntry | null = null;
    if (e.productId) {
      created = repo.addEntryFromProduct({
        productId: e.productId,
        dateLocal,
        meal,
        grams: e.grams,
      });
    } else if (e.recipeId) {
      created = repo.addEntryFromRecipe({
        recipeId: e.recipeId,
        dateLocal,
        meal,
        grams: e.grams,
      });
    }
    if (!created) return;
    refresh();
    showFlash(`Добавлено: ${e.displayName}`);
    setUndo({ entryIds: [created.id], message: `Добавлено: ${e.displayName}` });
  };

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

          <TodayRecentStrip
            recent={recent}
            onConfirm={openRecentConfirm}
            onQuickAdd={quickAddRecent}
          />

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
      <ConfirmPortionSheet
        visible={portionTarget != null}
        target={portionTarget?.target ?? null}
        meal={meal}
        mealLabel={MEAL_LABELS[meal]}
        initialGrams={portionTarget?.initialGrams}
        onClose={() => setPortionTarget(null)}
        onConfirm={(result) => {
          if (!portionTarget) return;
          if (!allowAdd()) return;
          let createdId: string;
          let label: string;
          if (portionTarget.target.kind === 'product') {
            const product = portionTarget.target.product as FoodProduct;
            repo.updateProductNutrition(product.id, result.per100g);
            const created = repo.addEntryFromProduct({
              productId: product.id,
              dateLocal,
              meal,
              grams: result.grams,
            });
            createdId = created.id;
            label = product.name;
          } else {
            const snap = portion(
              {
                kcal: result.per100g.energyKcal,
                protein: result.per100g.proteinG,
                fat: result.per100g.fatG,
                carbs: result.per100g.carbG,
              },
              result.grams,
            );
            const created = repo.addEntryFromRecipe({
              recipeId: portionTarget.target.recipe.id,
              dateLocal,
              meal,
              grams: result.grams,
              nutritionSnapshot: {
                energyKcal: snap.kcal,
                proteinG: snap.protein,
                fatG: snap.fat,
                carbG: snap.carbs,
              },
            });
            createdId = created.id;
            label = portionTarget.target.recipe.name;
          }
          refresh();
          setPortionTarget(null);
          showFlash(`Добавлено: ${label}`);
          setUndo({ entryIds: [createdId], message: `Добавлено: ${label}` });
        }}
      />
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

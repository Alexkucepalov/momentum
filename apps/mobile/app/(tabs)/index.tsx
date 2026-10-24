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
import type { FoodProduct } from '../../../../src/storage/types';
import { AddFoodBlock } from '@/src/components/AddFoodBlock';
import { DayStrip } from '@/src/components/DayStrip';
import { FlashBar } from '@/src/components/FlashBar';
import { FormScrollView } from '@/src/components/FormScrollView';
import { TodayPlanStrip } from '@/src/features/plan/TodayPlanStrip';
import { KcalRing } from '@/src/components/KcalRing';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { ScreenFooter } from '@/src/components/ScreenFooter';
import { SectionHeader } from '@/src/components/SectionHeader';
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
import { TargetsOnboardingSheet } from '@/src/features/diary/TargetsOnboardingSheet';
import { useAddGuard } from '@/src/hooks/useAddGuard';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

const MEAL_LABELS = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
} as const;

const MEAL_RU = {
  breakfast: 'завтрак',
  lunch: 'обед',
  dinner: 'ужин',
  snack: 'перекус',
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

export default function TodayScreen() {
  const router = useRouter();
  const { repo, dateLocal, setDateLocal, meal, setMeal, refresh, revision, showFlash } = useData();
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
  const todayEntries = repo.listEntriesForDate(dateLocal);
  const recent = repo.listRecentEntries(6);
  const favorites = repo.listFavorites().slice(0, 4);
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
    <View style={styles.root}>
      <FormScrollView contentContainerStyle={styles.content}>
        {/* Fold: date → KBJU → primary Add (footer sticky) → recent */}
        <Text style={styles.dateLine}>{dateLine}</Text>

        <DayStrip
          selected={dateLocal}
          today={today}
          onSelect={setDateLocal}
          onOpenCalendar={() => setCalendarOpen(true)}
        />

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

        <AddFoodBlock
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

        {/* Below fold: plan, habits, water, favorites, secondary links */}
        <TodayPlanStrip />

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

        <StatCards
          waterMl={waterMl}
          waterTargetMl={profile.waterTargetMl}
          activityMinutes={activityMinutes}
          onAddWater={(ml) => {
            repo.addWater(dateLocal, ml);
            refresh();
            showFlash(`+${ml} мл воды`);
          }}
        />

        {favorites.length > 0 ? (
          <>
            <SectionHeader title="Избранное" />
            <Text style={styles.favHint}>Сначала порция — в дневник только после подтверждения</Text>
            {favorites.map((p) => {
              const lastG = repo.lastGramsForProduct(p.id) ?? 100;
              return (
                <Pressable
                  key={p.id}
                  style={({ pressed }) => [styles.quick, pressed && styles.pressed]}
                  onPress={() => {
                    setPortionTarget({
                      target: { kind: 'product', product: p },
                      initialGrams: lastG,
                    });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Добавить ${p.name}, выбрать порцию`}
                >
                  <View style={styles.iconBubble}>
                    <Ionicons name="star" size={16} color={colors.fat} />
                  </View>
                  <View style={styles.quickBody}>
                    <Text style={styles.quickTitle}>{p.name}</Text>
                    <Text style={styles.quickMeta}>
                      обычно {lastG} г → {MEAL_RU[meal]}
                      {p.energyKcal === null ? '' : ` · ~${Math.round((p.energyKcal * lastG) / 100)} ккал`}
                    </Text>
                  </View>
                  <Text style={styles.quickAction}>+</Text>
                </Pressable>
              );
            })}
          </>
        ) : null}

        <View style={styles.secondaryLinks} accessibilityRole="summary">
          <Pressable
            onPress={() => router.push('/plan/eat-now')}
            style={({ pressed }) => [styles.secondaryLink, pressed && styles.pressed]}
            accessibilityRole="link"
            accessibilityLabel="Что съесть сейчас"
          >
            <Text style={styles.secondaryLinkText}>Что съесть сейчас →</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/recipes')}
            style={({ pressed }) => [styles.secondaryLink, pressed && styles.pressed]}
            accessibilityRole="link"
            accessibilityLabel="Рецепты"
          >
            <Text style={styles.secondaryLinkText}>Рецепты →</Text>
          </Pressable>
        </View>
      </FormScrollView>

      <ScreenFooter>
        <Pressable
          style={({ pressed }) => [styles.footerScan, pressed && styles.pressed]}
          onPress={() => setBarcodeOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Сканировать штрихкод"
        >
          <Ionicons name="barcode-outline" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.footerBtn}>
          <PrimaryButton label="Добавить еду" onPress={() => setOpen(true)} />
        </View>
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
      <ConfirmPortionSheet
        visible={portionTarget != null}
        target={portionTarget?.target ?? null}
        meal={meal}
        mealLabel={MEAL_LABELS[meal]}
        initialGrams={portionTarget?.initialGrams}
        onClose={() => setPortionTarget(null)}
        onConfirm={(result) => {
          if (!portionTarget || portionTarget.target.kind !== 'product') return;
          if (!allowAdd()) return;
          const product = portionTarget.target.product as FoodProduct;
          repo.updateProductNutrition(product.id, result.per100g);
          repo.addEntryFromProduct({
            productId: product.id,
            dateLocal,
            meal,
            grams: result.grams,
          });
          refresh();
          setPortionTarget(null);
          showFlash(`Добавлено: ${product.name}`);
        }}
      />
      <FlashBar />
      <UndoBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, paddingBottom: 140 },
  dateLine: {
    marginBottom: space.sm,
    fontSize: type.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  quick: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.sm,
    minHeight: touchMin,
    gap: space.sm,
  },
  pressed: { opacity: 0.88 },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBody: { flex: 1 },
  quickTitle: { fontSize: type.body, fontWeight: '600', color: colors.text },
  quickMeta: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
  quickAction: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: space.sm,
  },
  favHint: {
    fontSize: type.micro,
    color: colors.textMuted,
    marginBottom: space.sm,
    marginTop: -4,
  },
  secondaryLinks: {
    marginTop: space.md,
    marginBottom: space.sm,
    gap: space.xs,
  },
  secondaryLink: {
    paddingVertical: space.sm,
    minHeight: touchMin,
    justifyContent: 'center',
  },
  secondaryLinkText: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  footerScan: {
    width: touchMin,
    height: touchMin,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtn: { flex: 1 },
});

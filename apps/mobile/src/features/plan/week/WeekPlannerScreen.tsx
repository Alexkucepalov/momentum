import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';

import { datesInWeekFromStart, weekStartMonday } from '../../../../../../src/domain/habitWeek';
import { formatDateRu } from '../../../../../../src/domain/dateFormatRu';
import type { MealPlanPeriodDays, MealPlanDiversity } from '../../../../../../src/domain/mealPlanDraft';
import {
  dayFillFromSummary,
  nutritionForPlannedMeal,
  summarizePlannedDayNutrition,
} from '../../../../../../src/domain/plannedMealNutrition';
import type { MealSlot, PlannedMeal } from '../../../../../../src/storage/types';
import { DayStrip } from '@/src/components/DayStrip';
import { EmptyState } from '@/src/components/EmptyState';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useAddGuard } from '@/src/hooks/useAddGuard';
import { useData } from '@/src/state/DataContext';
import { colors, elevation, radius, space, touchMin, type } from '@/src/theme/tokens';
import { AddToPlanSheet } from './AddToPlanSheet';
import { DayNutritionBar } from './DayNutritionBar';
import { DragOverlay } from './DragOverlay';
import { MealActionSheet } from './MealActionSheet';
import { MealSlotSection } from './MealSlotSection';
import { MoveCopySheet, type MoveCopyMode } from './MoveCopySheet';
import { PlanDragProvider, usePlanDrag, type DropTarget } from './planDragContext';
import { WeekOverview } from './WeekOverview';

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const PERIODS: MealPlanPeriodDays[] = [3, 5, 7];
const PORTION_STEPS = [100, 150, 200, 250, 300];

type PlannerView = 'day' | 'week';

function fmtMacroLine(n: {
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}): string {
  const parts: string[] = [];
  if (n.kcal !== null) parts.push(`${Math.round(n.kcal)} ккал`);
  if (n.protein !== null) parts.push(`Б ${Math.round(n.protein)}`);
  if (n.fat !== null) parts.push(`Ж ${Math.round(n.fat)}`);
  if (n.carbs !== null) parts.push(`У ${Math.round(n.carbs)}`);
  return parts.length ? parts.join(' · ') : 'КБЖУ неизвестны';
}

function kcalLabel(n: { kcal: number | null }): string {
  return n.kcal === null ? '— ккал' : `${Math.round(n.kcal)} ккал`;
}

export function WeekPlannerScreen() {
  return (
    <PlanDragProvider>
      <WeekPlannerBody />
    </PlanDragProvider>
  );
}

function WeekPlannerBody() {
  const router = useRouter();
  const { repo, dateLocal, setDateLocal, refresh, revision, showFlash } = useData();
  const allowAdd = useAddGuard();
  const { dragging, hover, setDayBox } = usePlanDrag();
  const pointerX = useSharedValue(0);
  const pointerY = useSharedValue(0);
  void revision;

  const [selectedDate, setSelectedDate] = useState(dateLocal);
  const [view, setView] = useState<PlannerView>('day');
  const [composerOpen, setComposerOpen] = useState(false);
  const [days, setDays] = useState<MealPlanPeriodDays>(7);
  const [cookSessions, setCookSessions] = useState('2');
  const [diversity, setDiversity] = useState<MealPlanDiversity>('balanced');
  const [error, setError] = useState<string | null>(null);

  const [addSlot, setAddSlot] = useState<MealSlot | null>(null);
  const [menuMeal, setMenuMeal] = useState<PlannedMeal | null>(null);
  const [transfer, setTransfer] = useState<{
    mode: MoveCopyMode;
    meal: PlannedMeal;
  } | null>(null);

  const profile = repo.getProfile();
  const products = repo.listProducts();
  const recipes = repo.listRecipes();
  const recent = repo.listRecentEntries(16);

  const lookup = useMemo(
    () => ({
      getRecipe: (id: string) => repo.getRecipe(id),
      getRecipeIngredients: (id: string) => repo.getRecipeIngredients(id),
      getProduct: (id: string) => products.find((p) => p.id === id) ?? null,
    }),
    [repo, products, revision],
  );

  const weekStart = weekStartMonday(selectedDate);
  const weekDays = datesInWeekFromStart(weekStart);

  const fillByDate = useMemo(() => {
    const map: Record<string, 'empty' | 'partial' | 'filled'> = {};
    for (const d of weekDays) {
      const meals = repo.listPlannedMealsForDate(d);
      map[d] = dayFillFromSummary(summarizePlannedDayNutrition(meals, lookup));
    }
    return map;
  }, [weekDays, repo, lookup, revision]);

  const dayMeals = repo.listPlannedMealsForDate(selectedDate);
  const daySummary = useMemo(
    () => summarizePlannedDayNutrition(dayMeals, lookup),
    [dayMeals, lookup],
  );

  const bySlot = useMemo(() => {
    const map: Record<MealSlot, PlannedMeal[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const m of dayMeals) map[m.meal].push(m);
    return map;
  }, [dayMeals]);

  const nutritionOf = (m: PlannedMeal) => nutritionForPlannedMeal(m, lookup);
  const macrosFor = (m: PlannedMeal) => fmtMacroLine(nutritionOf(m));
  const kcalFor = (m: PlannedMeal) => kcalLabel(nutritionOf(m));

  const weekSummaries = useMemo(() => {
    const map: Record<string, ReturnType<typeof summarizePlannedDayNutrition>> = {};
    for (const d of weekDays) {
      map[d] = summarizePlannedDayNutrition(repo.listPlannedMealsForDate(d), lookup);
    }
    return map;
  }, [weekDays, repo, lookup, revision]);

  const selectDate = (d: string) => {
    setSelectedDate(d);
    setDateLocal(d);
    setView('day');
  };

  const applyDrop = useCallback(
    (mealId: string, target: DropTarget | null) => {
      if (!target) {
        showFlash('Перенос отменён');
        return;
      }
      const source = dayMeals.find((m) => m.id === mealId) ??
        // may be from another day if list is only selected day — look up via plan lists
        null;
      let meal = source;
      if (!meal) {
        for (const d of weekDays) {
          const hit = repo.listPlannedMealsForDate(d).find((m) => m.id === mealId);
          if (hit) {
            meal = hit;
            break;
          }
        }
      }
      if (!meal) return;

      if (target.kind === 'slot') {
        if (meal.dateLocal === selectedDate && meal.meal === target.slot) return;
        repo.movePlannedMeal(mealId, { dateLocal: selectedDate, meal: target.slot });
        refresh();
        showFlash(`→ ${slotLabel(target.slot)}`);
        return;
      }
      // day drop keeps the same meal slot
      if (meal.dateLocal === target.dateLocal) {
        selectDate(target.dateLocal);
        return;
      }
      repo.movePlannedMeal(mealId, { dateLocal: target.dateLocal, meal: meal.meal });
      refresh();
      selectDate(target.dateLocal);
      showFlash(`→ ${formatDateRu(target.dateLocal)}`);
    },
    [dayMeals, weekDays, repo, selectedDate, refresh, showFlash],
  );

  const createDraft = () => {
    setError(null);
    try {
      if (recipes.length === 0) {
        setError('Нужен хотя бы один рецепт — иначе план будет пустым.');
        return;
      }
      const sessions = Number(cookSessions);
      if (!Number.isInteger(sessions) || sessions < 1) throw new Error('Готовок: целое ≥ 1');
      repo.createMealPlanDraft({
        startDateLocal: selectedDate,
        days,
        budgetRub: null,
        cookSessions: sessions,
        diversity,
      });
      setComposerOpen(false);
      refresh();
      showFlash('Черновик меню готов — ещё не съедено');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать план');
    }
  };

  const cyclePortion = (m: PlannedMeal) => {
    const idx = PORTION_STEPS.findIndex((g) => g >= m.grams);
    const next =
      idx < 0 || idx === PORTION_STEPS.length - 1
        ? PORTION_STEPS[0]!
        : PORTION_STEPS[idx + 1]!;
    repo.updatePlannedMealGrams(m.id, next);
    refresh();
    showFlash(`Порция ${next} г`);
  };

  const replaceMeal = (m: PlannedMeal) => {
    if (recipes.length < 2) {
      showFlash('Нужно ≥2 рецепта для замены');
      return;
    }
    const ids = recipes.map((r) => r.id);
    const cur = m.recipeId ? ids.indexOf(m.recipeId) : -1;
    const other = recipes[(cur + 1) % recipes.length]!;
    repo.replacePlannedMeal(m.id, {
      recipeId: other.id,
      productId: null,
      displayName: other.name,
      grams: Math.min(200, Math.max(100, Math.round(other.cookedYieldG / 4))),
    });
    refresh();
    showFlash(`Замена: ${other.name}`);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        scrollEnabled={!dragging}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.viewToggle} accessibilityRole="tablist">
          {(
            [
              ['day', 'День'],
              ['week', 'Неделя'],
            ] as const
          ).map(([id, label]) => {
            const on = view === id;
            return (
              <Pressable
                key={id}
                onPress={() => setView(id)}
                style={[styles.viewChip, on && styles.viewChipOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={label}
              >
                <Text style={[styles.viewChipText, on && styles.viewChipTextOn]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <DayStrip
          selected={selectedDate}
          today={dateLocal}
          onSelect={selectDate}
          fillByDate={fillByDate}
          dragActive={dragging}
          hoverDate={hover?.kind === 'day' ? hover.dateLocal : null}
          onDayBox={setDayBox}
        />

        {view === 'week' ? (
          <WeekOverview
            days={weekDays}
            summaries={weekSummaries}
            targetKcal={profile.dailyEnergyKcal}
            selected={selectedDate}
            onSelect={selectDate}
          />
        ) : null}

        {view === 'day' ? (
          <>
            <View style={styles.todayRow}>
              <Text style={styles.dayTitle}>
                {formatDateRu(selectedDate)}
                {selectedDate === dateLocal ? ' · сегодня' : ''}
              </Text>
              {selectedDate !== dateLocal ? (
                <Pressable
                  onPress={() => selectDate(dateLocal)}
                  accessibilityRole="button"
                  accessibilityLabel="К сегодня"
                  hitSlop={8}
                >
                  <Text style={styles.todayLink}>Сегодня</Text>
                </Pressable>
              ) : null}
            </View>

            <DayNutritionBar
              summary={daySummary}
              targets={{
                energyKcal: profile.dailyEnergyKcal,
                proteinG: profile.dailyProteinG,
                fatG: profile.dailyFatG,
                carbG: profile.dailyCarbG,
              }}
            />

            {daySummary.empty ? (
              <Text style={styles.emptyHint} accessibilityRole="text">
                Добавь первое блюдо
              </Text>
            ) : null}

            {SLOTS.map((slot) => (
              <MealSlotSection
                key={slot}
                slot={slot}
                meals={bySlot[slot]}
                kcalFor={kcalFor}
                onAdd={() => setAddSlot(slot)}
                onOpenMenu={(m) => setMenuMeal(m)}
                pointerX={pointerX}
                pointerY={pointerY}
                onDrop={applyDrop}
              />
            ))}
          </>
        ) : null}

        <Pressable
          onPress={() => setComposerOpen((v) => !v)}
          style={styles.secondaryToggle}
          accessibilityRole="button"
          accessibilityLabel={composerOpen ? 'Скрыть автосборку' : 'Автосборка из рецептов'}
        >
          <Text style={styles.secondaryToggleText}>
            {composerOpen ? 'Скрыть' : 'Автосборка из рецептов'}
          </Text>
        </Pressable>

        {composerOpen ? (
          <View style={styles.composer}>
            <Text style={styles.composerLead}>3–7 дней · завтрак / обед / ужин</Text>
            <Text style={styles.label}>Период</Text>
            <View style={styles.row}>
              {PERIODS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setDays(p)}
                  style={[styles.chip, days === p && styles.chipOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: days === p }}
                >
                  <Text style={[styles.chipText, days === p && styles.chipTextOn]}>{p} дн.</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Готовок</Text>
            <TextInput
              value={cookSessions}
              onChangeText={setCookSessions}
              keyboardType="number-pad"
              style={styles.input}
              accessibilityLabel="Число готовок"
            />
            <Text style={styles.label}>Разнообразие</Text>
            <View style={styles.row}>
              {(
                [
                  ['balanced', 'Сбалансированное'],
                  ['fewer', 'Меньше блюд'],
                ] as const
              ).map(([id, label]) => (
                <Pressable
                  key={id}
                  onPress={() => setDiversity(id)}
                  style={[styles.chip, diversity === id && styles.chipOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: diversity === id }}
                >
                  <Text style={[styles.chipText, diversity === id && styles.chipTextOn]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label="Спроектировать план" onPress={createDraft} />
            {recipes.length === 0 ? (
              <EmptyState
                compact
                icon="book-outline"
                title="Нет рецептов"
                body="Добавь рецепты — черновик меню собирается из личной базы."
                actionLabel="К рецептам"
                onAction={() => router.push('/recipes')}
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <AddToPlanSheet
        visible={addSlot != null}
        slot={addSlot}
        dateLocal={selectedDate}
        products={products}
        recipes={recipes}
        recent={recent}
        lastGramsForProduct={(id) => repo.lastGramsForProduct(id)}
        lastGramsForRecipe={(id) => repo.lastGramsForRecipe(id)}
        onClose={() => setAddSlot(null)}
        onAdd={(input) => {
          if (!addSlot) return;
          repo.addPlannedMeal({
            dateLocal: selectedDate,
            meal: addSlot,
            displayName: input.displayName,
            grams: input.grams,
            recipeId: input.recipeId,
            productId: input.productId,
          });
          refresh();
          showFlash(`В план: ${input.displayName}`);
          setAddSlot(null);
        }}
      />

      <MealActionSheet
        visible={menuMeal != null}
        meal={menuMeal}
        macrosLine={menuMeal ? macrosFor(menuMeal) : ''}
        onClose={() => setMenuMeal(null)}
        onAction={(id) => {
          const m = menuMeal;
          if (!m) return;
          setMenuMeal(null);
          if (id === 'portion') cyclePortion(m);
          else if (id === 'replace') replaceMeal(m);
          else if (id === 'move') setTransfer({ mode: 'move', meal: m });
          else if (id === 'copy') setTransfer({ mode: 'copy', meal: m });
          else if (id === 'delete') {
            repo.softDeletePlannedMeal(m.id);
            refresh();
            showFlash(`Удалено из плана: ${m.displayName}`);
          } else if (id === 'log') {
            if (!allowAdd()) return;
            repo.logPlannedMealToDiary(m.id);
            refresh();
            showFlash(`В дневник: ${m.displayName}`);
          }
        }}
      />

      <MoveCopySheet
        visible={transfer != null}
        mode={transfer?.mode ?? 'move'}
        meal={transfer?.meal ?? null}
        anchorDate={selectedDate}
        onClose={() => setTransfer(null)}
        onConfirm={({ dateLocal: destDate, meal: destSlot }) => {
          if (!transfer) return;
          if (transfer.mode === 'move') {
            repo.movePlannedMeal(transfer.meal.id, {
              dateLocal: destDate,
              meal: destSlot,
            });
            showFlash(`Перенесено → ${formatDateRu(destDate)}`);
          } else {
            repo.copyPlannedMeal(transfer.meal.id, {
              dateLocal: destDate,
              meal: destSlot,
            });
            showFlash(`Скопировано → ${formatDateRu(destDate)}`);
          }
          refresh();
          setTransfer(null);
          selectDate(destDate);
        }}
      />

      <DragOverlay pointerX={pointerX} pointerY={pointerY} />
    </View>
  );
}

function slotLabel(slot: MealSlot): string {
  switch (slot) {
    case 'breakfast':
      return 'Завтрак';
    case 'lunch':
      return 'Обед';
    case 'dinner':
      return 'Ужин';
    case 'snack':
      return 'Перекус';
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: space.lg, paddingBottom: space.xxl },
  viewToggle: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: space.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: 4,
  },
  viewChip: {
    flex: 1,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  viewChipOn: { backgroundColor: colors.primaryButton },
  viewChipText: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary },
  viewChipTextOn: { color: colors.primaryButtonText },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  dayTitle: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  todayLink: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  emptyHint: {
    fontSize: type.caption,
    color: colors.textMuted,
    marginBottom: space.sm,
  },
  secondaryToggle: {
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.md,
  },
  secondaryToggleText: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  composer: { gap: space.md, marginTop: space.sm },
  composerLead: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
  label: { fontSize: type.caption, color: colors.textMuted },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: 36,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  chipOn: { backgroundColor: colors.primaryButton },
  chipText: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  chipTextOn: { color: colors.primaryButtonText },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: type.caption },
});

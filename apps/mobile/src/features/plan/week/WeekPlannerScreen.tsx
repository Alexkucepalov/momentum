import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

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
import { FormScrollView } from '@/src/components/FormScrollView';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useAddGuard } from '@/src/hooks/useAddGuard';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { AddToPlanSheet } from './AddToPlanSheet';
import { DayNutritionBar } from './DayNutritionBar';
import { DragOverlay } from './DragOverlay';
import { MealSlotSection } from './MealSlotSection';
import { MoveCopySheet, type MoveCopyMode } from './MoveCopySheet';
import { PlanDragProvider, usePlanDrag, type DropTarget } from './planDragContext';

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const PERIODS: MealPlanPeriodDays[] = [3, 5, 7];
const PORTION_STEPS = [100, 150, 200, 250, 300];

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
  const { session, setDayBox } = usePlanDrag();
  void revision;

  const [selectedDate, setSelectedDate] = useState(dateLocal);
  const [composerOpen, setComposerOpen] = useState(false);
  const [days, setDays] = useState<MealPlanPeriodDays>(7);
  const [cookSessions, setCookSessions] = useState('2');
  const [diversity, setDiversity] = useState<MealPlanDiversity>('balanced');
  const [error, setError] = useState<string | null>(null);

  const [addSlot, setAddSlot] = useState<MealSlot | null>(null);
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

  const macrosFor = (m: PlannedMeal) => fmtMacroLine(nutritionForPlannedMeal(m, lookup));

  const selectDate = (d: string) => {
    setSelectedDate(d);
    setDateLocal(d);
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
      <FormScrollView
        contentContainerStyle={styles.content}
        scrollEnabled={session == null}
      >
        <View style={styles.banner} accessibilityRole="summary">
          <Text style={styles.bannerText}>Запланированное ≠ съеденное</Text>
          <Text style={styles.bannerSub}>
            Удерживай ☰ на карточке — перетащи на слот или день. Кнопки «Перенести» тоже работают.
          </Text>
        </View>

        <DayStrip
          selected={selectedDate}
          today={dateLocal}
          onSelect={selectDate}
          fillByDate={fillByDate}
          dragActive={session != null}
          hoverDate={session?.hover?.kind === 'day' ? session.hover.dateLocal : null}
          onDayBox={setDayBox}
        />

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

        {SLOTS.map((slot) => (
          <MealSlotSection
            key={slot}
            slot={slot}
            meals={bySlot[slot]}
            macrosFor={macrosFor}
            onAdd={() => setAddSlot(slot)}
            onPortion={cyclePortion}
            onMove={(m) => setTransfer({ mode: 'move', meal: m })}
            onCopy={(m) => setTransfer({ mode: 'copy', meal: m })}
            onReplace={replaceMeal}
            onDelete={(m) => {
              repo.softDeletePlannedMeal(m.id);
              refresh();
              showFlash(`Удалено из плана: ${m.displayName}`);
            }}
            onLog={(m) => {
              if (!allowAdd()) return;
              repo.logPlannedMealToDiary(m.id);
              refresh();
              showFlash(`В дневник: ${m.displayName}`);
            }}
          />
        ))}

        <Pressable
          onPress={() => setComposerOpen((v) => !v)}
          style={styles.secondaryToggle}
          accessibilityRole="button"
          accessibilityLabel={composerOpen ? 'Скрыть автосборку' : 'Автосборка из рецептов'}
        >
          <Text style={styles.secondaryToggleText}>
            {composerOpen ? 'Скрыть автосборку' : 'Автосборка меню из рецептов'}
          </Text>
        </Pressable>

        {composerOpen ? (
          <View style={styles.composer}>
            <Text style={styles.composerLead}>
              Заполнит 3–7 дней завтрак/обед/ужин из твоих рецептов. Можно править слоты вручную.
            </Text>
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
      </FormScrollView>

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

      <DragOverlay onDrop={applyDrop} />
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
  root: { flex: 1 },
  content: { padding: space.lg, paddingBottom: space.xxl },
  banner: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: space.md,
    gap: 4,
    marginBottom: space.md,
  },
  bannerText: { fontSize: type.caption, fontWeight: '800', color: colors.text },
  bannerSub: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  dayTitle: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  todayLink: { fontSize: type.caption, fontWeight: '700', color: colors.text },
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
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  chipTextOn: { color: colors.primaryButtonText },
  input: {
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    fontSize: type.body,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: type.caption },
});

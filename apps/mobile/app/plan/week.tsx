import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  datesInWeekFromStart,
  HABIT_WEEKDAY_LABELS_RU,
  weekStartMonday,
} from '../../../../src/domain/habitWeek';
import {
  buildPlannedDayNutrition,
  nutritionForPlannedMeal,
} from '../../../../src/domain/plannedDayNutrition';
import type { MealSlot, PlannedMeal } from '../../../../src/storage/types';
import { FlashBar } from '@/src/components/FlashBar';
import { FormScrollView } from '@/src/components/FormScrollView';
import { AddPlannedMealSheet, type AddPick } from '@/src/features/plan/AddPlannedMealSheet';
import { EditPlannedGramsSheet } from '@/src/features/plan/EditPlannedGramsSheet';
import { MEAL_SLOTS } from '@/src/features/plan/mealBoardLabels';
import { MovePlannedMealSheet } from '@/src/features/plan/MovePlannedMealSheet';
import { PlanNotDiaryNote } from '@/src/features/plan/PlanNotDiaryNote';
import { WeekBoard, type WeekBoardDay } from '@/src/features/plan/WeekBoard';
import { useData, usePlanRevision } from '@/src/state/DataContext';
import { confirmAction } from '@/src/utils/confirmAction';
import { AppButton, AppText, colors, space } from '@/src/design-system';

function emptySlots(): Record<MealSlot, PlannedMeal[]> {
  return { breakfast: [], lunch: [], dinner: [], snack: [] };
}

export default function WeekPlanScreen() {
  const router = useRouter();
  const { repo, dateLocal, refresh, showFlash } = useData();
  const planRevision = usePlanRevision();
  void planRevision;

  const profile = repo.getProfile();
  const weekStart = weekStartMonday(dateLocal);
  const weekDates = useMemo(() => datesInWeekFromStart(weekStart), [weekStart]);

  const [planId, setPlanId] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof repo.ensureWeekDraftPlan !== 'function') return;
      const plan = repo.ensureWeekDraftPlan(weekStart);
      setPlanId(plan.id);
    } catch {
      setPlanId(null);
    }
  }, [repo, weekStart]);

  const plan = planId ? repo.getMealPlan(planId) : null;
  const allMeals = useMemo(
    () => (planId ? repo.listPlannedMeals(planId) : []),
    [repo, planId],
  );

  const productById = useMemo(() => {
    const map = new Map(repo.listProducts().map((p) => [p.id, p]));
    return map;
  }, [repo]);

  const lookup = useMemo(
    () => ({
      getRecipe: (id: string) => repo.getRecipe(id),
      getRecipeIngredients: (id: string) => repo.getRecipeIngredients(id),
      getProduct: (id: string) => productById.get(id) ?? null,
    }),
    [repo, productById],
  );

  const targets = useMemo(
    () => ({
      energyKcal: profile.dailyEnergyKcal,
      proteinG: profile.dailyProteinG,
      fatG: profile.dailyFatG,
      carbG: profile.dailyCarbG,
    }),
    [profile],
  );

  const boardDays: WeekBoardDay[] = useMemo(() => {
    return weekDates.map((dateLocalDay, weekdayIndex) => {
      const dayMeals = allMeals.filter((m) => m.dateLocal === dateLocalDay);
      const bySlot = emptySlots();
      for (const m of dayMeals) {
        bySlot[m.meal].push(m);
      }
      const nutrition = buildPlannedDayNutrition({
        meals: dayMeals,
        targets,
        lookup,
      });
      const dayNumber = Number(dateLocalDay.slice(8, 10));
      return {
        dateLocal: dateLocalDay,
        weekdayIndex,
        dayNumber,
        nutrition,
        mealsBySlot: bySlot,
      };
    });
  }, [weekDates, allMeals, targets, lookup]);

  const kcalForMeal = (m: PlannedMeal) => nutritionForPlannedMeal(m, lookup).energyKcal;

  const [addTarget, setAddTarget] = useState<{ dateLocal: string; slot: MealSlot } | null>(null);
  const [moveMeal, setMoveMeal] = useState<PlannedMeal | null>(null);
  const [editMeal, setEditMeal] = useState<PlannedMeal | null>(null);

  const recipes = useMemo(
    () =>
      repo
        .listRecipes()
        .map((r) => ({ id: r.id, name: r.name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [repo],
  );
  const products = useMemo(
    () =>
      repo
        .listProducts()
        .map((p) => ({ id: p.id, name: p.name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [repo],
  );

  const moveDays = weekDates.map((d, i) => ({
    dateLocal: d,
    label: `${HABIT_WEEKDAY_LABELS_RU[i]} ${Number(d.slice(8, 10))}`,
  }));

  const onAddConfirm = (pick: AddPick, grams: number) => {
    if (!addTarget) return;
    repo.ensureWeekDraftPlan(weekStart);
    repo.addPlannedMeal({
      dateLocal: addTarget.dateLocal,
      meal: addTarget.slot,
      displayName: pick.name,
      grams,
      recipeId: pick.kind === 'recipe' ? pick.id : null,
      productId: pick.kind === 'product' ? pick.id : null,
    });
    refresh('plan');
    showFlash(`В план: ${pick.name}`);
    setAddTarget(null);
  };

  const onDelete = (m: PlannedMeal) => {
    confirmAction('Убрать из плана?', `«${m.displayName}» исчезнет с доски. Дневник не трогаем.`, {
      confirmLabel: 'Убрать',
      destructive: true,
      onConfirm: () => {
        repo.softDeletePlannedMeal(m.id);
        refresh('plan');
        showFlash('Убрано с доски');
      },
    });
  };

  const rangeLabel = `${HABIT_WEEKDAY_LABELS_RU[0]} ${Number(weekDates[0]!.slice(8, 10))} — ${HABIT_WEEKDAY_LABELS_RU[6]} ${Number(weekDates[6]!.slice(8, 10))}`;

  return (
    <View style={styles.root}>
      <FormScrollView contentContainerStyle={styles.content} testID="week-board-screen">
        <PlanNotDiaryNote
          style={styles.banner}
          extra={` · доска ${rangeLabel}${plan ? ` · ${plan.status === 'draft' ? 'черновик' : 'активный'}` : ''}`}
        />

        <WeekBoard
          days={boardDays}
          hasEnergyTarget={profile.dailyEnergyKcal != null}
          kcalForMeal={kcalForMeal}
          onAdd={(dateLocalDay, slot) => setAddTarget({ dateLocal: dateLocalDay, slot })}
          onPressMeal={setEditMeal}
          onLongPressMeal={setMoveMeal}
          onDeleteMeal={onDelete}
        />

        <AppText variant="caption" tone="muted" style={styles.hint}>
          Долгое нажатие на карточку — перенести на другой день или слот ({MEAL_SLOTS.length} слота).
        </AppText>

        <View style={styles.footer}>
          <AppButton
            label="Собрать покупки"
            variant="secondary"
            onPress={() => router.push('/plan/shop')}
          />
        </View>
      </FormScrollView>

      <AddPlannedMealSheet
        visible={addTarget != null}
        slot={addTarget?.slot ?? 'lunch'}
        dayLabel={
          addTarget
            ? moveDays.find((d) => d.dateLocal === addTarget.dateLocal)?.label ?? addTarget.dateLocal
            : ''
        }
        recipes={recipes}
        products={products}
        onClose={() => setAddTarget(null)}
        onConfirm={onAddConfirm}
      />

      <MovePlannedMealSheet
        visible={moveMeal != null}
        mealName={moveMeal?.displayName ?? ''}
        days={moveDays}
        onClose={() => setMoveMeal(null)}
        onPick={(dateLocalDay, slot) => {
          if (!moveMeal) return;
          repo.movePlannedMeal(moveMeal.id, { dateLocal: dateLocalDay, meal: slot });
          refresh('plan');
          showFlash('Перенесено');
          setMoveMeal(null);
        }}
      />

      <EditPlannedGramsSheet
        visible={editMeal != null}
        mealName={editMeal?.displayName ?? ''}
        grams={editMeal?.grams ?? 100}
        onClose={() => setEditMeal(null)}
        onSave={(grams) => {
          if (!editMeal) return;
          repo.updatePlannedMealGrams(editMeal.id, grams);
          refresh('plan');
          showFlash(`Порция: ${grams} г`);
        }}
      />
      <FlashBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingTop: space.md,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  banner: {
    paddingHorizontal: space.lg,
    lineHeight: 18,
  },
  hint: {
    paddingHorizontal: space.lg,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: space.lg,
  },
});

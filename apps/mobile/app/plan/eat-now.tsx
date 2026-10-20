import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  eatNowInputsFromCookedBatches,
  eatNowInputsFromProducts,
  eatNowInputsFromRecipes,
} from '../../../../src/domain/buildEatNowInputs';
import { recipeAtHome, selectEatNowProducts } from '../../../../src/domain/eatNowPool';
import { mealSlotForNow } from '../../../../src/domain/mealSlotForNow';
import { hasAnyKnownRemaining, remainingMacros } from '../../../../src/domain/remainingMacros';
import {
  scoreEatNow,
  type EatNowCandidate,
  type EatNowFilterId,
} from '../../../../src/domain/scoreEatNow';
import type { MealSlot } from '../../../../src/storage/types';
import { portion } from '../../../../src/domain/nutrition';
import { EmptyState } from '@/src/components/EmptyState';
import { FormScrollView } from '@/src/components/FormScrollView';
import { MealChips } from '@/src/components/MealChips';
import {
  ConfirmPortionSheet,
  type PortionTarget,
} from '@/src/features/diary/ConfirmPortionSheet';
import { useAddGuard } from '@/src/hooks/useAddGuard';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

const FILTERS: { id: EatNowFilterId; label: string }[] = [
  { id: 'all', label: 'Подходящие' },
  { id: 'at_home', label: 'Дома' },
  { id: 'to_buy', label: 'Купить' },
  { id: 'no_cook', label: 'Без готовки' },
  { id: 'quick_15', label: 'До 15 мин' },
  { id: 'more_protein', label: 'Больше белка' },
];

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

function fmtMacro(n: number | null, suffix: string): string | null {
  if (n === null) return null;
  return `${Math.round(n)}${suffix}`;
}

function RemainingStrip({
  energyKcal,
  proteinG,
  fatG,
  carbG,
  incomplete,
}: {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
  incomplete: boolean;
}) {
  const macros = [
    fmtMacro(proteinG, ' г Б'),
    fmtMacro(fatG, ' г Ж'),
    fmtMacro(carbG, ' г У'),
  ].filter(Boolean);

  return (
    <View
      style={styles.remaining}
      accessibilityRole="summary"
      accessibilityLabel={
        energyKcal === null
          ? 'Остаток калорий неизвестен'
          : `Остаток ${Math.round(energyKcal)} килокалорий${macros.length ? `, ${macros.join(', ')}` : ''}`
      }
    >
      <Text style={styles.remainingLabel}>Условный остаток на сегодня</Text>
      <Text style={styles.remainingHero}>
        {energyKcal === null ? 'ккал неизвестны' : `${Math.round(energyKcal)} ккал`}
      </Text>
      {macros.length > 0 ? <Text style={styles.remainingMacros}>{macros.join(' · ')}</Text> : null}
      {incomplete ? (
        <Text style={styles.hint}>Часть макросов неизвестна — не подставляем нули.</Text>
      ) : null}
      <Text style={styles.hint}>Остаток — ориентир, не запрет.</Text>
    </View>
  );
}

export default function EatNowScreen() {
  const router = useRouter();
  const { repo, dateLocal, meal, setMeal, refresh, revision, showFlash } = useData();
  void revision;
  const allowAdd = useAddGuard();
  const [filter, setFilter] = useState<EatNowFilterId>('all');
  const [portionTarget, setPortionTarget] = useState<{
    target: PortionTarget;
    initialGrams: number;
  } | null>(null);

  const mealSeeded = useRef(false);
  useEffect(() => {
    if (mealSeeded.current) return;
    mealSeeded.current = true;
    setMeal(mealSlotForNow());
  }, [setMeal]);

  const profile = repo.getProfile();
  const totals = repo.dailyTotals(dateLocal);
  const remaining = useMemo(
    () =>
      remainingMacros(
        {
          energyKcal: profile.dailyEnergyKcal,
          proteinG: profile.dailyProteinG,
          fatG: profile.dailyFatG,
          carbG: profile.dailyCarbG,
        },
        {
          energyKcal: totals.energyKcal,
          proteinG: totals.proteinG,
          fatG: totals.fatG,
          carbG: totals.carbG,
        },
      ),
    [profile, totals],
  );

  const candidates = useMemo(() => {
    const recipes = repo.listRecipes();
    const products = repo.listProducts();
    const pantry = repo.listPantryItems();
    const frequentIds = new Set(repo.listFrequentProducts(24).map((p) => p.id));
    const batches = repo.listCookedBatches({ onlyRemaining: true });
    const batchRecipeIds = new Set(batches.map((b) => b.recipeId));
    const { atHomeIds, usefulProducts, buyProducts } = selectEatNowProducts({
      recipes,
      products,
      pantry,
      frequentIds,
      batchRecipeIds,
    });

    const recipeInputs = eatNowInputsFromRecipes(recipes, (id) => repo.getRecipeIngredients(id), {
      defaultPrepMinutes: 25,
      atHome: false,
    }).map((c) => {
      const home = recipeAtHome(c.id, batchRecipeIds);
      return { ...c, atHome: home, toBuy: !home, prepMinutes: home ? 8 : 25 };
    });

    const usefulInputs = eatNowInputsFromProducts(usefulProducts, {
      atHome: (id) => atHomeIds.has(id),
    }).map((c) => ({ ...c, toBuy: !c.atHome }));

    const buyInputs = eatNowInputsFromProducts(buyProducts, { atHome: false }).map((c) => ({
      ...c,
      toBuy: true,
      prepMinutes: 5,
    }));

    const batchInputs = eatNowInputsFromCookedBatches(
      batches,
      (id) => repo.getRecipe(id),
      (id) => repo.getRecipeIngredients(id),
    ).map((c) => ({ ...c, toBuy: false }));

    const pool =
      filter === 'to_buy'
        ? [...buyInputs, ...recipeInputs.filter((r) => r.toBuy)]
        : filter === 'at_home'
          ? [...batchInputs, ...recipeInputs.filter((r) => r.atHome), ...usefulInputs.filter((p) => p.atHome)]
          : [...batchInputs, ...recipeInputs, ...usefulInputs];

    // Dedupe by kind+id (buy may overlap useful).
    const seen = new Set<string>();
    const deduped = pool.filter((c) => {
      const k = `${c.kind}:${c.id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return scoreEatNow(deduped, remaining, [filter]).slice(0, 20);
  }, [repo, remaining, filter, revision]);

  const openCandidate = (c: EatNowCandidate) => {
    if (c.kind === 'cooked_batch') {
      const batch = repo.listCookedBatches().find((b) => b.id === c.id);
      if (!batch) return;
      const recipe = repo.getRecipe(batch.recipeId);
      if (!recipe) return;
      setPortionTarget({
        target: {
          kind: 'recipe',
          recipe,
          ingredients: repo.getRecipeIngredients(recipe.id),
        },
        initialGrams: Math.min(c.suggestedGrams, Math.max(40, Math.round(batch.remainingG))),
      });
      return;
    }
    if (c.kind === 'recipe') {
      const recipe = repo.getRecipe(c.id);
      if (!recipe) return;
      setPortionTarget({
        target: {
          kind: 'recipe',
          recipe,
          ingredients: repo.getRecipeIngredients(recipe.id),
        },
        initialGrams: c.suggestedGrams,
      });
      return;
    }
    if (c.kind === 'product') {
      const product = repo.listProducts().find((p) => p.id === c.id);
      if (!product) return;
      setPortionTarget({
        target: { kind: 'product', product },
        initialGrams: c.suggestedGrams,
      });
    }
  };

  const noTargets =
    profile.dailyEnergyKcal === null &&
    profile.dailyProteinG === null &&
    profile.dailyFatG === null &&
    profile.dailyCarbG === null;

  return (
    <View style={styles.root}>
      <FormScrollView contentContainerStyle={styles.content}>
        <RemainingStrip {...remaining} />

        <Text style={styles.sectionLabel}>Приём пищи</Text>
        <MealChips value={meal} onChange={setMeal} />

        <Text style={styles.sectionLabel}>Фильтры</Text>
        <View style={styles.chips} accessibilityRole="tablist">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={f.label}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {noTargets ? (
          <EmptyState
            compact
            icon="flag-outline"
            title="Нет дневных целей"
            body="Задайте КБЖУ в профиле — тогда подбор сможет опираться на остаток. Пока можно листать варианты с известными макросами."
            actionLabel="В профиль"
            onAction={() => router.push('/(tabs)/profile')}
          />
        ) : null}

        {!hasAnyKnownRemaining(remaining) && !noTargets ? (
          <EmptyState
            compact
            icon="calculator-outline"
            title="Остаток пока не считается"
            body="Нужны и цели, и записи за день с известными КБЖУ. Варианты ниже всё равно можно открыть."
          />
        ) : null}

        {candidates.length === 0 ? (
          <EmptyState
            compact
            icon="nutrition-outline"
            title="Нет подходящих вариантов"
            body={
              filter === 'at_home'
                ? 'Заполни запасы или отметь приготовленную партию — тогда «Дома» заработает.'
                : 'Нужны рецепты / избранное / частые продукты с известными КБЖУ. Справочник целиком не сваливаем в ленту.'
            }
            actionLabel={filter === 'at_home' ? 'К запасам' : 'К рецептам'}
            onAction={() => router.push(filter === 'at_home' ? '/plan/pantry' : '/recipes')}
          />
        ) : (
          <View style={styles.cards} accessibilityRole="list">
            {candidates.map((c) => (
              <CandidateCard
                key={`${c.kind}:${c.id}`}
                candidate={c}
                onDiary={() => openCandidate(c)}
                onPlan={() => {
                  let recipeId: string | null = c.kind === 'recipe' ? c.id : null;
                  const productId = c.kind === 'product' ? c.id : null;
                  if (c.kind === 'cooked_batch') {
                    recipeId =
                      repo.listCookedBatches().find((b) => b.id === c.id)?.recipeId ?? null;
                  }
                  repo.addPlannedMeal({
                    dateLocal,
                    meal,
                    displayName: c.title,
                    grams: c.suggestedGrams,
                    recipeId,
                    productId,
                  });
                  refresh();
                  showFlash(`В меню: ${c.title}`);
                }}
              />
            ))}
          </View>
        )}
      </FormScrollView>

      {portionTarget ? (
        <ConfirmPortionSheet
          visible
          target={portionTarget.target}
          meal={meal}
          mealLabel={MEAL_LABELS[meal]}
          initialGrams={portionTarget.initialGrams}
          onClose={() => setPortionTarget(null)}
          onConfirm={(result) => {
            if (!allowAdd()) return;
            const t = portionTarget.target;
            if (t.kind === 'product') {
              repo.updateProductNutrition(t.product.id, result.per100g);
              repo.addEntryFromProduct({
                productId: t.product.id,
                dateLocal,
                meal,
                grams: result.grams,
              });
              showFlash(`В дневник: ${t.product.name}`);
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
              repo.addEntryFromRecipe({
                recipeId: t.recipe.id,
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
              showFlash(`В дневник: ${t.recipe.name}`);
            }
            setPortionTarget(null);
            refresh();
          }}
        />
      ) : null}
    </View>
  );
}

function CandidateCard({
  candidate: c,
  onDiary,
  onPlan,
}: {
  candidate: EatNowCandidate;
  onDiary: () => void;
  onPlan: () => void;
}) {
  const macros = [
    fmtMacro(c.proteinG, ' г Б'),
    fmtMacro(c.fatG, ' г Ж'),
    fmtMacro(c.carbG, ' г У'),
  ].filter(Boolean);

  return (
    <View style={styles.card} accessibilityRole="summary" accessibilityLabel={c.title}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{c.title}</Text>
        {c.prepMinutes !== null ? (
          <Text style={styles.time}>{c.prepMinutes} мин</Text>
        ) : null}
      </View>
      <Text style={styles.cardReason}>{c.explanation}</Text>
      <Text style={styles.portion}>
        {c.suggestedGrams} г
        {c.energyKcal !== null ? ` · ${Math.round(c.energyKcal)} ккал` : ''}
        {macros.length ? ` · ${macros.join(' · ')}` : ''}
      </Text>
      <View style={styles.ctaRow}>
        <Pressable
          onPress={onDiary}
          style={({ pressed }) => [styles.ctaPrimary, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`В дневник ${c.title}`}
        >
          <Text style={styles.ctaPrimaryText}>В дневник</Text>
        </Pressable>
        <Pressable
          onPress={onPlan}
          style={({ pressed }) => [styles.ctaSecondary, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`В план ${c.title}`}
        >
          <Text style={styles.ctaSecondaryText}>В план</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: space.lg,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  remaining: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.xs,
  },
  remainingLabel: { fontSize: type.caption, color: colors.textSecondary, fontWeight: '600' },
  remainingHero: { fontSize: type.hero, fontWeight: '800', color: colors.text },
  remainingMacros: { fontSize: type.body, color: colors.text, fontWeight: '600' },
  hint: { fontSize: type.caption, color: colors.textMuted, marginTop: 2 },
  sectionLabel: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: space.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: 36,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.primaryButtonText },
  cards: { gap: space.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: 4,
    minHeight: touchMin,
  },
  pressed: { opacity: 0.9 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  cardTitle: { flex: 1, fontSize: type.subtitle, fontWeight: '700', color: colors.text },
  time: { fontSize: type.caption, color: colors.textSecondary, fontWeight: '600' },
  cardReason: { fontSize: type.caption, color: colors.textSecondary },
  portion: { fontSize: type.body, color: colors.text, fontWeight: '600', marginTop: 4 },
  ctaRow: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  ctaPrimary: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    paddingHorizontal: space.md,
  },
  ctaPrimaryText: { fontSize: type.caption, fontWeight: '800', color: colors.primaryButtonText },
  ctaSecondary: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
    backgroundColor: colors.background,
  },
  ctaSecondaryText: { fontSize: type.caption, fontWeight: '800', color: colors.text },
});

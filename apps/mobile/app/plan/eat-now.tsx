import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';

import {
  eatNowInputsFromCookedBatches,
  eatNowInputsFromProducts,
  eatNowInputsFromRecipes,
} from '../../../../src/domain/buildEatNowInputs';
import { recipeHasBatch, selectEatNowProducts } from '../../../../src/domain/eatNowPool';
import { mealSlotForNow } from '../../../../src/domain/mealSlotForNow';
import { remainingMacros } from '../../../../src/domain/remainingMacros';
import {
  scoreEatNow,
  type EatNowCandidate,
  type EatNowFilterId,
} from '../../../../src/domain/scoreEatNow';
import type { MealSlot } from '../../../../src/storage/types';
import { portion } from '../../../../src/domain/nutrition';
import { EmptyState } from '@/src/components/EmptyState';
import { FormScrollView } from '@/src/components/FormScrollView';
import { MacroStrip } from '@/src/components/MacroStrip';
import { MealChips } from '@/src/components/MealChips';
import {
  ConfirmPortionSheet,
  type PortionTarget,
} from '@/src/features/diary/ConfirmPortionSheet';
import { useAddGuard } from '@/src/hooks/useAddGuard';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

const FILTERS: { id: EatNowFilterId; label: string }[] = [
  { id: 'all', label: 'Все' },
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

function kindIcon(kind: EatNowCandidate['kind']): keyof typeof Ionicons.glyphMap {
  if (kind === 'cooked_batch') return 'file-tray-outline';
  if (kind === 'recipe') return 'restaurant-outline';
  return 'nutrition-outline';
}

function kindLabel(kind: EatNowCandidate['kind']): string {
  if (kind === 'cooked_batch') return 'Партия';
  if (kind === 'recipe') return 'Рецепт';
  return 'Продукт';
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
    const frequentIds = new Set(repo.listFrequentProducts(24).map((p) => p.id));
    const batches = repo.listCookedBatches({ onlyRemaining: true });
    const batchRecipeIds = new Set(batches.map((b) => b.recipeId));
    const usefulProducts = selectEatNowProducts({ products, frequentIds });

    const recipeInputs = eatNowInputsFromRecipes(recipes, (id) => repo.getRecipeIngredients(id), {
      defaultPrepMinutes: 25,
    }).map((c) => (recipeHasBatch(c.id, batchRecipeIds) ? { ...c, prepMinutes: 8 } : c));

    const usefulInputs = eatNowInputsFromProducts(usefulProducts);

    const batchInputs = eatNowInputsFromCookedBatches(
      batches,
      (id) => repo.getRecipe(id),
      (id) => repo.getRecipeIngredients(id),
    );

    const pool = [...batchInputs, ...recipeInputs, ...usefulInputs];
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

  return (
    <View style={styles.root}>
      <FormScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lead}>
          Подбор из рецептов, готовых партий и ваших продуктов — без запасов и «добора» КБЖУ.
        </Text>

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

        {candidates.length === 0 ? (
          <EmptyState
            compact
            icon="nutrition-outline"
            title="Нет подходящих вариантов"
            body="Добавьте рецепты или свои продукты с известными КБЖУ — тогда лента заполнится."
            actionLabel="Мои продукты"
            onAction={() => router.push('/plan/my-products' as Href)}
            secondaryActionLabel="К рецептам"
            onSecondaryAction={() => router.push('/recipes')}
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
  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`${kindLabel(c.kind)} ${c.title}`}
    >
      <View style={styles.cardRow}>
        <View style={styles.thumb}>
          <Ionicons name={kindIcon(c.kind)} size={22} color={colors.textMuted} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {c.title}
            </Text>
            {c.prepMinutes !== null ? (
              <Text style={styles.time}>{c.prepMinutes} мин</Text>
            ) : null}
          </View>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {kindLabel(c.kind)}
            {c.explanation ? ` · ${c.explanation}` : ''}
          </Text>
          <MacroStrip
            energyKcal={c.energyKcal}
            proteinG={c.proteinG}
            fatG={c.fatG}
            carbG={c.carbG}
            suffix={` · ${c.suggestedGrams} г`}
          />
        </View>
      </View>
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
  lead: {
    fontSize: type.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
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
    padding: space.md,
    gap: space.sm,
    minHeight: touchMin,
  },
  cardRow: { flexDirection: 'row', gap: space.md },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  pressed: { opacity: 0.9 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  cardTitle: { flex: 1, fontSize: type.subtitle, fontWeight: '700', color: colors.text },
  time: { fontSize: type.caption, color: colors.textSecondary, fontWeight: '600' },
  cardMeta: { fontSize: type.caption, color: colors.textSecondary },
  ctaRow: { flexDirection: 'row', gap: space.sm },
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

import { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';

import {
  defaultProductPortionGrams,
  defaultRecipePortionGrams,
} from '../../../../src/domain/defaultPortionGrams';
import { portion } from '../../../../src/domain/nutrition';
import { repeatableFromEntries } from '../../../../src/domain/repeatMeal';
import type { FoodEntry, FoodProduct, MealSlot, Recipe } from '../../../../src/storage/types';
import { CopyYesterdayButton } from '@/src/components/CopyYesterdayButton';
import { DateSwitcher } from '@/src/components/DateSwitcher';
import { FlashBar } from '@/src/components/FlashBar';
import { FormScrollView } from '@/src/components/FormScrollView';
import { KcalRing } from '@/src/components/KcalRing';
import { PortionEditModal } from '@/src/components/PortionEditModal';
import { SaveMealModal } from '@/src/components/SaveMealModal';
import { ScreenFooter } from '@/src/components/ScreenFooter';
import { UndoBar } from '@/src/components/UndoBar';
import { DayCalendarSheet } from '@/src/features/calendar/DayCalendarSheet';
import { AddFoodSheet } from '@/src/features/diary/AddFoodSheet';
import { BarcodeLookupSheet } from '@/src/features/diary/BarcodeLookupSheet';
import {
  ConfirmPortionSheet,
  type PortionTarget,
} from '@/src/features/diary/ConfirmPortionSheet';
import { FoodCatalogList, type CatalogFilter } from '@/src/features/diary/FoodCatalogList';
import {
  FoodSegmentTabs,
  type FoodSegment,
} from '@/src/features/diary/FoodSegmentTabs';
import { MealSection } from '@/src/features/diary/MealSection';
import { TodayPlanStrip } from '@/src/features/plan/TodayPlanStrip';
import { useAddGuard } from '@/src/hooks/useAddGuard';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, surfaceCard, touchMin, type } from '@/src/theme/tokens';

const MEALS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

export default function FoodScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { repo, dateLocal, setDateLocal, meal, setMeal, refresh, revision, setUndo, showFlash } =
    useData();
  void revision;
  const allowAdd = useAddGuard();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [portionTarget, setPortionTarget] = useState<{
    target: PortionTarget;
    initialGrams: number;
  } | null>(null);
  const [segment, setSegment] = useState<FoodSegment>('diary');
  const [query, setQuery] = useState('');
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>('all');
  const [saveMealSlot, setSaveMealSlot] = useState<MealSlot | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);

  const profile = repo.getProfile();
  const entries = repo.listEntriesForDate(dateLocal);
  const totals = repo.dailyTotals(dateLocal);
  const products = repo.listProducts();
  const recipes = repo.listRecipes();
  const recent = repo.listRecentEntries(16);
  const frequent = repo.listFrequentProducts(24);
  const recipeIngredientCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of recipes) {
      map[r.id] = repo.getRecipeIngredients(r.id).length;
    }
    return map;
  }, [recipes, repo, revision]);
  const dailyTargets = {
    energyKcal: profile.dailyEnergyKcal,
    proteinG: profile.dailyProteinG,
    fatG: profile.dailyFatG,
    carbG: profile.dailyCarbG,
  };

  const mealEntries = useMemo(() => {
    const map: Record<MealSlot, FoodEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const e of entries) map[e.meal].push(e);
    return map;
  }, [entries]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.push('/plan')}
            accessibilityRole="button"
            accessibilityLabel="План питания"
            style={styles.headerBtn}
            hitSlop={8}
          >
            <Ionicons name="compass-outline" size={22} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/recipes')}
            accessibilityRole="button"
            accessibilityLabel="Рецепты"
            style={styles.headerBtn}
            hitSlop={8}
          >
            <Ionicons name="book-outline" size={22} color={colors.text} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, router]);

  const selectSegment = (next: FoodSegment) => {
    setSegment(next);
    if (next === 'diary') setQuery('');
  };

  const onDelete = (entry: FoodEntry) => {
    repo.softDeleteEntry(entry.id);
    setUndo({ entryId: entry.id, message: `Удалено: ${entry.displayName}` });
    refresh();
  };

  const openForMeal = (slot: MealSlot) => {
    setMeal(slot);
    setOpen(true);
  };

  /** UX-01: recent/repeat opens ConfirmPortion — same pipeline as catalog (+). */
  const repeatEntry = (e: FoodEntry) => {
    if (e.productId) {
      const product = products.find((p) => p.id === e.productId);
      if (!product) return;
      setPortionTarget({ target: { kind: 'product', product }, initialGrams: e.grams });
      return;
    }
    if (e.recipeId) {
      const recipe = recipes.find((r) => r.id === e.recipeId);
      if (!recipe) return;
      setPortionTarget({
        target: {
          kind: 'recipe',
          recipe,
          ingredients: repo.getRecipeIngredients(recipe.id),
        },
        initialGrams: e.grams,
      });
    }
  };

  const repeatMealSlot = (slot: MealSlot) => {
    if (!allowAdd()) return;
    const items = repeatableFromEntries(mealEntries[slot]);
    if (items.length === 0) return;
    for (const item of items) {
      if (item.kind === 'product') {
        repo.addEntryFromProduct({
          productId: item.productId,
          dateLocal,
          meal,
          grams: item.grams,
        });
      } else {
        repo.addEntryFromRecipe({
          recipeId: item.recipeId,
          dateLocal,
          meal,
          grams: item.grams,
        });
      }
    }
    refresh();
  };

  const openProductPortion = (p: FoodProduct) => {
    setPortionTarget({
      target: { kind: 'product', product: p },
      initialGrams: defaultProductPortionGrams(repo.lastGramsForProduct(p.id)),
    });
  };

  const openRecipePortion = (r: Recipe) => {
    const ingredients = repo.getRecipeIngredients(r.id);
    setPortionTarget({
      target: { kind: 'recipe', recipe: r, ingredients },
      initialGrams: defaultRecipePortionGrams(repo.lastGramsForRecipe(r.id), r.cookedYieldG),
    });
  };

  return (
    <View style={styles.root}>
      <FormScrollView contentContainerStyle={styles.content}>
        <DateSwitcher
          selected={dateLocal}
          timeZone={profile.timezone}
          onSelect={setDateLocal}
          onOpenCalendar={() => setCalendarOpen(true)}
        />

        <FoodSegmentTabs value={segment} onChange={selectSegment} />

        {segment === 'diary' ? (
          <>
            <KcalRing
              variant="compact"
              totals={totals}
              targets={dailyTargets}
              activityKcal={repo.activityEnergyKcalForDate(dateLocal)}
              activityMinutes={repo.activityMinutesForDate(dateLocal)}
              onSetTarget={() => router.push('/profile')}
            />

            <TodayPlanStrip />

            <CopyYesterdayButton />

            {MEALS.map((slot) => (
              <MealSection
                key={slot}
                meal={slot}
                entries={mealEntries[slot]}
                onDelete={onDelete}
                onEditGrams={setEditing}
                onAdd={() => openForMeal(slot)}
                onRepeatMeal={() => repeatMealSlot(slot)}
                onSaveMeal={() => setSaveMealSlot(slot)}
              />
            ))}

            <Pressable
              onPress={() => router.push('/plan/eat-now')}
              style={({ pressed }) => [styles.secondaryLink, pressed && styles.pressed]}
              accessibilityRole="link"
              accessibilityLabel="Что съесть сейчас"
            >
              <Text style={styles.secondaryLinkText}>Что съесть сейчас →</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Яйцо, овсянка, рецепт…"
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
                accessibilityLabel="Поиск продукта или рецепта"
                returnKeyType="search"
              />
              {query.length > 0 ? (
                <Pressable
                  onPress={() => setQuery('')}
                  accessibilityRole="button"
                  accessibilityLabel="Очистить поиск"
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>

            <FoodCatalogList
              filter={catalogFilter}
              onFilterChange={setCatalogFilter}
              products={products}
              recipes={recipes}
              recent={recent}
              frequent={frequent}
              query={query}
              recipeIngredientCounts={recipeIngredientCounts}
              getRecipeIngredients={(id) => repo.getRecipeIngredients(id)}
              onAddProduct={openProductPortion}
              onAddRecipe={openRecipePortion}
              onOpenRecipe={(r) => router.push(`/recipes/${r.id}`)}
              onBrowseRecipes={() => router.push('/recipes')}
              onToggleFavorite={(p) => {
                repo.setFavorite(p.id, !p.isFavorite);
                refresh();
              }}
              onRepeatEntry={repeatEntry}
            />
          </>
        )}
      </FormScrollView>

      <ScreenFooter>
        <Pressable
          style={({ pressed }) => [styles.footerIcon, pressed && styles.pressed]}
          onPress={() => setBarcodeOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Сканировать штрихкод"
        >
          <Ionicons name="barcode-outline" size={22} color={colors.text} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.footerScan, pressed && styles.pressed]}
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Добавить еду"
        >
          <Ionicons name="add" size={22} color={colors.primaryButtonText} />
          <Text style={styles.footerScanText}>Добавить еду</Text>
        </Pressable>
      </ScreenFooter>

      <AddFoodSheet visible={open} onClose={() => setOpen(false)} />
      <BarcodeLookupSheet visible={barcodeOpen} onClose={() => setBarcodeOpen(false)} />
      <DayCalendarSheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} />
      <SaveMealModal
        visible={saveMealSlot != null}
        defaultName={saveMealSlot ? MEAL_LABELS[saveMealSlot] : ''}
        onClose={() => setSaveMealSlot(null)}
        onSave={(name) => {
          if (!saveMealSlot) return;
          try {
            repo.createSavedMealFromEntries(name, mealEntries[saveMealSlot], saveMealSlot);
            refresh();
            showFlash(`Сохранён приём «${name}»`);
          } catch (e) {
            showFlash(e instanceof Error ? e.message : 'Не сохранено');
          }
        }}
      />
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
          if (portionTarget.target.kind === 'product') {
            repo.updateProductNutrition(portionTarget.target.product.id, result.per100g);
            repo.addEntryFromProduct({
              productId: portionTarget.target.product.id,
              dateLocal,
              meal,
              grams: result.grams,
            });
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
          }
          refresh();
          setPortionTarget(null);
        }}
      />
      <PortionEditModal
        visible={editing != null}
        title={editing?.displayName ?? ''}
        initialGrams={editing?.grams ?? 0}
        onClose={() => setEditing(null)}
        onSave={(grams) => {
          if (!editing) return;
          repo.updateEntryGrams(editing.id, grams);
          refresh();
          setEditing(null);
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
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLink: {
    paddingVertical: space.sm,
    minHeight: touchMin,
    justifyContent: 'center',
    marginTop: space.sm,
    marginBottom: space.md,
  },
  secondaryLinkText: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  footerIcon: {
    width: touchMin,
    height: touchMin,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    ...surfaceCard,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    minHeight: touchMin,
    marginBottom: space.md,
  },
  searchInput: {
    flex: 1,
    fontSize: type.body,
    color: colors.text,
    paddingVertical: space.sm,
  },
  footerScan: {
    flex: 1,
    minHeight: touchMin,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  footerScanText: {
    fontSize: type.body,
    fontWeight: '800',
    color: colors.primaryButtonText,
  },
  pressed: { opacity: 0.88 },
});

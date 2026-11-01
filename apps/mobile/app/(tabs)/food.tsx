import { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';

import { portion } from '../../../../src/domain/nutrition';
import { repeatableFromEntries } from '../../../../src/domain/repeatMeal';
import type { FoodEntry, FoodProduct, MealSlot, Recipe } from '../../../../src/storage/types';
import { localDateKey } from '../../../../src/storage/validation';
import { CopyYesterdayButton } from '@/src/components/CopyYesterdayButton';
import { DayStrip } from '@/src/components/DayStrip';
import { DaySwipeArea } from '@/src/components/DaySwipeArea';
import { EmptyState } from '@/src/components/EmptyState';
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
import { useAddGuard } from '@/src/hooks/useAddGuard';
import { useData } from '@/src/state/DataContext';
import {
  AppButton,
  colors,
  radius,
  space,
  touchMin,
  type,
} from '@/src/design-system';

const MEALS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

/**
 * Food diary + catalog (Stage 4.2 / E1–E9).
 * Shared DayStrip; SegmentedControl; catalog FlatList virtualizes above threshold.
 */
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
  const today = localDateKey(new Date(), profile.timezone);
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

  const diaryEmpty = entries.length === 0;

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
            <Ionicons name="compass-outline" size={22} color={colors.ink} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/recipes')}
            accessibilityRole="button"
            accessibilityLabel="Рецепты"
            style={styles.headerBtn}
            hitSlop={8}
          >
            <Ionicons name="book-outline" size={22} color={colors.ink} />
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

  const repeatEntry = (e: FoodEntry) => {
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
  };

  const repeatMealSlot = (slot: MealSlot) => {
    if (!allowAdd()) return;
    const items = repeatableFromEntries(mealEntries[slot]);
    if (items.length === 0) return;
    const createdIds: string[] = [];
    for (const item of items) {
      if (item.kind === 'product') {
        const e = repo.addEntryFromProduct({
          productId: item.productId,
          dateLocal,
          meal,
          grams: item.grams,
        });
        createdIds.push(e.id);
      } else {
        const e = repo.addEntryFromRecipe({
          recipeId: item.recipeId,
          dateLocal,
          meal,
          grams: item.grams,
        });
        createdIds.push(e.id);
      }
    }
    refresh();
    showFlash(`Повторён ${MEAL_LABELS[slot].toLowerCase()} · ${createdIds.length}`);
    setUndo({
      entryIds: createdIds,
      message: `Повторён ${MEAL_LABELS[slot].toLowerCase()} · ${createdIds.length}`,
    });
  };

  const openProductPortion = (p: FoodProduct) => {
    setPortionTarget({ target: { kind: 'product', product: p }, initialGrams: 100 });
  };

  const openRecipePortion = (r: Recipe) => {
    const ingredients = repo.getRecipeIngredients(r.id);
    setPortionTarget({
      target: { kind: 'recipe', recipe: r, ingredients },
      initialGrams: Math.min(200, r.cookedYieldG),
    });
  };

  const chrome = (
    <>
      <DayStrip
        selected={dateLocal}
        today={today}
        onSelect={setDateLocal}
        onOpenCalendar={() => setCalendarOpen(true)}
      />
      <FoodSegmentTabs value={segment} onChange={selectSegment} />
    </>
  );

  return (
    <View style={styles.root} testID="food-screen">
      <DaySwipeArea dateLocal={dateLocal} onDateChange={setDateLocal}>
        {segment === 'diary' ? (
          <FormScrollView contentContainerStyle={styles.content}>
            {chrome}

            <KcalRing
              variant="compact"
              totals={totals}
              targets={dailyTargets}
              activityKcal={repo.activityEnergyKcalForDate(dateLocal)}
              activityMinutes={repo.activityMinutesForDate(dateLocal)}
              onSetTarget={() => router.push('/profile')}
            />

            <CopyYesterdayButton />

            {diaryEmpty ? (
              <EmptyState
                compact
                icon="restaurant-outline"
                title="Дневник пуст"
                body="Повтори вчерашний приём или добавь первую запись."
                actionLabel="Добавить еду"
                onAction={() => setOpen(true)}
                secondaryActionLabel="Открыть каталог"
                onSecondaryAction={() => selectSegment('catalog')}
              />
            ) : (
              MEALS.map((slot) => (
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
              ))
            )}
          </FormScrollView>
        ) : (
          <View style={styles.catalogRoot}>
            <View style={styles.catalogChrome}>
              {chrome}
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
          </View>
        )}
      </DaySwipeArea>

      <ScreenFooter>
        <Pressable
          style={({ pressed }) => [styles.footerIcon, pressed && styles.pressed]}
          onPress={() => setBarcodeOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Сканировать штрихкод"
        >
          <Ionicons name="barcode-outline" size={22} color={colors.ink} />
        </Pressable>
        <AppButton
          label="Добавить еду"
          onPress={() => setOpen(true)}
          style={styles.footerScan}
          testID="food-add-cta"
        />
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
          let createdId: string;
          let label: string;
          if (portionTarget.target.kind === 'product') {
            repo.updateProductNutrition(portionTarget.target.product.id, result.per100g);
            const e = repo.addEntryFromProduct({
              productId: portionTarget.target.product.id,
              dateLocal,
              meal,
              grams: result.grams,
            });
            createdId = e.id;
            label = portionTarget.target.product.name;
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
            const e = repo.addEntryFromRecipe({
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
            createdId = e.id;
            label = portionTarget.target.recipe.name;
          }
          refresh();
          setPortionTarget(null);
          showFlash(`Добавлено: ${label}`);
          setUndo({ entryIds: [createdId], message: `Добавлено: ${label}` });
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
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.lg, paddingBottom: 140, gap: space.sm },
  catalogRoot: { flex: 1, paddingHorizontal: space.lg, paddingTop: space.lg },
  catalogChrome: { gap: space.sm, marginBottom: space.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerIcon: {
    width: touchMin,
    height: touchMin,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: space.md,
    minHeight: touchMin,
  },
  searchInput: {
    flex: 1,
    fontSize: type.body,
    color: colors.ink,
    paddingVertical: space.sm,
  },
  footerScan: {
    flex: 1,
  },
  pressed: { opacity: 0.88 },
});

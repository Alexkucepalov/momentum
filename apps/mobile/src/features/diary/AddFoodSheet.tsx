import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { portion } from '../../../../../src/domain/nutrition';
import type { FoodEntry, FoodProduct, MealSlot, Recipe } from '../../../../../src/storage/types';
import { FormScrollView } from '../../components/FormScrollView';
import { SwipeToDismissSheet } from '../../components/SwipeToDismissSheet';
import { useAddGuard } from '../../hooks/useAddGuard';
import { useData, useDiaryRevision } from '../../state/DataContext';
import { AppText, ErrorBanner, colors, radius, space, touchMin, type } from '@/src/design-system';
import { BarcodeLookupSheet } from './BarcodeLookupSheet';
import { ConfirmPortionSheet, type PortionTarget } from './ConfirmPortionSheet';
import { AddFoodEmptyHint } from './addFood/AddFoodEmptyHint';
import { AddFoodSheetChrome } from './addFood/AddFoodSheetChrome';
import { AddFoodTabs } from './addFood/AddFoodTabs';
import { FoodPickRow } from './addFood/FoodPickRow';
import { ManualProductForm } from './addFood/ManualProductForm';
import { QuickAddForm } from './addFood/QuickAddForm';
import { RecipesPanel } from './addFood/RecipesPanel';
import { SavedMealsPanel } from './addFood/SavedMealsPanel';
import type { AddFoodTab } from './addFood/types';
import { unifiedFoodSearch } from './addFood/unifiedFoodSearch';

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

const CATALOG_TABS: AddFoodTab[] = ['recent', 'favorites', 'recipes'];

export function AddFoodSheet({
  visible,
  onClose,
  initialTab = 'recent',
}: {
  visible: boolean;
  onClose: () => void;
  /** Open on a specific catalog tab (e.g. saved meals). */
  initialTab?: AddFoodTab;
}) {
  const router = useRouter();
  const { repo, dateLocal, meal, setMeal, refresh, showFlash, setUndo } = useData();
  const revision = useDiaryRevision();
  void revision;
  const allowAdd = useAddGuard();
  const [tab, setTab] = useState<AddFoodTab>(initialTab);
  const [mealPickerOpen, setMealPickerOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [grams, setGrams] = useState('100');
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    target: PortionTarget;
    initialGrams: number;
  } | null>(null);
  const [pendingManual, setPendingManual] = useState<{
    name: string;
    energyKcal: number | null;
    proteinG: number | null;
    fatG: number | null;
    carbG: number | null;
    grams: number;
  } | null>(null);

  const recent = repo.listRecentEntries(16);
  const favorites = repo.listFavorites();
  const recipes = repo.listRecipes();
  const products = repo.listProducts();
  const savedMeals = repo.listSavedMeals();

  // Fresh sheet each open — avoid stale search/mode from last session.
  useEffect(() => {
    if (visible) {
      setTab(initialTab);
      return;
    }
    setQuery('');
    setTab('recent');
    setMealPickerOpen(false);
    setError(null);
    setName('');
    setKcal('');
    setProtein('');
    setFat('');
    setCarbs('');
    setGrams('100');
  }, [visible, initialTab]);

  const searching = query.trim().length > 0;
  const searchHits = useMemo(
    () =>
      searching
        ? unifiedFoodSearch({ query, products, recipes, recent })
        : [],
    [searching, query, products, recipes, recent],
  );

  const parseOptional = (raw: string): number | null => {
    const t = raw.trim();
    if (t === '') return null;
    const n = Number(t.replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) throw new Error('Число должно быть ≥ 0');
    return n;
  };

  const finishQuick = (label: string, entryIds: string[]) => {
    refresh('diary');
    showFlash(label);
    if (entryIds.length > 0) setUndo({ entryIds, message: label });
    onClose();
  };

  const quickAddEntry = (e: FoodEntry) => {
    if (!allowAdd()) return;
    if (e.productId) {
      const created = repo.addEntryFromProduct({
        productId: e.productId,
        dateLocal,
        meal,
        grams: e.grams,
      });
      finishQuick(`Добавлено: ${e.displayName}`, [created.id]);
      return;
    }
    if (e.recipeId) {
      const created = repo.addEntryFromRecipe({
        recipeId: e.recipeId,
        dateLocal,
        meal,
        grams: e.grams,
      });
      finishQuick(`Добавлено: ${e.displayName}`, [created.id]);
    }
  };

  const quickAddProduct = (p: FoodProduct, g = 100) => {
    if (!allowAdd()) return;
    const created = repo.addEntryFromProduct({
      productId: p.id,
      dateLocal,
      meal,
      grams: g,
    });
    finishQuick(`Добавлено: ${p.name}`, [created.id]);
  };

  const quickAddRecipe = (r: Recipe) => {
    if (!allowAdd()) return;
    const g = Math.min(200, r.cookedYieldG);
    const created = repo.addEntryFromRecipe({
      recipeId: r.id,
      dateLocal,
      meal,
      grams: g,
    });
    finishQuick(`Добавлено: ${r.name}`, [created.id]);
  };

  const openProductConfirm = (product: FoodProduct, initialGrams = 100) => {
    setConfirm({ target: { kind: 'product', product }, initialGrams });
  };

  const openRecipeConfirm = (recipe: Recipe, initialGrams?: number) => {
    const ings = repo.getRecipeIngredients(recipe.id);
    setConfirm({
      target: { kind: 'recipe', recipe, ingredients: ings },
      initialGrams: initialGrams ?? Math.min(200, recipe.cookedYieldG),
    });
  };

  const openRecentConfirm = (e: FoodEntry) => {
    if (e.productId) {
      const product = repo.listProducts().find((p) => p.id === e.productId);
      if (product) openProductConfirm(product, e.grams);
      return;
    }
    if (e.recipeId) {
      const recipe = recipes.find((r) => r.id === e.recipeId);
      if (recipe) openRecipeConfirm(recipe, e.grams);
    }
  };

  const saveManual = () => {
    try {
      setError(null);
      const g = Number(grams.replace(',', '.'));
      if (!Number.isFinite(g) || g < 0) throw new Error('Граммы должны быть ≥ 0');
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Укажи название');
      const draft = {
        name: trimmed,
        energyKcal: parseOptional(kcal),
        proteinG: parseOptional(protein),
        fatG: parseOptional(fat),
        carbG: parseOptional(carbs),
        grams: g,
      };
      const previewProduct: FoodProduct = {
        id: 'draft',
        name: draft.name,
        brand: null,
        barcode: null,
        energyKcal: draft.energyKcal,
        proteinG: draft.proteinG,
        fatG: draft.fatG,
        carbG: draft.carbG,
        source: 'user',
        isFavorite: false,
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
      };
      setPendingManual(draft);
      setConfirm({ target: { kind: 'product', product: previewProduct }, initialGrams: g });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    }
  };

  const selectCatalogTab = (next: AddFoodTab) => {
    setTab(next);
    // Keep query when switching catalog tabs; clear when leaving forms later.
  };

  return (
    <>
      <SwipeToDismissSheet visible={visible && !confirm} onClose={onClose} maxHeightRatio={0.94}>
        <View style={styles.sheet}>
          <AddFoodSheetChrome
            meal={meal}
            onChangeMeal={(m) => {
              setMeal(m);
              setMealPickerOpen(false);
            }}
            mealPickerOpen={mealPickerOpen}
            onToggleMealPicker={() => setMealPickerOpen((v) => !v)}
            onClose={onClose}
            query={query}
            onChangeQuery={(t) => {
              setQuery(t);
              if (t.trim() && !CATALOG_TABS.includes(tab)) setTab('recent');
            }}
            searching={searching}
            tab={tab}
            onSelectTab={(next) => {
              setQuery('');
              setTab(next);
            }}
            onOpenScan={() => setScanOpen(true)}
          />

          {!searching && CATALOG_TABS.includes(tab) ? (
            <AddFoodTabs value={tab} onChange={selectCatalogTab} />
          ) : null}

          {error ? (
            <View style={styles.errorWrap}>
              <ErrorBanner
                message={error}
                actionLabel="Скрыть"
                onAction={() => setError(null)}
              />
            </View>
          ) : null}

          <FormScrollView variant="sheet" style={styles.scroll} contentContainerStyle={styles.body}>
            {searching ? (
              searchHits.length === 0 ? (
                <AddFoodEmptyHint
                  title="Ничего не найдено"
                  body="Попробуй другое название или добавь продукт вручную / быстро."
                />
              ) : (
                <>
                  <Text style={styles.tip}>Справочник, свои продукты, рецепты и недавние</Text>
                  {searchHits.map((hit) => {
                    if (hit.kind === 'recent') {
                      const e = hit.entry;
                      return (
                        <FoodPickRow
                          key={`r-${e.id}`}
                          title={e.displayName}
                          meta={`Последняя порция · ${e.grams} г · ${e.energyKcal === null ? '— ккал' : `${Math.round(e.energyKcal)} ккал`}`}
                          icon={e.recipeId ? 'restaurant-outline' : 'time-outline'}
                          onPress={() => openRecentConfirm(e)}
                          onQuickAdd={
                            e.productId || e.recipeId ? () => quickAddEntry(e) : undefined
                          }
                          accessibilityLabel={`Выбрать порцию ${e.displayName}`}
                        />
                      );
                    }
                    if (hit.kind === 'product') {
                      const p = hit.product;
                      const last = repo.lastGramsForProduct(p.id);
                      return (
                        <FoodPickRow
                          key={`p-${p.id}`}
                          title={p.name}
                          meta={
                            last != null
                              ? `Последняя порция · ${last} г`
                              : `${p.energyKcal === null ? '—' : p.energyKcal} ккал/100г`
                          }
                          icon="nutrition-outline"
                          onPress={() => openProductConfirm(p, last ?? 100)}
                          onQuickAdd={() => quickAddProduct(p, last ?? 100)}
                          accessibilityLabel={`Выбрать порцию ${p.name}`}
                        />
                      );
                    }
                    const r = hit.recipe;
                    return (
                      <FoodPickRow
                        key={`rc-${r.id}`}
                        title={r.name}
                        meta={`Рецепт · выход ${r.cookedYieldG} г`}
                        icon="restaurant-outline"
                        onPress={() => openRecipeConfirm(r)}
                        onQuickAdd={() => quickAddRecipe(r)}
                        accessibilityLabel={`Выбрать порцию ${r.name}`}
                      />
                    );
                  })}
                </>
              )
            ) : null}

            {!searching && tab === 'recent' ? (
              recent.length === 0 ? (
                <AddFoodEmptyHint
                  title="Пока нет недавних"
                  body="Ищи по названию (есть справочник обычных продуктов), сканер или быстрый ввод — повтор потом в один тап «+»."
                />
              ) : (
                <>
                  <Text style={styles.tip}>
                    «+» — сразу с прошлой порцией. Строка — изменить граммы.
                  </Text>
                  {recent.map((e) => (
                    <FoodPickRow
                      key={e.id}
                      title={e.displayName}
                      meta={`Последняя порция · ${e.grams} г · ${e.energyKcal === null ? '— ккал' : `${Math.round(e.energyKcal)} ккал`}`}
                      icon={e.recipeId ? 'restaurant-outline' : 'nutrition-outline'}
                      onPress={() => openRecentConfirm(e)}
                      onQuickAdd={
                        e.productId || e.recipeId ? () => quickAddEntry(e) : undefined
                      }
                      accessibilityLabel={`Выбрать порцию ${e.displayName}`}
                    />
                  ))}
                </>
              )
            ) : null}

            {!searching && tab === 'favorites' ? (
              favorites.length === 0 ? (
                <AddFoodEmptyHint
                  title="Нет избранного"
                  body="На вкладке Питание нажми ★ у продукта — он появится здесь."
                />
              ) : (
                <>
                  <Text style={styles.tip}>«+» добавляет последнюю или 100 г. Строка — порция.</Text>
                  {favorites.map((p) => {
                    const last = repo.lastGramsForProduct(p.id);
                    return (
                      <FoodPickRow
                        key={p.id}
                        title={p.name}
                        meta={
                          last != null
                            ? `Последняя порция · ${last} г`
                            : `${p.energyKcal === null ? '—' : p.energyKcal} ккал/100г`
                        }
                        icon="star-outline"
                        onPress={() => openProductConfirm(p, last ?? 100)}
                        onQuickAdd={() => quickAddProduct(p, last ?? 100)}
                        accessibilityLabel={`Выбрать порцию ${p.name}`}
                      />
                    );
                  })}
                </>
              )
            ) : null}

            {!searching && tab === 'meals' ? (
              <SavedMealsPanel
                meals={savedMeals}
                onLog={(m) => {
                  if (!allowAdd()) return;
                  try {
                    const created = repo.logSavedMeal({
                      savedMealId: m.id,
                      dateLocal,
                      meal,
                    });
                    const label = `Приём «${m.name}»: +${created.length}`;
                    refresh('diary');
                    showFlash(label);
                    setUndo({
                      entryIds: created.map((e) => e.id),
                      message: label,
                    });
                    onClose();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Не удалось добавить');
                  }
                }}
                onDelete={(m) => {
                  repo.softDeleteSavedMeal(m.id);
                  refresh('diary');
                  showFlash(`Удалён шаблон «${m.name}»`);
                }}
              />
            ) : null}

            {!searching && tab === 'quick' ? (
              <QuickAddForm
                onSubmit={(values) => {
                  if (!allowAdd()) return;
                  const created = repo.addQuickEntry({
                    dateLocal,
                    meal,
                    displayName: values.displayName,
                    energyKcal: values.energyKcal,
                    proteinG: values.proteinG,
                    fatG: values.fatG,
                    carbG: values.carbG,
                  });
                  const label = `Быстрый ввод: ${values.displayName}`;
                  refresh('diary');
                  showFlash(label);
                  setUndo({ entryIds: [created.id], message: label });
                  onClose();
                }}
              />
            ) : null}

            {!searching && tab === 'manual' ? (
              <ManualProductForm
                name={name}
                grams={grams}
                kcal={kcal}
                protein={protein}
                fat={fat}
                carbs={carbs}
                onChangeName={setName}
                onChangeGrams={setGrams}
                onChangeKcal={setKcal}
                onChangeProtein={setProtein}
                onChangeFat={setFat}
                onChangeCarbs={setCarbs}
                onSubmit={saveManual}
              />
            ) : null}

            {!searching && tab === 'recipes' ? (
              <>
                <View style={styles.recipesShortcuts}>
                  <Pressable
                    style={styles.recipesLink}
                    onPress={() => {
                      onClose();
                      router.push('/recipes');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Открыть раздел рецептов"
                  >
                    <Ionicons name="book-outline" size={18} color={colors.text} />
                    <Text style={styles.recipesLinkText}>Все рецепты</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </Pressable>
                  <Pressable
                    style={styles.recipesLink}
                    onPress={() => {
                      onClose();
                      router.push('/recipes/import-text');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Создать рецепт из текста"
                  >
                    <Ionicons name="document-text-outline" size={18} color={colors.text} />
                    <Text style={styles.recipesLinkText}>Из текста</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </Pressable>
                  <Pressable
                    style={styles.recipesLink}
                    onPress={() => {
                      onClose();
                      router.push('/recipes/import-personal');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Мой архив рецептов"
                  >
                    <Ionicons name="library-outline" size={18} color={colors.text} />
                    <Text style={styles.recipesLinkText}>Мой архив</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </Pressable>
                </View>
                <RecipesPanel
                  recipes={recipes}
                  getIngredientCount={(id) => repo.getRecipeIngredients(id).length}
                  onPickRecipe={(r) => openRecipeConfirm(r)}
                  onQuickAddRecipe={quickAddRecipe}
                  onCreateRecipe={(input) => {
                    const recipe = repo.createRecipe(input);
                    refresh('diary');
                    openRecipeConfirm(recipe);
                  }}
                />
              </>
            ) : null}
          </FormScrollView>
        </View>
      </SwipeToDismissSheet>

      <BarcodeLookupSheet visible={scanOpen} onClose={() => setScanOpen(false)} />

      <ConfirmPortionSheet
        visible={confirm != null}
        target={confirm?.target ?? null}
        meal={meal}
        mealLabel={MEAL_LABELS[meal]}
        initialGrams={confirm?.initialGrams}
        onClose={() => {
          setConfirm(null);
          setPendingManual(null);
        }}
        onConfirm={(result) => {
          if (!confirm) return;
          if (!allowAdd()) return;
          let createdId: string | null = null;
          let label = 'Добавлено';
          if (confirm.target.kind === 'product') {
            if (pendingManual && confirm.target.product.id === 'draft') {
              const product = repo.createProduct({
                name: pendingManual.name,
                energyKcal: result.per100g.energyKcal,
                proteinG: result.per100g.proteinG,
                fatG: result.per100g.fatG,
                carbG: result.per100g.carbG,
                source: 'user',
              });
              const e = repo.addEntryFromProduct({
                productId: product.id,
                dateLocal,
                meal,
                grams: result.grams,
              });
              createdId = e.id;
              label = `Добавлено: ${product.name}`;
              setName('');
              setKcal('');
              setProtein('');
              setFat('');
              setCarbs('');
              setPendingManual(null);
            } else {
              repo.updateProductNutrition(confirm.target.product.id, result.per100g);
              const e = repo.addEntryFromProduct({
                productId: confirm.target.product.id,
                dateLocal,
                meal,
                grams: result.grams,
              });
              createdId = e.id;
              label = `Добавлено: ${confirm.target.product.name}`;
            }
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
              recipeId: confirm.target.recipe.id,
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
            label = `Добавлено: ${confirm.target.recipe.name}`;
          }
          showFlash(label);
          if (createdId) setUndo({ entryIds: [createdId], message: label });
          refresh('diary');
          setConfirm(null);
          onClose();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sheet: {
    minHeight: 420,
  },
  scroll: {
    maxHeight: 560,
  },
  body: {
    paddingHorizontal: space.lg,
    paddingBottom: 48,
  },
  errorWrap: {
    paddingHorizontal: space.lg,
  },
  tip: {
    fontSize: type.caption,
    color: colors.textMuted,
    marginBottom: space.md,
    lineHeight: 18,
  },
  recipesShortcuts: { gap: space.sm, marginBottom: space.md },
  recipesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    minHeight: touchMin,
    marginBottom: space.md,
  },
  recipesLinkText: { flex: 1, fontWeight: '700', color: colors.ink, fontSize: type.body },
});

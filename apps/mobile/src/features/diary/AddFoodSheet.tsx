import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { portion } from '../../../../../src/domain/nutrition';
import type { FoodEntry, FoodProduct, MealSlot, Recipe } from '../../../../../src/storage/types';
import { FormScrollView } from '../../components/FormScrollView';
import { SwipeToDismissSheet } from '../../components/SwipeToDismissSheet';
import { useAddGuard } from '../../hooks/useAddGuard';
import { useData } from '../../state/DataContext';
import { colors, radius, space, touchMin, type } from '../../theme/tokens';
import { BarcodeLookupSheet } from './BarcodeLookupSheet';
import {
  defaultProductPortionGrams,
  defaultRecipePortionGrams,
} from '../../../../../src/domain/defaultPortionGrams';
import { ConfirmPortionSheet, type PortionTarget } from './ConfirmPortionSheet';
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

const MEALS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const CATALOG_TABS: AddFoodTab[] = ['recent', 'favorites', 'mine', 'recipes'];
const MODE_TABS: AddFoodTab[] = ['manual', 'quick', 'meals'];
const MODE_TITLES: Record<'manual' | 'quick' | 'meals', string> = {
  manual: 'Вручную',
  quick: 'Быстрый ввод',
  meals: 'Приёмы',
};

export function AddFoodSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { repo, dateLocal, meal, setMeal, refresh, revision, showFlash } = useData();
  void revision;
  const allowAdd = useAddGuard();
  const [tab, setTab] = useState<AddFoodTab>('recent');
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
  const mineProducts = repo.listProducts().filter((p) => p.source === 'user');
  const recipes = repo.listRecipes();
  const products = repo.listProducts();
  const savedMeals = repo.listSavedMeals();

  // Fresh sheet each open — avoid stale search/mode from last session.
  useEffect(() => {
    if (!visible) {
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
    }
  }, [visible]);

  const searching = query.trim().length > 0;
  const inCatalog = CATALOG_TABS.includes(tab);
  const inMode = MODE_TABS.includes(tab);
  const showSearch = inCatalog || searching;

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

  const finishQuick = (label: string) => {
    refresh();
    showFlash(label);
    onClose();
  };

  const quickAddEntry = (e: FoodEntry) => {
    if (!allowAdd()) return;
    if (e.productId) {
      repo.addEntryFromProduct({
        productId: e.productId,
        dateLocal,
        meal,
        grams: e.grams,
      });
      finishQuick(`Добавлено: ${e.displayName}`);
      return;
    }
    if (e.recipeId) {
      repo.addEntryFromRecipe({
        recipeId: e.recipeId,
        dateLocal,
        meal,
        grams: e.grams,
      });
      finishQuick(`Добавлено: ${e.displayName}`);
    }
  };

  const quickAddProduct = (p: FoodProduct, g = 100) => {
    if (!allowAdd()) return;
    repo.addEntryFromProduct({ productId: p.id, dateLocal, meal, grams: g });
    finishQuick(`Добавлено: ${p.name}`);
  };

  const quickAddRecipe = (r: Recipe) => {
    if (!allowAdd()) return;
    const g = Math.min(200, r.cookedYieldG);
    repo.addEntryFromRecipe({ recipeId: r.id, dateLocal, meal, grams: g });
    finishQuick(`Добавлено: ${r.name}`);
  };

  const openProductConfirm = (product: FoodProduct, initialGrams?: number) => {
    setConfirm({
      target: { kind: 'product', product },
      initialGrams:
        initialGrams ?? defaultProductPortionGrams(repo.lastGramsForProduct(product.id)),
    });
  };

  const openRecipeConfirm = (recipe: Recipe, initialGrams?: number) => {
    const ings = repo.getRecipeIngredients(recipe.id);
    setConfirm({
      target: { kind: 'recipe', recipe, ingredients: ings },
      initialGrams:
        initialGrams ??
        defaultRecipePortionGrams(repo.lastGramsForRecipe(recipe.id), recipe.cookedYieldG),
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
  };

  const openMode = (next: 'manual' | 'quick' | 'meals') => {
    setQuery('');
    setError(null);
    setTab(next);
  };

  const backToCatalog = () => {
    setTab('recent');
    setError(null);
  };

  return (
    <>
      <SwipeToDismissSheet visible={visible && !confirm} onClose={onClose} maxHeightRatio={0.94}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title} accessibilityRole="header">
                Добавить еду
              </Text>
              <Pressable
                style={styles.mealContext}
                onPress={() => setMealPickerOpen((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={`Приём: ${MEAL_LABELS[meal]}. Нажмите, чтобы сменить`}
              >
                <Text style={styles.mealContextText}>в {MEAL_LABELS[meal].toLowerCase()}</Text>
                <Ionicons
                  name={mealPickerOpen ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Закрыть"
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {mealPickerOpen ? (
            <View style={styles.mealPicker} accessibilityRole="menu">
              {MEALS.map((m) => {
                const on = meal === m;
                return (
                  <Pressable
                    key={m}
                    style={[styles.mealOpt, on && styles.mealOptOn]}
                    onPress={() => {
                      setMeal(m);
                      setMealPickerOpen(false);
                    }}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={MEAL_LABELS[m]}
                  >
                    <Text style={[styles.mealOptText, on && styles.mealOptTextOn]}>
                      {MEAL_LABELS[m]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {showSearch ? (
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={(t) => {
                  setQuery(t);
                  if (t.trim() && !CATALOG_TABS.includes(tab)) setTab('recent');
                }}
                placeholder="Поиск по продуктам и рецептам"
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
                accessibilityLabel="Поиск по продуктам и рецептам"
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
          ) : null}

          {!searching && inCatalog ? (
            <AddFoodTabs value={tab} onChange={selectCatalogTab} />
          ) : null}

          {!searching && inMode ? (
            <View style={styles.modeHeader}>
              <Pressable
                onPress={backToCatalog}
                style={styles.modeBack}
                accessibilityRole="button"
                accessibilityLabel="Назад к списку"
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
                <Text style={styles.modeBackText}>К списку</Text>
              </Pressable>
              <Text style={styles.modeTitle} accessibilityRole="header">
                {MODE_TITLES[tab as 'manual' | 'quick' | 'meals']}
              </Text>
            </View>
          ) : null}

          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="assertive">
              {error}
            </Text>
          ) : null}

          <FormScrollView variant="sheet" style={styles.scroll} contentContainerStyle={styles.body}>
            {searching ? (
              searchHits.length === 0 ? (
                <EmptyHint
                  title="Ничего не найдено"
                  body="Сбрось поиск или добавь вручную — нули не выдумываем."
                  actionLabel="Ввести вручную"
                  onAction={() => openMode('manual')}
                  secondaryActionLabel="Быстрый ввод"
                  onSecondaryAction={() => openMode('quick')}
                />
              ) : (
                searchHits.map((hit) => {
                  if (hit.kind === 'recent') {
                    const e = hit.entry;
                    return (
                      <FoodPickRow
                        key={`r-${e.id}`}
                        title={e.displayName}
                        meta={`Последняя порция · ${e.grams} г · ${e.energyKcal === null ? '— ккал' : `${Math.round(e.energyKcal)} ккал`}`}
                        icon={e.recipeId ? 'restaurant-outline' : 'time-outline'}
                        tone={e.recipeId ? 'recipe' : 'recent'}
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
                        tone="product"
                        onPress={() =>
                          openProductConfirm(p, defaultProductPortionGrams(last))
                        }
                        onQuickAdd={() =>
                          quickAddProduct(p, defaultProductPortionGrams(last))
                        }
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
                      tone="recipe"
                      onPress={() => openRecipeConfirm(r)}
                      onQuickAdd={() => quickAddRecipe(r)}
                      accessibilityLabel={`Выбрать порцию ${r.name}`}
                    />
                  );
                })
              )
            ) : null}

            {!searching && tab === 'recent' ? (
              recent.length === 0 ? (
                <EmptyHint
                  title="Пока нет недавних"
                  body="Поиск, сканер или быстрый ввод — потом повтор одним «+»."
                />
              ) : (
                recent.map((e) => (
                  <FoodPickRow
                    key={e.id}
                    title={e.displayName}
                    meta={`Последняя порция · ${e.grams} г · ${e.energyKcal === null ? '— ккал' : `${Math.round(e.energyKcal)} ккал`}`}
                    icon={e.recipeId ? 'restaurant-outline' : 'time-outline'}
                    tone={e.recipeId ? 'recipe' : 'recent'}
                    onPress={() => openRecentConfirm(e)}
                    onQuickAdd={
                      e.productId || e.recipeId ? () => quickAddEntry(e) : undefined
                    }
                    accessibilityLabel={`Выбрать порцию ${e.displayName}`}
                  />
                ))
              )
            ) : null}

            {!searching && tab === 'favorites' ? (
              favorites.length === 0 ? (
                <EmptyHint
                  title="Нет избранного"
                  body="На вкладке Питание нажми ★ у продукта."
                />
              ) : (
                favorites.map((p) => {
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
                      icon="star"
                      tone="favorite"
                      onPress={() =>
                        openProductConfirm(p, defaultProductPortionGrams(last))
                      }
                      onQuickAdd={() =>
                        quickAddProduct(p, defaultProductPortionGrams(last))
                      }
                      accessibilityLabel={`Выбрать порцию ${p.name}`}
                    />
                  );
                })
              )
            ) : null}

            {!searching && tab === 'mine' ? (
              mineProducts.length === 0 ? (
                <EmptyHint
                  title="Нет своих продуктов"
                  body="План → Мои продукты. КБЖУ можно дописать позже."
                />
              ) : (
                mineProducts.map((p) => {
                  const last = repo.lastGramsForProduct(p.id);
                  const unknown =
                    p.energyKcal == null &&
                    p.proteinG == null &&
                    p.fatG == null &&
                    p.carbG == null;
                  return (
                    <FoodPickRow
                      key={p.id}
                      title={p.name}
                      meta={
                        unknown
                          ? 'КБЖУ неизвестны'
                          : last != null
                            ? `Последняя порция · ${last} г`
                            : `${p.energyKcal === null ? '—' : p.energyKcal} ккал/100г`
                      }
                      icon="basket-outline"
                      tone="product"
                      onPress={() =>
                        openProductConfirm(p, defaultProductPortionGrams(last))
                      }
                      onQuickAdd={() =>
                        quickAddProduct(p, defaultProductPortionGrams(last))
                      }
                      accessibilityLabel={`Выбрать порцию ${p.name}`}
                    />
                  );
                })
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
                    refresh();
                    showFlash(`Приём «${m.name}»: +${created.length}`);
                    onClose();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Не удалось добавить');
                  }
                }}
                onDelete={(m) => {
                  repo.softDeleteSavedMeal(m.id);
                  refresh();
                  showFlash(`Удалён шаблон «${m.name}»`);
                }}
              />
            ) : null}

            {!searching && tab === 'quick' ? (
              <QuickAddForm
                onSubmit={(values) => {
                  if (!allowAdd()) return;
                  repo.addQuickEntry({
                    dateLocal,
                    meal,
                    displayName: values.displayName,
                    energyKcal: values.energyKcal,
                    proteinG: values.proteinG,
                    fatG: values.fatG,
                    carbG: values.carbG,
                  });
                  refresh();
                  showFlash(`Быстрый ввод: ${values.displayName}`);
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
                <View style={styles.recipesChips} accessibilityRole="toolbar">
                  <RecipeChip
                    icon="book-outline"
                    label="Все"
                    onPress={() => {
                      onClose();
                      router.push('/recipes');
                    }}
                    accessibilityLabel="Открыть раздел рецептов"
                  />
                  <RecipeChip
                    icon="document-text-outline"
                    label="Из текста"
                    onPress={() => {
                      onClose();
                      router.push('/recipes/import-text');
                    }}
                    accessibilityLabel="Создать рецепт из текста"
                  />
                  <RecipeChip
                    icon="library-outline"
                    label="Архив"
                    onPress={() => {
                      onClose();
                      router.push('/recipes/import-personal');
                    }}
                    accessibilityLabel="Мой архив рецептов"
                  />
                </View>
                <RecipesPanel
                  recipes={recipes}
                  getIngredientCount={(id) => repo.getRecipeIngredients(id).length}
                  getRecipeIngredients={(id) => repo.getRecipeIngredients(id)}
                  onPickRecipe={(r) => openRecipeConfirm(r)}
                  onQuickAddRecipe={quickAddRecipe}
                  onCreateRecipe={(input) => {
                    const recipe = repo.createRecipe(input);
                    refresh();
                    openRecipeConfirm(recipe);
                  }}
                />
              </>
            ) : null}
          </FormScrollView>

          {!searching ? (
            <View style={styles.dock} accessibilityRole="toolbar">
              <DockItem
                icon="barcode-outline"
                label="Сканер"
                onPress={() => setScanOpen(true)}
              />
              <DockItem
                icon="create-outline"
                label="Вручную"
                onPress={() => openMode('manual')}
                active={tab === 'manual'}
              />
              <DockItem
                icon="flash-outline"
                label="Быстро"
                onPress={() => openMode('quick')}
                active={tab === 'quick'}
              />
              <DockItem
                icon="bookmark-outline"
                label="Приёмы"
                onPress={() => openMode('meals')}
                active={tab === 'meals'}
              />
            </View>
          ) : null}
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
              repo.addEntryFromProduct({
                productId: product.id,
                dateLocal,
                meal,
                grams: result.grams,
              });
              setName('');
              setKcal('');
              setProtein('');
              setFat('');
              setCarbs('');
              setPendingManual(null);
              showFlash(`Добавлено: ${product.name}`);
            } else {
              repo.updateProductNutrition(confirm.target.product.id, result.per100g);
              repo.addEntryFromProduct({
                productId: confirm.target.product.id,
                dateLocal,
                meal,
                grams: result.grams,
              });
              showFlash(`Добавлено: ${confirm.target.product.name}`);
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
            repo.addEntryFromRecipe({
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
            showFlash(`Добавлено: ${confirm.target.recipe.name}`);
          }
          refresh();
          setConfirm(null);
          onClose();
        }}
      />
    </>
  );
}

function EmptyHint({
  title,
  body,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
      {secondaryActionLabel && onSecondaryAction ? (
        <Pressable
          onPress={onSecondaryAction}
          style={({ pressed }) => [styles.emptySecondary, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={secondaryActionLabel}
        >
          <Text style={styles.emptySecondaryText}>{secondaryActionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function DockItem({
  icon,
  label,
  onPress,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      style={[styles.dockItem, active && styles.dockItemOn]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={label}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? colors.primaryButtonText : colors.text}
      />
      <Text style={[styles.dockLabel, active && styles.dockLabelOn]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function RecipeChip({
  icon,
  label,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      style={styles.recipeChip}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={16} color={colors.fat} />
      <Text style={styles.recipeChipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: {
    minHeight: 420,
  },
  scroll: {
    maxHeight: 520,
    flexGrow: 1,
  },
  dock: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  dockItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: touchMin + 4,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dockItemOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  dockLabel: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dockLabelOn: { color: colors.primaryButtonText },
  modeHeader: {
    paddingHorizontal: space.lg,
    marginBottom: space.md,
    gap: space.xs,
  },
  modeBack: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    minHeight: 36,
    marginLeft: -4,
  },
  modeBackText: {
    fontSize: type.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeTitle: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
  },
  recipesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.md,
  },
  recipeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minHeight: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.toneRecipeBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recipeChipText: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.text,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    paddingHorizontal: space.md,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontSize: type.body, color: colors.text },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: space.lg,
    marginBottom: space.md,
  },
  headerText: { flex: 1, paddingRight: space.md },
  title: {
    fontSize: type.title,
    fontWeight: '800',
    color: colors.text,
  },
  mealContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
    minHeight: 28,
  },
  mealContextText: {
    fontSize: type.caption,
    fontWeight: '600',
    color: colors.textMuted,
  },
  closeBtn: {
    width: touchMin,
    height: touchMin,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingHorizontal: space.lg,
    marginBottom: space.md,
  },
  mealOpt: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 40,
    justifyContent: 'center',
  },
  mealOptOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  mealOptText: { fontWeight: '600', color: colors.text, fontSize: type.caption },
  mealOptTextOn: { color: colors.primaryButtonText },
  body: {
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
  error: {
    color: colors.danger,
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  emptyTitle: {
    fontSize: type.subtitle,
    fontWeight: '700',
    color: colors.text,
    marginBottom: space.sm,
  },
  emptyBody: {
    fontSize: type.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  emptyAction: {
    marginTop: space.md,
    minHeight: touchMin,
    borderRadius: radius.md,
    backgroundColor: colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  emptyActionText: {
    fontWeight: '800',
    color: colors.primaryButtonText,
    fontSize: type.body,
  },
  emptySecondary: {
    marginTop: space.sm,
    minHeight: touchMin,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  emptySecondaryText: {
    fontWeight: '700',
    color: colors.text,
    fontSize: type.caption,
  },
  pressed: { opacity: 0.88 },
});

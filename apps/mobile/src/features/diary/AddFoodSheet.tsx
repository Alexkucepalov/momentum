import { useMemo, useState } from 'react';
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

const CATALOG_TABS: AddFoodTab[] = ['recent', 'favorites', 'recipes'];

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
  const recipes = repo.listRecipes();
  const products = repo.listProducts();
  const savedMeals = repo.listSavedMeals();

  const searching = query.trim().length > 0;
  const showSearch = CATALOG_TABS.includes(tab) || searching;

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

          {/* Search first on catalog tabs — one box for products + recipes */}
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

          {!searching && CATALOG_TABS.includes(tab) ? (
            <AddFoodTabs value={tab} onChange={selectCatalogTab} />
          ) : null}

          <View style={styles.actions} accessibilityRole="toolbar">
            <ActionChip icon="barcode-outline" label="Сканер" onPress={() => setScanOpen(true)} />
            <ActionChip
              icon="create-outline"
              label="Вручную"
              onPress={() => {
                setQuery('');
                setTab('manual');
              }}
              active={tab === 'manual'}
            />
            <ActionChip
              icon="flash-outline"
              label="Быстро"
              onPress={() => {
                setQuery('');
                setTab('quick');
              }}
              active={tab === 'quick'}
            />
            <ActionChip
              icon="bookmark-outline"
              label="Приёмы"
              onPress={() => {
                setQuery('');
                setTab('meals');
              }}
              active={tab === 'meals'}
            />
          </View>

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
                <EmptyHint
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
                <EmptyHint
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
                    refresh();
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

function EmptyHint({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

function ActionChip({
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
      style={[styles.actionChip, active && styles.actionChipOn]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={16} color={active ? colors.primaryButtonText : colors.text} />
      <Text style={[styles.actionLabel, active && styles.actionLabelOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: {
    minHeight: 420,
  },
  scroll: {
    maxHeight: 560,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 36,
  },
  actionChipOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  actionLabel: { fontSize: type.micro, fontWeight: '700', color: colors.text },
  actionLabelOn: { color: colors.primaryButtonText },
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
    paddingBottom: 48,
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    minHeight: touchMin,
    marginBottom: space.md,
  },
  recipesLinkText: { flex: 1, fontWeight: '700', color: colors.text, fontSize: type.body },
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
});

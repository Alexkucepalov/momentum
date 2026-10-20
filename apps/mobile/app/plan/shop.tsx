import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { EmptyState } from '@/src/components/EmptyState';
import { FormScrollView } from '@/src/components/FormScrollView';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

function fmtQty(q: number, unit: string): string {
  if (unit === 'pcs') return `${Math.round(q)} шт`;
  if (q >= 1000 && (unit === 'g' || unit === 'ml')) {
    return `${(q / 1000).toFixed(q % 1000 === 0 ? 0 : 1)} ${unit === 'g' ? 'кг' : 'л'}`;
  }
  return `${Math.round(q)} ${unit}`;
}

type CreateMode = 'plan' | 'recipe' | 'manual' | 'purchase' | null;

export default function ShopScreen() {
  const router = useRouter();
  const { repo, refresh, revision, showFlash } = useData();
  void revision;

  const plans = repo.listMealPlans();
  const recipes = repo.listRecipes();
  const lists = repo.listShoppingLists();
  const [listId, setListId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedId, setLastCheckedId] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState<'g' | 'ml' | 'pcs'>('g');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [recipeServings, setRecipeServings] = useState('1');
  const [purchaseName, setPurchaseName] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchaseUnit, setPurchaseUnit] = useState<'g' | 'ml' | 'pcs'>('g');

  const activeListId = listId ?? lists[0]?.id ?? null;
  const list = activeListId ? repo.getShoppingList(activeListId) : null;
  const items = activeListId ? repo.listShoppingItems(activeListId) : [];
  const basket = activeListId ? repo.shoppingBasketTotal(activeListId) : null;

  const checkedCount = useMemo(() => items.filter((i) => i.checked).length, [items]);

  const buildFromPlan = (planId: string) => {
    setError(null);
    try {
      const created = repo.createShoppingListFromPlan(planId);
      setListId(created.id);
      setCreateMode(null);
      refresh();
      showFlash('Список покупок собран');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось собрать список');
    }
  };

  const createEmpty = () => {
    setError(null);
    const title = newListTitle.trim() || 'Ручной список';
    try {
      const created = repo.createEmptyShoppingList(title);
      setListId(created.id);
      setNewListTitle('');
      setCreateMode(null);
      refresh();
      showFlash('Список создан');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать список');
    }
  };

  const addManualItem = () => {
    if (!activeListId) return;
    setError(null);
    const name = newItemName.trim();
    const qtyNum = Number(newItemQty.replace(',', '.'));
    if (!name) {
      setError('Название обязательно');
      return;
    }
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      setError('Количество: число > 0');
      return;
    }
    try {
      repo.addShoppingItemManual(activeListId, {
        displayName: name,
        quantity: qtyNum,
        unit: newItemUnit,
      });
      setNewItemName('');
      setNewItemQty('');
      refresh();
      showFlash('Добавлено');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить');
    }
  };

  const buildFromRecipe = () => {
    if (!selectedRecipeId) return;
    setError(null);
    const servings = Number(recipeServings.replace(',', '.'));
    if (!Number.isFinite(servings) || servings <= 0) {
      setError('Порций: число > 0');
      return;
    }
    try {
      const created = repo.createShoppingListFromRecipe(selectedRecipeId, servings);
      setListId(created.id);
      setSelectedRecipeId(null);
      setRecipeServings('1');
      setCreateMode(null);
      refresh();
      showFlash('Список из рецепта создан');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать список');
    }
  };

  const confirmPurchase = () => {
    setError(null);
    const name = purchaseName.trim();
    const qtyNum = Number(purchaseQty.replace(',', '.'));
    if (!name) {
      setError('Название обязательно');
      return;
    }
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      setError('Количество: число > 0');
      return;
    }
    try {
      const result = repo.reconcilePurchase({
        displayName: name,
        quantity: qtyNum,
        unit: purchaseUnit,
      });
      const total = result.checkedItems.length + result.reducedItems.length;
      if (total === 0) {
        Alert.alert('Покупка', 'Нет открытых позиций для сверки');
      } else {
        Alert.alert(
          'Покупка сверена',
          `Отмечено ${result.checkedItems.length}, уменьшено ${result.reducedItems.length}`,
        );
      }
      setPurchaseName('');
      setPurchaseQty('');
      setCreateMode(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сверить покупку');
    }
  };

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Собери корзину из меню или рецепта — одинаковые продукты объединяются, запасы вычитаются.
        Создай пустой список для ручного ввода. Цену вводи сам — показываем как оценку с датой, не
        как «цену сегодня».
      </Text>

      {!createMode && (
        <>
          <Text style={styles.section}>Создать список</Text>
          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => setCreateMode('manual')}
              style={({ pressed }) => [styles.modeCard, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.cardTitle}>Пустой список</Text>
              <Text style={styles.cardSub}>Добавлять вручную</Text>
            </Pressable>
            <Pressable
              onPress={() => setCreateMode('plan')}
              style={({ pressed }) => [styles.modeCard, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.cardTitle}>Из меню</Text>
              <Text style={styles.cardSub}>Агрегирует ингредиенты</Text>
            </Pressable>
          </View>
          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => setCreateMode('recipe')}
              style={({ pressed }) => [styles.modeCard, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.cardTitle}>Из рецепта</Text>
              <Text style={styles.cardSub}>Недостающее из запасов</Text>
            </Pressable>
            <Pressable
              onPress={() => setCreateMode('purchase')}
              style={({ pressed }) => [styles.modeCard, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.cardTitle}>Купил</Text>
              <Text style={styles.cardSub}>Сверить с открытыми списками</Text>
            </Pressable>
          </View>
        </>
      )}

      {createMode === 'manual' && (
        <>
          <Text style={styles.section}>Пустой список</Text>
          <TextInput
            value={newListTitle}
            onChangeText={setNewListTitle}
            placeholder="Название списка (необязательно)"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            accessibilityLabel="Название списка"
          />
          <View style={styles.buttonRow}>
            <PrimaryButton label="Создать" onPress={createEmpty} />
            <Pressable
              onPress={() => {
                setCreateMode(null);
                setNewListTitle('');
              }}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>Отмена</Text>
            </Pressable>
          </View>
        </>
      )}

      {createMode === 'plan' && (
        <>
          <Text style={styles.section}>Из меню</Text>
          {plans.length === 0 ? (
            <EmptyState
              compact
              icon="calendar-outline"
              title="Нет плана"
              body="Сначала составь меню на неделю — оттуда соберём корзину."
              actionLabel="К меню"
              onAction={() => router.push('/plan/week')}
            />
          ) : (
            <View style={styles.list}>
              {plans.slice(0, 5).map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => buildFromPlan(p.id)}
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Собрать покупки из плана ${p.startDate}`}
                >
                  <Text style={styles.cardTitle}>
                    {p.startDate} → {p.endDate}
                  </Text>
                  <Text style={styles.cardSub}>Собрать список · {p.status}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Pressable
            onPress={() => setCreateMode(null)}
            style={styles.cancelBtn}
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>Отмена</Text>
          </Pressable>
        </>
      )}

      {createMode === 'recipe' && (
        <>
          <Text style={styles.section}>Из рецепта</Text>
          {recipes.length === 0 ? (
            <EmptyState
              compact
              icon="book-outline"
              title="Нет рецептов"
              body="Добавь рецепты с ингредиентами — создадим список покупок."
              actionLabel="К рецептам"
              onAction={() => router.push('/recipes')}
            />
          ) : (
            <>
              <View style={styles.list}>
                {recipes.slice(0, 10).map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => setSelectedRecipeId(r.id)}
                    style={({ pressed }) => [
                      styles.card,
                      selectedRecipeId === r.id && styles.cardSelected,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedRecipeId === r.id }}
                  >
                    <Text style={styles.cardTitle}>{r.name}</Text>
                    <Text style={styles.cardSub}>Выход {r.cookedYieldG} г</Text>
                  </Pressable>
                ))}
              </View>
              {selectedRecipeId && (
                <>
                  <TextInput
                    value={recipeServings}
                    onChangeText={setRecipeServings}
                    placeholder="Порций (умножитель)"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    accessibilityLabel="Количество порций"
                  />
                  <View style={styles.buttonRow}>
                    <PrimaryButton label="Создать список" onPress={buildFromRecipe} />
                    <Pressable
                      onPress={() => {
                        setCreateMode(null);
                        setSelectedRecipeId(null);
                        setRecipeServings('1');
                      }}
                      style={styles.cancelBtn}
                    >
                      <Text style={styles.cancelText}>Отмена</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </>
          )}
        </>
      )}

      {createMode === 'purchase' && (
        <>
          <Text style={styles.section}>Купил</Text>
          <Text style={styles.hint}>
            Укажи что купил — сверим с открытыми списками, отметим / уменьшим позиции.
          </Text>
          <TextInput
            value={purchaseName}
            onChangeText={setPurchaseName}
            placeholder="Название продукта"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            accessibilityLabel="Название купленного продукта"
          />
          <View style={styles.unitRow}>
            <TextInput
              value={purchaseQty}
              onChangeText={setPurchaseQty}
              placeholder="Количество"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={[styles.input, { flex: 1 }]}
              accessibilityLabel="Количество купленного"
            />
            <View style={styles.unitPicker}>
              {(['g', 'ml', 'pcs'] as const).map((u) => (
                <Pressable
                  key={u}
                  onPress={() => setPurchaseUnit(u)}
                  style={[styles.unitBtn, purchaseUnit === u && styles.unitBtnActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: purchaseUnit === u }}
                >
                  <Text style={[styles.unitText, purchaseUnit === u && styles.unitTextActive]}>
                    {u === 'g' ? 'г' : u === 'ml' ? 'мл' : 'шт'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.buttonRow}>
            <PrimaryButton label="Сверить" onPress={confirmPurchase} />
            <Pressable
              onPress={() => {
                setCreateMode(null);
                setPurchaseName('');
                setPurchaseQty('');
              }}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>Отмена</Text>
            </Pressable>
          </View>
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {list && !createMode ? (
        <>
          <Text style={styles.section}>{list.title}</Text>
          <Text style={styles.meta}>
            {checkedCount}/{items.length} отмечено
          </Text>

          {list.planId === null && (
            <>
              <Text style={styles.subsection}>Добавить товар</Text>
              <TextInput
                value={newItemName}
                onChangeText={setNewItemName}
                placeholder="Название товара"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                accessibilityLabel="Название товара"
              />
              <View style={styles.unitRow}>
                <TextInput
                  value={newItemQty}
                  onChangeText={setNewItemQty}
                  placeholder="Количество"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  style={[styles.input, { flex: 1 }]}
                  accessibilityLabel="Количество товара"
                />
                <View style={styles.unitPicker}>
                  {(['g', 'ml', 'pcs'] as const).map((u) => (
                    <Pressable
                      key={u}
                      onPress={() => setNewItemUnit(u)}
                      style={[styles.unitBtn, newItemUnit === u && styles.unitBtnActive]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: newItemUnit === u }}
                    >
                      <Text style={[styles.unitText, newItemUnit === u && styles.unitTextActive]}>
                        {u === 'g' ? 'г' : u === 'ml' ? 'мл' : 'шт'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <PrimaryButton label="Добавить" onPress={addManualItem} />
            </>
          )}

          <View style={styles.totalBox} accessibilityRole="summary">
            <Text style={styles.totalHero}>
              {basket?.totalRub != null ? `${Math.round(basket.totalRub)} ₽` : '—'}
            </Text>
            <Text style={styles.totalLabel}>{basket?.label ?? 'Сумма неизвестна'}</Text>
          </View>

          {items.length === 0 ? (
            <Text style={styles.hint}>Пустой список — добавь товары или собери из плана/рецепта.</Text>
          ) : (
            <View style={styles.list}>
              {items.map((item) => {
                const need = item.needToBuy;
                const cover =
                  item.coveredByPantry > 0
                    ? ` · дома ${fmtQty(item.coveredByPantry, item.unit)}`
                    : '';
                return (
                  <View key={item.id} style={[styles.card, item.checked && styles.cardChecked]}>
                    <Pressable
                      onPress={() => {
                        const next = !item.checked;
                        repo.setShoppingItemChecked(item.id, next);
                        if (next) setLastCheckedId(item.id);
                        refresh();
                        showFlash(next ? 'Куплено' : 'Снова в списке');
                      }}
                      style={styles.checkHit}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: item.checked }}
                      accessibilityLabel={item.displayName}
                    >
                      <Text style={styles.checkMark}>{item.checked ? '✓' : '○'}</Text>
                      <View style={styles.cardMain}>
                        <Text style={styles.cardTitle}>{item.displayName}</Text>
                        <Text style={styles.cardSub}>
                          нужно {fmtQty(need, item.unit)}
                          {cover}
                          {item.priceRub != null
                            ? ` · ${Math.round(item.priceRub)} ₽${
                                item.priceAsOf ? ` · оценка · ${item.priceAsOf}` : ''
                              }`
                            : ' · цена не задана'}
                        </Text>
                      </View>
                    </Pressable>
                    {!item.checked && need > 0 ? (
                      <View style={styles.priceRow}>
                        <TextInput
                          value={priceDraft[item.id] ?? (item.priceRub != null ? String(item.priceRub) : '')}
                          onChangeText={(t) => setPriceDraft((d) => ({ ...d, [item.id]: t }))}
                          placeholder="₽ за нужное"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="decimal-pad"
                          style={styles.priceInput}
                          accessibilityLabel={`Цена за нужный объём ${item.displayName}`}
                        />
                        <Pressable
                          onPress={() => {
                            const raw = (priceDraft[item.id] ?? '').trim();
                            if (!raw) {
                              repo.setShoppingItemPrice(item.id, { priceRub: null });
                            } else {
                              const n = Number(raw.replace(',', '.'));
                              if (!Number.isFinite(n) || n < 0) {
                                setError('Цена: число ≥ 0');
                                return;
                              }
                              repo.setShoppingItemPrice(item.id, {
                                priceRub: n,
                                priceAsOf: new Date().toISOString().slice(0, 10),
                                priceSource: 'user',
                              });
                            }
                            setError(null);
                            refresh();
                            showFlash('Цена сохранена');
                          }}
                          style={styles.priceBtn}
                          accessibilityRole="button"
                          accessibilityLabel="Сохранить цену"
                        >
                          <Text style={styles.priceBtnText}>OK</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}

          {lastCheckedId ? (
            <Pressable
              onPress={() => {
                repo.setShoppingItemChecked(lastCheckedId, false);
                setLastCheckedId(null);
                refresh();
                showFlash('Отменено');
              }}
              style={styles.undo}
              accessibilityRole="button"
              accessibilityLabel="Отменить последнюю отметку куплено"
            >
              <Text style={styles.undoText}>Отменить последнюю «куплено»</Text>
            </Pressable>
          ) : null}

          <PrimaryButton
            label="Удалить список"
            onPress={() => {
              repo.softDeleteShoppingList(list.id);
              setListId(null);
              refresh();
              showFlash('Список удалён');
            }}
          />
        </>
      ) : null}
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  lead: { fontSize: type.body, color: colors.textSecondary, lineHeight: 22 },
  section: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: space.sm,
  },
  subsection: {
    fontSize: type.caption,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: space.xs,
  },
  meta: { fontSize: type.caption, color: colors.textMuted },
  list: { gap: space.sm },
  buttonRow: { flexDirection: 'row', gap: space.sm },
  modeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: 4,
    minHeight: touchMin,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
    minHeight: touchMin,
  },
  cardSelected: { borderColor: colors.accent, borderWidth: 2 },
  cardChecked: { opacity: 0.65 },
  pressed: { opacity: 0.9 },
  checkHit: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  checkMark: { fontSize: 20, fontWeight: '700', color: colors.text, width: 24 },
  cardMain: { flex: 1, gap: 2 },
  cardTitle: { fontSize: type.subtitle, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: type.caption, color: colors.textSecondary },
  totalBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: 4,
  },
  totalHero: { fontSize: type.hero, fontWeight: '800', color: colors.text },
  totalLabel: { fontSize: type.caption, color: colors.textSecondary, fontWeight: '600' },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.text,
  },
  unitRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  unitPicker: { flexDirection: 'row', gap: space.xs },
  unitBtn: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitBtnActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  unitText: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  unitTextActive: { color: colors.primaryButtonText },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  priceInput: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.text,
  },
  priceBtn: {
    minHeight: 40,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBtnText: { color: colors.primaryButtonText, fontWeight: '800', fontSize: type.caption },
  cancelBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: type.body, fontWeight: '700', color: colors.text },
  error: { color: colors.danger, fontSize: type.caption },
  hint: { fontSize: type.caption, color: colors.textMuted },
  undo: {
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  undoText: { fontSize: type.caption, fontWeight: '700', color: colors.text },
});

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedTextInput as TextInput } from '@/src/design-system/components/ThemedTextInput';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';
import { useRouter } from 'expo-router';

import { filterMissingShoppingItems } from '../../../../src/domain/aggregateShopping';
import { EmptyState } from '@/src/components/EmptyState';
import { FormScrollView } from '@/src/components/FormScrollView';
import { useData, useAnyRevision } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { AppButton } from '@/src/design-system';

function fmtQty(q: number, unit: string): string {
  if (unit === 'pcs') return `${Math.round(q)} шт`;
  if (q >= 1000 && (unit === 'g' || unit === 'ml')) {
    return `${(q / 1000).toFixed(q % 1000 === 0 ? 0 : 1)} ${unit === 'g' ? 'кг' : 'л'}`;
  }
  return `${Math.round(q)} ${unit}`;
}

export default function ShopScreen() {
  const router = useRouter();
  const { repo, refresh, showFlash } = useData();
  const revision = useAnyRevision();
  void revision;

  const plans = repo.listMealPlans();
  const recipes = repo.listRecipes();
  const lists = repo.listShoppingLists();
  const [listId, setListId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedId, setLastCheckedId] = useState<string | null>(null);
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [manualName, setManualName] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [manualUnit, setManualUnit] = useState<'g' | 'ml' | 'pcs'>('pcs');

  const activeListId = listId ?? lists[0]?.id ?? null;
  const list = activeListId ? repo.getShoppingList(activeListId) : null;
  const items = activeListId ? repo.listShoppingItems(activeListId) : [];
  const basket = activeListId ? repo.shoppingBasketTotal(activeListId) : null;

  const checkedCount = useMemo(() => items.filter((i) => i.checked).length, [items]);
  const visibleItems = useMemo(
    () => (onlyMissing ? filterMissingShoppingItems(items, { includeChecked: false }) : items),
    [items, onlyMissing],
  );
  const coveredSkipped = useMemo(
    () => items.filter((i) => i.needToBuy <= 0).length,
    [items],
  );

  const buildFromPlan = (planId: string) => {
    setError(null);
    try {
      const created = repo.createShoppingListFromPlan(planId);
      setListId(created.id);
      refresh();
      showFlash('Список покупок собран');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось собрать список');
    }
  };

  const buildFromRecipe = (recipeId: string) => {
    setError(null);
    try {
      const created = repo.createShoppingListFromRecipe(recipeId);
      setListId(created.id);
      refresh();
      const need = repo.listShoppingItems(created.id).filter((i) => i.needToBuy > 0).length;
      showFlash(
        need > 0
          ? `Из рецепта: ${need} к покупке (с учётом запасов)`
          : 'Всё из рецепта уже в запасах',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось собрать из рецепта');
    }
  };

  const createEmpty = () => {
    setError(null);
    try {
      const created = repo.createEmptyShoppingList('Мой список');
      setListId(created.id);
      refresh();
      showFlash('Пустой список готов');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать список');
    }
  };

  const addManual = () => {
    setError(null);
    try {
      let id = activeListId;
      if (!id) {
        id = repo.createEmptyShoppingList('Мой список').id;
        setListId(id);
      }
      const qty = Number(manualQty.replace(',', '.'));
      repo.addShoppingItem({
        listId: id,
        displayName: manualName,
        quantity: qty,
        unit: manualUnit,
      });
      setManualName('');
      setManualQty('1');
      refresh();
      showFlash('Позиция в списке');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить');
    }
  };

  const hasLists = lists.length > 0;

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Корзина из меню или руками. Цену вводи сам — оценка с датой, не «цена сегодня».
      </Text>

      {!hasLists ? (
        <EmptyState
          compact
          icon="cart-outline"
          title="Первый список покупок"
          body="Создай пустой список и добавь позиции вручную — или собери из рецепта после."
          actionLabel="Создать список"
          onAction={createEmpty}
        />
      ) : (
        <AppButton label="Новый пустой список" onPress={createEmpty} />
      )}
      <Pressable
        onPress={() => router.push('/plan/receipt')}
        style={styles.linkRow}
        accessibilityRole="button"
        accessibilityLabel="Импорт покупки"
      >
        <Text style={styles.linkText}>Купил → импорт в запасы</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/plan/stores')}
        style={styles.linkRow}
        accessibilityRole="button"
        accessibilityLabel="Предпочтения магазинов"
      >
        <Text style={styles.linkMuted}>Магазины (предпочтения)</Text>
      </Pressable>

      <Text style={styles.section}>Добавить вручную</Text>
      <TextInput
        value={manualName}
        onChangeText={setManualName}
        placeholder="Название"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        accessibilityLabel="Название позиции"
      />
      <View style={styles.row}>
        <TextInput
          value={manualQty}
          onChangeText={setManualQty}
          placeholder="Кол-во"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          style={[styles.input, styles.qtyInput]}
          accessibilityLabel="Количество"
        />
        {(['g', 'ml', 'pcs'] as const).map((u) => (
          <Pressable
            key={u}
            onPress={() => setManualUnit(u)}
            style={[styles.unitChip, manualUnit === u && styles.unitChipOn]}
            accessibilityRole="radio"
            accessibilityState={{ selected: manualUnit === u }}
            accessibilityLabel={u === 'pcs' ? 'шт' : u}
          >
            <Text style={styles.unitChipText}>{u === 'pcs' ? 'шт' : u}</Text>
          </Pressable>
        ))}
      </View>
      <AppButton label="В список" onPress={addManual} />

      {recipes.length > 0 ? (
        <>
          <Text style={styles.section}>Из рецепта</Text>
          <View style={styles.list}>
            {recipes.slice(0, 8).map((r) => (
              <Pressable
                key={r.id}
                onPress={() => buildFromRecipe(r.id)}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Собрать покупки из рецепта ${r.name}`}
              >
                <Text style={styles.cardTitle}>{r.name}</Text>
                <Text style={styles.cardSub}>Недостающее · с учётом запасов</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {plans.length > 0 ? (
        <>
          <Text style={styles.section}>Из меню</Text>
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
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {list ? (
        <>
          <Text style={styles.section}>{list.title}</Text>
          <Text style={styles.meta}>
            {checkedCount}/{items.length} отмечено
            {coveredSkipped > 0 ? ` · ${coveredSkipped} уже дома (не в списке)` : ''}
          </Text>

          <Pressable
            onPress={() => setOnlyMissing((v) => !v)}
            style={[styles.filterChip, onlyMissing && styles.filterChipOn]}
            accessibilityRole="switch"
            accessibilityState={{ checked: onlyMissing }}
            accessibilityLabel="Только недостающее"
          >
            <Text style={styles.filterChipText}>
              {onlyMissing ? 'Только недостающее' : 'Показать все строки'}
            </Text>
          </Pressable>

          <View style={styles.totalBox} accessibilityRole="summary">
            <Text style={styles.totalHero}>
              {basket?.totalRub != null ? `${Math.round(basket.totalRub)} ₽` : '—'}
            </Text>
            <Text style={styles.totalLabel}>{basket?.label ?? 'Сумма неизвестна'}</Text>
          </View>

          {items.length === 0 ? (
            <Text style={styles.hint}>
              Пусто — либо в плане нет граммовок, либо всё уже покрыто запасами.
            </Text>
          ) : visibleItems.length === 0 ? (
            <Text style={styles.hint}>Недостающего нет — всё отмечено или покрыто дома.</Text>
          ) : (
            <View style={styles.list}>
              {visibleItems.map((item) => {
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

          <AppButton
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
  linkRow: { minHeight: touchMin, justifyContent: 'center' },
  linkText: { fontSize: type.body, fontWeight: '700', color: colors.text },
  linkMuted: { fontSize: type.caption, fontWeight: '600', color: colors.textSecondary },
  input: {
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    fontSize: type.body,
    color: colors.text,
    width: '100%',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center' },
  qtyInput: { flex: 1, minWidth: 72 },
  unitChip: {
    minHeight: touchMin,
    minWidth: touchMin,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  unitChipOn: { borderColor: colors.text, backgroundColor: colors.background },
  unitChipText: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  section: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: space.sm,
  },
  meta: { fontSize: type.caption, color: colors.textMuted },
  filterChip: {
    alignSelf: 'flex-start',
    minHeight: touchMin,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  filterChipOn: { borderColor: colors.text },
  filterChipText: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  list: { gap: space.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
    minHeight: touchMin,
  },
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
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  priceInput: {
    flex: 1,
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.text,
  },
  priceBtn: {
    minHeight: touchMin,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBtnText: { color: colors.primaryButtonText, fontWeight: '800', fontSize: type.caption },
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

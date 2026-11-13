import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedTextInput as TextInput } from '@/src/design-system/components/ThemedTextInput';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';
import { useRouter } from 'expo-router';

import { normalizeShoppingName } from '../../../../src/domain/aggregateShopping';
import type { FoodProduct, PantryLocation, PantryUnit } from '../../../../src/storage/types';
import { EmptyState } from '@/src/components/EmptyState';
import { FormScrollView } from '@/src/components/FormScrollView';
import { useData, useAnyRevision } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { AppButton } from '@/src/design-system';

const LOCATIONS: { id: PantryLocation; label: string }[] = [
  { id: 'fridge', label: 'Холодильник' },
  { id: 'freezer', label: 'Морозилка' },
  { id: 'pantry', label: 'Шкаф' },
];

const UNITS: { id: PantryUnit; label: string }[] = [
  { id: 'g', label: 'г' },
  { id: 'ml', label: 'мл' },
  { id: 'pcs', label: 'шт' },
];

function parseOptionalQty(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) throw new Error('Количество: число ≥ 0 или пусто');
  return n;
}

function locLabel(id: PantryLocation): string {
  return LOCATIONS.find((l) => l.id === id)?.label ?? id;
}

export default function PantryScreen() {
  const router = useRouter();
  const { repo, refresh, showFlash } = useData();
  const revision = useAnyRevision();
  void revision;

  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [location, setLocation] = useState<PantryLocation>('fridge');
  const [unit, setUnit] = useState<PantryUnit>('g');
  const [linkedProduct, setLinkedProduct] = useState<FoodProduct | null>(null);
  const [batchYield, setBatchYield] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const items = repo.listPantryItems();
  const batches = repo.listCookedBatches({ onlyRemaining: true });
  const recipes = useMemo(() => repo.listRecipes(), [repo]);

  const productSuggestions = useMemo(() => {
    const q = normalizeShoppingName(name);
    if (q.length < 2) return [];
    return repo
      .listProducts()
      .filter((p) => !p.deletedAt && normalizeShoppingName(p.name).includes(q))
      .slice(0, 6);
  }, [name, repo]);

  const grouped = useMemo(() => {
    const map: Record<PantryLocation, typeof items> = { fridge: [], freezer: [], pantry: [] };
    for (const i of items) map[i.location].push(i);
    return map;
  }, [items]);

  const addItem = (): boolean => {
    setError(null);
    try {
      const quantity = parseOptionalQty(qty);
      const displayName = linkedProduct?.name ?? name;
      repo.upsertPantryItem({
        displayName,
        productId: linkedProduct?.id ?? null,
        location,
        unit,
        quantityG: unit === 'pcs' ? null : quantity,
        quantityCount: unit === 'pcs' ? quantity : null,
      });
      setName('');
      setQty('');
      setLinkedProduct(null);
      refresh();
      showFlash(linkedProduct ? `В запасах: ${linkedProduct.name}` : 'Добавлено в запасы');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
      return false;
    }
  };

  const saveEdit = (id: string) => {
    setError(null);
    try {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const quantity = parseOptionalQty(editQty);
      repo.upsertPantryItem({
        id: item.id,
        displayName: item.displayName,
        productId: item.productId,
        location: item.location,
        unit: item.unit,
        quantityG: item.unit === 'pcs' ? null : quantity,
        quantityCount: item.unit === 'pcs' ? quantity : null,
        expiresOn: item.expiresOn,
      });
      setEditingId(null);
      refresh();
      showFlash('Количество обновлено');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось обновить');
    }
  };

  const markCooked = (recipeId: string) => {
    setError(null);
    try {
      const recipe = repo.getRecipe(recipeId);
      if (!recipe) throw new Error('Рецепт не найден');
      let yieldG: number | undefined;
      if (batchYield.trim()) {
        const n = Number(batchYield.replace(',', '.'));
        if (!Number.isFinite(n) || n <= 0) throw new Error('Выход партии: число > 0');
        yieldG = n;
      }
      repo.createCookedBatch({ recipeId, initialYieldG: yieldG });
      setBatchYield('');
      refresh();
      showFlash(`Партия: ${recipe.name}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать партию');
    }
  };

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <Text style={styles.section}>
        Дома {items.length > 0 ? `· ${items.length}` : ''}
      </Text>
      {items.length === 0 ? (
        <EmptyState
          compact
          icon="cube-outline"
          title="Пока пусто"
          body="Добавь то, что реально есть, или подтверди покупку — позиции попадут сюда."
          actionLabel="Добавить"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        (['fridge', 'freezer', 'pantry'] as PantryLocation[]).map((loc) =>
          grouped[loc].length === 0 ? null : (
            <View key={loc} style={styles.group}>
              <Text style={styles.groupTitle}>{locLabel(loc)}</Text>
              {grouped[loc].map((item) => {
                const qtyLabel =
                  item.unit === 'pcs'
                    ? item.quantityCount === null
                      ? 'кол-во неизвестно'
                      : `${item.quantityCount} шт`
                    : item.quantityG === null
                      ? 'масса неизвестна'
                      : `${Math.round(item.quantityG)} ${item.unit}`;
                const editing = editingId === item.id;
                return (
                  <View key={item.id} style={styles.card}>
                    <View style={styles.cardMain}>
                      <Text style={styles.cardTitle}>{item.displayName}</Text>
                      <Text style={styles.cardSub}>
                        {qtyLabel}
                        {item.productId ? ' · в каталоге' : ''}
                      </Text>
                      <View style={styles.row}>
                        {LOCATIONS.map((l) => (
                          <Pressable
                            key={l.id}
                            onPress={() => {
                              repo.upsertPantryItem({
                                id: item.id,
                                displayName: item.displayName,
                                productId: item.productId,
                                location: l.id,
                                unit: item.unit,
                                quantityG: item.quantityG,
                                quantityCount: item.quantityCount,
                              });
                              refresh();
                            }}
                            style={[styles.miniChip, item.location === l.id && styles.chipOn]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: item.location === l.id }}
                            accessibilityLabel={`${item.displayName}: ${l.label}`}
                          >
                            <Text
                              style={[
                                styles.miniChipText,
                                item.location === l.id && styles.chipTextOn,
                              ]}
                            >
                              {l.label.slice(0, 4)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      {editing ? (
                        <View style={styles.editRow}>
                          <TextInput
                            value={editQty}
                            onChangeText={setEditQty}
                            keyboardType="decimal-pad"
                            style={styles.editInput}
                            accessibilityLabel="Новое количество"
                          />
                          <Pressable onPress={() => saveEdit(item.id)} style={styles.smallBtn}>
                            <Text style={styles.smallBtnText}>OK</Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.sideActions}>
                      <Pressable
                        onPress={() => {
                          setEditingId(item.id);
                          setEditQty(
                            item.unit === 'pcs'
                              ? item.quantityCount != null
                                ? String(item.quantityCount)
                                : ''
                              : item.quantityG != null
                                ? String(item.quantityG)
                                : '',
                          );
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Изменить ${item.displayName}`}
                      >
                        <Text style={styles.linkBtn}>Кол-во</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          repo.softDeletePantryItem(item.id);
                          refresh();
                          showFlash('Удалено из запасов');
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Удалить ${item.displayName}`}
                      >
                        <Text style={styles.deleteText}>Удалить</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ),
        )
      )}

      <Pressable
        onPress={() => setAddOpen((v) => !v)}
        style={styles.addToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: addOpen }}
        accessibilityLabel={addOpen ? 'Скрыть форму добавления' : 'Добавить запас'}
      >
        <Text style={styles.addToggleText}>{addOpen ? 'Скрыть форму' : '+ Добавить запас'}</Text>
      </Pressable>

      {addOpen ? (
        <View style={styles.addPanel}>
          <TextInput
            value={name}
            onChangeText={(t) => {
              setName(t);
              setLinkedProduct(null);
            }}
            placeholder="Например: творог"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            accessibilityLabel="Название продукта в запасах"
          />
          {productSuggestions.length > 0 ? (
            <View style={styles.suggest}>
              {productSuggestions.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setLinkedProduct(p);
                    setName(p.name);
                  }}
                  style={[styles.suggestChip, linkedProduct?.id === p.id && styles.suggestOn]}
                  accessibilityRole="button"
                  accessibilityLabel={`Связать с ${p.name}`}
                >
                  <Text style={styles.suggestText}>{p.name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {linkedProduct ? (
            <Text style={styles.linkOk}>Связано с каталогом</Text>
          ) : null}
          <TextInput
            value={qty}
            onChangeText={setQty}
            placeholder="Количество (пусто = неизвестно)"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            style={styles.input}
            accessibilityLabel="Количество"
          />
          <View style={styles.row}>
            {LOCATIONS.map((l) => (
              <Pressable
                key={l.id}
                onPress={() => setLocation(l.id)}
                style={[styles.chip, location === l.id && styles.chipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: location === l.id }}
                accessibilityLabel={l.label}
              >
                <Text style={[styles.chipText, location === l.id && styles.chipTextOn]}>
                  {l.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.row}>
            {UNITS.map((u) => (
              <Pressable
                key={u.id}
                onPress={() => setUnit(u.id)}
                style={[styles.chip, unit === u.id && styles.chipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: unit === u.id }}
                accessibilityLabel={`Единица ${u.label}`}
              >
                <Text style={[styles.chipText, unit === u.id && styles.chipTextOn]}>{u.label}</Text>
              </Pressable>
            ))}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppButton
            label="Сохранить в запасы"
            onPress={() => {
              if (addItem()) setAddOpen(false);
            }}
          />
        </View>
      ) : null}

      <Text style={styles.section}>Приготовленные партии</Text>
      <Text style={styles.hint}>
        Укажи фактический выход (г), если отличается от рецепта — иначе возьмём выход рецепта.
      </Text>
      <TextInput
        value={batchYield}
        onChangeText={setBatchYield}
        placeholder="Выход партии, г (опционально)"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        style={styles.input}
        accessibilityLabel="Выход готовой партии в граммах"
      />
      {batches.length === 0 ? (
        <Text style={styles.hint}>Нет остатков. Отметь готовку — потом лог порции спишет граммы.</Text>
      ) : (
        <View style={styles.list}>
          {batches.map((b) => {
            const recipe = repo.getRecipe(b.recipeId);
            return (
              <View key={b.id} style={styles.card}>
                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle}>{recipe?.name ?? 'Рецепт'}</Text>
                  <Text style={styles.cardSub}>
                    Остаток {Math.round(b.remainingG)} г из {Math.round(b.initialYieldG)} г
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push('/plan/eat-now')}
                  accessibilityRole="button"
                  accessibilityLabel="Что съесть из партии"
                >
                  <Text style={styles.linkBtn}>Съесть</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {recipes.length > 0 ? (
        <>
          <Text style={styles.section}>Отметить приготовленным</Text>
          <View style={styles.list}>
            {recipes.slice(0, 16).map((r) => (
              <Pressable
                key={r.id}
                onPress={() => markCooked(r.id)}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Отметить приготовленным: ${r.name}`}
              >
                <Text style={styles.cardTitle}>{r.name}</Text>
                <Text style={styles.cardSub}>
                  По умолчанию {Math.round(r.cookedYieldG)} г · создать партию
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  lead: { fontSize: type.body, color: colors.textSecondary, lineHeight: 22 },
  addToggle: {
    minHeight: touchMin,
    justifyContent: 'center',
    paddingVertical: space.sm,
  },
  addToggleText: { fontSize: type.body, fontWeight: '800', color: colors.text },
  addPanel: { gap: space.sm },
  miniChip: {
    minHeight: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  miniChipText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  section: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: space.sm,
  },
  input: {
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    fontSize: type.body,
    color: colors.text,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: touchMin,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  chipTextOn: { color: colors.primaryButtonText },
  suggest: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  suggestChip: {
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.accentSoft,
  },
  suggestOn: { borderColor: colors.accent, backgroundColor: colors.surface },
  suggestText: { fontSize: type.caption, fontWeight: '600', color: colors.text },
  linkOk: { fontSize: type.caption, color: colors.success, fontWeight: '600' },
  error: { color: colors.danger, fontSize: type.caption },
  group: { gap: space.sm },
  groupTitle: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  list: { gap: space.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: touchMin,
  },
  pressed: { opacity: 0.9 },
  cardMain: { flex: 1, gap: 2 },
  cardTitle: { fontSize: type.subtitle, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: type.caption, color: colors.textSecondary },
  sideActions: { gap: space.sm, alignItems: 'flex-end' },
  linkBtn: { fontSize: type.caption, fontWeight: '800', color: colors.text },
  deleteText: { fontSize: type.caption, fontWeight: '700', color: colors.danger },
  hint: { fontSize: type.caption, color: colors.textMuted, lineHeight: 18 },
  editRow: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  editInput: {
    flex: 1,
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    color: colors.text,
  },
  smallBtn: {
    minHeight: touchMin,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnText: { color: colors.primaryButtonText, fontWeight: '800' },
});

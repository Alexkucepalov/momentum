import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { PantryLocation, PantryUnit } from '../../../../src/storage/types';
import { EmptyState } from '@/src/components/EmptyState';
import { FormScrollView } from '@/src/components/FormScrollView';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

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

export default function PantryScreen() {
  const { repo, refresh, revision, showFlash } = useData();
  void revision;

  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [location, setLocation] = useState<PantryLocation>('fridge');
  const [unit, setUnit] = useState<PantryUnit>('g');
  const [error, setError] = useState<string | null>(null);

  const items = repo.listPantryItems();
  const batches = repo.listCookedBatches({ onlyRemaining: true });
  const recipes = useMemo(() => repo.listRecipes(), [repo, revision]);

  const addItem = () => {
    setError(null);
    try {
      const quantity = parseOptionalQty(qty);
      repo.upsertPantryItem({
        displayName: name,
        location,
        unit,
        quantityG: unit === 'pcs' ? null : quantity,
        quantityCount: unit === 'pcs' ? quantity : null,
      });
      setName('');
      setQty('');
      refresh();
      showFlash('Добавлено в запасы');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    }
  };

  const markCooked = (recipeId: string) => {
    try {
      repo.createCookedBatch({ recipeId });
      refresh();
      showFlash('Партия отмечена');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать партию');
    }
  };

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Запасы дома и остатки приготовленного. Лог порции рецепта уменьшает партию, если она есть.
      </Text>

      <Text style={styles.section}>Добавить продукт</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Название"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        accessibilityLabel="Название продукта в запасах"
      />
      <TextInput
        value={qty}
        onChangeText={setQty}
        placeholder="Количество (можно пусто)"
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
            <Text style={[styles.chipText, location === l.id && styles.chipTextOn]}>{l.label}</Text>
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
      <PrimaryButton label="Сохранить в запасы" onPress={addItem} />

      <Text style={styles.section}>Запасы</Text>
      {items.length === 0 ? (
        <EmptyState
          compact
          icon="cube-outline"
          title="Пока пусто"
          body="Добавь то, что есть в холодильнике или морозилке — фильтр «Дома» в Eat Now это учтёт."
        />
      ) : (
        <View style={styles.list}>
          {items.map((item) => {
            const qtyLabel =
              item.unit === 'pcs'
                ? item.quantityCount === null
                  ? 'кол-во неизвестно'
                  : `${item.quantityCount} шт`
                : item.quantityG === null
                  ? 'масса неизвестна'
                  : `${Math.round(item.quantityG)} ${item.unit}`;
            const loc = LOCATIONS.find((l) => l.id === item.location)?.label ?? item.location;
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle}>{item.displayName}</Text>
                  <Text style={styles.cardSub}>
                    {loc} · {qtyLabel}
                    {item.expiresOn ? ` · до ${item.expiresOn}` : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    repo.softDeletePantryItem(item.id);
                    refresh();
                    showFlash('Удалено из запасов');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Удалить ${item.displayName}`}
                  hitSlop={8}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteText}>Удалить</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <Text style={styles.section}>Приготовленные партии</Text>
      {batches.length === 0 ? (
        <Text style={styles.hint}>Нет остатков. Отметь готовку ниже — потом лог порции спишет граммы.</Text>
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
              </View>
            );
          })}
        </View>
      )}

      <Text style={styles.section}>Отметить приготовленным</Text>
      {recipes.length === 0 ? (
        <Text style={styles.hint}>Сначала добавь рецепт.</Text>
      ) : (
        <View style={styles.list}>
          {recipes.slice(0, 12).map((r) => (
            <Pressable
              key={r.id}
              onPress={() => markCooked(r.id)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Отметить приготовленным: ${r.name}`}
            >
              <Text style={styles.cardTitle}>{r.name}</Text>
              <Text style={styles.cardSub}>Выход {Math.round(r.cookedYieldG)} г · создать партию</Text>
            </Pressable>
          ))}
        </View>
      )}
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
    minHeight: 36,
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
  error: { color: colors.danger, fontSize: type.caption },
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
  deleteBtn: { paddingVertical: space.sm, paddingHorizontal: space.sm },
  deleteText: { fontSize: type.caption, fontWeight: '700', color: colors.danger },
  hint: { fontSize: type.caption, color: colors.textMuted, lineHeight: 18 },
});

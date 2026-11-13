import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedTextInput as TextInput } from '@/src/design-system/components/ThemedTextInput';

import type { MealSlot } from '../../../../../src/storage/types';
import { SwipeToDismissSheet } from '@/src/components/SwipeToDismissSheet';
import { AppButton, AppText, Field, colors, radius, space, touchMin } from '@/src/design-system';
import { MEAL_LABELS_RU } from './mealBoardLabels';

export type AddPick =
  | { kind: 'recipe'; id: string; name: string }
  | { kind: 'product'; id: string; name: string };

export function AddPlannedMealSheet({
  visible,
  slot,
  dayLabel,
  recipes,
  products,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  slot: MealSlot;
  dayLabel: string;
  recipes: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string }>;
  onClose: () => void;
  onConfirm: (pick: AddPick, grams: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [gramsRaw, setGramsRaw] = useState('200');
  const [picked, setPicked] = useState<AddPick | null>(null);

  const q = query.trim().toLowerCase();
  const filteredRecipes = useMemo(
    () => recipes.filter((r) => !q || r.name.toLowerCase().includes(q)).slice(0, 40),
    [recipes, q],
  );
  const filteredProducts = useMemo(
    () => products.filter((p) => !q || p.name.toLowerCase().includes(q)).slice(0, 40),
    [products, q],
  );

  const resetAndClose = () => {
    setQuery('');
    setGramsRaw('200');
    setPicked(null);
    onClose();
  };

  const submit = () => {
    if (!picked) return;
    const grams = Number(gramsRaw.replace(',', '.'));
    if (!Number.isFinite(grams) || grams <= 0) return;
    onConfirm(picked, grams);
    resetAndClose();
  };

  return (
    <SwipeToDismissSheet visible={visible} onClose={resetAndClose} maxHeightRatio={0.92} testID="add-planned-sheet">
      <View style={styles.pad}>
        <AppText variant="title" style={styles.title}>
          Добавить
        </AppText>
        <AppText variant="caption" tone="muted">
          {dayLabel} · {MEAL_LABELS_RU[slot]} · не дневник
        </AppText>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Поиск рецепта или продукта"
          placeholderTextColor={colors.textMuted}
          style={styles.search}
          accessibilityLabel="Поиск"
        />

        <Field
          label="Граммы"
          value={gramsRaw}
          onChangeText={setGramsRaw}
          keyboardType="decimal-pad"
          placeholder="200"
        />

        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          <AppText variant="label" tone="muted" style={styles.section}>
            Рецепты
          </AppText>
          {filteredRecipes.length === 0 ? (
            <AppText variant="caption" tone="muted">
              Нет совпадений
            </AppText>
          ) : (
            filteredRecipes.map((r) => (
              <PickRow
                key={r.id}
                label={r.name}
                selected={picked?.kind === 'recipe' && picked.id === r.id}
                onPress={() => setPicked({ kind: 'recipe', id: r.id, name: r.name })}
              />
            ))
          )}
          <AppText variant="label" tone="muted" style={styles.section}>
            Продукты
          </AppText>
          {filteredProducts.length === 0 ? (
            <AppText variant="caption" tone="muted">
              Нет совпадений
            </AppText>
          ) : (
            filteredProducts.map((p) => (
              <PickRow
                key={p.id}
                label={p.name}
                selected={picked?.kind === 'product' && picked.id === p.id}
                onPress={() => setPicked({ kind: 'product', id: p.id, name: p.name })}
              />
            ))
          )}
        </ScrollView>

        <AppButton label="Добавить в план" onPress={submit} disabled={!picked} />
      </View>
    </SwipeToDismissSheet>
  );
}

function PickRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pick,
        selected && styles.pickOn,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <AppText variant="body" style={selected ? styles.pickTextOn : undefined}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, gap: space.sm, flex: 1 },
  title: { fontWeight: '800' },
  search: {
    minHeight: touchMin,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    backgroundColor: colors.canvas,
    color: colors.ink,
  },
  list: { maxHeight: 280 },
  section: {
    marginTop: space.md,
    marginBottom: space.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  pick: {
    minHeight: touchMin,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: space.xs,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  pickOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  pickTextOn: { color: colors.onAccent, fontWeight: '600' },
  pressed: { opacity: 0.88 },
});

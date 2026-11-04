import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { recipePortion } from '../../../../../../src/domain/nutrition';
import type { Recipe } from '../../../../../../src/storage/types';
import { MacroStrip } from '../../../components/MacroStrip';
import { colors, radius, space, touchMin, type } from '../../../theme/tokens';
import { emptyIngredient, type DraftIngredient } from './types';
import { AppButton } from '@/src/design-system';

export function RecipesPanel({
  recipes,
  getIngredientCount,
  onPickRecipe,
  onQuickAddRecipe,
  onCreateRecipe,
}: {
  recipes: Recipe[];
  getIngredientCount: (recipeId: string) => number;
  onPickRecipe: (recipe: Recipe) => void;
  onQuickAddRecipe: (recipe: Recipe) => void;
  onCreateRecipe: (input: {
    name: string;
    cookedYieldG: number;
    ingredients: Array<{
      displayName: string;
      rawGrams: number;
      nutritionPer100g: {
        kcal: number | null;
        protein: number | null;
        fat: number | null;
        carbs: number | null;
      };
    }>;
  }) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [yieldG, setYieldG] = useState('');
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([emptyIngredient()]);
  const [error, setError] = useState<string | null>(null);

  const parseOptional = (raw: string): number | null => {
    const t = raw.trim();
    if (t === '') return null;
    const n = Number(t.replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) throw new Error('Число должно быть ≥ 0');
    return n;
  };

  const parseRequired = (raw: string, label: string): number => {
    const n = Number(String(raw).replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) throw new Error(`${label}: число ≥ 0`);
    return n;
  };

  const recipePreview = (() => {
    try {
      const cooked = Number(yieldG.replace(',', '.'));
      if (!Number.isFinite(cooked) || cooked <= 0) return null;
      const parsed = ingredients.map((ing) => ({
        grams: parseRequired(ing.rawGrams || '0', 'Граммы'),
        nutritionPer100g: {
          kcal: parseOptional(ing.kcalPer100),
          protein: parseOptional(ing.proteinPer100),
          fat: parseOptional(ing.fatPer100),
          carbs: parseOptional(ing.carbPer100),
        },
      }));
      if (!parsed.some((p) => p.grams > 0)) return null;
      const sample = recipePortion(parsed, cooked, Math.min(200, cooked));
      return { sampleGrams: Math.min(200, cooked), nutrition: sample };
    } catch {
      return null;
    }
  })();

  const save = () => {
    try {
      setError(null);
      const cooked = Number(yieldG.replace(',', '.'));
      if (!Number.isFinite(cooked) || cooked <= 0) throw new Error('Выход готового блюда должен быть > 0');
      const nameTrim = recipeName.trim();
      if (!nameTrim) throw new Error('Укажи название рецепта');
      const parsed = ingredients
        .map((ing) => {
          const displayName = ing.displayName.trim();
          if (!displayName && !ing.rawGrams.trim()) return null;
          if (!displayName) throw new Error('У каждого ингредиента нужно имя');
          return {
            displayName,
            rawGrams: parseRequired(ing.rawGrams, displayName),
            nutritionPer100g: {
              kcal: parseOptional(ing.kcalPer100),
              protein: parseOptional(ing.proteinPer100),
              fat: parseOptional(ing.fatPer100),
              carbs: parseOptional(ing.carbPer100),
            },
          };
        })
        .filter((x): x is NonNullable<typeof x> => x != null);
      if (!parsed.length) throw new Error('Добавь хотя бы один ингредиент');
      onCreateRecipe({ name: nameTrim, cookedYieldG: cooked, ingredients: parsed });
      setRecipeName('');
      setYieldG('');
      setIngredients([emptyIngredient()]);
      setCreating(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    }
  };

  const updateIngredient = (key: string, patch: Partial<DraftIngredient>) => {
    setIngredients((list) => list.map((ing) => (ing.key === key ? { ...ing, ...patch } : ing)));
  };

  return (
    <View>
      {recipes.length === 0 && !creating ? (
        <Text style={styles.hint}>Пока нет рецептов. Создай один — потом порции в один тап.</Text>
      ) : null}

      {recipes.map((r) => {
        const ingCount = getIngredientCount(r.id);
        return (
          <View key={r.id} style={styles.recipeCard}>
            <Pressable
              style={styles.recipeMain}
              onPress={() => onPickRecipe(r)}
              accessibilityRole="button"
              accessibilityLabel={`Рецепт ${r.name}, выбрать порцию`}
            >
              {r.photoUri ? (
                <Image source={{ uri: r.photoUri }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbEmpty]}>
                  <Ionicons name="restaurant-outline" size={20} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.recipeBody}>
                <Text style={styles.recipeTitle} numberOfLines={2}>
                  {r.name}
                </Text>
                <Text style={styles.recipeMeta}>
                  Выход {r.cookedYieldG} г · {ingCount} ингр.
                </Text>
                <MacroStrip
                  energyKcal={r.energyKcalPer100g}
                  proteinG={r.proteinGPer100g}
                  fatG={r.fatGPer100g}
                  carbG={r.carbGPer100g}
                />
              </View>
            </Pressable>
            <Pressable
              style={styles.quick}
              onPress={() => onQuickAddRecipe(r)}
              accessibilityRole="button"
              accessibilityLabel={`Быстро добавить ${r.name}`}
            >
              <Ionicons name="add" size={22} color={colors.primaryButtonText} />
            </Pressable>
          </View>
        );
      })}

      {!creating ? (
        <Pressable
          style={styles.createBtn}
          onPress={() => setCreating(true)}
          accessibilityRole="button"
          accessibilityLabel="Создать новый рецепт"
        >
          <Ionicons name="add" size={20} color={colors.text} />
          <Text style={styles.createText}>Новый рецепт</Text>
        </Pressable>
      ) : (
        <View style={styles.createCard}>
          <View style={styles.createHead}>
            <Text style={styles.createTitle}>Новый рецепт</Text>
            <Pressable onPress={() => setCreating(false)} accessibilityRole="button">
              <Text style={styles.cancel}>Свернуть</Text>
            </Pressable>
          </View>
          <Field label="Название" value={recipeName} onChangeText={setRecipeName} />
          <Field
            label="Вес готового блюда, г"
            value={yieldG}
            onChangeText={setYieldG}
            keyboardType="decimal-pad"
          />
          {ingredients.map((ing, index) => (
            <View key={ing.key} style={styles.ingCard}>
              <View style={styles.ingHead}>
                <Text style={styles.ingTitle}>Ингредиент {index + 1}</Text>
                {ingredients.length > 1 ? (
                  <Pressable
                    onPress={() => setIngredients((list) => list.filter((x) => x.key !== ing.key))}
                    accessibilityRole="button"
                    accessibilityLabel={`Удалить ингредиент ${index + 1}`}
                  >
                    <Text style={styles.remove}>Удалить</Text>
                  </Pressable>
                ) : null}
              </View>
              <Field
                label="Название"
                value={ing.displayName}
                onChangeText={(t) => updateIngredient(ing.key, { displayName: t })}
              />
              <Field
                label="Сырые граммы"
                value={ing.rawGrams}
                onChangeText={(t) => updateIngredient(ing.key, { rawGrams: t })}
                keyboardType="decimal-pad"
              />
              <View style={styles.macroRow}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Б"
                    value={ing.proteinPer100}
                    onChangeText={(t) => updateIngredient(ing.key, { proteinPer100: t })}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Ж"
                    value={ing.fatPer100}
                    onChangeText={(t) => updateIngredient(ing.key, { fatPer100: t })}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="У"
                    value={ing.carbPer100}
                    onChangeText={(t) => updateIngredient(ing.key, { carbPer100: t })}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <Field
                label="ккал / 100г (авто из БЖУ)"
                value={ing.kcalPer100}
                onChangeText={(t) => updateIngredient(ing.key, { kcalPer100: t })}
                keyboardType="decimal-pad"
              />
            </View>
          ))}
          <Pressable
            style={styles.addIng}
            onPress={() => setIngredients((list) => [...list, emptyIngredient()])}
            accessibilityRole="button"
            accessibilityLabel="Добавить ингредиент"
          >
            <Text style={styles.addIngText}>+ Ингредиент</Text>
          </Pressable>
          {recipePreview ? (
            <View style={styles.preview}>
              <Text style={styles.previewTitle}>Превью {recipePreview.sampleGrams} г</Text>
              <Text style={styles.previewBody}>
                {recipePreview.nutrition.kcal === null
                  ? '—'
                  : Math.round(recipePreview.nutrition.kcal)}{' '}
                ккал · Б{' '}
                {recipePreview.nutrition.protein === null
                  ? '—'
                  : Math.round(recipePreview.nutrition.protein)}{' '}
                · Ж{' '}
                {recipePreview.nutrition.fat === null ? '—' : Math.round(recipePreview.nutrition.fat)} · У{' '}
                {recipePreview.nutrition.carbs === null
                  ? '—'
                  : Math.round(recipePreview.nutrition.carbs)}
              </Text>
            </View>
          ) : (
            <Text style={styles.hint}>Сырые ингредиенты + вес готового → порция пересчитается.</Text>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppButton label="Сохранить и выбрать порцию" onPress={save} />
        </View>
      )}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={styles.input}
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: colors.textSecondary,
    fontSize: type.body,
    lineHeight: 20,
    marginBottom: space.md,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: space.sm,
    marginBottom: space.sm,
  },
  recipeMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.sm,
    minHeight: touchMin,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  recipeBody: { flex: 1 },
  recipeTitle: { fontSize: type.body, fontWeight: '700', color: colors.text },
  recipeMeta: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
  quick: {
    width: touchMin,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: touchMin,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: space.sm,
  },
  createText: { fontWeight: '700', color: colors.text },
  createCard: {
    marginTop: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  createHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  createTitle: { fontWeight: '800', fontSize: type.subtitle, color: colors.text },
  cancel: { fontWeight: '600', color: colors.textMuted },
  field: { marginBottom: space.md },
  fieldLabel: { fontSize: type.caption, color: colors.textSecondary, marginBottom: space.xs },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.text,
  },
  ingCard: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.md,
  },
  ingHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.sm },
  ingTitle: { fontWeight: '700', color: colors.text },
  remove: { color: colors.danger, fontWeight: '600' },
  macroRow: { flexDirection: 'row', gap: space.sm },
  addIng: {
    minHeight: touchMin,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  addIngText: { fontWeight: '700', color: colors.text },
  preview: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.md,
  },
  previewTitle: { fontWeight: '700', color: colors.text, marginBottom: 4 },
  previewBody: { color: colors.textSecondary, fontSize: type.body },
  error: { color: colors.danger, marginBottom: space.sm },
});

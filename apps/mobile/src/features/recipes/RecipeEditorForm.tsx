import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Nutrition } from '../../../../../src/domain/nutrition';
import { autoKcalStringFromMacroStrings } from '../../../../../src/domain/nutritionConsistency';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAutoKcalFromMacros } from '../../hooks/useAutoKcalFromMacros';
import {
  pickRecipePhotoFromLibrary,
  takeRecipePhoto,
} from '../../media/recipePhoto';
import { colors, elevation, radius, space, touchMin, type } from '../../theme/tokens';
import { emptyIngredient, type DraftIngredient } from '../diary/addFood/types';

export type RecipeFormValues = {
  name: string;
  cookedYieldG: number;
  description: string | null;
  instructions: string | null;
  photoUri: string | null;
  nutritionPer100g: Nutrition | null;
  ingredients: Array<{
    displayName: string;
    rawGrams: number;
    nutritionPer100g: Nutrition;
  }>;
};

export type RecipeFormInitial = {
  name?: string;
  cookedYieldG?: number;
  description?: string | null;
  instructions?: string | null;
  photoUri?: string | null;
  energyKcalPer100g?: number | null;
  proteinGPer100g?: number | null;
  fatGPer100g?: number | null;
  carbGPer100g?: number | null;
  ingredients?: DraftIngredient[];
};

function numToField(n: number | null | undefined): string {
  return n === null || n === undefined ? '' : String(n);
}

export function RecipeEditorForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: RecipeFormInitial;
  submitLabel: string;
  onSubmit: (values: RecipeFormValues) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [yieldG, setYieldG] = useState(
    initial?.cookedYieldG != null ? String(initial.cookedYieldG) : '',
  );
  const [description, setDescription] = useState(initial?.description ?? '');
  const [instructions, setInstructions] = useState(initial?.instructions ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(initial?.photoUri ?? null);
  const [kcal, setKcal] = useState(numToField(initial?.energyKcalPer100g));
  const [protein, setProtein] = useState(numToField(initial?.proteinGPer100g));
  const [fat, setFat] = useState(numToField(initial?.fatGPer100g));
  const [carbs, setCarbs] = useState(numToField(initial?.carbGPer100g));
  const [ingredients, setIngredients] = useState<DraftIngredient[]>(
    initial?.ingredients?.length ? initial.ingredients : [emptyIngredient()],
  );
  const [error, setError] = useState<string | null>(null);

  useAutoKcalFromMacros({
    protein,
    fat,
    carbs,
    setKcal,
    syncFromStart: true,
    seedKey: initial?.name ?? 'new',
  });

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

  const attachPhoto = () => {
    Alert.alert('Фото рецепта', 'Выбери источник', [
      {
        text: 'Галерея',
        onPress: () => {
          void (async () => {
            try {
              const uri = await pickRecipePhotoFromLibrary();
              if (uri) setPhotoUri(uri);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Не удалось выбрать фото');
            }
          })();
        },
      },
      {
        text: 'Камера',
        onPress: () => {
          void (async () => {
            try {
              const uri = await takeRecipePhoto();
              if (uri) setPhotoUri(uri);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Не удалось сделать фото');
            }
          })();
        },
      },
      ...(photoUri
        ? [
            {
              text: 'Убрать фото',
              style: 'destructive' as const,
              onPress: () => setPhotoUri(null),
            },
          ]
        : []),
      { text: 'Отмена', style: 'cancel' as const },
    ]);
  };

  const save = () => {
    try {
      setError(null);
      const nameTrim = name.trim();
      if (!nameTrim) throw new Error('Укажи название рецепта');
      const cooked = Number(yieldG.replace(',', '.'));
      if (!Number.isFinite(cooked) || cooked <= 0) {
        throw new Error('Выход готового блюда должен быть > 0');
      }
      const nutritionPer100g = {
        kcal: parseOptional(kcal),
        protein: parseOptional(protein),
        fat: parseOptional(fat),
        carbs: parseOptional(carbs),
      };
      const hasManual =
        nutritionPer100g.kcal !== null ||
        nutritionPer100g.protein !== null ||
        nutritionPer100g.fat !== null ||
        nutritionPer100g.carbs !== null;

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

      if (!parsed.length && !hasManual) {
        throw new Error('Впиши КБЖУ на 100 г готового блюда или добавь ингредиенты');
      }

      onSubmit({
        name: nameTrim,
        cookedYieldG: cooked,
        description: description.trim() || null,
        instructions: instructions.trim() || null,
        photoUri,
        nutritionPer100g: hasManual ? nutritionPer100g : null,
        ingredients: parsed,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    }
  };

  const updateIngredient = (key: string, patch: Partial<DraftIngredient>) => {
    setIngredients((list) =>
      list.map((ing) => {
        if (ing.key !== key) return ing;
        const next = { ...ing, ...patch };
        const macrosChanged =
          'proteinPer100' in patch || 'fatPer100' in patch || 'carbPer100' in patch;
        if (macrosChanged) {
          const auto = autoKcalStringFromMacroStrings(
            next.proteinPer100,
            next.fatPer100,
            next.carbPer100,
          );
          if (auto !== null) next.kcalPer100 = auto;
        }
        return next;
      }),
    );
  };

  return (
    <View>
      <Text style={styles.blockLabel}>1. Название и выход</Text>
      <Field label="Название" value={name} onChangeText={setName} placeholder="например Сырники" />
      <Field
        label="Фактический выход готового, г"
        value={yieldG}
        onChangeText={setYieldG}
        keyboardType="decimal-pad"
        placeholder="500"
      />

      <Text style={styles.blockLabel}>2. Ингредиенты</Text>
      <Text style={styles.lead}>
        Структурированный список с массой и КБЖУ на 100 г. Описание в свободном тексте не участвует в
        расчёте.
      </Text>
      {ingredients.map((ing, index) => (
        <View key={ing.key} style={styles.ingCard}>
          <Text style={styles.ingIndex}>#{index + 1}</Text>
          <Field
            label="Продукт"
            value={ing.displayName}
            onChangeText={(t) => updateIngredient(ing.key, { displayName: t })}
            placeholder="творог"
          />
          <Field
            label="Масса, г"
            value={ing.rawGrams}
            onChangeText={(t) => updateIngredient(ing.key, { rawGrams: t })}
            keyboardType="decimal-pad"
          />
          <Text style={styles.ingSub}>КБЖУ на 100 г (пусто = неизвестно)</Text>
          <View style={styles.macroRow}>
            <View style={styles.third}>
              <Field
                label="Б"
                value={ing.proteinPer100}
                onChangeText={(t) => updateIngredient(ing.key, { proteinPer100: t })}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.third}>
              <Field
                label="Ж"
                value={ing.fatPer100}
                onChangeText={(t) => updateIngredient(ing.key, { fatPer100: t })}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.third}>
              <Field
                label="У"
                value={ing.carbPer100}
                onChangeText={(t) => updateIngredient(ing.key, { carbPer100: t })}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <Field
            label="ккал (авто из БЖУ)"
            value={ing.kcalPer100}
            onChangeText={(t) => updateIngredient(ing.key, { kcalPer100: t })}
            keyboardType="decimal-pad"
          />
          {ingredients.length > 1 ? (
            <Pressable
              onPress={() => setIngredients((list) => list.filter((x) => x.key !== ing.key))}
              accessibilityRole="button"
              accessibilityLabel="Удалить ингредиент"
            >
              <Text style={styles.remove}>Удалить строку</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      <Pressable
        style={styles.addIng}
        onPress={() => setIngredients((list) => [...list, emptyIngredient()])}
        accessibilityRole="button"
        accessibilityLabel="Добавить ингредиент"
      >
        <Ionicons name="add" size={18} color={colors.text} />
        <Text style={styles.addIngText}>Строка ингредиента</Text>
      </Pressable>

      <Text style={styles.blockLabel}>3. КБЖУ готового на 100 г</Text>
      <Text style={styles.lead}>
        Если заданы Б/Ж/У — ккал считаются как 4×Б+9×Ж+4×У (можно поправить вручную). Приоритетнее
        расчёта из ингредиентов при добавлении порции.
      </Text>
      <View style={styles.macroRow}>
        <View style={styles.third}>
          <Field label="Белки" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" />
        </View>
        <View style={styles.third}>
          <Field label="Жиры" value={fat} onChangeText={setFat} keyboardType="decimal-pad" />
        </View>
        <View style={styles.third}>
          <Field label="Углеводы" value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" />
        </View>
      </View>
      <Field
        label="ккал (авто из БЖУ)"
        value={kcal}
        onChangeText={setKcal}
        keyboardType="decimal-pad"
      />

      <Text style={styles.blockLabel}>4. Описание и шаги (не для КБЖУ)</Text>
      <Field
        label="Описание"
        value={description}
        onChangeText={setDescription}
        placeholder="Коротко о блюде"
        multiline
      />
      <Field
        label="Как готовить"
        value={instructions}
        onChangeText={setInstructions}
        placeholder="Шаги приготовления"
        multiline
      />

      <Text style={styles.blockLabel}>5. Фото (необязательно)</Text>
      <Pressable
        style={styles.photoBox}
        onPress={attachPhoto}
        accessibilityRole="button"
        accessibilityLabel={photoUri ? 'Изменить фото рецепта' : 'Добавить фото рецепта'}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} accessibilityIgnoresInvertColors />
        ) : (
          <View style={styles.photoEmpty}>
            <Ionicons name="camera-outline" size={22} color={colors.textMuted} />
            <Text style={styles.photoHint}>Добавить фото</Text>
          </View>
        )}
      </Pressable>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      ) : null}
      <PrimaryButton label={submitLabel} onPress={save} />
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline && styles.inputMulti]}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  photoBox: {
    height: 120,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.md,
  },
  photo: { width: '100%', height: '100%' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  photoHint: { color: colors.textMuted, fontWeight: '600', fontSize: type.caption },
  field: { marginBottom: space.sm },
  fieldLabel: {
    fontSize: type.caption,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: touchMin,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.text,
  },
  inputMulti: { minHeight: 88, paddingVertical: space.sm },
  blockLabel: {
    marginTop: space.lg,
    marginBottom: space.xs,
    fontSize: type.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  lead: {
    fontSize: type.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: space.sm,
  },
  macroRow: { flexDirection: 'row', gap: space.sm },
  third: { flex: 1 },
  ingCard: {
    padding: space.md,
    marginBottom: space.sm,
  },
  ingIndex: {
    fontSize: type.micro,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: space.xs,
  },
  ingSub: {
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: space.xs,
    marginTop: space.xs,
  },
  remove: {
    color: colors.danger,
    fontWeight: '600',
    marginTop: space.sm,
    fontSize: type.caption,
  },
  addIng: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: touchMin,
    marginBottom: space.md,
  },
  addIngText: { fontWeight: '700', color: colors.text, fontSize: type.body },
  error: { color: colors.danger, marginBottom: space.sm, fontSize: type.caption },
});

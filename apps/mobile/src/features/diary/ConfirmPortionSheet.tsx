import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { portion, type Nutrition } from '../../../../../src/domain/nutrition';
import { nutritionConsistencyHint } from '../../../../../src/domain/nutritionConsistency';
import { nutritionForRecipePortion } from '../../../../../src/domain/recipeNutrition';
import type { FoodProduct, MealSlot, Recipe, RecipeIngredient } from '../../../../../src/storage/types';
import { FormScrollView } from '../../components/FormScrollView';
import { PortionStepper } from '../../components/PortionStepper';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SwipeToDismissSheet } from '../../components/SwipeToDismissSheet';
import { useAutoKcalFromMacros } from '../../hooks/useAutoKcalFromMacros';
import { colors, radius, space, touchMin, type } from '../../theme/tokens';

export type PortionTarget =
  | { kind: 'product'; product: FoodProduct }
  | {
      kind: 'recipe';
      recipe: Recipe;
      ingredients: RecipeIngredient[];
    };

export type PortionNutritionPer100g = {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
};

export type PortionConfirmResult = {
  grams: number;
  /** Per 100 g of product, or per 100 g of cooked recipe yield. */
  per100g: PortionNutritionPer100g;
};

function fmt(n: number | null): string {
  if (n === null) return '—';
  return String(Math.round(n));
}

function numToField(n: number | null): string {
  return n === null ? '' : String(n);
}

function parseOptionalField(raw: string): number | null {
  const t = raw.trim();
  if (t === '') return null;
  const n = Number(t.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) throw new Error('КБЖУ: число ≥ 0 или пусто');
  return n;
}

function initialPer100g(target: PortionTarget): PortionNutritionPer100g {
  if (target.kind === 'product') {
    const p = target.product;
    return {
      energyKcal: p.energyKcal,
      proteinG: p.proteinG,
      fatG: p.fatG,
      carbG: p.carbG,
    };
  }
  const cooked = nutritionForRecipePortion(target.recipe, target.ingredients, 100);
  return {
    energyKcal: cooked.kcal,
    proteinG: cooked.protein,
    fatG: cooked.fat,
    carbG: cooked.carbs,
  };
}

export function ConfirmPortionSheet({
  visible,
  target,
  meal: _meal,
  mealLabel,
  initialGrams,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  target: PortionTarget | null;
  meal: MealSlot;
  mealLabel: string;
  initialGrams?: number;
  onClose: () => void;
  onConfirm: (result: PortionConfirmResult) => void;
}) {
  void _meal;
  const scrollRef = useRef<ScrollView>(null);
  const macroBlockY = useRef(0);
  const [grams, setGrams] = useState(initialGrams ?? 100);
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [error, setError] = useState<string | null>(null);

  const scrollMacrosIntoView = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, macroBlockY.current - 12),
        animated: true,
      });
    });
  };

  const seedKey =
    visible && target
      ? target.kind === 'product'
        ? `p:${target.product.id}:${initialGrams ?? 100}`
        : `r:${target.recipe.id}:${initialGrams ?? 100}`
      : null;

  useEffect(() => {
    if (!visible || !target) return;
    setGrams(initialGrams ?? 100);
    setError(null);
    const base = initialPer100g(target);
    setKcal(numToField(base.energyKcal));
    setProtein(numToField(base.proteinG));
    setFat(numToField(base.fatG));
    setCarbs(numToField(base.carbG));
  }, [visible, initialGrams, target]);

  useAutoKcalFromMacros({
    protein,
    fat,
    carbs,
    setKcal,
    enabled: visible && target != null,
    syncFromStart: false,
    seedKey,
  });

  const per100gParsed: PortionNutritionPer100g | null = useMemo(() => {
    try {
      return {
        energyKcal: parseOptionalField(kcal),
        proteinG: parseOptionalField(protein),
        fatG: parseOptionalField(fat),
        carbG: parseOptionalField(carbs),
      };
    } catch {
      return null;
    }
  }, [kcal, protein, fat, carbs]);

  const nutrition: Nutrition | null = useMemo(() => {
    if (!per100gParsed) return null;
    try {
      return portion(
        {
          kcal: per100gParsed.energyKcal,
          protein: per100gParsed.proteinG,
          fat: per100gParsed.fatG,
          carbs: per100gParsed.carbG,
        },
        grams,
      );
    } catch {
      return null;
    }
  }, [per100gParsed, grams]);

  const consistencyHint = useMemo(() => {
    if (!nutrition) return null;
    return nutritionConsistencyHint({
      energyKcal: nutrition.kcal,
      proteinG: nutrition.protein,
      fatG: nutrition.fat,
      carbG: nutrition.carbs,
    });
  }, [nutrition]);

  if (!target) return null;

  const title = target.kind === 'product' ? target.product.name : target.recipe.name;
  const source =
    target.kind === 'product'
      ? `Источник: ${target.product.source}`
      : `Рецепт · выход ${target.recipe.cookedYieldG} г`;

  const submit = () => {
    try {
      const per100g = {
        energyKcal: parseOptionalField(kcal),
        proteinG: parseOptionalField(protein),
        fatG: parseOptionalField(fat),
        carbG: parseOptionalField(carbs),
      };
      portion(
        {
          kcal: per100g.energyKcal,
          protein: per100g.proteinG,
          fat: per100g.fatG,
          carbs: per100g.carbG,
        },
        grams,
      );
      onConfirm({ grams, per100g });
      // Caller closes the sheet; do not call onClose() here — that means "cancel".
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Проверь КБЖУ и граммы');
    }
  };

  return (
    <SwipeToDismissSheet visible={visible} onClose={onClose} maxHeightRatio={0.88}>
      <FormScrollView ref={scrollRef} variant="sheet" bounces={false} contentContainerStyle={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Порция
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Закрыть">
            <Text style={styles.close}>Закрыть</Text>
          </Pressable>
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.meta}>
          {source} · в {mealLabel}
        </Text>
        <Text style={styles.portionLead}>
          Сколько съел с упаковки? КБЖУ ниже пересчитаются на эти граммы — не на всю пачку.
        </Text>

        <View
          onLayout={(e) => {
            macroBlockY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.section}>На 100 г</Text>
          <View style={styles.macroGrid}>
            <MacroField label="ккал" value={kcal} onChangeText={setKcal} wide onFocus={scrollMacrosIntoView} />
            <MacroField label="Б" value={protein} onChangeText={setProtein} onFocus={scrollMacrosIntoView} />
            <MacroField label="Ж" value={fat} onChangeText={setFat} onFocus={scrollMacrosIntoView} />
            <MacroField label="У" value={carbs} onChangeText={setCarbs} onFocus={scrollMacrosIntoView} />
          </View>
          <Text style={styles.hint}>
            Пустое = неизвестно (не ноль). Если заданы Б, Ж и У — ккал считаются как 4×Б+9×Ж+4×У
            (этикетку при открытии не перезаписываем, пока не меняешь макросы).
          </Text>
        </View>

        <View style={styles.preview}>
          <Text style={styles.previewKcal}>{fmt(nutrition?.kcal ?? null)}</Text>
          <Text style={styles.previewUnit}>ккал в порции</Text>
          <Text style={styles.previewMacros}>
            Б {fmt(nutrition?.protein ?? null)} · Ж {fmt(nutrition?.fat ?? null)} · У{' '}
            {fmt(nutrition?.carbs ?? null)}
          </Text>
        </View>
        {consistencyHint ? <Text style={styles.consistency}>{consistencyHint}</Text> : null}

        <PortionStepper grams={grams} onChange={setGrams} lastGrams={initialGrams ?? null} />

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="assertive">
            {error}
          </Text>
        ) : null}

        <PrimaryButton label="Добавить в дневник" onPress={submit} />
      </FormScrollView>
    </SwipeToDismissSheet>
  );
}

function MacroField({
  label,
  value,
  onChangeText,
  wide,
  onFocus,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  wide?: boolean;
  onFocus?: () => void;
}) {
  return (
    <View style={[styles.field, wide && styles.fieldWide]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={colors.textMuted}
        style={styles.fieldInput}
        accessibilityLabel={`${label} на 100 грамм`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  title: { fontSize: type.subtitle, fontWeight: '700', color: colors.text },
  close: { fontSize: type.body, fontWeight: '600', color: colors.text, minHeight: touchMin, textAlignVertical: 'center' },
  name: { fontSize: type.title, fontWeight: '800', color: colors.text },
  meta: {
    fontSize: type.caption,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: space.xs,
  },
  portionLead: {
    fontSize: type.caption,
    color: colors.text,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: space.md,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.md,
    paddingVertical: space.sm,
  },
  previewKcal: { fontSize: 28, fontWeight: '800', color: colors.text },
  previewUnit: { fontSize: type.caption, color: colors.textSecondary, fontWeight: '600' },
  previewMacros: {
    flex: 1,
    fontSize: type.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  section: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: space.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.xs,
  },
  field: {
    width: '30%',
    flexGrow: 1,
  },
  fieldWide: {
    width: '100%',
    flexGrow: 0,
  },
  fieldLabel: {
    fontSize: type.micro,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: '600',
  },
  fieldInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    fontSize: type.body,
    fontWeight: '600',
    color: colors.text,
  },
  hint: {
    fontSize: type.micro,
    color: colors.textMuted,
    marginBottom: space.md,
  },
  consistency: {
    fontSize: type.micro,
    color: colors.textMuted,
    marginBottom: space.md,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    marginBottom: space.sm,
    fontSize: type.caption,
  },
});

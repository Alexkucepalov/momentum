import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { SwipeToDismissSheet } from '@/src/components/SwipeToDismissSheet';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

const PRESETS = [100, 200, 300, 400] as const;

function fmt(n: number | null): string {
  return n == null ? '—' : String(Math.round(n));
}

/** Reference portion sheet: stepper, presets, live macros. Does not invent missing values. */
export function PortionAdjustSheet({
  visible,
  title,
  grams,
  preview,
  onClose,
  onSave,
}: {
  visible: boolean;
  title: string;
  grams: number;
  preview: (grams: number) => {
    kcal: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
  };
  onClose: () => void;
  onSave: (grams: number) => void;
}) {
  const [value, setValue] = useState(grams);

  useEffect(() => {
    if (visible) setValue(Math.max(1, Math.round(grams)));
  }, [visible, grams]);

  const nutrition = preview(value);

  return (
    <SwipeToDismissSheet visible={visible} onClose={onClose} maxHeightRatio={0.72}>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.kicker}>Порция</Text>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => setValue((g) => Math.max(10, g - 10))}
            style={styles.step}
            accessibilityRole="button"
            accessibilityLabel="Уменьшить порцию на 10 грамм"
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.grams}>{value} г</Text>
          <Pressable
            onPress={() => setValue((g) => g + 10)}
            style={styles.step}
            accessibilityRole="button"
            accessibilityLabel="Увеличить порцию на 10 грамм"
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
        <View style={styles.presets}>
          {PRESETS.map((g) => {
            const on = value === g;
            return (
              <Pressable
                key={g}
                onPress={() => setValue(g)}
                style={[styles.preset, on && styles.presetOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${g} грамм`}
              >
                <Text style={[styles.presetText, on && styles.presetTextOn]}>{g} г</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.totals}>
          <Total label="ккал" value={fmt(nutrition.kcal)} />
          <Total label="Б" value={fmt(nutrition.protein)} />
          <Total label="Ж" value={fmt(nutrition.fat)} />
          <Total label="У" value={fmt(nutrition.carbs)} />
        </View>
        <PrimaryButton label="Сохранить" onPress={() => onSave(value)} />
        <Pressable onPress={onClose} style={styles.cancel} accessibilityRole="button">
          <Text style={styles.cancelText}>Отмена</Text>
        </Pressable>
      </View>
    </SwipeToDismissSheet>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.total}>
      <Text style={styles.totalValue}>{value}</Text>
      <Text style={styles.totalLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.md },
  title: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  kicker: {
    fontSize: type.micro,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: colors.textMuted,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  step: {
    width: touchMin,
    height: touchMin,
    borderRadius: touchMin / 2,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 24, fontWeight: '600', color: colors.text },
  grams: { fontSize: 40, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  presets: { flexDirection: 'row', gap: space.sm },
  preset: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetOn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.text },
  presetText: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary },
  presetTextOn: { color: colors.text, fontWeight: '800' },
  totals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
  },
  total: { alignItems: 'center', gap: 2 },
  totalValue: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  totalLabel: { fontSize: type.micro, fontWeight: '700', color: colors.textMuted },
  cancel: { minHeight: touchMin, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontWeight: '700', color: colors.textSecondary },
});

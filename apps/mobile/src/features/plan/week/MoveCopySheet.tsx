import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDateRu } from '../../../../../../src/domain/dateFormatRu';
import { shiftDateLocal } from '../../../../../../src/domain/repeatMeal';
import type { MealSlot, PlannedMeal } from '../../../../../../src/storage/types';
import { FormScrollView } from '@/src/components/FormScrollView';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { SwipeToDismissSheet } from '@/src/components/SwipeToDismissSheet';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

const MEALS: Array<{ id: MealSlot; label: string }> = [
  { id: 'breakfast', label: 'Завтрак' },
  { id: 'lunch', label: 'Обед' },
  { id: 'dinner', label: 'Ужин' },
  { id: 'snack', label: 'Перекус' },
];

export type MoveCopyMode = 'move' | 'copy';

export function MoveCopySheet({
  visible,
  mode,
  meal,
  anchorDate,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  mode: MoveCopyMode;
  meal: PlannedMeal | null;
  anchorDate: string;
  onClose: () => void;
  onConfirm: (args: { dateLocal: string; meal: MealSlot }) => void;
}) {
  const dayOptions = useMemo(() => {
    const out: string[] = [];
    for (let i = -3; i <= 7; i++) out.push(shiftDateLocal(anchorDate, i));
    return out;
  }, [anchorDate]);

  const [dateLocal, setDateLocal] = useState(meal?.dateLocal ?? anchorDate);
  const [slot, setSlot] = useState<MealSlot>(meal?.meal ?? 'lunch');

  useEffect(() => {
    if (meal && visible) {
      setDateLocal(meal.dateLocal);
      setSlot(meal.meal);
    }
  }, [meal?.id, visible]);

  if (!meal) return null;

  return (
    <SwipeToDismissSheet visible={visible} onClose={onClose} maxHeightRatio={0.72}>
      <FormScrollView variant="sheet" contentContainerStyle={styles.body}>
        <Text style={styles.title} accessibilityRole="header">
          {mode === 'move' ? 'Перенести' : 'Копировать'}
        </Text>
        <Text style={styles.sub} numberOfLines={2}>
          {meal.displayName}
        </Text>

        <Text style={styles.label}>День</Text>
        <View style={styles.row}>
          {dayOptions.map((d) => {
            const on = d === dateLocal;
            return (
              <Pressable
                key={d}
                onPress={() => setDateLocal(d)}
                style={[styles.chip, on && styles.chipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={formatDateRu(d)}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{formatDateRu(d)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Приём</Text>
        <View style={styles.row}>
          {MEALS.map((m) => {
            const on = m.id === slot;
            return (
              <Pressable
                key={m.id}
                onPress={() => setSlot(m.id)}
                style={[styles.chip, on && styles.chipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={m.label}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton
          label={mode === 'move' ? 'Перенести' : 'Скопировать'}
          onPress={() => onConfirm({ dateLocal, meal: slot })}
        />
        <Pressable onPress={onClose} style={styles.cancel} accessibilityRole="button">
          <Text style={styles.cancelText}>Отмена</Text>
        </Pressable>
      </FormScrollView>
    </SwipeToDismissSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.md },
  title: { fontSize: type.title, fontWeight: '800', color: colors.text },
  sub: { fontSize: type.body, color: colors.textSecondary, marginTop: -space.sm },
  label: { fontSize: type.caption, fontWeight: '700', color: colors.textMuted },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: 40,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.primaryButton, borderColor: colors.primaryButton },
  chipText: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  chipTextOn: { color: colors.primaryButtonText },
  cancel: {
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontWeight: '700', color: colors.textSecondary },
});

import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { datesInWeekFromStart, weekStartMonday } from '../../../../../../src/domain/habitWeek';
import type { MealSlot, PlannedMeal } from '../../../../../../src/storage/types';
import { FormScrollView } from '@/src/components/FormScrollView';
import { SwipeToDismissSheet } from '@/src/components/SwipeToDismissSheet';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

const MEALS: Array<{ id: MealSlot; label: string }> = [
  { id: 'breakfast', label: 'Завтрак' },
  { id: 'lunch', label: 'Обед' },
  { id: 'dinner', label: 'Ужин' },
  { id: 'snack', label: 'Перекус' },
];

export type MoveCopyMode = 'move' | 'copy';

function dayTitle(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const label = dt.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

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
  const dayOptions = useMemo(
    () => datesInWeekFromStart(weekStartMonday(anchorDate)),
    [anchorDate],
  );

  const [dateLocal, setDateLocal] = useState(meal?.dateLocal ?? anchorDate);
  const [slot, setSlot] = useState<MealSlot>(meal?.meal ?? 'lunch');

  useEffect(() => {
    if (meal && visible) {
      setDateLocal(meal.dateLocal);
      setSlot(meal.meal);
    }
  }, [meal?.id, visible, meal?.dateLocal, meal?.meal]);

  if (!meal) return null;

  const title = mode === 'move' ? 'Переместить блюдо' : 'Копировать блюдо';
  const action = mode === 'move' ? 'Переместить' : 'Копировать';

  return (
    <SwipeToDismissSheet visible={visible} onClose={onClose} maxHeightRatio={0.86}>
      <FormScrollView variant="sheet" contentContainerStyle={styles.body}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.sub} numberOfLines={2}>
          {meal.displayName}
        </Text>
        <Text style={styles.question}>
          {mode === 'move' ? 'Куда переместить?' : 'Куда скопировать?'}
        </Text>
        <Text style={styles.note}>
          {mode === 'copy'
            ? 'Оригинал в этот день не меняется.'
            : 'Блюдо исчезнет с текущего места.'}
        </Text>

        {dayOptions.map((iso) => (
          <RadioRow
            key={iso}
            label={dayTitle(iso)}
            selected={iso === dateLocal}
            onPress={() => setDateLocal(iso)}
          />
        ))}

        <Text style={styles.question}>Приём</Text>
        {MEALS.map((item) => (
          <RadioRow
            key={item.id}
            label={item.label}
            selected={item.id === slot}
            onPress={() => setSlot(item.id)}
          />
        ))}

        <Pressable
          onPress={() => onConfirm({ dateLocal, meal: slot })}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={action}
        >
          <Text style={styles.primaryText}>{action}</Text>
        </Pressable>
        <Pressable onPress={onClose} style={styles.cancel} accessibilityRole="button">
          <Text style={styles.cancelText}>Отмена</Text>
        </Pressable>
      </FormScrollView>
    </SwipeToDismissSheet>
  );
}

function RadioRow({
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
      style={({ pressed }) => [styles.radioRow, pressed && styles.pressed]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: 0 },
  title: { fontSize: type.title, fontWeight: '800', color: colors.text },
  sub: {
    fontSize: type.body,
    color: colors.textSecondary,
    marginTop: space.xs,
    marginBottom: space.md,
  },
  question: {
    fontSize: type.body,
    fontWeight: '800',
    color: colors.text,
    marginTop: space.md,
    marginBottom: space.xs,
  },
  note: { fontSize: type.caption, color: colors.textMuted, marginBottom: space.sm },
  radioRow: {
    minHeight: touchMin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.text, backgroundColor: colors.text },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  radioLabel: { flex: 1, fontSize: type.body, fontWeight: '600', color: colors.text },
  primary: {
    minHeight: touchMin,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.lg,
  },
  primaryText: { color: colors.primaryButtonText, fontWeight: '800', fontSize: type.body },
  cancel: {
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: space.sm,
  },
  cancelText: { fontWeight: '700', color: colors.textSecondary },
  pressed: { opacity: 0.88 },
});

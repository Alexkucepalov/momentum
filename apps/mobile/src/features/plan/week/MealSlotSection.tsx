import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { MealSlot, PlannedMeal } from '../../../../../../src/storage/types';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { PlannedMealCard } from './PlannedMealCard';

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

export function MealSlotSection({
  slot,
  meals,
  macrosFor,
  onAdd,
  onPortion,
  onMove,
  onCopy,
  onReplace,
  onDelete,
  onLog,
}: {
  slot: MealSlot;
  meals: PlannedMeal[];
  macrosFor: (m: PlannedMeal) => string;
  onAdd: () => void;
  onPortion: (m: PlannedMeal) => void;
  onMove: (m: PlannedMeal) => void;
  onCopy: (m: PlannedMeal) => void;
  onReplace: (m: PlannedMeal) => void;
  onDelete: (m: PlannedMeal) => void;
  onLog: (m: PlannedMeal) => void;
}) {
  return (
    <View style={styles.section} accessibilityRole="summary">
      <Text style={styles.heading}>{MEAL_LABELS[slot]}</Text>
      {meals.map((m) => (
        <PlannedMealCard
          key={m.id}
          meal={m}
          macrosLine={macrosFor(m)}
          onPortion={() => onPortion(m)}
          onMove={() => onMove(m)}
          onCopy={() => onCopy(m)}
          onReplace={() => onReplace(m)}
          onDelete={() => onDelete(m)}
          onLog={() => onLog(m)}
        />
      ))}
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.add, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Добавить блюдо в ${MEAL_LABELS[slot]}`}
      >
        <Ionicons name="add" size={20} color={colors.text} />
        <Text style={styles.addText}>Добавить блюдо</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: space.lg },
  heading: {
    fontSize: type.caption,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: space.sm,
  },
  add: {
    minHeight: touchMin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: space.md,
  },
  addText: { fontSize: type.body, fontWeight: '700', color: colors.text },
  pressed: { opacity: 0.88 },
});

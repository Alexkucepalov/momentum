import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SharedValue } from 'react-native-reanimated';

import type { MealSlot, PlannedMeal } from '../../../../../../src/storage/types';
import { colors, elevation, radius, space, touchMin, type } from '@/src/theme/tokens';
import { PlannedMealCard } from './PlannedMealCard';
import { usePlanDrag, type DropTarget } from './planDragContext';

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

export function MealSlotSection({
  slot,
  meals,
  kcalFor,
  onAdd,
  onOpenMenu,
  pointerX,
  pointerY,
  onDrop,
}: {
  slot: MealSlot;
  meals: PlannedMeal[];
  kcalFor: (m: PlannedMeal) => string;
  onAdd: () => void;
  onOpenMenu: (m: PlannedMeal) => void;
  pointerX: SharedValue<number>;
  pointerY: SharedValue<number>;
  onDrop: (mealId: string, target: DropTarget | null) => void;
}) {
  const { dragging, setSlotBox, isHoveringSlot } = usePlanDrag();
  const wrapRef = useRef<View>(null);
  const hot = isHoveringSlot(slot);

  const measure = () => {
    wrapRef.current?.measureInWindow((x, y, width, height) => {
      setSlotBox(slot, { x, y, width, height });
    });
  };

  useEffect(() => {
    measure();
    return () => setSlotBox(slot, null);
  }, [slot, meals.length, dragging]);

  return (
    <View
      ref={wrapRef}
      onLayout={measure}
      style={[styles.section, hot && styles.sectionHot]}
      accessibilityRole="summary"
    >
      <View style={styles.head}>
        <Text style={[styles.heading, hot && styles.headingHot]}>{MEAL_LABELS[slot]}</Text>
        {hot ? <Text style={styles.hotHint}>Отпустите сюда</Text> : null}
      </View>

      {meals.map((m) => (
        <PlannedMealCard
          key={m.id}
          meal={m}
          kcalLabel={kcalFor(m)}
          onOpenMenu={() => onOpenMenu(m)}
          pointerX={pointerX}
          pointerY={pointerY}
          onDrop={onDrop}
        />
      ))}

      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.add, hot && styles.addHot, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Добавить блюдо в ${MEAL_LABELS[slot]}`}
      >
        <Ionicons name="add" size={20} color={colors.text} />
        <Text style={styles.addText}>Добавить</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space.md,
    ...elevation.card,
  },
  sectionHot: {
    backgroundColor: colors.focusSoft,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  heading: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
  },
  headingHot: { color: colors.text },
  hotHint: {
    fontSize: type.micro,
    fontWeight: '800',
    color: colors.textMuted,
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
  addHot: {
    borderColor: colors.text,
  },
  addText: { fontSize: type.body, fontWeight: '700', color: colors.text },
  pressed: { opacity: 0.88 },
});

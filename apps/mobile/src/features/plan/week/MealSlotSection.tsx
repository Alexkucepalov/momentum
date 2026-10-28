import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { MealSlot, PlannedMeal } from '../../../../../../src/storage/types';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { PlannedMealCard } from './PlannedMealCard';
import { usePlanDrag } from './planDragContext';

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
}: {
  slot: MealSlot;
  meals: PlannedMeal[];
  kcalFor: (m: PlannedMeal) => string;
  onAdd: () => void;
  onOpenMenu: (m: PlannedMeal) => void;
}) {
  const { session, setSlotBox, isHoveringSlot } = usePlanDrag();
  const wrapRef = useRef<View>(null);
  const hot = isHoveringSlot(slot);
  const dragging = session != null;

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
      style={[styles.section, hot && styles.sectionHot, dragging && !hot && styles.sectionDragMode]}
      accessibilityRole="summary"
    >
      <Text style={[styles.heading, hot && styles.headingHot]}>{MEAL_LABELS[slot]}</Text>

      {hot ? (
        <View style={styles.dropZone} accessibilityLiveRegion="polite">
          <Ionicons name="arrow-down-circle-outline" size={22} color={colors.carbs} />
          <Text style={styles.dropText}>Отпустите, чтобы переместить</Text>
        </View>
      ) : null}

      {meals.map((m) => (
        <PlannedMealCard
          key={m.id}
          meal={m}
          kcalLabel={kcalFor(m)}
          onOpenMenu={() => onOpenMenu(m)}
        />
      ))}

      {!hot ? (
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [styles.add, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Добавить блюдо в ${MEAL_LABELS[slot]}`}
        >
          <Ionicons name="add" size={20} color={colors.text} />
          <Text style={styles.addText}>Добавить блюдо</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: space.lg,
    borderRadius: radius.lg,
    padding: space.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sectionDragMode: {
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  sectionHot: {
    borderColor: colors.carbs,
    borderStyle: 'dashed',
    backgroundColor: colors.preview,
  },
  heading: {
    fontSize: type.caption,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: space.sm,
  },
  headingHot: { color: colors.carbs },
  dropZone: {
    minHeight: 72,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.carbs,
    backgroundColor: colors.preview,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: space.sm,
    paddingHorizontal: space.md,
  },
  dropText: {
    fontSize: type.caption,
    fontWeight: '800',
    color: colors.carbs,
    textAlign: 'center',
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

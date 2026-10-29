import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import type { MealSlot, PlannedMeal } from '../../../../../../src/storage/types';
import { colors, space, type } from '@/src/theme/tokens';
import { AppCard } from '@/src/ui/AppCard';
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
  slotKcal,
  kcalFor,
  onAdd,
  onOpenMenu,
  pointerX,
  pointerY,
  onDrop,
}: {
  slot: MealSlot;
  meals: PlannedMeal[];
  slotKcal: string;
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
    <View ref={wrapRef} onLayout={measure} style={styles.outer}>
      <AppCard
        style={[styles.section, hot && styles.sectionHot]}
        accessibilityRole="summary"
      >
        <View style={styles.head}>
          <Text style={styles.heading}>{MEAL_LABELS[slot]}</Text>
          {hot ? (
            <Text style={styles.hotHint}>Отпустите сюда</Text>
          ) : slotKcal ? (
            <Text style={styles.kcal}>{slotKcal}</Text>
          ) : null}
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
          <Text style={styles.addText}>+ Добавить блюдо</Text>
        </Pressable>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { marginBottom: space.md },
  section: {},
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
    flex: 1,
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
  },
  kcal: {
    fontSize: type.caption,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  hotHint: {
    fontSize: type.micro,
    fontWeight: '800',
    color: colors.textMuted,
  },
  add: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: space.sm,
  },
  addHot: {},
  addText: { fontSize: type.body, fontWeight: '700', color: colors.textSecondary },
  pressed: { opacity: 0.88 },
});

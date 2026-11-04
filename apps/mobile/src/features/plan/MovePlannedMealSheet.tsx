import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { MealSlot } from '../../../../../src/storage/types';
import { SwipeToDismissSheet } from '@/src/components/SwipeToDismissSheet';
import { AppText, colors, radius, space, touchMin } from '@/src/design-system';
import { MEAL_LABELS_RU, MEAL_SLOTS } from './mealBoardLabels';

export type MoveDayOption = {
  dateLocal: string;
  label: string;
};

export function MovePlannedMealSheet({
  visible,
  mealName,
  days,
  onClose,
  onPick,
}: {
  visible: boolean;
  mealName: string;
  days: MoveDayOption[];
  onClose: () => void;
  onPick: (dateLocal: string, meal: MealSlot) => void;
}) {
  return (
    <SwipeToDismissSheet visible={visible} onClose={onClose} maxHeightRatio={0.85} testID="move-planned-sheet">
      <View style={styles.pad}>
        <AppText variant="title" style={styles.title}>
          Куда перенести
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.sub}>
          {mealName}
        </AppText>
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          {days.map((d) => (
            <View key={d.dateLocal} style={styles.dayBlock}>
              <AppText variant="label" tone="muted" style={styles.dayLabel}>
                {d.label}
              </AppText>
              <View style={styles.slotRow}>
                {MEAL_SLOTS.map((slot) => (
                  <Pressable
                    key={slot}
                    onPress={() => onPick(d.dateLocal, slot)}
                    style={({ pressed }) => [styles.slotChip, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`${d.label}, ${MEAL_LABELS_RU[slot]}`}
                  >
                    <AppText variant="caption" style={styles.slotChipText}>
                      {MEAL_LABELS_RU[slot]}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </SwipeToDismissSheet>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, gap: space.sm, maxHeight: '100%' },
  title: { fontWeight: '800' },
  sub: { marginBottom: space.sm },
  scroll: { maxHeight: 420 },
  dayBlock: { marginBottom: space.md, gap: space.sm },
  dayLabel: {
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  slotChip: {
    minHeight: touchMin - 4,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    justifyContent: 'center',
  },
  slotChipText: { fontWeight: '600' },
  pressed: { opacity: 0.88 },
});

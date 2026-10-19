import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  repeatableDayFromEntries,
  shiftDateLocal,
} from '../../../../src/domain/repeatMeal';
import { useData } from '../state/DataContext';
import { colors, radius, space, touchMin, type } from '../theme/tokens';

/** Copies previous calendar day's linked food entries into the selected day (same meal slots). */
export function CopyYesterdayButton() {
  const { repo, dateLocal, refresh, showFlash, revision } = useData();
  void revision;
  const yesterday = shiftDateLocal(dateLocal, -1);
  const sourceCount = repo.listEntriesForDate(yesterday).length;
  // Hide when yesterday is empty — no dead CTA (Sprint 1 empty-state rule).
  if (sourceCount === 0) return null;

  const onCopy = () => {
    const items = repeatableDayFromEntries(repo.listEntriesForDate(yesterday));
    if (items.length === 0) {
      showFlash('Вчерашние записи без продукта/рецепта — повторить нельзя');
      return;
    }
    for (const item of items) {
      if (item.kind === 'product') {
        repo.addEntryFromProduct({
          productId: item.productId,
          dateLocal,
          meal: item.meal,
          grams: item.grams,
        });
      } else {
        repo.addEntryFromRecipe({
          recipeId: item.recipeId,
          dateLocal,
          meal: item.meal,
          grams: item.grams,
        });
      }
    }
    refresh();
    showFlash(`Повторили вчерашний рацион · ${items.length}`);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      onPress={onCopy}
      accessibilityRole="button"
      accessibilityLabel={`Повторить вчерашний рацион, ${sourceCount} записей`}
      accessibilityHint="Добавит в выбранный день те же приёмы и порции, что были вчера"
    >
      <View style={styles.iconWrap}>
        <Ionicons name="calendar-outline" size={18} color={colors.text} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.label}>Повторить вчерашний рацион</Text>
        <Text style={styles.meta}>{sourceCount} записей · те же приёмы пищи</Text>
      </View>
      <Ionicons name="arrow-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touchMin + 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.md,
  },
  pressed: { opacity: 0.88 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  label: { fontSize: type.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: type.micro, color: colors.textSecondary, marginTop: 2 },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { FoodEntry, MealSlot } from '../../../../../src/storage/types';
import { colors, space, type } from '../../theme/tokens';
import { AppCard } from '@/src/ui/AppCard';
import { ListRow } from '@/src/ui/ListRow';

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

function fmtKcal(n: number | null): string {
  if (n === null) return '—';
  return `${Math.round(n)}`;
}

function fmtMacro(n: number | null): string {
  if (n === null) return '—';
  return String(Math.round(n));
}

/** Diary meal block — Nutrition-ref card + ListRow entries. */
export function MealSection({
  meal,
  entries,
  onDelete,
  onEditGrams,
  onAdd,
  onRepeatMeal,
  onSaveMeal,
}: {
  meal: MealSlot;
  entries: FoodEntry[];
  onDelete: (entry: FoodEntry) => void;
  onEditGrams: (entry: FoodEntry) => void;
  onAdd?: () => void;
  onRepeatMeal?: () => void;
  onSaveMeal?: () => void;
}) {
  const sectionKcal = entries.some((e) => e.energyKcal === null)
    ? null
    : entries.reduce((sum, e) => sum + (e.energyKcal as number), 0);
  const empty = entries.length === 0;
  const canRepeat =
    !!onRepeatMeal && entries.some((e) => e.productId != null || e.recipeId != null);
  const canSave =
    !!onSaveMeal && entries.some((e) => e.productId != null || e.recipeId != null);

  if (empty) {
    return (
      <AppCard onPress={onAdd} style={styles.emptyCard} accessibilityLabel={`${MEAL_LABELS[meal]} — добавить`}>
        <View style={styles.emptyRow}>
          <View style={styles.flex}>
            <Text style={styles.heading}>{MEAL_LABELS[meal]}</Text>
            <Text style={styles.hint}>нажми, чтобы добавить</Text>
          </View>
          <View style={styles.plus}>
            <Ionicons name="add" size={22} color={colors.primaryButtonText} />
          </View>
        </View>
      </AppCard>
    );
  }

  return (
    <AppCard padding="none" style={styles.card}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Text style={styles.heading}>{MEAL_LABELS[meal]}</Text>
          <Text style={styles.meta}>
            {sectionKcal === null ? 'ккал частично неизвестны' : `${fmtKcal(sectionKcal)} ккал`}
            {entries.length > 1 ? ` · ${entries.length}` : ''}
          </Text>
        </View>
        {canSave ? (
          <IconBtn label={`Сохранить ${MEAL_LABELS[meal]}`} icon="bookmark-outline" onPress={onSaveMeal!} />
        ) : null}
        {canRepeat ? (
          <IconBtn label={`Повторить ${MEAL_LABELS[meal]}`} icon="copy-outline" onPress={onRepeatMeal!} />
        ) : null}
        {onAdd ? (
          <IconBtn label={`Добавить в ${MEAL_LABELS[meal]}`} icon="add" onPress={onAdd} />
        ) : null}
      </View>

      {entries.map((entry) => (
        <ListRow
          key={entry.id}
          title={entry.displayName}
          pills={[
            `Б ${fmtMacro(entry.proteinG)}г`,
            `У ${fmtMacro(entry.carbG)}г`,
            `Ж ${fmtMacro(entry.fatG)}г`,
          ]}
          meta={`${entry.grams} г`}
          trailing={`${fmtKcal(entry.energyKcal)} ккал`}
          onPress={() => onEditGrams(entry)}
          onDelete={() => onDelete(entry)}
          accessibilityLabel={`${entry.displayName}, ${entry.grams} грамм`}
        />
      ))}
    </AppCard>
  );
}

function IconBtn({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.md },
  emptyCard: { marginBottom: space.sm },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  heading: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  hint: { marginTop: 2, fontSize: type.caption, color: colors.textMuted },
  meta: { marginTop: 2, fontSize: type.caption, color: colors.textMuted },
  plus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
});

import { useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { nutritionConsistencyHint } from '../../../../../src/domain/nutritionConsistency';
import type { FoodEntry, MealSlot } from '../../../../../src/storage/types';
import { colors, radius, space, touchMin, type } from '../../theme/tokens';

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

const SWIPE_THRESHOLD = -72;

function fmtKcal(n: number | null): string {
  if (n === null) return '— ккал';
  return `${Math.round(n)} ккал`;
}

function fmtMacro(n: number | null): string {
  if (n === null) return '—';
  return String(Math.round(n));
}

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
    !!onRepeatMeal &&
    entries.some((e) => e.productId != null || e.recipeId != null);
  const canSave =
    !!onSaveMeal &&
    entries.some((e) => e.productId != null || e.recipeId != null);

  if (empty) {
    return (
      <Pressable
        style={({ pressed }) => [styles.compactEmpty, pressed && styles.pressed]}
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={`${MEAL_LABELS[meal]} — ничего не добавлено. Добавить`}
      >
        <View style={styles.compactText}>
          <Text style={styles.compactLabel}>{MEAL_LABELS[meal]}</Text>
          <Text style={styles.compactHint}>нажми, чтобы добавить</Text>
        </View>
        <View style={styles.compactPlus}>
          <Ionicons name="add" size={22} color={colors.primaryButtonText} />
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.card} accessibilityRole="list" accessibilityLabel={MEAL_LABELS[meal]}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.heading}>{MEAL_LABELS[meal]}</Text>
          <Text style={styles.sectionKcal}>
            {sectionKcal === null ? 'ккал частично неизвестны' : fmtKcal(sectionKcal)}
            {entries.length > 1 ? ` · ${entries.length} зап.` : ''}
          </Text>
        </View>
        {canSave ? (
          <Pressable
            onPress={onSaveMeal}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Сохранить ${MEAL_LABELS[meal]} как шаблон`}
          >
            <Ionicons name="bookmark-outline" size={18} color={colors.text} />
          </Pressable>
        ) : null}
        {canRepeat ? (
          <Pressable
            onPress={onRepeatMeal}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Повторить ${MEAL_LABELS[meal]} в выбранный приём`}
          >
            <Ionicons name="copy-outline" size={18} color={colors.text} />
          </Pressable>
        ) : null}
        {onAdd ? (
          <Pressable
            onPress={onAdd}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Добавить в ${MEAL_LABELS[meal]}`}
          >
            <Ionicons name="add" size={22} color={colors.text} />
          </Pressable>
        ) : null}
      </View>

      {entries.map((entry) => (
        <SwipeEntryRow
          key={entry.id}
          entry={entry}
          onDelete={() => onDelete(entry)}
          onEdit={() => onEditGrams(entry)}
        />
      ))}
    </View>
  );
}

function SwipeEntryRow({
  entry,
  onDelete,
  onEdit,
}: {
  entry: FoodEntry;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const tx = useRef(new Animated.Value(0)).current;
  const incomplete =
    entry.energyKcal === null ||
    entry.proteinG === null ||
    entry.fatG === null ||
    entry.carbG === null;
  const diverge = nutritionConsistencyHint({
    energyKcal: entry.energyKcal,
    proteinG: entry.proteinG,
    fatG: entry.fatG,
    carbG: entry.carbG,
  });

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) tx.setValue(Math.max(g.dx, -112));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < SWIPE_THRESHOLD || g.vx < -0.6) {
          Animated.timing(tx, { toValue: -96, duration: 120, useNativeDriver: true }).start();
        } else {
          Animated.spring(tx, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.swipeWrap}>
      <View style={styles.deleteBehind}>
        <Pressable
          onPress={onDelete}
          style={styles.deleteAction}
          accessibilityRole="button"
          accessibilityLabel={`Удалить ${entry.displayName}`}
        >
          <Text style={styles.deleteActionText}>Удалить</Text>
        </Pressable>
      </View>
      <Animated.View
        style={[styles.rowFront, { transform: [{ translateX: tx }] }]}
        {...pan.panHandlers}
      >
        <Pressable
          style={({ pressed }) => [styles.main, pressed && styles.pressed]}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`${entry.displayName}, ${entry.grams} грамм, ${fmtKcal(entry.energyKcal)}. Изменить граммы. Свайп влево — удалить`}
          accessibilityHint="Свайп влево, чтобы удалить"
        >
          <Text style={styles.name} numberOfLines={2}>
            {entry.displayName}
          </Text>
          <Text style={styles.meta}>
            {entry.grams} г · Б {fmtMacro(entry.proteinG)} · Ж {fmtMacro(entry.fatG)} · У{' '}
            {fmtMacro(entry.carbG)}
            {incomplete ? ' · неполно' : ''}
            {diverge ? ' · ккал≠БЖУ' : ''}
          </Text>
        </Pressable>
        <Text style={styles.kcal}>{fmtKcal(entry.energyKcal)}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    marginBottom: space.sm,
    minHeight: 56,
  },
  compactText: { flex: 1 },
  compactLabel: {
    fontSize: type.body,
    fontWeight: '800',
    color: colors.text,
  },
  compactHint: {
    marginTop: 2,
    fontSize: type.caption,
    color: colors.textMuted,
  },
  compactPlus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.md,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.xs,
    gap: space.sm,
  },
  headText: { flex: 1 },
  heading: {
    fontSize: type.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  sectionKcal: {
    marginTop: 2,
    fontSize: type.caption,
    color: colors.textMuted,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeWrap: {
    marginTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    overflow: 'hidden',
  },
  deleteBehind: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingRight: space.md,
  },
  deleteAction: {
    minWidth: 80,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionText: {
    color: colors.primaryButtonText,
    fontWeight: '800',
    fontSize: type.caption,
  },
  rowFront: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    minHeight: touchMin,
    paddingTop: space.sm,
  },
  main: {
    flex: 1,
    paddingRight: space.sm,
    paddingVertical: space.xs,
  },
  name: {
    fontSize: type.body,
    color: colors.text,
    fontWeight: '600',
  },
  meta: {
    fontSize: type.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  kcal: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.text,
    marginRight: space.xs,
  },
  pressed: { opacity: 0.75 },
});

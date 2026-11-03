import { useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { nutritionConsistencyHint } from '../../../../../src/domain/nutritionConsistency';
import type { FoodEntry, MealSlot } from '../../../../../src/storage/types';
import { AppCard, AppText, colors, radius, space, touchMin } from '@/src/design-system';

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

const REVEAL_X = -88;
const COMMIT_DX = -72;

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
        accessibilityLabel={`${MEAL_LABELS[meal]} — пока пусто. Добавить`}
      >
        <View style={styles.compactText}>
          <AppText variant="body" style={styles.compactLabel}>
            {MEAL_LABELS[meal]}
          </AppText>
          <AppText variant="caption" tone="muted">
            нажми, чтобы добавить
          </AppText>
        </View>
        <View style={styles.compactPlus}>
          <Ionicons name="add" size={22} color={colors.primaryButtonText} />
        </View>
      </Pressable>
    );
  }

  return (
    <AppCard accessibilityLabel={MEAL_LABELS[meal]} style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <AppText variant="subtitle">{MEAL_LABELS[meal]}</AppText>
          <AppText variant="caption" tone="muted">
            {sectionKcal === null ? 'ккал частично неизвестны' : fmtKcal(sectionKcal)}
            {entries.length > 1 ? ` · ${entries.length} зап.` : ''}
          </AppText>
        </View>
        {canSave ? (
          <Pressable
            onPress={onSaveMeal}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Сохранить ${MEAL_LABELS[meal]} как шаблон`}
          >
            <Ionicons name="bookmark-outline" size={18} color={colors.ink} />
          </Pressable>
        ) : null}
        {canRepeat ? (
          <Pressable
            onPress={onRepeatMeal}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Повторить ${MEAL_LABELS[meal]} в выбранный приём`}
          >
            <Ionicons name="copy-outline" size={18} color={colors.ink} />
          </Pressable>
        ) : null}
        {onAdd ? (
          <Pressable
            onPress={onAdd}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Добавить в ${MEAL_LABELS[meal]}`}
          >
            <Ionicons name="add" size={22} color={colors.ink} />
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
    </AppCard>
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
  const open = useRef(false);
  const dragging = useRef(false);
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

  const snapShut = () => {
    open.current = false;
    Animated.spring(tx, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 20 }).start();
  };

  const snapOpen = () => {
    open.current = true;
    Animated.spring(tx, {
      toValue: REVEAL_X,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  };

  const commitDelete = () => {
    Animated.timing(tx, { toValue: -420, duration: 160, useNativeDriver: true }).start(() => {
      onDelete();
    });
  };

  const pan = useRef(
    PanResponder.create({
      // Capture leftward horizontal moves so DaySwipeArea does not steal delete.
      onMoveShouldSetPanResponderCapture: (_, g) =>
        g.dx < -12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.15,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: () => !dragging.current && !open.current,
      onPanResponderGrant: () => {
        dragging.current = true;
      },
      onPanResponderMove: (_, g) => {
        if (g.dx <= 0) tx.setValue(Math.max(g.dx, -120));
        else if (open.current) tx.setValue(Math.min(0, REVEAL_X + g.dx));
      },
      onPanResponderRelease: (_, g) => {
        dragging.current = false;
        const shouldCommit = g.dx < COMMIT_DX || g.vx < -0.85;
        if (shouldCommit) {
          commitDelete();
          return;
        }
        if (g.dx < -36 || (open.current && g.dx < 24)) snapOpen();
        else snapShut();
      },
      onPanResponderTerminate: () => {
        dragging.current = false;
        if (open.current) snapOpen();
        else snapShut();
      },
    }),
  ).current;

  return (
    <View style={styles.swipeWrap} testID="diary-swipe-row">
      <View style={styles.deleteBehind}>
        <Pressable
          onPress={commitDelete}
          style={styles.deleteAction}
          accessibilityRole="button"
          accessibilityLabel={`Удалить ${entry.displayName}`}
        >
          <Ionicons name="trash-outline" size={20} color={colors.primaryButtonText} />
          <AppText variant="caption" tone="inverse" style={styles.deleteActionText}>
            Удалить
          </AppText>
        </Pressable>
      </View>
      <Animated.View
        style={[styles.rowFront, { transform: [{ translateX: tx }] }]}
        {...pan.panHandlers}
      >
        <Pressable
          style={({ pressed }) => [styles.main, pressed && styles.pressed]}
          onPress={() => {
            if (open.current) {
              snapShut();
              return;
            }
            onEdit();
          }}
          accessibilityRole="button"
          accessibilityLabel={`${entry.displayName}, ${entry.grams} грамм, ${fmtKcal(entry.energyKcal)}. Изменить граммы. Свайп влево — удалить`}
          accessibilityHint="Свайп влево, чтобы удалить"
        >
          <AppText variant="body" style={styles.name} numberOfLines={2}>
            {entry.displayName}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {entry.grams} г · Б {fmtMacro(entry.proteinG)} · Ж {fmtMacro(entry.fatG)} · У{' '}
            {fmtMacro(entry.carbG)}
            {incomplete ? ' · неполно' : ''}
            {diverge ? ' · ккал≠БЖУ' : ''}
          </AppText>
        </Pressable>
        <Pressable
          onPress={commitDelete}
          style={({ pressed }) => [styles.trashHit, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Удалить ${entry.displayName}`}
          hitSlop={6}
        >
          <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
        </Pressable>
        <AppText variant="caption" style={styles.kcal}>
          {fmtKcal(entry.energyKcal)}
        </AppText>
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
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    marginBottom: space.sm,
    minHeight: 56,
  },
  compactText: { flex: 1, gap: 2 },
  compactLabel: {
    fontWeight: '700',
  },
  compactPlus: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginBottom: space.md,
    overflow: 'hidden',
    padding: space.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.xs,
    gap: space.sm,
  },
  headText: { flex: 1, gap: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeWrap: {
    marginTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    overflow: 'hidden',
    borderRadius: radius.sm,
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
    paddingRight: space.sm,
  },
  deleteAction: {
    minWidth: 76,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  deleteActionText: {
    fontWeight: '800',
  },
  rowFront: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    minHeight: touchMin,
    paddingTop: space.sm,
    paddingBottom: space.xs,
    gap: space.xs,
  },
  main: {
    flex: 1,
    paddingRight: space.sm,
    paddingVertical: space.xs,
  },
  name: {
    fontWeight: '600',
  },
  trashHit: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  kcal: {
    fontWeight: '700',
    marginRight: space.xs,
    minWidth: 64,
    textAlign: 'right',
  },
  pressed: { opacity: 0.75 },
});

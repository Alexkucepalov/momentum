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

const MEAL_ACCENT: Record<MealSlot, string> = {
  breakfast: colors.mealBreakfast,
  lunch: colors.mealLunch,
  dinner: colors.mealDinner,
  snack: colors.mealSnack,
};

const REVEAL_X = -132;
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
  onCopyEntry,
  onAdd,
  onRepeatMeal,
  onSaveMeal,
}: {
  meal: MealSlot;
  entries: FoodEntry[];
  onDelete: (entry: FoodEntry) => void;
  onEditGrams: (entry: FoodEntry) => void;
  onCopyEntry?: (entry: FoodEntry) => void;
  onAdd?: () => void;
  onRepeatMeal?: () => void;
  onSaveMeal?: () => void;
}) {
  const accent = MEAL_ACCENT[meal];
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
        style={({ pressed }) => [pressed && styles.pressed]}
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={`${MEAL_LABELS[meal]} — пока пусто. Добавить`}
        testID={`meal-section-${meal}`}
      >
        <AppCard style={[styles.card, styles.emptyCard, { borderLeftColor: accent }]}>
          <View style={styles.compactText}>
            <AppText variant="body" style={styles.compactLabel}>
              {MEAL_LABELS[meal]}
            </AppText>
            <AppText variant="caption" tone="muted">
              нажми, чтобы добавить
            </AppText>
          </View>
          <View style={[styles.compactPlus, { backgroundColor: accent }]}>
            <Ionicons name="add" size={22} color={colors.onAccent} />
          </View>
        </AppCard>
      </Pressable>
    );
  }

  return (
    <AppCard
      style={[styles.card, { borderLeftColor: accent }]}
      accessibilityLabel={MEAL_LABELS[meal]}
      testID={`meal-section-${meal}`}
    >
      <View style={styles.head}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <View style={styles.headText}>
          <AppText variant="subtitle">{MEAL_LABELS[meal]}</AppText>
          <AppText variant="caption" tone="muted">
            {sectionKcal === null ? 'ккал частично неизвестны' : fmtKcal(sectionKcal)}
            {entries.length > 1 ? ` · ${entries.length}` : ''}
          </AppText>
        </View>
        {canSave ? (
          <Pressable
            onPress={onSaveMeal}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Сохранить ${MEAL_LABELS[meal]} как шаблон приёма`}
          >
            <Ionicons name="bookmark-outline" size={18} color={colors.ink} />
          </Pressable>
        ) : null}
        {canRepeat ? (
          <Pressable
            onPress={onRepeatMeal}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Повторить ${MEAL_LABELS[meal]} в этот же приём`}
          >
            <Ionicons name="copy-outline" size={18} color={colors.ink} />
          </Pressable>
        ) : null}
        {onAdd ? (
          <Pressable
            onPress={onAdd}
            style={({ pressed }) => [styles.iconBtn, styles.iconBtnAccent, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Добавить в ${MEAL_LABELS[meal]}`}
          >
            <Ionicons name="add" size={22} color={accent} />
          </Pressable>
        ) : null}
      </View>

      {entries.map((entry) => (
        <SwipeEntryRow
          key={entry.id}
          entry={entry}
          accent={accent}
          onDelete={() => onDelete(entry)}
          onEdit={() => onEditGrams(entry)}
          onCopy={onCopyEntry ? () => onCopyEntry(entry) : undefined}
        />
      ))}
    </AppCard>
  );
}

function SwipeEntryRow({
  entry,
  accent,
  onDelete,
  onEdit,
  onCopy,
}: {
  entry: FoodEntry;
  accent: string;
  onDelete: () => void;
  onEdit: () => void;
  onCopy?: () => void;
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
      onMoveShouldSetPanResponderCapture: (_, g) =>
        g.dx < -12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.15,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: () => !dragging.current && !open.current,
      onPanResponderGrant: () => {
        dragging.current = true;
      },
      onPanResponderMove: (_, g) => {
        if (g.dx <= 0) tx.setValue(Math.max(g.dx, -160));
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
      <View style={styles.actionsBehind}>
        {onCopy ? (
          <Pressable
            onPress={() => {
              snapShut();
              onCopy();
            }}
            style={styles.copyAction}
            accessibilityRole="button"
            accessibilityLabel={`Скопировать ${entry.displayName} в этот день`}
          >
            <Ionicons name="copy-outline" size={18} color={colors.ink} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={commitDelete}
          style={styles.deleteAction}
          accessibilityRole="button"
          accessibilityLabel={`Удалить ${entry.displayName}`}
        >
          <Ionicons name="trash-outline" size={20} color={colors.primaryButtonText} />
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
          accessibilityLabel={`${entry.displayName}, ${entry.grams} грамм, ${fmtKcal(entry.energyKcal)}. Изменить граммы`}
        >
          <AppText variant="body" style={styles.name} numberOfLines={1}>
            {entry.displayName}
          </AppText>
          <AppText variant="caption" tone="secondary" numberOfLines={1}>
            {entry.grams} г · Б {fmtMacro(entry.proteinG)} · Ж {fmtMacro(entry.fatG)} · У{' '}
            {fmtMacro(entry.carbG)}
            {incomplete ? ' · неполно' : ''}
            {diverge ? ' · ккал≠БЖУ' : ''}
          </AppText>
        </Pressable>
        <AppText variant="caption" style={[styles.kcal, { color: accent }]}>
          {fmtKcal(entry.energyKcal)}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: space.sm,
    overflow: 'hidden',
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderLeftWidth: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touchMin,
    borderStyle: 'dashed',
  },
  compactText: { flex: 1, gap: 0, minWidth: 0 },
  compactLabel: {
    fontWeight: '700',
  },
  compactPlus: {
    width: 36,
    height: 36,
    flexShrink: 0,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: space.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  headText: { flex: 1, gap: 0, minWidth: 0 },
  iconBtn: {
    width: 36,
    height: 36,
    flexShrink: 0,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnAccent: {
    backgroundColor: colors.accentSoft,
  },
  swipeWrap: {
    marginTop: space.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    overflow: 'hidden',
  },
  actionsBehind: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: colors.canvas,
  },
  copyAction: {
    minWidth: 48,
    minHeight: touchMin - 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  deleteAction: {
    minWidth: 64,
    minHeight: touchMin - 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  rowFront: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    minHeight: touchMin - 4,
    paddingVertical: space.xs,
    gap: space.xs,
  },
  main: {
    flex: 1,
    minWidth: 0,
    paddingRight: space.sm,
  },
  name: {
    fontWeight: '600',
  },
  kcal: {
    fontWeight: '700',
    marginRight: space.xs,
    minWidth: 56,
    flexShrink: 0,
    textAlign: 'right',
  },
  pressed: { opacity: 0.75 },
});

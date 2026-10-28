import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { FoodEntry, MealSlot } from '../../../../src/storage/types';
import { nothing, nothingRadius, nothingSpace, nothingType } from '../theme/nothing';
import { colors, radius, space, touchMin, type } from '../theme/tokens';
import { MealChips } from './MealChips';

const MEAL_RU: Record<MealSlot, string> = {
  breakfast: 'завтрак',
  lunch: 'обед',
  dinner: 'ужин',
  snack: 'перекус',
};

export type QuickRepeatItem = {
  id: string;
  displayName: string;
  grams: number;
};

/**
 * Recent / quick-repeat on Today.
 * Meal chips optional — default off fold; override lives in AddFoodSheet.
 */
export function AddFoodBlock({
  meal,
  onChangeMeal,
  todayEntries,
  quickRepeats,
  onRepeat,
  onCopyYesterday,
  onOpenDiary,
  onAddFood,
  showMealChips = false,
  tone = 'default',
}: {
  meal: MealSlot;
  onChangeMeal: (meal: MealSlot) => void;
  todayEntries: FoodEntry[];
  quickRepeats: QuickRepeatItem[];
  onRepeat: (id: string) => void;
  onCopyYesterday?: () => void;
  /** Open full Food diary (meals, edit, delete). */
  onOpenDiary?: () => void;
  /** Open Add Food sheet — primary daily log action on Today. */
  onAddFood?: () => void;
  /** When true, show meal chips (legacy). Today keeps false. */
  showMealChips?: boolean;
  /** Nothing chrome on Today — leave default for any Food reuse. */
  tone?: 'default' | 'nothing';
}) {
  const entryCount = todayEntries.length;
  void todayEntries;
  const n = tone === 'nothing';

  return (
    <View style={[styles.wrap, n && styles.wrapN]}>
      <View style={styles.head}>
        <Text style={[styles.title, n && styles.titleN]}>{n ? 'LOG' : 'Недавно'}</Text>
        {onOpenDiary ? (
          <Pressable
            onPress={onOpenDiary}
            accessibilityRole="button"
            accessibilityLabel="Открыть полный дневник"
            hitSlop={8}
          >
            <Text style={styles.diaryLink}>
              {entryCount === 0
                ? 'Дневник →'
                : `${entryCount} ${entryCount === 1 ? 'запись' : entryCount < 5 ? 'записи' : 'записей'} →`}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.status}>
            {entryCount === 0
              ? 'пока пусто'
              : `${entryCount} ${entryCount === 1 ? 'запись' : entryCount < 5 ? 'записи' : 'записей'}`}
          </Text>
        )}
      </View>

      {showMealChips ? (
        <>
          <Text style={styles.mealLabel}>Куда записать</Text>
          <View style={styles.chipsWrap}>
            <MealChips value={meal} onChange={onChangeMeal} compact />
          </View>
        </>
      ) : null}

      {onAddFood ? (
        <Pressable
          style={({ pressed }) => [styles.addBtn, n && styles.addBtnN, pressed && styles.pressed]}
          onPress={onAddFood}
          accessibilityRole="button"
          accessibilityLabel="Добавить еду"
        >
          <Ionicons name="add" size={20} color={colors.primaryButtonText} />
          <Text style={[styles.addBtnText, n && styles.addBtnTextN]}>Добавить еду</Text>
        </Pressable>
      ) : null}

      {quickRepeats.length > 0 ? (
        <View style={styles.list}>
          {quickRepeats.slice(0, 3).map((e) => (
            <Pressable
              key={e.id}
              style={({ pressed }) => [styles.repeatRow, pressed && styles.pressed]}
              onPress={() => onRepeat(e.id)}
              accessibilityRole="button"
              accessibilityLabel={`Повторить ${e.displayName}, ${e.grams} грамм в ${MEAL_RU[meal]}`}
            >
              <Ionicons name="refresh" size={16} color={colors.text} />
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {e.displayName}
                </Text>
                <Text style={styles.rowMeta}>
                  {e.grams} г → {MEAL_RU[meal]}
                </Text>
              </View>
              <Text style={styles.plus}>+</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {onCopyYesterday ? (
        <Pressable
          style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]}
          onPress={onCopyYesterday}
          accessibilityRole="button"
          accessibilityLabel="Скопировать вчерашний день"
        >
          <Ionicons name="copy-outline" size={18} color={colors.text} />
          <Text style={styles.copyText}>Повторить вчерашний день</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.lg,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: space.sm,
  },
  title: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
  },
  status: {
    fontSize: type.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  diaryLink: {
    fontSize: type.caption,
    color: colors.text,
    fontWeight: '700',
  },
  mealLabel: {
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: space.sm,
  },
  chipsWrap: { marginBottom: space.md },
  sectionLabel: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: space.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  list: { marginBottom: space.sm },
  row: {
    paddingVertical: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  repeatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touchMin,
    paddingVertical: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: type.body, fontWeight: '600', color: colors.text },
  rowMeta: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
  plus: { fontSize: 20, fontWeight: '700', color: colors.text, paddingHorizontal: space.xs },
  empty: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.sm,
  },
  emptyTitle: { fontWeight: '800', color: colors.text, fontSize: type.body, marginBottom: 4 },
  emptyBody: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: touchMin,
    marginBottom: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryButton,
  },
  addBtnText: {
    fontWeight: '800',
    color: colors.primaryButtonText,
    fontSize: type.body,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: 44,
    marginTop: space.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  copyText: { fontWeight: '700', color: colors.text, fontSize: type.caption },
  pressed: { opacity: 0.88 },
  wrapN: {
    backgroundColor: nothing.surface,
    borderRadius: nothingRadius.sm,
    borderColor: nothing.lineStrong,
    padding: nothingSpace.lg,
  },
  titleN: {
    fontSize: nothingType.micro,
    letterSpacing: nothingType.letterWide,
    textTransform: 'uppercase',
    color: nothing.muted,
  },
  addBtnN: {
    borderRadius: nothingRadius.sm,
    backgroundColor: nothing.invert,
  },
  addBtnTextN: {
    letterSpacing: 0.6,
  },
});

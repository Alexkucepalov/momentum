import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  repeatableDayFromEntries,
  shiftDateLocal,
} from '../../../../src/domain/repeatMeal';
import { useAddGuard } from '../hooks/useAddGuard';
import { useData, useDiaryRevision } from '../state/DataContext';
import { AppText, colors, radius, space, touchMin } from '../design-system';

/**
 * One-tap repeat of previous calendar day's linked food (J1/J2).
 * Sets Undo to soft-delete the newly created entries (J6).
 */
export function CopyYesterdayButton({ testID = 'copy-yesterday' }: { testID?: string }) {
  const { repo, dateLocal, refresh, showFlash, setUndo } = useData();
  const revision = useDiaryRevision();
  const allowAdd = useAddGuard();
  void revision;
  const yesterday = shiftDateLocal(dateLocal, -1);
  const sourceCount = repo.listEntriesForDate(yesterday).length;
  if (sourceCount === 0) return null;

  const onCopy = () => {
    if (!allowAdd()) return;
    const items = repeatableDayFromEntries(repo.listEntriesForDate(yesterday));
    if (items.length === 0) {
      showFlash('Вчерашние записи без продукта/рецепта — повторить нельзя');
      return;
    }
    const createdIds: string[] = [];
    for (const item of items) {
      if (item.kind === 'product') {
        const e = repo.addEntryFromProduct({
          productId: item.productId,
          dateLocal,
          meal: item.meal,
          grams: item.grams,
        });
        createdIds.push(e.id);
      } else {
        const e = repo.addEntryFromRecipe({
          recipeId: item.recipeId,
          dateLocal,
          meal: item.meal,
          grams: item.grams,
        });
        createdIds.push(e.id);
      }
    }
    refresh('diary');
    showFlash(`Повторили вчера · ${createdIds.length}`);
    setUndo({
      entryIds: createdIds,
      message: `Добавлено из вчера · ${createdIds.length}`,
    });
  };

  return (
    <Pressable
      testID={testID}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      onPress={onCopy}
      accessibilityRole="button"
      accessibilityLabel={`Повторить вчерашний рацион, ${sourceCount} записей`}
      accessibilityHint="Добавит в выбранный день те же приёмы и порции. Можно отменить."
    >
      <View style={styles.iconWrap}>
        <Ionicons name="copy-outline" size={18} color={colors.ink} />
      </View>
      <View style={styles.textCol}>
        <AppText variant="body" style={styles.label}>
          Повторить вчера
        </AppText>
        <AppText variant="caption" tone="secondary">
          {sourceCount} зап. · те же приёмы · ≤10 с
        </AppText>
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.sm,
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
  label: { fontWeight: '700' },
});

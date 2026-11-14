import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  shiftDateLocal,
} from '../../../../src/domain/repeatMeal';
import { localDateKey } from '../../../../src/storage/validation';
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
    let createdIds: string[];
    try {
      createdIds = repo.copyDiaryEntries({ items: repo.listEntriesForDate(yesterday).map(e => ({ entryId: e.id })), dateLocal }).map(e => e.id);
    } catch (e) { showFlash(e instanceof Error ? e.message : 'Не удалось повторить день'); return; }
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
      accessibilityLabel={`Повторить предыдущий день, ${sourceCount} записей`}
      accessibilityHint="Добавит в выбранный день те же приёмы и порции. Можно отменить."
    >
      <View style={styles.iconWrap}>
        <Ionicons name="copy-outline" size={18} color={colors.ink} />
      </View>
      <View style={styles.textCol}>
        <AppText variant="body" style={styles.label}>
          {dateLocal === localDateKey(new Date(), repo.getProfile().timezone) ? 'Повторить вчера' : 'Повторить предыдущий день'}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {sourceCount} зап. · те же порции
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
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.sm,
  },
  pressed: { opacity: 0.88 },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  label: { fontWeight: '500' },
});

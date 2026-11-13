import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SwipeToDismissSheet } from '@/src/components/SwipeToDismissSheet';
import { AppButton, AppText, Field, colors, radius, space, touchMin } from '@/src/design-system';

const RPE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function SessionFinishSheet({
  visible,
  title,
  onClose,
  onConfirm,
  completedCount,
  totalCount,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (args: { feelingRpe: number | null; feelingNote: string | null }) => void;
  completedCount?: number;
  totalCount?: number;
}) {
  const [rpe, setRpe] = useState<number | null>(null);
  const [note, setNote] = useState('');
  useEffect(() => { if (visible) { setRpe(null); setNote(''); } }, [visible, title]);

  return (
    <SwipeToDismissSheet visible={visible} onClose={onClose} maxHeightRatio={0.7} testID="session-finish-sheet">
      <View style={styles.pad}>
        <AppText variant="title" style={styles.title}>
          Как прошла?
        </AppText>
        {completedCount != null && totalCount != null ? <AppText variant="caption" tone="secondary">Записано подходов: {completedCount} из {totalCount}. {completedCount < totalCount ? 'Незаписанные подходы останутся пустыми.' : ''}</AppText> : null}
        <AppText variant="caption" tone="muted" style={styles.sub}>
          {title} · сложность по желанию (1–10). Пусто = неизвестно, не ноль.
        </AppText>
        <View style={styles.rpeRow}>
          {RPE.map((n) => {
            const on = rpe === n;
            return (
              <Pressable
                key={n}
                onPress={() => setRpe(value => value === n ? null : n)}
                style={({ pressed }) => [styles.rpeChip, on && styles.rpeOn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`Сложность ${n}`}
              >
                <AppText variant="caption" tone={on ? 'inverse' : 'ink'}>
                  {n}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <Field
          label="Заметка (самочувствие)"
          value={note}
          onChangeText={setNote}
          placeholder="например: поясница ок, спал мало"
        />
        <AppButton
          label="Сохранить тренировку"
          onPress={() =>
            onConfirm({
              feelingRpe: rpe,
              feelingNote: note.trim() ? note.trim() : null,
            })
          }
          testID="session-finish-save"
        />
        <AppButton
          label="Сохранить без оценки"
          variant="ghost"
          onPress={() => onConfirm({ feelingRpe: null, feelingNote: note.trim() || null })}
        />
      </View>
    </SwipeToDismissSheet>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, gap: space.sm },
  title: { fontWeight: '800' },
  sub: { marginBottom: space.sm },
  rpeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginBottom: space.sm,
  },
  rpeChip: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rpeOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  pressed: { opacity: 0.85 },
});

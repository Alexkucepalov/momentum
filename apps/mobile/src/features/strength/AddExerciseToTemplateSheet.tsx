import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { StrengthExercise } from '../../../../../src/domain/strength/types';
import { SwipeToDismissSheet } from '@/src/components/SwipeToDismissSheet';
import { AppButton, AppText, Field, colors, radius, space, touchMin } from '@/src/design-system';

export function AddExerciseToTemplateSheet({
  visible,
  exercises,
  excludeIds,
  onClose,
  onPick,
  onCreateNew,
}: {
  visible: boolean;
  exercises: StrengthExercise[];
  excludeIds: Set<string>;
  onClose: () => void;
  onPick: (exerciseId: string) => void;
  onCreateNew: () => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises
      .filter((e) => !excludeIds.has(e.id))
      .filter((e) => (q ? e.name.toLowerCase().includes(q) : true));
  }, [exercises, excludeIds, query]);

  return (
    <SwipeToDismissSheet
      visible={visible}
      onClose={onClose}
      maxHeightRatio={0.85}
      testID="add-exercise-template-sheet"
    >
      <View style={styles.pad}>
        <AppText variant="title" style={styles.title}>
          Добавить упражнение
        </AppText>
        <Field
          label="Поиск"
          value={query}
          onChangeText={setQuery}
          placeholder="жим, тяга…"
          autoCorrect={false}
        />
        <AppButton label="Новое упражнение" variant="secondary" onPress={onCreateNew} />
        <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
          {filtered.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => onPick(e.id)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Добавить ${e.name}`}
            >
              <AppText variant="body">{e.name}</AppText>
              {e.equipment ? (
                <AppText variant="caption" tone="muted">
                  {e.equipment}
                </AppText>
              ) : null}
            </Pressable>
          ))}
          {filtered.length === 0 ? (
            <AppText variant="caption" tone="muted" style={styles.empty}>
              Ничего не найдено — создай своё
            </AppText>
          ) : null}
        </ScrollView>
      </View>
    </SwipeToDismissSheet>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, gap: space.sm, maxHeight: '100%' },
  title: { fontWeight: '800' },
  scroll: { maxHeight: 360 },
  row: {
    minHeight: touchMin,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: space.sm,
    gap: 2,
  },
  empty: { paddingVertical: space.md },
  pressed: { opacity: 0.85 },
});

import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { MuscleGroup } from '../../../../../src/domain/strength/types';
import { SwipeToDismissSheet } from '@/src/components/SwipeToDismissSheet';
import { AppButton, AppText, Field, colors, radius, space, touchMin } from '@/src/design-system';

const MUSCLES: { id: MuscleGroup; label: string }[] = [
  { id: 'chest', label: 'грудь' },
  { id: 'back', label: 'спина' },
  { id: 'shoulders', label: 'плечи' },
  { id: 'biceps', label: 'бицепс' },
  { id: 'triceps', label: 'трицепс' },
  { id: 'legs', label: 'ноги' },
  { id: 'core', label: 'корпус' },
  { id: 'other', label: 'другое' },
];

export function CreateExerciseSheet({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: {
    name: string;
    primaryMuscles: MuscleGroup[];
    equipment: string | null;
  }) => void;
}) {
  const [name, setName] = useState('');
  const [equipment, setEquipment] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup>('other');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Введи название');
      return;
    }
    setError(null);
    onCreate({
      name: trimmed,
      primaryMuscles: [muscle],
      equipment: equipment.trim() ? equipment.trim() : null,
    });
    setName('');
    setEquipment('');
    setMuscle('other');
  };

  return (
    <SwipeToDismissSheet
      visible={visible}
      onClose={onClose}
      maxHeightRatio={0.75}
      testID="create-exercise-sheet"
    >
      <View style={styles.pad}>
        <AppText variant="title" style={styles.title}>
          Новое упражнение
        </AppText>
        <Field label="Название" value={name} onChangeText={setName} placeholder="например: Жим гантелей" />
        <Field
          label="Оборудование"
          value={equipment}
          onChangeText={setEquipment}
          placeholder="гантели / тренажёр / тело"
        />
        <AppText variant="label" tone="muted">
          Основная группа
        </AppText>
        <View style={styles.chips}>
          {MUSCLES.map((m) => {
            const on = muscle === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMuscle(m.id)}
                style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={m.label}
              >
                <AppText variant="caption" tone={on ? 'inverse' : 'ink'}>
                  {m.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        {error ? (
          <AppText variant="caption" tone="danger">
            {error}
          </AppText>
        ) : null}
        <AppButton label="Создать и добавить" onPress={submit} testID="create-exercise-save" />
      </View>
    </SwipeToDismissSheet>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, gap: space.sm },
  title: { fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginBottom: space.sm },
  chip: {
    minHeight: touchMin - 12,
    paddingHorizontal: space.sm,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  pressed: { opacity: 0.85 },
});

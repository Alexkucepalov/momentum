import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { parseOptionalNonNegativeNumber } from '../../../../../src/domain/strength';
import type { WorkoutSet } from '../../../../../src/domain/strength/types';
import { AppText, Field, colors, radius, space, touchMin } from '@/src/design-system';

function formatHint(kg: number | null, reps: number | null): string | null {
  if (kg == null && reps == null) return null;
  const w = kg == null ? '—' : String(kg);
  const r = reps == null ? '—' : String(reps);
  return `${w} кг × ${r}`;
}

export function SetLogRow({
  set,
  exerciseName,
  onComplete,
}: {
  set: WorkoutSet;
  exerciseName: string;
  onComplete: (args: { weightKg: number | null; reps: number | null }) => void;
}) {
  const [weight, setWeight] = useState(set.weightKg != null ? String(set.weightKg) : '');
  const [reps, setReps] = useState(set.reps != null ? String(set.reps) : '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWeight(set.weightKg != null ? String(set.weightKg) : '');
    setReps(set.reps != null ? String(set.reps) : '');
    setError(null);
  }, [set.id, set.weightKg, set.reps, set.completed]);

  const hint = formatHint(set.targetWeightKg, set.targetReps);

  const submit = () => {
    const w = parseOptionalNonNegativeNumber(weight);
    const r = parseOptionalNonNegativeNumber(reps);
    if (!w.ok) {
      setError(w.error);
      return;
    }
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(null);
    onComplete({ weightKg: w.value, reps: r.value });
  };

  return (
    <View
      style={[styles.row, set.completed && styles.rowDone]}
      accessibilityLabel={`${exerciseName}, подход ${set.setIndex}`}
    >
      <View style={styles.top}>
        <AppText variant="label" tone="muted">
          Подход {set.setIndex}
        </AppText>
        {set.completed ? (
          <View accessibilityLabel="Подход записан">
            <Ionicons name="checkmark-circle" size={28} color={colors.success} />
          </View>
        ) : (
          <Pressable
            onPress={submit}
            style={({ pressed }) => [styles.checkBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Записать подход ${set.setIndex}`}
            testID={`set-complete-${set.id}`}
          >
            <Ionicons name="checkmark" size={22} color={colors.ink} />
          </Pressable>
        )}
      </View>
      <View style={styles.fields}>
        <View style={styles.fieldWrap}>
          <Field
            label="кг"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder={set.targetWeightKg != null ? String(set.targetWeightKg) : '—'}
            editable={!set.completed}
            testID={`set-weight-${set.id}`}
          />
        </View>
        <View style={styles.fieldWrap}>
          <Field
            label="повт."
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            placeholder={set.targetReps != null ? String(set.targetReps) : '—'}
            editable={!set.completed}
            testID={`set-reps-${set.id}`}
          />
        </View>
      </View>
      {hint && !set.completed ? (
        <AppText variant="caption" tone="muted">
          прошлый: {hint}
        </AppText>
      ) : null}
      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: space.md,
    marginBottom: space.sm,
    gap: space.xs,
  },
  rowDone: {
    opacity: 0.72,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  fields: {
    flexDirection: 'row',
    gap: space.sm,
  },
  fieldWrap: {
    flex: 1,
  },
  checkBtn: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
});

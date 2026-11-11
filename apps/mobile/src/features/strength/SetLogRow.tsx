import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  initialSetFieldValues,
  parseOptionalNonNegativeNumber,
} from '../../../../../src/domain/strength';
import type { WorkoutSet } from '../../../../../src/domain/strength/types';
import { AppText, Field, colors, radius, space, touchMin } from '@/src/design-system';

function formatHint(kg: number | null, reps: number | null): string | null {
  if (kg == null && reps == null) return null;
  const w = kg == null ? '—' : String(kg);
  const r = reps == null ? '—' : String(reps);
  return `${w} × ${r}`;
}

export function SetLogRow({
  set,
  exerciseName,
  isCurrent,
  onComplete,
}: {
  set: WorkoutSet;
  exerciseName: string;
  isCurrent?: boolean;
  onComplete: (args: { weightKg: number | null; reps: number | null }) => void;
}) {
  const seeded = initialSetFieldValues(set);
  const [weight, setWeight] = useState(seeded.weight);
  const [reps, setReps] = useState(seeded.reps);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = initialSetFieldValues(set);
    setWeight(next.weight);
    setReps(next.reps);
    setError(null);
  }, [set.id, set.weightKg, set.reps, set.targetWeightKg, set.targetReps, set.completed]);

  const hint = formatHint(set.targetWeightKg, set.targetReps);
  const canRepeat =
    !set.completed &&
    set.weightKg == null &&
    set.reps == null &&
    (set.targetWeightKg != null || set.targetReps != null);

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

  const repeatPrevious = () => {
    onComplete({
      weightKg: set.targetWeightKg,
      reps: set.targetReps,
    });
  };

  return (
    <View
      style={[
        styles.row,
        set.completed && styles.rowDone,
        isCurrent && !set.completed && styles.rowCurrent,
      ]}
      accessibilityLabel={`${exerciseName}, подход ${set.setIndex}${isCurrent ? ', текущий' : ''}`}
    >
      <View style={styles.top}>
        <AppText variant="label" tone={isCurrent ? 'ink' : 'muted'}>
          {set.setIndex}
          {isCurrent && !set.completed ? ' · сейчас' : ''}
        </AppText>
        <View style={styles.topActions}>
          {canRepeat ? (
            <Pressable
              onPress={repeatPrevious}
              style={({ pressed }) => [styles.repeatBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Повторить прошлый ${hint ?? ''}`}
              testID={`set-repeat-${set.id}`}
            >
              <AppText variant="caption">Как в прошлый</AppText>
            </Pressable>
          ) : null}
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
              <Ionicons name="checkmark" size={22} color={colors.onPrimary} />
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.fields}>
        <View style={styles.fieldWrap}>
          <Field
            label="кг"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="—"
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
            placeholder="—"
            editable={!set.completed}
            testID={`set-reps-${set.id}`}
          />
        </View>
      </View>
      {hint && !set.completed && !canRepeat ? (
        <AppText variant="caption" tone="muted">
          ориентир: {hint}
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
    opacity: 0.55,
  },
  rowCurrent: {
    borderColor: colors.ink,
    borderWidth: 1.5,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
    gap: space.sm,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
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
    backgroundColor: colors.ink,
  },
  repeatBtn: {
    minHeight: touchMin - 8,
    paddingHorizontal: space.sm,
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.canvas,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
});

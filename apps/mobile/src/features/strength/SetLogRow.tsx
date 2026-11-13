import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initialSetFieldValues, parseOptionalNonNegativeNumber } from '../../../../../src/domain/strength';
import type { WorkoutSet } from '../../../../../src/domain/strength/types';
import { AppButton, AppText, Field, colors, radius, space, touchMin } from '@/src/design-system';

const fmt = (n: number | null) => n == null ? '—' : n.toLocaleString('ru-RU');
export function SetLogRow({ set, exerciseName, isCurrent, onComplete }: {
  set: WorkoutSet; exerciseName: string; isCurrent?: boolean;
  onComplete: (args: { weightKg: number | null; reps: number | null }) => void;
}) {
  const initial = initialSetFieldValues(set);
  const [weight, setWeight] = useState(initial.weight);
  const [reps, setReps] = useState(initial.reps);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const next = initialSetFieldValues(set);
    setWeight(next.weight); setReps(next.reps); setError(null);
  }, [set.id, set.weightKg, set.reps, set.targetWeightKg, set.targetReps, set.completed]);

  if (set.completed) return (
    <View style={styles.saved} accessibilityLabel={`${exerciseName}, подход ${set.setIndex}, записан: ${fmt(set.weightKg)} кг, ${fmt(set.reps)} повторов`}>
      <AppText variant="caption" tone="secondary">Подход {set.setIndex}</AppText>
      <AppText variant="body" style={styles.savedValue}>{fmt(set.weightKg)} кг × {fmt(set.reps)}</AppText>
      <Ionicons name="checkmark" size={18} color={colors.success} />
    </View>
  );
  if (!isCurrent && !expanded) return (
    <Pressable onPress={() => setExpanded(true)} style={styles.saved} accessibilityRole="button" accessibilityLabel={`${exerciseName}, настроить подход ${set.setIndex}`}>
      <AppText variant="caption" tone="secondary">Подход {set.setIndex}</AppText>
      <AppText variant="caption" tone="muted" style={styles.savedValue}>{fmt(set.targetWeightKg)} кг × {fmt(set.targetReps)}</AppText>
      <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
    </Pressable>
  );
  const submit = () => {
    const w = parseOptionalNonNegativeNumber(weight);
    const r = parseOptionalNonNegativeNumber(reps);
    if (!w.ok) { setError(w.error); return; }
    if (!r.ok) { setError(r.error); return; }
    setError(null); onComplete({ weightKg: w.value, reps: r.value });
  };
  const canRepeat = set.weightKg == null && set.reps == null && (set.targetWeightKg != null || set.targetReps != null);
  return (
    <View style={styles.current} accessibilityLabel={`${exerciseName}, подход ${set.setIndex}${isCurrent ? ', текущий' : ''}`}>
      <View style={styles.top}><AppText variant="caption">Подход {set.setIndex}{isCurrent ? ' · сейчас' : ''}</AppText>{canRepeat ? <Pressable onPress={() => onComplete({ weightKg: set.targetWeightKg, reps: set.targetReps })} style={styles.repeat} accessibilityRole="button" accessibilityLabel={`Повторить прошлый ${fmt(set.targetWeightKg)} на ${fmt(set.targetReps)}`} testID={`set-repeat-${set.id}`}><AppText variant="caption" tone="secondary">Как в прошлый</AppText></Pressable> : null}</View>
      <View style={styles.fields}>
        <View style={styles.field}><Field label="Вес, кг" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="—" style={styles.input} testID={`set-weight-${set.id}`} /></View>
        <View style={styles.field}><Field label="Повторения" value={reps} onChangeText={setReps} keyboardType="number-pad" placeholder="—" style={styles.input} testID={`set-reps-${set.id}`} /></View>
      </View>
      {error ? <AppText variant="caption" tone="danger" accessibilityRole="alert">{error}</AppText> : null}
      <AppButton label="Записать подход" onPress={submit} testID={`set-complete-${set.id}`} />
    </View>
  );
}
const styles = StyleSheet.create({
  saved: { minHeight: touchMin, flexDirection: 'row', alignItems: 'center', gap: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingVertical: space.sm },
  savedValue: { flex: 1, textAlign: 'right', fontWeight: '500' },
  current: { borderRadius: radius.card, backgroundColor: colors.trainingStrength, padding: space.lg, gap: space.md, marginVertical: space.sm },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }, repeat: { minHeight: 44, justifyContent: 'center' },
  fields: { flexDirection: 'row', gap: space.md }, field: { flex: 1, minWidth: 0 }, input: { fontSize: 32, height: 64, textAlign: 'center', borderWidth: 0, backgroundColor: colors.surface, letterSpacing: -1 },
});

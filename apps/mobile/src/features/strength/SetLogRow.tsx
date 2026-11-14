import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initialSetFieldValues, parseOptionalNonNegativeNumber, parseOptionalRepetitions } from '../../../../../src/domain/strength';
import type { WorkoutSet } from '../../../../../src/domain/strength/types';
import { AppButton, AppText, Field, colors, radius, space, touchMin } from '@/src/design-system';

const fmt = (n: number | null) => n == null ? '—' : n.toLocaleString('ru-RU');
export function SetLogRow({ set, exerciseName, isCurrent, readOnly = false, onComplete }: {
  set: WorkoutSet; exerciseName: string; isCurrent?: boolean; readOnly?: boolean;
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

  if (readOnly || (set.completed && !expanded)) return (
    <Pressable onPress={readOnly ? undefined : () => setExpanded(true)} disabled={readOnly} accessibilityRole={readOnly ? undefined : 'button'} style={styles.saved} accessibilityLabel={`${exerciseName}, подход ${set.setIndex}, ${set.completed ? 'записан' : 'не записан'}: ${fmt(set.weightKg)} кг, ${fmt(set.reps)} повторов${readOnly ? '' : '. Изменить подход'}`}>
      <AppText variant="caption" tone="secondary">Подход {set.setIndex}</AppText>
      <AppText variant="body" style={styles.savedValue}>{fmt(set.weightKg)} кг × {fmt(set.reps)}</AppText>
      <Ionicons name={set.completed ? 'checkmark' : 'remove-outline'} size={18} color={set.completed ? colors.success : colors.textMuted} />
    </Pressable>
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
    const r = parseOptionalRepetitions(reps);
    if (!w.ok) { setError(w.error); return; }
    if (!r.ok) { setError(r.error); return; }
    setError(null); onComplete({ weightKg: w.value, reps: r.value }); setExpanded(false);
  };
  const canRepeat = set.weightKg == null && set.reps == null && (set.targetWeightKg != null || set.targetReps != null);
  return (
    <View style={styles.current} accessibilityLabel={`${exerciseName}, подход ${set.setIndex}${isCurrent ? ', текущий' : ''}`}>
      <View style={styles.top}><AppText variant="caption">Подход {set.setIndex}{isCurrent ? ' · сейчас' : ''}</AppText>{canRepeat ? <Pressable onPress={() => onComplete({ weightKg: set.targetWeightKg, reps: set.targetReps })} style={styles.repeat} accessibilityRole="button" accessibilityLabel={`Записать подсказку: ${fmt(set.targetWeightKg)} кг, ${fmt(set.targetReps)} повторений`} testID={`set-repeat-${set.id}`}><AppText variant="caption" tone="secondary">Записать подсказку</AppText></Pressable> : null}</View>
      <View style={styles.fields}>
        <View style={styles.field}><Field label="Вес, кг" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="—" style={styles.input} testID={`set-weight-${set.id}`} /></View>
        <View style={styles.field}><Field label="Повторения" value={reps} onChangeText={setReps} keyboardType="number-pad" placeholder="—" style={styles.input} testID={`set-reps-${set.id}`} /></View>
      </View>
      {error ? <AppText variant="caption" tone="danger" accessibilityRole="alert">{error}</AppText> : null}
      <AppButton label={set.completed ? 'Сохранить изменения' : 'Записать подход'} onPress={submit} testID={`set-complete-${set.id}`} />
      {set.completed ? <AppButton label="Отмена" variant="ghost" onPress={() => setExpanded(false)} /> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  saved: { minHeight: touchMin, flexDirection: 'row', alignItems: 'center', gap: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingVertical: space.sm },
  savedValue: { flex: 1, textAlign: 'right', fontWeight: '500' },
  current: { borderRadius: radius.card, backgroundColor: colors.trainingStrength, padding: space.lg, gap: space.md, marginVertical: space.sm },
  top: { flexWrap: 'wrap', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }, repeat: { minHeight: touchMin, justifyContent: 'center' },
  fields: { flexDirection: 'row', gap: space.md }, field: { flex: 1, minWidth: 0 }, input: { fontSize: 32, height: 64, textAlign: 'center', borderWidth: 0, backgroundColor: colors.surface, letterSpacing: -1 },
});

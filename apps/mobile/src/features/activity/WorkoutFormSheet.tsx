import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { WorkoutType } from '../../../../../src/storage/types';
import { FormScrollView } from '../../components/FormScrollView';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SwipeToDismissSheet } from '../../components/SwipeToDismissSheet';
import { colors, elevation, radius, space, touchMin, type } from '../../theme/tokens';

const TYPES: Array<{ type: WorkoutType; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { type: 'walking', label: 'Ходьба', icon: 'walk-outline' },
  { type: 'cycling', label: 'Вело', icon: 'bicycle-outline' },
  { type: 'strength', label: 'Сила', icon: 'barbell-outline' },
  { type: 'football', label: 'Футбол', icon: 'football-outline' },
  { type: 'other', label: 'Другое', icon: 'fitness-outline' },
];

const PRESETS = [15, 30, 45, 60] as const;
const RPE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function buildNotes(args: {
  type: WorkoutType;
  note: string;
  steps: string;
  avgSpeed: string;
  sets: string;
  rpe: number | null;
  customName: string;
}): string | null {
  const parts: string[] = [];
  if (args.type === 'other' && args.customName.trim()) {
    parts.push(args.customName.trim());
  }
  if (args.type === 'walking' && args.steps.trim()) {
    parts.push(`шаги ${args.steps.trim()}`);
  }
  if (args.type === 'cycling' && args.avgSpeed.trim()) {
    parts.push(`ср. ${args.avgSpeed.trim()} км/ч`);
  }
  if (args.type === 'strength' && args.sets.trim()) {
    parts.push(args.sets.trim());
  }
  if (args.type === 'football' && args.rpe != null) {
    parts.push(`интенсивность ${args.rpe}/10`);
  }
  if (args.note.trim()) parts.push(args.note.trim());
  return parts.length ? parts.join(' · ') : null;
}

/**
 * Contextual workout form — fields depend on type (Sprint 3).
 * Extra details are stored in notes (no schema bump). Full strength editor = later.
 */
export function WorkoutFormSheet({
  visible,
  onClose,
  onSave,
  initialType = 'walking',
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (input: {
    type: WorkoutType;
    durationSec: number;
    distanceM: number | null;
    notes: string | null;
  }) => void;
  initialType?: WorkoutType;
}) {
  const [workoutType, setWorkoutType] = useState<WorkoutType>(initialType);
  const [minutes, setMinutes] = useState('30');
  const [distanceKm, setDistanceKm] = useState('');
  const [steps, setSteps] = useState('');
  const [avgSpeed, setAvgSpeed] = useState('');
  const [sets, setSets] = useState('');
  const [rpe, setRpe] = useState<number | null>(5);
  const [customName, setCustomName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setWorkoutType(initialType);
    setError(null);
  }, [visible, initialType]);

  const showDistance = workoutType === 'walking' || workoutType === 'cycling';

  const submit = () => {
    try {
      setError(null);
      const mins = Number(minutes.replace(',', '.'));
      if (!Number.isFinite(mins) || mins <= 0) throw new Error('Длительность в минутах должна быть > 0');
      if (workoutType === 'other' && !customName.trim() && !notes.trim()) {
        throw new Error('Укажи название или заметку');
      }
      const distRaw = distanceKm.trim();
      const distanceM =
        !showDistance || distRaw === ''
          ? null
          : (() => {
              const km = Number(distRaw.replace(',', '.'));
              if (!Number.isFinite(km) || km < 0) throw new Error('Дистанция в км должна быть ≥ 0');
              return Math.round(km * 1000);
            })();
      onSave({
        type: workoutType,
        durationSec: Math.round(mins * 60),
        distanceM,
        notes: buildNotes({
          type: workoutType,
          note: notes,
          steps,
          avgSpeed,
          sets,
          rpe: workoutType === 'football' ? rpe : null,
          customName,
        }),
      });
      setNotes('');
      setDistanceKm('');
      setSteps('');
      setAvgSpeed('');
      setSets('');
      setCustomName('');
      setMinutes('30');
      setRpe(5);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не сохранено');
    }
  };

  return (
    <SwipeToDismissSheet visible={visible} onClose={onClose} maxHeightRatio={0.92}>
      <FormScrollView variant="sheet" contentContainerStyle={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Новая тренировка
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Закрыть">
            <Text style={styles.close}>Закрыть</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Вид</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.types}>
          {TYPES.map((t) => {
            const on = workoutType === t.type;
            return (
              <Pressable
                key={t.type}
                style={({ pressed }) => [
                  styles.typeChip,
                  on && styles.typeChipOn,
                  pressed && styles.pressed,
                ]}
                onPress={() => setWorkoutType(t.type)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={t.label}
              >
                <Ionicons name={t.icon} size={18} color={on ? colors.primaryButtonText : colors.text} />
                <Text style={[styles.typeText, on && styles.typeTextOn]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {workoutType === 'other' ? (
          <Field
            label="Название"
            value={customName}
            onChangeText={setCustomName}
            placeholder="например Йога"
          />
        ) : null}

        <Text style={styles.section}>Длительность</Text>
        <View style={styles.presets}>
          {PRESETS.map((m) => {
            const on = minutes === String(m);
            return (
              <Pressable
                key={m}
                style={({ pressed }) => [
                  styles.preset,
                  on && styles.presetOn,
                  pressed && styles.pressed,
                ]}
                onPress={() => setMinutes(String(m))}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${m} минут`}
              >
                <Text style={[styles.presetText, on && styles.presetTextOn]}>{m}</Text>
              </Pressable>
            );
          })}
        </View>
        <Field label="Минуты" value={minutes} onChangeText={setMinutes} keyboardType="decimal-pad" />

        {showDistance ? (
          <Field
            label="Дистанция, км (необязательно)"
            value={distanceKm}
            onChangeText={setDistanceKm}
            keyboardType="decimal-pad"
          />
        ) : null}

        {workoutType === 'walking' ? (
          <Field
            label="Шаги (необязательно)"
            value={steps}
            onChangeText={setSteps}
            keyboardType="number-pad"
            placeholder="например 6500"
          />
        ) : null}

        {workoutType === 'cycling' ? (
          <Field
            label="Средняя скорость, км/ч (необязательно)"
            value={avgSpeed}
            onChangeText={setAvgSpeed}
            keyboardType="decimal-pad"
          />
        ) : null}

        {workoutType === 'strength' ? (
          <Field
            label="Упражнения / подходы (кратко)"
            value={sets}
            onChangeText={setSets}
            placeholder="присед 3×8 · 60 кг"
          />
        ) : null}

        {workoutType === 'football' ? (
          <>
            <Text style={styles.section}>Интенсивность (1–10)</Text>
            <View style={styles.rpeRow}>
              {RPE.map((n) => {
                const on = rpe === n;
                return (
                  <Pressable
                    key={n}
                    style={[styles.rpeChip, on && styles.rpeChipOn]}
                    onPress={() => setRpe(n)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`Интенсивность ${n}`}
                  >
                    <Text style={[styles.rpeText, on && styles.rpeTextOn]}>{n}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <Field label="Заметка" value={notes} onChangeText={setNotes} placeholder="по желанию" />

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="assertive">
            {error}
          </Text>
        ) : null}
        <PrimaryButton label="Сохранить" onPress={submit} />
      </FormScrollView>
    </SwipeToDismissSheet>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  title: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  close: {
    fontSize: type.body,
    fontWeight: '600',
    color: colors.text,
    minHeight: touchMin,
    textAlignVertical: 'center',
  },
  section: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: space.sm,
  },
  types: { gap: space.sm, paddingBottom: space.md },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 40,
  },
  typeChipOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  pressed: { opacity: 0.88 },
  typeText: { fontWeight: '600', color: colors.text, fontSize: type.caption },
  typeTextOn: { color: colors.primaryButtonText },
  presets: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  preset: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...elevation.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  presetText: { fontWeight: '700', color: colors.text },
  presetTextOn: { color: colors.primaryButtonText },
  field: { marginBottom: space.md },
  fieldLabel: { fontSize: type.caption, color: colors.textSecondary, marginBottom: space.xs },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...elevation.card,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.text,
  },
  rpeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: space.lg },
  rpeChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  rpeChipOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  rpeText: { fontSize: type.micro, fontWeight: '700', color: colors.text },
  rpeTextOn: { color: colors.primaryButtonText },
  error: { color: colors.danger, marginBottom: space.sm },
});

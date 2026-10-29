import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { HabitAutoSource, HabitKind } from '../../../../../src/storage/types';
import { colors, radius, space, touchMin, type } from '../../theme/tokens';

const FREQ = [1, 2, 3, 4, 5, 6, 7] as const;

const AUTO_OPTIONS: { value: HabitAutoSource; label: string }[] = [
  { value: null, label: 'Только вручную' },
  { value: 'any_workout', label: 'После любой тренировки' },
  { value: 'walking', label: 'После ходьбы' },
  { value: 'cycling', label: 'После вело' },
  { value: 'strength', label: 'После силовой' },
];

export const HABIT_NAME_SUGGESTIONS = [
  'Растяжка',
  'Прогулка',
  'Медитация',
  'Чтение',
  'Сон раньше',
] as const;

export type HabitFormValue = {
  name: string;
  times: number;
  kind: HabitKind;
  unit: string;
  targetValue: string;
  autoSource: HabitAutoSource;
};

export function HabitFormFields({
  name,
  times,
  kind,
  unit,
  targetValue,
  autoSource,
  onChangeName,
  onChangeTimes,
  onChangeKind,
  onChangeUnit,
  onChangeTargetValue,
  onChangeAutoSource,
  namePlaceholder = 'например Растяжка',
}: {
  name: string;
  times: number;
  kind: HabitKind;
  unit: string;
  targetValue: string;
  autoSource: HabitAutoSource;
  onChangeName: (t: string) => void;
  onChangeTimes: (n: number) => void;
  onChangeKind: (k: HabitKind) => void;
  onChangeUnit: (t: string) => void;
  onChangeTargetValue: (t: string) => void;
  onChangeAutoSource: (s: HabitAutoSource) => void;
  namePlaceholder?: string;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>Название</Text>
      <TextInput
        value={name}
        onChangeText={onChangeName}
        placeholder={namePlaceholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        accessibilityLabel="Название привычки"
      />
      <View style={styles.suggestRow}>
        {HABIT_NAME_SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            style={({ pressed }) => [styles.suggest, pressed && styles.pressed]}
            onPress={() => onChangeName(s)}
            accessibilityRole="button"
            accessibilityLabel={`Подставить ${s}`}
          >
            <Text style={styles.suggestText}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Что хочешь отслеживать?</Text>
      <View style={styles.kindRow}>
        {(
          [
            { k: 'checkbox' as const, label: 'Дни недели' },
            { k: 'quantity' as const, label: 'Сумму (мин, км…)' },
          ] as const
        ).map(({ k, label }) => {
          const on = kind === k;
          return (
            <Pressable
              key={k}
              style={({ pressed }) => [
                styles.kindChip,
                on && styles.kindChipOn,
                pressed && styles.pressed,
              ]}
              onPress={() => onChangeKind(k)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={label}
            >
              <Text style={[styles.kindText, on && styles.kindTextOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {kind === 'checkbox' ? (
        <>
          <Text style={styles.fieldLabel}>Сколько дней в неделю?</Text>
          <Text style={styles.fieldHint}>Мягкая цель — пропуск дня ничего не ломает.</Text>
          <View style={styles.freqRow}>
            {FREQ.map((n) => {
              const on = times === n;
              return (
                <Pressable
                  key={n}
                  style={({ pressed }) => [
                    styles.freqChip,
                    on && styles.freqChipOn,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => onChangeTimes(n)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${n} раз в неделю`}
                >
                  <Text style={[styles.freqText, on && styles.freqTextOn]}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.fieldLabel}>Сколько за неделю?</Text>
          <Text style={styles.fieldHint}>Сумма и единица — как тебе удобно (мин, стр, раз…).</Text>
          <View style={styles.qtyRow}>
            <TextInput
              value={targetValue}
              onChangeText={onChangeTargetValue}
              keyboardType="decimal-pad"
              placeholder="например 150"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.qtyInput]}
              accessibilityLabel="Целевое количество за неделю"
            />
            <TextInput
              value={unit}
              onChangeText={onChangeUnit}
              placeholder="мин"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.unitInput]}
              accessibilityLabel="Единица измерения"
            />
          </View>
        </>
      )}

      <Text style={[styles.fieldLabel, styles.autoLabel]}>Отмечать автоматически?</Text>
      <Text style={styles.fieldHint}>
        Только если на устройстве уже есть подходящая тренировка — ничего не выдумываем.
      </Text>
      <View style={styles.autoRow}>
        {AUTO_OPTIONS.map((opt) => {
          const on = autoSource === opt.value;
          return (
            <Pressable
              key={String(opt.value)}
              style={({ pressed }) => [
                styles.suggest,
                on && styles.autoOn,
                pressed && styles.pressed,
              ]}
              onPress={() => onChangeAutoSource(opt.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={opt.label}
            >
              <Text style={[styles.suggestText, on && styles.autoOnText]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: space.xs,
  },
  autoLabel: { marginTop: space.lg },
  fieldHint: {
    fontSize: type.micro,
    color: colors.textMuted,
    marginBottom: space.sm,
    lineHeight: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    marginBottom: space.sm,
    color: colors.text,
    fontSize: type.body,
  },
  qtyRow: { flexDirection: 'row', gap: space.sm },
  qtyInput: { flex: 1 },
  unitInput: { width: 88 },
  suggestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginBottom: space.lg,
  },
  suggest: {
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  suggestText: { fontSize: type.micro, fontWeight: '600', color: colors.textSecondary },
  kindRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  kindChip: {
    flex: 1,
    minHeight: touchMin,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindChipOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  kindText: { fontWeight: '700', color: colors.text, fontSize: type.body },
  kindTextOn: { color: colors.primaryButtonText },
  freqRow: { flexDirection: 'row', gap: space.xs },
  freqChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqChipOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  freqText: { fontWeight: '700', color: colors.text, fontSize: type.body },
  freqTextOn: { color: colors.primaryButtonText },
  autoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  autoOn: { backgroundColor: colors.primaryButton },
  autoOnText: { color: colors.primaryButtonText },
  pressed: { opacity: 0.88 },
});

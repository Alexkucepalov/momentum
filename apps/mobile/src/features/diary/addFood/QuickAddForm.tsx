import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { kcalFromCompleteMacros } from '../../../../../../src/domain/nutritionConsistency';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { colors, radius, space, touchMin, type } from '../../../theme/tokens';

type Mode = 'kcal' | 'macros';

/**
 * Mode A — know restaurant kcal (macros stay unknown / null).
 * Mode B — enter any mix of kcal + БЖУ; empty = unknown, never coerced to 0.
 * Atwater suggestion is a hint only — does not overwrite user kcal.
 */
export function QuickAddForm({
  onSubmit,
}: {
  onSubmit: (values: {
    displayName: string;
    energyKcal: number | null;
    proteinG: number | null;
    fatG: number | null;
    carbG: number | null;
  }) => void;
}) {
  const [mode, setMode] = useState<Mode>('kcal');
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [error, setError] = useState<string | null>(null);

  const parseOptional = (raw: string): number | null => {
    const t = raw.trim();
    if (t === '') return null;
    const n = Number(t.replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) throw new Error('Число ≥ 0 или пусто');
    return n;
  };

  const proteinN = safeNum(protein);
  const fatN = safeNum(fat);
  const carbN = safeNum(carbs);
  const suggested =
    mode === 'macros' ? kcalFromCompleteMacros(proteinN, fatN, carbN) : null;

  const save = () => {
    try {
      setError(null);
      const energyKcal = parseOptional(kcal);
      const proteinG = mode === 'kcal' ? null : parseOptional(protein);
      const fatG = mode === 'kcal' ? null : parseOptional(fat);
      const carbG = mode === 'kcal' ? null : parseOptional(carbs);
      if (mode === 'kcal') {
        if (energyKcal === null) throw new Error('Укажи калории');
      } else if (energyKcal === null && proteinG === null && fatG === null && carbG === null) {
        throw new Error('Укажи хотя бы ккал или одно из Б/Ж/У');
      }
      onSubmit({
        displayName: name.trim() || 'Быстрый ввод',
        energyKcal,
        proteinG,
        fatG,
        carbG,
      });
      setName('');
      setKcal('');
      setProtein('');
      setFat('');
      setCarbs('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не сохранено');
    }
  };

  const applySuggested = () => {
    if (suggested == null) return;
    setKcal(String(Math.round(suggested)));
  };

  return (
    <View>
      <View style={styles.modes} accessibilityRole="tablist">
        <ModeChip
          label="Знаю ккал"
          active={mode === 'kcal'}
          onPress={() => setMode('kcal')}
        />
        <ModeChip
          label="Знаю КБЖУ"
          active={mode === 'macros'}
          onPress={() => setMode('macros')}
        />
      </View>

      <Text style={styles.lead}>
        {mode === 'kcal'
          ? 'Только калории — Б/Ж/У останутся неизвестными (—), не нулями.'
          : 'Любое сочетание полей. Пустое = неизвестно. Подсказка 4×Б+9×Ж+4×У не перезаписывает твои ккал.'}
      </Text>

      <Field
        label="Название (необязательно)"
        value={name}
        onChangeText={setName}
        placeholder="Кофе с молоком"
      />

      {mode === 'macros' ? (
        <View style={styles.row}>
          <View style={styles.third}>
            <Field label="Б" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" placeholder="—" />
          </View>
          <View style={styles.third}>
            <Field label="Ж" value={fat} onChangeText={setFat} keyboardType="decimal-pad" placeholder="—" />
          </View>
          <View style={styles.third}>
            <Field label="У" value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" placeholder="—" />
          </View>
        </View>
      ) : null}

      <Field
        label={mode === 'kcal' ? 'ккал' : 'ккал'}
        value={kcal}
        onChangeText={setKcal}
        keyboardType="decimal-pad"
        placeholder={mode === 'kcal' ? 'например 450' : 'пусто = неизвестно'}
      />

      {suggested != null ? (
        <Pressable
          onPress={applySuggested}
          style={({ pressed }) => [styles.hintBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Подставить ${Math.round(suggested)} килокалорий из БЖУ`}
        >
          <Text style={styles.hintText}>
            По БЖУ ≈ {Math.round(suggested)} ккал · нажми, чтобы подставить
          </Text>
        </Pressable>
      ) : null}

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      ) : null}
      <PrimaryButton label="Добавить в дневник" onPress={save} />
    </View>
  );
}

function safeNum(raw: string): number | null {
  const t = raw.trim();
  if (t === '') return null;
  const n = Number(t.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function ModeChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.modeChip, active && styles.modeChipOn]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Text style={[styles.modeLabel, active && styles.modeLabelOn]}>{label}</Text>
    </Pressable>
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
  keyboardType?: 'default' | 'decimal-pad';
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
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
  modes: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.md,
  },
  modeChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  modeChipOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  modeLabel: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  modeLabelOn: { color: colors.primaryButtonText },
  lead: {
    fontSize: type.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: space.md,
  },
  field: { marginBottom: space.sm },
  label: { fontSize: type.caption, color: colors.textSecondary, marginBottom: 4, fontWeight: '600' },
  input: {
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.text,
  },
  row: { flexDirection: 'row', gap: space.sm },
  third: { flex: 1 },
  hintBtn: {
    marginBottom: space.sm,
    paddingVertical: space.sm,
  },
  hintText: {
    fontSize: type.caption,
    color: colors.text,
    fontWeight: '600',
  },
  pressed: { opacity: 0.85 },
  error: { color: colors.danger, marginBottom: space.sm, fontSize: type.caption },
});

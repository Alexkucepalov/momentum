import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, elevation, radius, space, touchMin, type } from '../theme/tokens';

const PRESETS = [50, 100, 150, 200, 250] as const;

function formatGrams(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return String(rounded);
}

export function PortionStepper({
  grams,
  onChange,
  lastGrams,
}: {
  grams: number;
  onChange: (grams: number) => void;
  /** Remembered last portion — one-tap restore. */
  lastGrams?: number | null;
}) {
  const [raw, setRaw] = useState(() => formatGrams(grams));

  // Sync when ±10 / presets change grams from outside (not while draft is empty/partial).
  useEffect(() => {
    setRaw((prev) => {
      const t = prev.trim().replace(',', '.');
      // Keep in-progress edits: empty field or trailing decimal.
      if (t === '' || t === '.' || t.endsWith('.')) return prev;
      const asNum = Number(t);
      if (Number.isFinite(asNum) && Math.round(asNum * 10) / 10 === Math.round(grams * 10) / 10) {
        return prev;
      }
      return formatGrams(grams);
    });
  }, [grams]);

  const setSafe = (n: number) => {
    if (!Number.isFinite(n) || n < 0) return;
    const next = Math.round(n * 10) / 10;
    onChange(next);
    setRaw(formatGrams(next));
  };

  const commitRaw = () => {
    const t = raw.trim().replace(',', '.');
    if (t === '' || t === '.') {
      setRaw(formatGrams(grams));
      return;
    }
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) {
      setRaw(formatGrams(grams));
      return;
    }
    setSafe(n);
  };

  const last =
    lastGrams != null && Number.isFinite(lastGrams) && lastGrams > 0
      ? Math.round(lastGrams * 10) / 10
      : null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Порция, г</Text>
      <View style={styles.row}>
        <Pressable
          style={styles.btn}
          onPress={() => setSafe(Math.max(0, grams - 10))}
          accessibilityRole="button"
          accessibilityLabel="Минус 10 грамм"
        >
          <Text style={styles.btnText}>−10</Text>
        </Pressable>
        <TextInput
          value={raw}
          onChangeText={(t) => {
            const normalized = t.replace(',', '.');
            // Allow full clear and intermediate decimals ("12.").
            if (normalized !== '' && !/^\d*\.?\d*$/.test(normalized)) return;
            setRaw(normalized);
            if (normalized === '' || normalized === '.' || normalized.endsWith('.')) return;
            const n = Number(normalized);
            if (Number.isFinite(n) && n >= 0) {
              onChange(Math.round(n * 10) / 10);
            }
          }}
          onBlur={commitRaw}
          onSubmitEditing={commitRaw}
          keyboardType="decimal-pad"
          selectTextOnFocus
          style={styles.input}
          accessibilityLabel="Граммы порции"
          accessibilityHint="Можно полностью стереть и ввести заново"
        />
        <Pressable
          style={styles.btn}
          onPress={() => setSafe(grams + 10)}
          accessibilityRole="button"
          accessibilityLabel="Плюс 10 грамм"
        >
          <Text style={styles.btnText}>+10</Text>
        </Pressable>
      </View>
      <View style={styles.presets}>
        {last != null ? (
          <Pressable
            style={[styles.preset, styles.presetLast, grams === last && styles.presetOn]}
            onPress={() => setSafe(last)}
            accessibilityRole="button"
            accessibilityLabel={`Последняя порция ${last} грамм`}
          >
            <Text style={[styles.presetText, grams === last && styles.presetTextOn]}>
              Последняя · {last} г
            </Text>
          </Pressable>
        ) : null}
        {PRESETS.map((s) => (
          <Pressable
            key={s}
            style={[styles.preset, grams === s && styles.presetOn]}
            onPress={() => setSafe(s)}
            accessibilityRole="button"
            accessibilityLabel={`${s} грамм`}
          >
            <Text style={[styles.presetText, grams === s && styles.presetTextOn]}>{s} г</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.lg },
  label: {
    fontSize: type.caption,
    color: colors.textSecondary,
    marginBottom: space.sm,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  btn: {
    minHeight: touchMin,
    minWidth: 64,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: type.body,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    flex: 1,
    minHeight: touchMin,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...elevation.card,
    textAlign: 'center',
    fontSize: type.title,
    fontWeight: '700',
    color: colors.text,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.sm,
  },
  preset: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 36,
    justifyContent: 'center',
  },
  presetLast: {
    borderColor: colors.text,
  },
  presetOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  presetText: {
    fontSize: type.caption,
    fontWeight: '600',
    color: colors.text,
  },
  presetTextOn: {
    color: colors.primaryButtonText,
  },
});

import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedTextInput as TextInput } from '@/src/design-system/components/ThemedTextInput';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';

import { colors, radius, space, touchMin, type } from '../theme/tokens';

const PRESETS = [50, 100, 150, 200, 250] as const;
const STEP = 10;

function formatGrams(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return String(rounded);
}

/**
 * Local typing buffer; parent `grams` syncs only when not focused so each keystroke
 * is not wiped by a re-select / controlled rewrite (first-digit regression).
 */
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
  const focusedRef = useRef(false);

  useEffect(() => {
    if (focusedRef.current) return;
    setRaw(formatGrams(grams));
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
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
          onPress={() => setSafe(Math.max(0, grams - STEP))}
          accessibilityRole="button"
          accessibilityLabel={`Минус ${STEP} грамм`}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <TextInput
          value={raw}
          onChangeText={(t) => {
            const normalized = t.replace(',', '.');
            if (normalized !== '' && !/^\d*\.?\d*$/.test(normalized)) return;
            setRaw(normalized);
          }}
          onFocus={() => {
            focusedRef.current = true;
          }}
          onBlur={() => {
            focusedRef.current = false;
            commitRaw();
          }}
          onSubmitEditing={commitRaw}
          keyboardType="decimal-pad"
          style={styles.input}
          accessibilityLabel="Граммы порции"
          accessibilityHint="Сотри и введи заново, или правь цифры"
        />
        <Pressable
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
          onPress={() => setSafe(grams + STEP)}
          accessibilityRole="button"
          accessibilityLabel={`Плюс ${STEP} грамм`}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
      <Text style={styles.stepHint}>Шаг ±{STEP} г</Text>
      <View style={styles.presets}>
        {last != null ? (
          <Pressable
            style={[styles.preset, styles.presetLast, grams === last && styles.presetOn]}
            onPress={() => setSafe(last)}
            accessibilityRole="button"
            accessibilityLabel={`Последняя порция ${last} грамм`}
          >
            <Text style={[styles.presetText, grams === last && styles.presetTextOn]} numberOfLines={1}>
              Было {last} г
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
            <Text style={[styles.presetText, grams === s && styles.presetTextOn]}>{s}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.md,
    width: '100%',
    maxWidth: '100%',
  },
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
    width: '100%',
  },
  stepBtn: {
    width: touchMin,
    height: touchMin,
    flexShrink: 0,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 32,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: type.title,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: space.sm,
  },
  stepHint: {
    marginTop: space.xs,
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '600',
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.sm,
    width: '100%',
  },
  preset: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: touchMin,
    maxWidth: '100%',
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
  pressed: { opacity: 0.88 },
});

import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  initialSetFieldValues,
  parseOptionalNonNegativeNumber,
  parseOptionalRepetitions,
} from "../../../../../src/domain/strength";
import type { WorkoutSet } from "../../../../../src/domain/strength/types";
import {
  AppButton,
  AppText,
  Field,
  colors,
  radius,
  space,
  touchMin,
} from "@/src/design-system";

export function SetLogRow({
  set,
  exerciseName,
  onComplete,
  onDraft,
}: {
  set: WorkoutSet;
  exerciseName: string;
  onComplete: (args: { weightKg: number | null; reps: number | null }) => void;
  onDraft: (input: { weight: string; reps: string }) => void;
}) {
  const initial = initialSetFieldValues(set);
  const [weight, setWeight] = useState(initial.weight),
    [reps, setReps] = useState(initial.reps);
  const [step, setStep] = useState(2.5),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const value = initialSetFieldValues(set);
    setWeight(value.weight);
    setReps(value.reps);
    setError(null);
  }, [set.id, set.weightKg, set.reps, set.completed]);
  const change = (kind: "weight" | "reps", value: string) => {
    const input = {
      weight: kind === "weight" ? value : weight,
      reps: kind === "reps" ? value : reps,
    };
    if (kind === "weight") setWeight(value);
    else setReps(value);
    setError(null);
    if (!set.completed)
      try {
        onDraft(input);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось сохранить ввод");
      }
  };
  const adjust = (kind: "weight" | "reps", delta: number) => {
    const raw = kind === "weight" ? weight : reps;
    if (!raw.trim() && delta < 0) return;
    const current = raw.trim() ? Number(raw.replace(",", ".")) : 0;
    if (Number.isFinite(current))
      change(
        kind,
        String(Math.round(Math.max(0, current + delta) * 1000) / 1000),
      );
  };
  const submit = () => {
    const w = parseOptionalNonNegativeNumber(weight),
      r = parseOptionalRepetitions(reps);
    if (!w.ok) {
      setError(w.error);
      return;
    }
    if (!r.ok) {
      setError(r.error);
      return;
    }
    try {
      onComplete({ weightKg: w.value, reps: r.value });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось записать подход");
    }
  };
  return (
    <View
      style={styles.current}
      testID="focused-set-editor"
      accessibilityLabel={`${exerciseName}, подход ${set.setIndex}`}
    >
      <View style={styles.top}>
        <AppText variant="subtitle">Подход {set.setIndex}</AppText>
        <AppText variant="caption" tone="secondary">
          {set.completed ? "Редактирование" : "Фактические значения"}
        </AppText>
      </View>
      <View style={styles.fields}>
        {(["weight", "reps"] as const).map((kind) => (
          <View key={kind} style={styles.field}>
            <Field
              label={kind === "weight" ? "Вес, кг" : "Повторения"}
              value={kind === "weight" ? weight : reps}
              onChangeText={(value) => change(kind, value)}
              maxLength={32}
              keyboardType={kind === "weight" ? "decimal-pad" : "number-pad"}
              placeholder="—"
              style={styles.input}
              testID={`set-${kind}-${set.id}`}
            />
            <View style={styles.steps}>
              {([-1, 1] as const).map((direction) => (
                <Pressable
                  key={direction}
                  onPress={() =>
                    adjust(kind, direction * (kind === "weight" ? step : 1))
                  }
                  style={({ pressed }) => [
                    styles.step,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${direction > 0 ? "Увеличить" : "Уменьшить"} ${kind === "weight" ? `вес на ${step} кг` : "повторы на 1"}`}
                >
                  <Ionicons
                    name={direction > 0 ? "add" : "remove"}
                    size={20}
                    color={colors.ink}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>
      <View style={styles.stepOptions}>
        <AppText variant="caption" tone="secondary">
          Шаг веса
        </AppText>
        {[1, 2.5, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => setStep(n)}
            accessibilityRole="button"
            accessibilityLabel={`Шаг веса ${n} кг`}
            accessibilityState={{ selected: step === n }}
            style={[styles.preset, step === n && styles.selected]}
          >
            <AppText variant="caption" tone={step === n ? "inverse" : "ink"}>
              {n.toLocaleString("ru-RU")}
            </AppText>
          </Pressable>
        ))}
      </View>
      {error ? (
        <AppText variant="caption" tone="danger" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
      <AppButton
        label={set.completed ? "Сохранить изменения" : "Записать подход"}
        onPress={submit}
        testID={`set-complete-${set.id}`}
      />
      {!set.completed ? (
        <AppText variant="caption" tone="secondary">
          Подход попадёт в итог после «Записать».
        </AppText>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  current: {
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: space.lg,
    gap: space.md,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: space.sm,
  },
  fields: { flexDirection: "row", gap: space.md },
  field: { flex: 1, minWidth: 0 },
  input: {
    fontSize: 34,
    minHeight: 64,
    textAlign: "center",
    borderWidth: 0,
    backgroundColor: colors.surfaceMuted,
    letterSpacing: -1,
  },
  steps: { flexDirection: "row", gap: space.sm },
  step: {
    minHeight: touchMin,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  stepOptions: {
    flexDirection: "row",
    gap: space.sm,
    alignItems: "center",
    flexWrap: "wrap",
  },
  preset: {
    minWidth: touchMin,
    minHeight: touchMin,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  selected: { backgroundColor: colors.accent },
  pressed: { opacity: 0.65 },
});

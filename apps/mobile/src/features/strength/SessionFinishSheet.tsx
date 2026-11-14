import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { SessionReview } from "../../../../../src/domain/strength/sessionReview";
import { SessionReviewPanel } from "./SessionReviewPanel";
import { FormScrollView } from "@/src/components/FormScrollView";
import { SwipeToDismissSheet } from "@/src/components/SwipeToDismissSheet";
import {
  AppButton,
  AppText,
  Field,
  colors,
  radius,
  space,
  touchMin,
} from "@/src/design-system";

const RPE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function SessionFinishSheet({
  visible,
  title,
  onClose,
  onConfirm,
  completedCount,
  totalCount,
  review,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (args: {
    feelingRpe: number | null;
    feelingNote: string | null;
  }) => void;
  completedCount?: number;
  totalCount?: number;
  review?: SessionReview;
}) {
  const [rpe, setRpe] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const save = (value: number | null) => {
    try {
      onConfirm({ feelingRpe: value, feelingNote: note.trim() || null });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не удалось сохранить тренировку",
      );
    }
  };
  useEffect(() => {
    if (visible) {
      setRpe(null);
      setNote("");
      setError(null);
    }
  }, [visible, title]);

  return (
    <SwipeToDismissSheet
      visible={visible}
      onClose={onClose}
      maxHeightRatio={0.92}
      testID="session-finish-sheet"
    >
      <FormScrollView variant="sheet" contentContainerStyle={styles.pad}>
        {review ? (
          <SessionReviewPanel review={review} names={{}} compact />
        ) : null}
        <AppText variant="title" style={styles.title}>
          Как прошла?
        </AppText>
        {completedCount != null && totalCount != null ? (
          <AppText variant="caption" tone="secondary">
            Записано подходов: {completedCount} из {totalCount}.{" "}
            {completedCount < totalCount
              ? "Незаписанные подходы останутся пустыми."
              : ""}
          </AppText>
        ) : null}
        <AppText variant="caption" tone="muted" style={styles.sub}>
          {title} · сложность по желанию (1–10). Пусто = неизвестно, не ноль.
        </AppText>
        <View style={styles.rpeRow}>
          {RPE.map((n) => {
            const on = rpe === n;
            return (
              <Pressable
                key={n}
                onPress={() => setRpe((value) => (value === n ? null : n))}
                style={({ pressed }) => [
                  styles.rpeChip,
                  on && styles.rpeOn,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`Сложность ${n}`}
              >
                <AppText variant="caption" tone={on ? "inverse" : "ink"}>
                  {n}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <Field
          label="Заметка (самочувствие)"
          value={note}
          onChangeText={setNote}
          placeholder="Что хочешь учесть в следующий раз?"
          maxLength={4000}
          multiline
        />
        {error ? (
          <AppText variant="caption" tone="danger" accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}
        <AppButton
          label="Сохранить тренировку"
          onPress={() => save(rpe)}
          testID="session-finish-save"
        />
        <AppButton
          label="Сохранить без оценки"
          variant="ghost"
          onPress={() => save(null)}
        />
      </FormScrollView>
    </SwipeToDismissSheet>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, gap: space.sm },
  title: { fontWeight: "800" },
  sub: { marginBottom: space.sm },
  rpeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.xs,
    marginBottom: space.sm,
  },
  rpeChip: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rpeOn: {
    backgroundColor: colors.accent,
    borderColor: colors.ink,
  },
  pressed: { opacity: 0.85 },
});

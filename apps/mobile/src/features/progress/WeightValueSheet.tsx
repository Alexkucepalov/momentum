import { useEffect, useState } from "react";
import { View } from "react-native";
import type { WeightEntry } from "../../../../../src/storage/types";
import { SwipeToDismissSheet } from "@/src/components/SwipeToDismissSheet";
import { AppButton, AppText, Field, space } from "@/src/design-system";

export function WeightValueSheet({
  entry,
  timezone,
  onClose,
  onSave,
}: {
  entry: WeightEntry | null;
  timezone: string;
  onClose: () => void;
  onSave: (kg: number) => void;
}) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (entry) {
      setRaw(String(entry.kg));
      setError(null);
    }
  }, [entry]);
  return (
    <SwipeToDismissSheet
      visible={entry != null}
      onClose={onClose}
      maxHeightRatio={0.65}
      testID="weight-edit-sheet"
    >
      <View style={{ padding: space.screen, gap: space.md }}>
        <AppText variant="title">Изменить замер</AppText>
        <AppText variant="caption" tone="secondary">
          {entry
            ? new Date(entry.weighedAt).toLocaleString("ru-RU", {
                timeZone: timezone,
              })
            : ""}{" "}
          · ручная запись
        </AppText>
        <Field
          label="Вес замера, кг"
          value={raw}
          onChangeText={setRaw}
          keyboardType="decimal-pad"
          error={error}
        />
        <AppButton
          label="Сохранить замер"
          onPress={() => {
            try {
              const kg = Number(raw.trim().replace(",", "."));
              if (!raw.trim() || !Number.isFinite(kg) || kg <= 0)
                throw new Error("Введи положительное число");
              onSave(kg);
              onClose();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Не удалось сохранить");
            }
          }}
        />
        <AppButton label="Отмена" variant="ghost" onPress={onClose} />
      </View>
    </SwipeToDismissSheet>
  );
}

import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { FoodEntry } from "../../../../../src/storage/types";
import {
  entryAmountLabel,
  isQuickEntry,
  resizeEntrySnapshot,
} from "../../../../../src/domain/diaryEntry";
import {
  AppButton,
  AppText,
  Field,
  colors,
  space,
  touchMin,
} from "@/src/design-system";
import { SwipeToDismissSheet } from "@/src/components/SwipeToDismissSheet";
import { FormScrollView } from "@/src/components/FormScrollView";
import { PortionStepper } from "@/src/components/PortionStepper";
export function EntryAmountSheet({
  entry,
  mode = "edit",
  context,
  onClose,
  onSave,
}: {
  entry: FoodEntry | null;
  mode?: "edit" | "repeat";
  context: string;
  onClose: () => void;
  onSave: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(100);
  const [raw, setRaw] = useState("1");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (entry) {
      setAmount(entry.grams);
      setRaw(String(entry.grams));
      setError(null);
    }
  }, [entry]);
  const quick = entry ? isQuickEntry(entry) : false;
  const value = quick ? Number(raw.trim().replace(",", ".")) : amount;
  let preview: string | null = null;
  if (entry && Number.isFinite(value) && value > 0)
    try {
      const n = resizeEntrySnapshot(entry, value);
      preview = `${n.energyKcal == null ? "—" : Math.round(n.energyKcal)} ккал · Б ${n.proteinG == null ? "—" : Math.round(n.proteinG)} · Ж ${n.fatG == null ? "—" : Math.round(n.fatG)} · У ${n.carbG == null ? "—" : Math.round(n.carbG)}`;
    } catch {}
  return (
    <SwipeToDismissSheet
      visible={!!entry}
      onClose={onClose}
      maxHeightRatio={0.9}
      testID="entry-amount-sheet"
    >
      <FormScrollView variant="sheet" contentContainerStyle={styles.body}>
        <View style={styles.head}>
          <AppText variant="title" style={{ flex: 1 }}>
            {mode === "edit" ? "Изменить порцию" : "Повторить еду"}
          </AppText>
          <Pressable
            onPress={onClose}
            style={styles.close}
            accessibilityRole="button"
            accessibilityLabel="Закрыть порцию"
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>
        <AppText variant="subtitle">{entry?.displayName}</AppText>
        <AppText variant="caption" tone="secondary">
          {context}
        </AppText>
        {quick ? (
          <Field
            label="Количество порций"
            value={raw}
            onChangeText={setRaw}
            keyboardType="decimal-pad"
            testID="entry-portions"
          />
        ) : (
          <PortionStepper
            grams={amount}
            onChange={setAmount}
            lastGrams={entry?.grams}
          />
        )}
        <AppText variant="body">
          {preview ?? "Укажи порцию больше нуля"}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {entry ? `Было: ${entryAmountLabel(entry)}. ` : ""}Расчёт по
          сохранённой записи. Неизвестные значения останутся неизвестными.
        </AppText>
        {error ? (
          <AppText variant="caption" tone="danger" accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}
        <AppButton
          label={mode === "edit" ? "Сохранить порцию" : "Добавить в дневник"}
          testID="entry-amount-save"
          onPress={() => {
            try {
              if (
                !Number.isFinite(value) ||
                value <= 0 ||
                (quick && !raw.trim())
              )
                throw new Error("Укажи порцию больше нуля");
              onSave(value);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Не удалось сохранить");
            }
          }}
        />
      </FormScrollView>
    </SwipeToDismissSheet>
  );
}
const styles = StyleSheet.create({
  body: { padding: space.screen, gap: space.lg },
  head: { flexDirection: "row", alignItems: "center", gap: space.sm },
  close: {
    minHeight: touchMin,
    minWidth: touchMin,
    alignItems: "center",
    justifyContent: "center",
  },
});

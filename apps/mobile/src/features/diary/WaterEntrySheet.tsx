import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SwipeToDismissSheet } from "@/src/components/SwipeToDismissSheet";
import { FormScrollView } from "@/src/components/FormScrollView";
import {
  AppButton,
  AppText,
  Field,
  colors,
  space,
  touchMin,
} from "@/src/design-system";
import { useData, useDiaryRevision } from "@/src/state/DataContext";
export function WaterEntrySheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { repo, dateLocal, refresh, setUndo, showFlash } = useData();
  useDiaryRevision();
  const [raw, setRaw] = useState("250");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (visible) {
      setRaw("250");
      setError(null);
    }
  }, [visible]);
  const entries = visible ? repo.listWaterForDate(dateLocal) : [];
  const added = (ml: number) => {
    try {
      if (!Number.isFinite(ml) || ml <= 0 || ml > 10000)
        throw new Error("Укажи объём от 1 до 10 000 мл");
      const row = repo.addWater(dateLocal, ml);
      const message = `Добавлено ${ml} мл воды`;
      refresh("diary");
      showFlash(message);
      setUndo({
        message,
        action: () => {
          repo.removeWater(row.id);
        },
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось добавить воду");
    }
  };
  return (
    <SwipeToDismissSheet
      visible={visible}
      onClose={onClose}
      maxHeightRatio={0.9}
      testID="water-entry-sheet"
    >
      <FormScrollView variant="sheet" contentContainerStyle={styles.body}>
        <View style={styles.head}>
          <AppText variant="title" style={{ flex: 1 }}>
            Вода за день
          </AppText>
          <Pressable
            style={styles.icon}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Закрыть воду"
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>
        <AppText variant="caption" tone="secondary">
          {dateLocal} · всего{" "}
          {repo.waterMlForDate(dateLocal).toLocaleString("ru-RU")} мл
        </AppText>
        <View style={styles.presets}>
          {[150, 250, 500].map((ml) => (
            <AppButton
              key={ml}
              label={`+${ml} мл`}
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => added(ml)}
            />
          ))}
        </View>
        <Field
          label="Свой объём, мл"
          value={raw}
          onChangeText={setRaw}
          keyboardType="decimal-pad"
          testID="water-amount"
        />
        {error ? (
          <AppText variant="caption" tone="danger" accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}
        <AppButton
          label="Добавить воду"
          testID="water-save"
          onPress={() => added(Number(raw.trim().replace(",", ".")))}
        />
        <AppText variant="subtitle">Записи</AppText>
        {entries.length ? (
          entries.map((row) => (
            <View key={row.id} style={styles.row}>
              <AppText variant="body" style={{ flex: 1 }}>
                {row.ml.toLocaleString("ru-RU")} мл
              </AppText>
              <Pressable
                style={styles.icon}
                onPress={() => {
                  const removed = repo.removeWater(row.id);
                  if (!removed) return;
                  const message = `Убрано ${row.ml} мл воды`;
                  refresh("diary");
                  showFlash(message);
                  setUndo({
                    message,
                    action: () => repo.restoreWater(removed),
                  });
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel={`Удалить воду ${row.ml} мл`}
                testID={`water-delete-${row.id}`}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          ))
        ) : (
          <AppText variant="body" tone="secondary">
            Вода пока не записана.
          </AppText>
        )}
      </FormScrollView>
    </SwipeToDismissSheet>
  );
}
const styles = StyleSheet.create({
  body: { padding: space.screen, gap: space.lg },
  head: { flexDirection: "row", alignItems: "center", gap: space.sm },
  icon: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: "center",
    justifyContent: "center",
  },
  presets: { flexDirection: "row", gap: space.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});

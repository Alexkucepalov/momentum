import { Pressable, StyleSheet, View } from "react-native";
import { DayStrip } from "@/src/components/DayStrip";
import { AppText, colors, space, touchMin } from "@/src/design-system";
export function DiaryDayHeader({
  dateLocal,
  today,
  onSelect,
  onOpenCalendar,
  compact = false,
}: {
  compact?: boolean;
  dateLocal: string;
  today: string;
  onSelect: (date: string) => void;
  onOpenCalendar: () => void;
}) {
  const date = new Date(dateLocal + "T12:00:00Z");
  const text = date.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(dateLocal.slice(0, 4) !== today.slice(0, 4)
      ? { year: "numeric" as const }
      : {}),
    timeZone: "UTC",
  });
  return (
    <View style={styles.wrap}>
      <View style={styles.line}>
        <AppText variant="caption" tone="secondary" style={{ flex: 1 }}>
          {text.charAt(0).toUpperCase() + text.slice(1)}
          {dateLocal > today
            ? " · будущий день"
            : dateLocal < today
              ? " · прошлый день"
              : ""}
        </AppText>
        {compact ? (
          <Pressable
            style={styles.today}
            onPress={onOpenCalendar}
            accessibilityRole="button"
            accessibilityLabel="Изменить дату добавления"
          >
            <AppText variant="caption">Дата</AppText>
          </Pressable>
        ) : null}
        {dateLocal !== today ? (
          <Pressable
            style={styles.today}
            onPress={() => onSelect(today)}
            accessibilityRole="button"
            accessibilityLabel="Вернуться к сегодняшнему дню"
            testID="diary-jump-today"
          >
            <AppText variant="caption">Сегодня</AppText>
          </Pressable>
        ) : null}
      </View>
      {!compact ? (
        <DayStrip
          selected={dateLocal}
          today={today}
          onSelect={onSelect}
          onOpenCalendar={onOpenCalendar}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 28,
  },
  calendar: { minHeight: touchMin, justifyContent: "center" },
  today: {
    minHeight: touchMin,
    justifyContent: "center",
    paddingLeft: space.sm,
    borderBottomColor: colors.border,
  },
});

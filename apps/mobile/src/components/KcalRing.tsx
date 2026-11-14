import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { energyProgressRatio } from "../../../../src/domain/energyProgress";
import type {
  DailyNutritionTargets,
  DailyTotals,
} from "../../../../src/storage/types";
import { AppText, colors, space, type } from "../design-system";

type Props = {
  totals: DailyTotals;
  targets?: DailyNutritionTargets | null;
  activityKcal?: number | null;
  activityMinutes?: number;
  variant?: "compact" | "ring";
  pulseKey?: number;
  onSetTarget?: () => void;
};
const SIZE = 94;
const R = 41;
const C = Math.PI * 2 * R;
const fmt = (n: number | null) =>
  n == null ? "—" : Math.round(n).toLocaleString("ru-RU");

/** Editorial day summary. An unset target never produces an invented progress ring. */
export function KcalRing({
  totals,
  targets,
  onSetTarget,
  variant = "ring",
}: Props) {
  const target = targets?.energyKcal ?? null;
  const hasTarget = target != null && target > 0;
  const empty = totals.entryCount === 0;
  const ratio = energyProgressRatio(totals.energyKcal, target);
  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={
        empty
          ? "Нет записей еды за выбранный день."
          : `Записано ${fmt(totals.energyKcal)} килокалорий. Белки ${fmt(totals.proteinG)}, жиры ${fmt(totals.fatG)}, углеводы ${fmt(totals.carbG)} грамм.${totals.hasUnknownFields ? " Часть значений неизвестна." : ""}`
      }
    >
      <View style={styles.hero}>
        <View style={styles.main}>
          <AppText variant="label" tone="muted" style={styles.eyebrow}>
            Записано за день
          </AppText>
          <AppText
            variant="metric"
            style={[styles.value, variant === "compact" && styles.compactValue]}
          >
            {empty ? "—" : fmt(totals.energyKcal)}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {empty
              ? "Пока нет записей еды"
              : hasTarget
                ? `из ${fmt(target)} ккал`
                : totals.entryCount > 0
                  ? "ккал · без ориентира"
                  : "ккал · пока нет записей"}
          </AppText>
        </View>
        {hasTarget && !empty ? (
          <View style={styles.ring}>
            <Svg width={SIZE} height={SIZE} aria-hidden={true}>
              <Circle
                cx={47}
                cy={47}
                r={R}
                stroke={colors.ringTrack}
                strokeWidth={5}
                fill="none"
              />
              <Circle
                cx={47}
                cy={47}
                r={R}
                stroke={colors.ringFill}
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${C} ${C}`}
                strokeDashoffset={C * (1 - ratio)}
                transform="rotate(-90 47 47)"
              />
            </Svg>
            <View style={styles.ringText} pointerEvents="none">
              <AppText variant="subtitle">
                {totals.energyKcal == null
                  ? "—"
                  : `${Math.round((totals.energyKcal / target!) * 100)}%`}
              </AppText>
              <AppText variant="label" tone="muted" style={styles.ringLabel}>
                ориентира
              </AppText>
            </View>
          </View>
        ) : hasTarget ? (
          <Pressable
            onPress={onSetTarget}
            accessibilityRole="button"
            accessibilityLabel="Изменить ориентир калорий"
            style={styles.target}
          >
            <AppText variant="caption" tone="secondary">
              Ориентир
            </AppText>
            <AppText variant="subtitle">{fmt(target)}</AppText>
            <AppText variant="caption" tone="secondary">
              ккал
            </AppText>
          </Pressable>
        ) : onSetTarget ? (
          <Pressable
            onPress={onSetTarget}
            accessibilityRole="button"
            accessibilityLabel="Задать ориентир калорий"
            style={styles.target}
          >
            <AppText variant="caption" style={styles.targetText}>
              Задать{`\n`}ориентир
            </AppText>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.macros}>
        {(
          [
            ["Белки", totals.proteinG, targets?.proteinG],
            ["Жиры", totals.fatG, targets?.fatG],
            ["Углеводы", totals.carbG, targets?.carbG],
          ] as const
        ).map(([label, value, goal]) => (
          <View key={label} style={styles.macro}>
            <AppText variant="label" tone="muted">
              {label}
            </AppText>
            <AppText variant="body" style={styles.macroValue}>
              {empty ? "—" : fmt(value)}
              <AppText variant="label" tone="secondary">
                {goal != null ? ` / ${fmt(goal)} г` : " г"}
              </AppText>
            </AppText>
            {!empty && goal != null && goal > 0 && value != null ? (
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${energyProgressRatio(value, goal) * 100}%` },
                  ]}
                />
              </View>
            ) : null}
          </View>
        ))}
      </View>
      {!empty && totals.hasUnknownFields ? (
        <AppText variant="caption" tone="muted" style={styles.note}>
          Часть КБЖУ не указана — итог неполный
        </AppText>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { marginBottom: space.sm },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    paddingVertical: space.md,
    paddingBottom: space.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  main: { flex: 1, minWidth: 0 },
  eyebrow: { textTransform: "uppercase", letterSpacing: 1.1 },
  compactValue: { fontSize: 40, lineHeight: 50 },
  value: {
    fontSize: type.metric,
    lineHeight: 58,
    fontWeight: "500",
    letterSpacing: -2,
    marginVertical: space.xs,
  },
  ring: { width: SIZE, height: SIZE },
  ringText: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  ringLabel: { fontSize: type.micro - 1 },
  target: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: space.sm,
  },
  targetText: { lineHeight: 20 },
  macros: {
    flexDirection: "row",
    gap: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.sm,
  },
  macro: { flex: 1, minWidth: 0, gap: space.xs },
  macroValue: { fontWeight: "600" },
  track: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: colors.ringTrack,
    marginTop: space.xs,
  },
  fill: { height: "100%", backgroundColor: colors.ink },
  note: { marginTop: space.sm },
});

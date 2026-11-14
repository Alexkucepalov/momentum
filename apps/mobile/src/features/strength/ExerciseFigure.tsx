import { equipmentLabel } from "../../../../../src/domain/strength/sessionReview";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import type { MuscleGroup } from "../../../../../src/domain/strength/types";
import { muscleLabelRu } from "../../../../../src/domain/strength";
import { AppText, colors, space } from "@/src/design-system";

/** Decorative muscle-group diagram, never a demonstration of exercise technique. */
export function ExerciseFigure({
  muscles,
  equipment,
}: {
  muscles: MuscleGroup[];
  equipment?: string | null;
}) {
  const fill = (group: MuscleGroup) =>
    muscles.includes(group) ? colors.sageInk : colors.surfaceMuted;
  return (
    <View style={styles.root}>
      <View style={styles.copy}>
        <AppText variant="label" tone="secondary">
          АКЦЕНТ
        </AppText>
        <AppText variant="subtitle">
          {muscles.length
            ? muscles.map(muscleLabelRu).join(" · ")
            : "Своя тренировка"}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {equipmentLabel(equipment)}
        </AppText>
      </View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        aria-hidden
      >
        <Svg width={86} height={116} viewBox="0 0 86 126">
          <Circle
            cx="43"
            cy="12"
            r="10"
            fill={colors.surfaceMuted}
            stroke={colors.borderStrong}
          />
          <Path
            d="M30 28 Q43 23 56 28 L62 62 L54 74 L53 113 Q49 123 44 114 L43 81 L42 114 Q37 123 33 113 L32 74 L24 62Z"
            fill={colors.surfaceMuted}
            stroke={colors.borderStrong}
            strokeWidth={1.5}
          />
          <Path
            d="M29 28 Q19 27 16 39 L8 66 Q6 72 12 73 L27 45 M57 28 Q67 27 70 39 L78 66 Q80 72 74 73 L59 45"
            fill={colors.surfaceMuted}
            stroke={colors.borderStrong}
            strokeWidth={1.5}
          />
          <Path
            d="M30 30 Q43 26 56 30 L54 45 L44 47 L43 34 L42 47 L32 45Z"
            fill={fill(muscles.includes("back") ? "back" : "chest")}
          />
          <Path
            d="M34 49 L52 49 L51 69 L44 74 L42 74 L35 69Z"
            fill={fill("core")}
          />
          <Path
            d="M33 78 L41 78 L40 108 L35 108Z M45 78 L53 78 L51 108 L46 108Z"
            fill={fill("legs")}
          />
          <Circle cx="24" cy="34" r="6" fill={fill("shoulders")} />
          <Circle cx="62" cy="34" r="6" fill={fill("shoulders")} />
          <Path
            d="M18 42 L25 45 L18 61 L13 59Z M61 45 L68 42 L73 59 L68 61Z"
            fill={fill(muscles.includes("triceps") ? "triceps" : "biceps")}
          />
        </Svg>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    paddingVertical: space.sm,
  },
  copy: { flex: 1, minWidth: 0, gap: space.sm },
});

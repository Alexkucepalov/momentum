import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius, space, touchMin } from "../tokens";
import { AppText } from "./AppText";

export type SegmentOption<T extends string> = {
  id: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (id: T) => void;
  accessibilityLabel?: string;
  testID?: string;
};

/** Equal-flex segment control on surfaceMuted track. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testID,
}: SegmentedControlProps<T>) {
  return (
    <View
      style={styles.track}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {options.map((opt) => {
        const on = opt.id === value;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={({ pressed }) => [
              styles.seg,
              on && styles.segOn,
              pressed && styles.pressed,
            ]}
            accessibilityRole="tab"
            aria-selected={on}
            accessibilityState={{ selected: on }}
            accessibilityLabel={opt.label}
          >
            <AppText
              variant="caption"
              tone={on ? "ink" : "secondary"}
              style={styles.label}
            >
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: space.xs,
    gap: space.xs,
    minHeight: touchMin + space.sm,
  },
  seg: {
    flex: 1,
    minWidth: 0,
    minHeight: touchMin,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xs,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  segOn: {
    backgroundColor: colors.surface,
    borderColor: colors.accentSoft,
  },
  label: { fontWeight: "500", textAlign: "center" },
  pressed: { opacity: 0.88 },
});

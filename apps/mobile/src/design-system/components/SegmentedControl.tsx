import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, space, touchMin } from '../tokens';
import { AppText } from './AppText';

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
            style={({ pressed }) => [styles.seg, on && styles.segOn, pressed && styles.pressed]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={opt.label}
          >
            <AppText variant="caption" tone={on ? 'inverse' : 'secondary'} style={styles.label}>
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
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
    minHeight: touchMin,
  },
  seg: {
    flex: 1,
    minHeight: touchMin - 8,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  segOn: {
    backgroundColor: colors.ink,
  },
  label: { fontWeight: '700' },
  pressed: { opacity: 0.88 },
});

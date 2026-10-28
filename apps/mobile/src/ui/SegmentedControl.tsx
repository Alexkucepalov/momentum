import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, elevation, radius, space, touchMin, type } from '@/src/theme/tokens';

/** Quiet track + white selected chip. Black fill stays for the one primary CTA. */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  dense = false,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
  /** Smaller label when a row has more than three options. */
  dense?: boolean;
}) {
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {options.map((option) => {
        const on = value === option.id;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[styles.tab, on && styles.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={option.label}
          >
            <Text
              style={[styles.label, dense && styles.labelDense, on && styles.labelOn]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
    minHeight: touchMin,
  },
  tabOn: {
    backgroundColor: colors.surface,
    ...elevation.card,
  },
  label: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  labelDense: {
    fontSize: type.micro,
  },
  labelOn: {
    color: colors.text,
    fontWeight: '800',
  },
});

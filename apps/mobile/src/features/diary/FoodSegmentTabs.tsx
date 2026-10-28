import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, touchMin, type } from '../../theme/tokens';

export type FoodSegment = 'diary' | 'catalog';

const SEGMENTS: { id: FoodSegment; label: string }[] = [
  { id: 'diary', label: 'Дневник' },
  { id: 'catalog', label: 'Каталог' },
];

/** Primary Food IA: diary vs catalog — mutually exclusive views. */
export function FoodSegmentTabs({
  value,
  onChange,
}: {
  value: FoodSegment;
  onChange: (segment: FoodSegment) => void;
}) {
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {SEGMENTS.map((s) => {
        const on = value === s.id;
        return (
          <Pressable
            key={s.id}
            onPress={() => onChange(s.id)}
            style={[styles.tab, on && styles.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={s.label}
          >
            <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
              {s.label}
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
    backgroundColor: colors.primaryButton,
  },
  label: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  labelOn: {
    color: colors.primaryButtonText,
  },
});

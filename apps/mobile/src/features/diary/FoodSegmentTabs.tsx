import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, colors, radius, space, touchMin } from '@/src/design-system';

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
            <AppText variant="caption" tone={on ? 'inverse' : 'secondary'} style={styles.label}>
              {s.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
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
    borderRadius: radius.pill,
    minHeight: touchMin,
  },
  tabOn: {
    backgroundColor: colors.primaryButton,
  },
  label: {
    fontWeight: '700',
  },
});

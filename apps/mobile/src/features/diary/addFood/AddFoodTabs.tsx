import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, space, type } from '../../../theme/tokens';
import { PRIMARY_ADD_FOOD_TABS, type AddFoodTab } from './types';

const ICONS: Record<
  (typeof PRIMARY_ADD_FOOD_TABS)[number]['id'],
  { off: keyof typeof Ionicons.glyphMap; on: keyof typeof Ionicons.glyphMap }
> = {
  recent: { off: 'time-outline', on: 'time' },
  favorites: { off: 'star-outline', on: 'star' },
  mine: { off: 'basket-outline', on: 'basket' },
  recipes: { off: 'restaurant-outline', on: 'restaurant' },
};

export function AddFoodTabs({
  value,
  onChange,
}: {
  value: AddFoodTab;
  onChange: (tab: AddFoodTab) => void;
}) {
  const selected = PRIMARY_ADD_FOOD_TABS.some((t) => t.id === value) ? value : 'recent';

  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {PRIMARY_ADD_FOOD_TABS.map((t) => {
        const on = selected === t.id;
        const icons = ICONS[t.id];
        return (
          <Pressable
            key={t.id}
            onPress={() => onChange(t.id)}
            style={[styles.tab, on && styles.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t.label}
          >
            <Ionicons
              name={on ? icons.on : icons.off}
              size={18}
              color={on ? colors.primaryButtonText : colors.textSecondary}
            />
            <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: space.lg,
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
    gap: 6,
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
    borderRadius: radius.md,
    minHeight: 56,
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

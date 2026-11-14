import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, space, type } from '../../../theme/tokens';
import { PRIMARY_ADD_FOOD_TABS, type AddFoodTab } from './types';

const ICONS: Record<
  (typeof PRIMARY_ADD_FOOD_TABS)[number]['id'],
  { off: keyof typeof Ionicons.glyphMap; on: keyof typeof Ionicons.glyphMap }
> = {
  recent: { off: 'time-outline', on: 'time' },
  favorites: { off: 'star-outline', on: 'star' },
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
            aria-selected={on}
            accessibilityState={{ selected: on }}
            accessibilityLabel={t.label}
          >
            <Ionicons
              name={on ? icons.on : icons.off}
              size={16}
              color={on ? colors.primaryButtonText : colors.text}
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
    marginBottom: space.sm,
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
    gap: 4,
    paddingVertical: space.sm,
    paddingHorizontal: space.xs,
    borderRadius: radius.md,
    minHeight: 48,
  },
  tabOn: {
    backgroundColor: colors.primaryButton,
  },
  label: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  labelOn: {
    color: colors.primaryButtonText,
  },
});

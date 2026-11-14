import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, space, touchMin, type } from '../tokens';
import { AppText } from './AppText';

/** A labeled, safe-area-aware floating dock. It occupies layout space. */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.shell, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      <View style={styles.dock} accessibilityRole="tablist" accessibilityLabel="Разделы приложения">
        {state.routes.filter((r) => r.name !== 'sleep').map((route) => {
          const options = descriptors[route.key]!.options;
          const selected = state.routes[state.index]?.key === route.key;
          const color = selected ? colors.onPrimary : colors.textSecondary;
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;
          return (
            <Pressable
              key={route.key}
              testID={`tab-${route.name}`}
              accessibilityRole="tab"
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              accessibilityState={{ selected }}
              aria-selected={selected}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={({ pressed }) => [styles.item, selected && styles.selected, pressed && styles.pressed]}
            >
              {options.tabBarIcon?.({ focused: selected, color, size: 20 })}
              <AppText variant="caption" tone={selected ? 'inverse' : 'secondary'} style={styles.label}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { backgroundColor: colors.canvas, paddingTop: space.sm, paddingHorizontal: space.lg },
  dock: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.xl, padding: 5, gap: 2 },
  item: { flex: 1, minWidth: 0, minHeight: touchMin + 6, alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: radius.lg, paddingVertical: space.sm, paddingHorizontal: 2 },
  selected: { backgroundColor: colors.ink },
  label: { fontSize: type.label, fontWeight: '500', textAlign: 'center' },
  pressed: { opacity: 0.8 },
});

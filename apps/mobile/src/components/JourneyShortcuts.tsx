import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, radius, space, type } from '../theme/tokens';

type Shortcut = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/(tabs)/food' | '/(tabs)/activity' | '/(tabs)/progress' | '/(tabs)/profile' | '/recipes';
};

const DEFAULT: Shortcut[] = [
  { key: 'food', label: 'Дневник', icon: 'restaurant-outline', href: '/(tabs)/food' },
  { key: 'recipes', label: 'Рецепты', icon: 'book-outline', href: '/recipes' },
  { key: 'activity', label: 'Спорт', icon: 'walk-outline', href: '/(tabs)/activity' },
  { key: 'progress', label: 'Прогресс', icon: 'stats-chart-outline', href: '/(tabs)/progress' },
];

/** Compact cross-links so the daily path doesn’t trap users on one tab. */
export function JourneyShortcuts({
  keys = ['food', 'recipes', 'activity', 'progress'],
}: {
  keys?: Array<Shortcut['key']>;
}) {
  const router = useRouter();
  const items = DEFAULT.filter((s) => keys.includes(s.key));

  return (
    <View style={styles.row} accessibilityRole="summary" accessibilityLabel="Быстрые разделы">
      {items.map((s) => (
        <Pressable
          key={s.key}
          onPress={() => router.push(s.href)}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={s.label}
        >
          <Ionicons name={s.icon} size={16} color={colors.text} />
          <Text style={styles.label}>{s.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    minHeight: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  pressed: { opacity: 0.88 },
});

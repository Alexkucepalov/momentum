import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppText, colors, radius, space, touchMin } from '@/src/design-system';

type Action = {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/recipes/new' | '/recipes/import-text' | '/recipes/import-personal';
};

const ACTIONS: Action[] = [
  { key: 'manual', title: 'Вручную', icon: 'create-outline', href: '/recipes/new' },
  { key: 'text', title: 'Из текста', icon: 'document-text-outline', href: '/recipes/import-text' },
  {
    key: 'archive',
    title: 'Архив',
    icon: 'library-outline',
    href: '/recipes/import-personal',
  },
];

/** Slim create/import toolbar — no bordered mini-cards. */
export function RecipeHubActions({
  compact = false,
  omit = [],
}: {
  compact?: boolean;
  omit?: Array<'manual' | 'text' | 'archive'>;
}) {
  const router = useRouter();
  const actions = ACTIONS.filter((a) => !omit.includes(a.key as 'manual' | 'text' | 'archive'));

  return (
    <View
      style={[styles.bar, compact && styles.barCompact]}
      accessibilityRole="toolbar"
      accessibilityLabel="Как добавить рецепт"
      testID="recipe-hub-actions"
    >
      {actions.map((a, i) => (
        <Pressable
          key={a.key}
          onPress={() => router.push(a.href)}
          style={({ pressed }) => [
            styles.item,
            i < actions.length - 1 && styles.itemBorder,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={a.title}
        >
          <Ionicons name={a.icon} size={compact ? 16 : 18} color={colors.ink} />
          <AppText variant="caption" style={styles.label} numberOfLines={1}>
            {a.title}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    minHeight: touchMin,
  },
  barCompact: { minHeight: 40 },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    minWidth: 0,
  },
  itemBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  label: { fontWeight: '700' },
  pressed: { backgroundColor: colors.accentSoft },
});

import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppCard, AppText, colors, radius, space, touchMin } from '@/src/design-system';

type Action = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/recipes/new' | '/recipes/import-text' | '/recipes/import-personal';
};

const ACTIONS: Action[] = [
  {
    key: 'manual',
    title: 'Вручную',
    subtitle: 'С нуля',
    icon: 'create-outline',
    href: '/recipes/new',
  },
  {
    key: 'text',
    title: 'Из текста',
    subtitle: 'Вставить',
    icon: 'document-text-outline',
    href: '/recipes/import-text',
  },
  {
    key: 'archive',
    title: 'Мой архив',
    subtitle: 'Импорт',
    icon: 'library-outline',
    href: '/recipes/import-personal',
  },
];

/** Primary entry points for creating / importing recipes. */
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
      style={[styles.row, compact && styles.rowCompact]}
      accessibilityRole="summary"
      accessibilityLabel="Как добавить рецепт"
      testID="recipe-hub-actions"
    >
      {actions.map((a) => (
        <Pressable
          key={a.key}
          onPress={() => router.push(a.href)}
          style={({ pressed }) => [styles.press, compact && styles.pressCompact, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`${a.title}. ${a.subtitle}`}
        >
          <AppCard style={[styles.card, compact && styles.cardCompact]}>
            <View style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
              <Ionicons name={a.icon} size={compact ? 16 : 22} color={colors.ink} />
            </View>
            <AppText variant={compact ? 'label' : 'body'} style={styles.title} numberOfLines={1}>
              {a.title}
            </AppText>
            {!compact ? (
              <AppText variant="caption" tone="secondary" numberOfLines={1}>
                {a.subtitle}
              </AppText>
            ) : null}
          </AppCard>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.md,
  },
  rowCompact: { gap: space.sm },
  press: {
    flex: 1,
    minHeight: touchMin + 24,
  },
  pressCompact: {
    minHeight: touchMin,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.lg,
    paddingHorizontal: space.md,
    gap: space.sm,
  },
  cardCompact: {
    paddingVertical: space.md,
    gap: 4,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconWrapCompact: {
    width: 32,
    height: 32,
    marginBottom: 0,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
  },
  pressed: { opacity: 0.75 },
});

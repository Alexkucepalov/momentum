import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppCard, AppText, colors, radius, space, touchMin } from '@/src/design-system';

type Action = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  href: '/recipes/new' | '/recipes/import-text' | '/recipes/import-personal';
};

const ACTIONS: Action[] = [
  {
    key: 'manual',
    title: 'Вручную',
    subtitle: 'С нуля',
    icon: 'create',
    tint: colors.accent,
    href: '/recipes/new',
  },
  {
    key: 'text',
    title: 'Из текста',
    subtitle: 'Вставить',
    icon: 'document-text',
    tint: colors.carbs,
    href: '/recipes/import-text',
  },
  {
    key: 'archive',
    title: 'Мой архив',
    subtitle: 'Импорт',
    icon: 'library',
    tint: colors.fat,
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
          style={({ pressed }) => [
            styles.press,
            compact && styles.pressCompact,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${a.title}. ${a.subtitle}`}
        >
          <AppCard style={[styles.card, compact && styles.cardCompact, { borderColor: a.tint }]}>
            <View
              style={[
                styles.iconWrap,
                compact && styles.iconWrapCompact,
                { backgroundColor: `${a.tint}22` },
              ]}
            >
              <Ionicons name={a.icon} size={compact ? 16 : 20} color={a.tint} />
            </View>
            <AppText
              variant={compact ? 'label' : 'caption'}
              style={styles.title}
              numberOfLines={1}
            >
              {a.title}
            </AppText>
            {!compact ? (
              <AppText variant="label" tone="secondary" numberOfLines={1} style={styles.sub}>
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
    alignItems: 'stretch',
    gap: space.sm,
  },
  rowCompact: { gap: space.sm },
  press: {
    flex: 1,
    minWidth: 0,
  },
  pressCompact: { flex: 1 },
  pressed: { opacity: 0.88 },
  card: {
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    minHeight: 96,
    borderWidth: 1.5,
  },
  cardCompact: {
    minHeight: touchMin,
    paddingVertical: space.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconWrapCompact: {
    width: 28,
    height: 28,
    marginBottom: 0,
  },
  title: { fontWeight: '700', textAlign: 'center' },
  sub: { textAlign: 'center' },
});

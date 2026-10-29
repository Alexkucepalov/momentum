import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

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
    >
      {actions.map((a) => (
        <Pressable
          key={a.key}
          onPress={() => router.push(a.href)}
          style={({ pressed }) => [
            styles.card,
            compact && styles.cardCompact,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${a.title}. ${a.subtitle}`}
        >
          <View style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
            <Ionicons name={a.icon} size={compact ? 16 : 22} color={colors.text} />
          </View>
          <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={1}>
            {a.title}
          </Text>
          {!compact ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {a.subtitle}
            </Text>
          ) : null}
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
  card: {
    flex: 1,
    minHeight: touchMin + 24,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.lg,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardCompact: {
    minHeight: touchMin,
    paddingVertical: space.md,
    gap: 4,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconWrapCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 0,
  },
  title: {
    fontSize: type.body,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  titleCompact: { fontSize: type.micro, fontWeight: '700' },
  subtitle: {
    fontSize: type.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});

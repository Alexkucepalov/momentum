import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { AppCard } from '@/src/ui/AppCard';

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

/** One CTA that reveals the three create paths. */
export function RecipeHubActions({
  compact = false,
  omit = [],
}: {
  compact?: boolean;
  omit?: Array<'manual' | 'text' | 'archive'>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(compact);
  const actions = ACTIONS.filter((a) => !omit.includes(a.key as 'manual' | 'text' | 'archive'));

  return (
    <View
      style={[styles.wrap, compact && styles.wrapCompact]}
      accessibilityRole="summary"
      accessibilityLabel="Как добавить рецепт"
    >
      {!compact ? (
        <Pressable
          onPress={() => setOpen((v) => !v)}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={open ? 'Скрыть способы добавления' : 'Добавить рецепт'}
        >
          <Ionicons name="add" size={20} color={colors.primaryButtonText} />
          <Text style={styles.primaryText}>Добавить рецепт</Text>
        </Pressable>
      ) : null}
      {open ? (
        <View style={[styles.row, compact && styles.rowCompact]}>
          {actions.map((a) => (
            <AppCard
              key={a.key}
              padding="none"
              style={[styles.card, compact && styles.cardCompact]}
              onPress={() => router.push(a.href)}
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
            </AppCard>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md, gap: space.sm },
  wrapCompact: { marginBottom: space.sm },
  primary: {
    minHeight: touchMin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    backgroundColor: colors.primaryButton,
    paddingHorizontal: space.lg,
  },
  primaryText: { fontSize: type.body, fontWeight: '800', color: colors.primaryButtonText },
  row: { flexDirection: 'row', gap: space.sm },
  rowCompact: { gap: 6 },
  card: {
    flex: 1,
    minHeight: touchMin,
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
  },
  cardCompact: { minHeight: 44, paddingVertical: 8 },
  pressed: { opacity: 0.88 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconWrapCompact: { width: 28, height: 28, marginBottom: 2 },
  title: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  titleCompact: { fontSize: type.micro },
  subtitle: { fontSize: type.micro, color: colors.textMuted },
});

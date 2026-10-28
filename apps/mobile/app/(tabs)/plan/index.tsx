import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';

import { FormScrollView } from '@/src/components/FormScrollView';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

type HubItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/plan/eat-now' | '/plan/week' | '/plan/my-products' | '/recipes';
  primary?: boolean;
};

const ITEMS: HubItem[] = [
  {
    key: 'eat-now',
    title: 'Что съесть сейчас?',
    subtitle: 'Из рецептов и продуктов',
    icon: 'flash-outline',
    href: '/plan/eat-now',
    primary: true,
  },
  {
    key: 'week',
    title: 'Меню на неделю',
    subtitle: 'План порций',
    icon: 'calendar-outline',
    href: '/plan/week',
  },
  {
    key: 'recipes',
    title: 'Рецепты',
    subtitle: 'Библиотека и импорт',
    icon: 'book-outline',
    href: '/recipes',
  },
  {
    key: 'my-products',
    title: 'Мои продукты',
    subtitle: 'Обычные покупки',
    icon: 'basket-outline',
    href: '/plan/my-products',
  },
];

function HubRow({ item }: { item: HubItem }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(item.href as Href)}
      style={({ pressed }) => [
        styles.card,
        item.primary && styles.cardPrimary,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.subtitle}`}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon} size={22} color={colors.text} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSub}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

/** One job: pick next action. Food-style rows, one soft accent. */
export default function PlanHubScreen() {
  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <View style={styles.list} accessibilityRole="list">
        {ITEMS.map((item) => (
          <HubRow key={item.key} item={item} />
        ))}
      </View>
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    paddingBottom: space.xxl,
  },
  list: { gap: space.sm },
  card: {
    minHeight: touchMin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPrimary: {
    borderColor: colors.text,
  },
  pressed: { opacity: 0.88 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontSize: type.subtitle, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: type.caption, color: colors.textSecondary },
});

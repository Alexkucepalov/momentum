import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';

import { FormScrollView } from '@/src/components/FormScrollView';
import { colors, radius, space, type } from '@/src/theme/tokens';
import { AppCard } from '@/src/ui/AppCard';
import { SoftHeader } from '@/src/ui/SoftHeader';

type HubItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/plan/eat-now' | '/plan/week' | '/plan/my-products' | '/recipes';
};

const ITEMS: HubItem[] = [
  {
    key: 'eat-now',
    title: 'Что съесть сейчас',
    subtitle: 'Из рецептов и продуктов',
    icon: 'flash-outline',
    href: '/plan/eat-now',
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
    <AppCard
      padding="md"
      onPress={() => router.push(item.href as Href)}
      style={styles.row}
      accessibilityLabel={`${item.title}. ${item.subtitle}`}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon} size={20} color={colors.text} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowSub}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </AppCard>
  );
}

/** Plan hub — Soft Light vertical rows (one list, no dual black CTAs). */
export default function PlanHubScreen() {
  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <SoftHeader eyebrow="План" title="Дальше" />
      <View style={styles.list}>
        {ITEMS.map((item) => (
          <HubRow key={item.key} item={item} />
        ))}
      </View>
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: space.xxl },
  list: { gap: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 72,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  rowTitle: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
  },
  rowSub: {
    fontSize: type.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

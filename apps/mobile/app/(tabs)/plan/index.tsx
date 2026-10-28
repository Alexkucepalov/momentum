import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';

import { FormScrollView } from '@/src/components/FormScrollView';
import { shell } from '@/src/theme/shell';
import { space } from '@/src/theme/tokens';
import { AppCard } from '@/src/ui/AppCard';
import { ListRow } from '@/src/ui/ListRow';
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

function HubRow({ item, divided }: { item: HubItem; divided: boolean }) {
  const router = useRouter();
  return (
    <ListRow
      title={item.title}
      meta={item.subtitle}
      iconName={item.icon}
      chevron
      divided={divided}
      onPress={() => router.push(item.href as Href)}
      accessibilityLabel={`${item.title}. ${item.subtitle}`}
    />
  );
}

/** Plan hub — one grouped list, circular glyphs, single chevron language. */
export default function PlanHubScreen() {
  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <SoftHeader eyebrow="План" title="Дальше" />
      <AppCard padding="none">
        {ITEMS.map((item, index) => (
          <HubRow key={item.key} item={item} divided={index > 0} />
        ))}
      </AppCard>
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: shell.screenBottom },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';

import { FormScrollView } from '@/src/components/FormScrollView';
import { GlyphDots } from '@/src/components/nothing/GlyphDots';
import { NothingKicker, NothingScreen } from '@/src/components/nothing/NothingChrome';
import { nothing, nothingRadius, nothingSpace, nothingType } from '@/src/theme/nothing';
import { touchMin } from '@/src/theme/tokens';

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
    subtitle: 'План порций · DnD',
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
      <View style={[styles.iconWrap, item.primary && styles.iconWrapPrimary]}>
        <Ionicons
          name={item.icon}
          size={20}
          color={item.primary ? nothing.invertText : nothing.display}
        />
      </View>
      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, item.primary && styles.cardTitlePrimary]}>{item.title}</Text>
        <Text style={[styles.cardSub, item.primary && styles.cardSubPrimary]}>{item.subtitle}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={item.primary ? nothing.invertText : nothing.muted}
      />
    </Pressable>
  );
}

export default function PlanHubScreen() {
  return (
    <NothingScreen>
      <FormScrollView contentContainerStyle={styles.content}>
        <NothingKicker label="Plan" dots={5} />
        <Text style={styles.lead}>Сейчас · неделя · библиотека</Text>
        <GlyphDots count={8} active={3} />
        <View style={styles.list} accessibilityRole="list">
          {ITEMS.map((item) => (
            <HubRow key={item.key} item={item} />
          ))}
        </View>
      </FormScrollView>
    </NothingScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: nothingSpace.lg,
    paddingBottom: nothingSpace.xxl,
  },
  lead: {
    fontSize: nothingType.caption,
    color: nothing.secondary,
    letterSpacing: 0.6,
    marginBottom: nothingSpace.sm,
    fontWeight: '600',
  },
  list: { gap: nothingSpace.sm, marginTop: nothingSpace.lg },
  card: {
    minHeight: touchMin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: nothingSpace.md,
    paddingVertical: nothingSpace.md,
    paddingHorizontal: nothingSpace.lg,
    backgroundColor: nothing.surface,
    borderRadius: nothingRadius.sm,
    borderWidth: 1,
    borderColor: nothing.lineStrong,
  },
  cardPrimary: {
    backgroundColor: nothing.invert,
    borderColor: nothing.invert,
  },
  pressed: { opacity: 0.8 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: nothingRadius.sm,
    backgroundColor: nothing.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapPrimary: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontSize: nothingType.subtitle, fontWeight: '700', color: nothing.display },
  cardTitlePrimary: { color: nothing.invertText },
  cardSub: { fontSize: nothingType.caption, color: nothing.secondary },
  cardSubPrimary: { color: 'rgba(255,255,255,0.65)' },
});

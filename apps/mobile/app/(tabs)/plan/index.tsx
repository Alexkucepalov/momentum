import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';

import { FormScrollView } from '@/src/components/FormScrollView';
import { colors, radius, space, surfaceCard, type } from '@/src/theme/tokens';

type HubItem = {
  key: string;
  title: string;
  subtitle: string;
  cta: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/plan/eat-now' | '/plan/week' | '/plan/my-products' | '/recipes';
  primary?: boolean;
};

const PRIMARY: HubItem[] = [
  {
    key: 'eat-now',
    title: 'Что съесть сейчас',
    subtitle: 'Из рецептов и продуктов',
    cta: 'Открыть',
    icon: 'flash-outline',
    href: '/plan/eat-now',
    primary: true,
  },
  {
    key: 'week',
    title: 'Меню на неделю',
    subtitle: 'План порций',
    cta: 'Собрать',
    icon: 'calendar-outline',
    href: '/plan/week',
    primary: true,
  },
];

const SECONDARY: HubItem[] = [
  {
    key: 'recipes',
    title: 'Рецепты',
    subtitle: 'Библиотека и импорт',
    cta: 'Открыть',
    icon: 'book-outline',
    href: '/recipes',
  },
  {
    key: 'my-products',
    title: 'Мои продукты',
    subtitle: 'Обычные покупки',
    cta: 'Открыть',
    icon: 'basket-outline',
    href: '/plan/my-products',
  },
];

function BentoCard({ item }: { item: HubItem }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(item.href as Href)}
      style={({ pressed }) => [
        styles.card,
        item.primary ? styles.cardPrimary : styles.cardQuiet,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.subtitle}`}
    >
      <View style={styles.cardTop}>
        <View style={styles.iconWrap}>
          <Ionicons name={item.icon} size={20} color={colors.text} />
        </View>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSub}>{item.subtitle}</Text>
      {item.primary ? (
        <View style={styles.cta}>
          <Text style={styles.ctaText}>{item.cta}</Text>
        </View>
      ) : (
        <Text style={styles.quietCta}>{item.cta} →</Text>
      )}
    </Pressable>
  );
}

/** One job: pick next action. 2×2 bento like Home Workouts/Meals. */
export default function PlanHubScreen() {
  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <View style={styles.grid} accessibilityRole="list">
        {PRIMARY.map((item) => (
          <View key={item.key} style={styles.cell}>
            <BentoCard item={item} />
          </View>
        ))}
        {SECONDARY.map((item) => (
          <View key={item.key} style={styles.cell}>
            <BentoCard item={item} />
          </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  cell: {
    width: '47.5%',
    flexGrow: 1,
  },
  card: {
    ...surfaceCard,
    minHeight: 148,
    padding: space.lg,
  },
  cardPrimary: {},
  cardQuiet: {},
  pressed: { opacity: 0.88 },
  cardTop: {
    marginBottom: space.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: type.caption,
    color: colors.textSecondary,
    marginBottom: space.md,
    flex: 1,
  },
  cta: {
    alignSelf: 'flex-start',
    minHeight: 36,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: type.caption,
    fontWeight: '800',
    color: colors.primaryButtonText,
  },
  quietCta: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 'auto',
  },
});

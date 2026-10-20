import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { FormScrollView } from '@/src/components/FormScrollView';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

type HubItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/plan/eat-now' | '/plan/pantry' | '/plan/week' | '/plan/shop' | '/plan/budget' | '/plan/stores' | '/recipes';
  primary?: boolean;
};

/** Primary = daily loop; secondary = planning/money — same screens, clearer hierarchy. */
const PRIMARY: HubItem[] = [
  {
    key: 'eat-now',
    title: 'Что съесть сейчас?',
    subtitle: 'Подбор по остатку КБЖУ · рецепты и запасы',
    icon: 'flash-outline',
    href: '/plan/eat-now',
    primary: true,
  },
  {
    key: 'recipes',
    title: 'Рецепты',
    subtitle: 'Библиотека, импорт, повтор готовки',
    icon: 'book-outline',
    href: '/recipes',
    primary: true,
  },
  {
    key: 'pantry',
    title: 'Запасы дома',
    subtitle: 'Что есть · для Eat Now и покупок',
    icon: 'cube-outline',
    href: '/plan/pantry',
    primary: true,
  },
];

const SECONDARY: HubItem[] = [
  {
    key: 'week',
    title: 'Меню на неделю',
    subtitle: 'План порций · не дневник',
    icon: 'calendar-outline',
    href: '/plan/week',
  },
  {
    key: 'shop',
    title: 'Покупки',
    subtitle: 'Список из меню и запасов',
    icon: 'cart-outline',
    href: '/plan/shop',
  },
  {
    key: 'budget',
    title: 'Бюджет питания',
    subtitle: 'Лимит и расходы · без live-цен',
    icon: 'wallet-outline',
    href: '/plan/budget',
  },
  {
    key: 'stores',
    title: 'Магазины',
    subtitle: 'Предпочтения · без парсинга цен',
    icon: 'storefront-outline',
    href: '/plan/stores',
  },
];

function HubRow({ item }: { item: HubItem }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(item.href)}
      style={({ pressed }) => [styles.card, item.primary && styles.cardPrimary, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.subtitle}`}
    >
      <View style={[styles.iconWrap, item.primary && styles.iconWrapPrimary]}>
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

export default function PlanHubScreen() {
  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <Text style={styles.kicker} accessibilityRole="header">
        План питания
      </Text>
      <Text style={styles.lead}>
        Сейчас — что съесть. Рецепты и запасы рядом. Меню и покупки — когда планируешь неделю.
      </Text>

      <Text style={styles.section}>Сейчас</Text>
      <View style={styles.list} accessibilityRole="list">
        {PRIMARY.map((item) => (
          <HubRow key={item.key} item={item} />
        ))}
      </View>

      <Text style={styles.section}>Неделя и деньги</Text>
      <View style={styles.list} accessibilityRole="list">
        {SECONDARY.map((item) => (
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
    gap: space.md,
  },
  kicker: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  lead: {
    fontSize: type.body,
    color: colors.textSecondary,
    marginBottom: space.xs,
    lineHeight: 22,
  },
  section: {
    marginTop: space.sm,
    fontSize: type.micro,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
  iconWrapPrimary: {
    backgroundColor: colors.accentSoft,
  },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontSize: type.subtitle, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: type.caption, color: colors.textSecondary },
});

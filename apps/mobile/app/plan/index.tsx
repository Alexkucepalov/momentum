import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { FormScrollView } from '@/src/components/FormScrollView';
import {
  AppCard,
  AppText,
  colors,
  radius,
  space,
  touchMin,
} from '@/src/design-system';

type HubItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  href:
    | '/plan/eat-now'
    | '/plan/pantry'
    | '/plan/week'
    | '/plan/shop'
    | '/plan/budget'
    | '/plan/stores'
    | '/plan/receipt'
    | '/recipes';
  primary?: boolean;
};

/** Primary = daily loop; secondary = planning/money — plan ≠ diary. */
const PRIMARY: HubItem[] = [
  {
    key: 'eat-now',
    title: 'Что съесть сейчас?',
    subtitle: 'Подбор по остатку КБЖУ · рецепты и запасы',
    icon: 'flash',
    tint: colors.fat,
    href: '/plan/eat-now',
    primary: true,
  },
  {
    key: 'recipes',
    title: 'Рецепты',
    subtitle: 'Библиотека, импорт, повтор готовки',
    icon: 'book',
    tint: colors.accent,
    href: '/recipes',
    primary: true,
  },
  {
    key: 'pantry',
    title: 'Запасы дома',
    subtitle: 'Что есть · для Eat Now и покупок',
    icon: 'cube',
    tint: colors.protein,
    href: '/plan/pantry',
    primary: true,
  },
];

const SECONDARY: HubItem[] = [
  {
    key: 'receipt',
    title: 'Импорт покупки',
    subtitle: 'Текст заказа → запасы',
    icon: 'receipt',
    tint: colors.carbs,
    href: '/plan/receipt',
  },
  {
    key: 'week',
    title: 'Меню на неделю',
    subtitle: 'Черновик порций · не дневник',
    icon: 'calendar',
    tint: colors.accent,
    href: '/plan/week',
  },
  {
    key: 'shop',
    title: 'Покупки',
    subtitle: 'Недостающее из меню и запасов',
    icon: 'cart',
    tint: colors.fat,
    href: '/plan/shop',
  },
  {
    key: 'budget',
    title: 'Бюджет питания',
    subtitle: 'План / факт · свои цены',
    icon: 'wallet',
    tint: colors.protein,
    href: '/plan/budget',
  },
];

const SETTINGS: HubItem[] = [
  {
    key: 'stores',
    title: 'Магазины',
    subtitle: 'Справочник мест',
    icon: 'storefront',
    tint: colors.textMuted,
    href: '/plan/stores',
  },
];

function HubRow({ item }: { item: HubItem }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(item.href)}
      style={({ pressed }) => [pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.subtitle}`}
      testID={`plan-hub-${item.key}`}
    >
      <AppCard style={[styles.card, item.primary && styles.cardPrimary]}>
        <View style={[styles.iconWrap, { backgroundColor: `${item.tint}22` }]}>
          <Ionicons name={item.icon} size={22} color={item.tint} />
        </View>
        <View style={styles.cardText}>
          <AppText variant="subtitle" style={styles.cardTitle}>
            {item.title}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {item.subtitle}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </AppCard>
    </Pressable>
  );
}

export default function PlanHubScreen() {
  return (
    <FormScrollView contentContainerStyle={styles.content} testID="plan-hub">
      <View style={styles.hero}>
        <AppText variant="title" style={styles.heroTitle}>
          План питания
        </AppText>
        <AppText variant="body" tone="secondary" style={styles.lead}>
          Сначала — что съесть сейчас. Меню и покупки — когда планируешь неделю.
        </AppText>
      </View>

      <AppCard style={styles.notice} accessibilityLabel="План не равен дневнику" testID="plan-neq-diary">
        <View style={styles.noticeRow}>
          <Ionicons name="information-circle" size={20} color={colors.accent} />
          <View style={styles.noticeText}>
            <AppText variant="label" tone="accent">
              Запланированное ≠ съеденное
            </AppText>
            <AppText variant="caption" tone="secondary">
              В дневник — только явная порция («В дневник»).
            </AppText>
          </View>
        </View>
      </AppCard>

      <AppText variant="label" tone="muted" style={styles.section}>
        Сейчас
      </AppText>
      <View style={styles.list} accessibilityRole="list">
        {PRIMARY.map((item) => (
          <HubRow key={item.key} item={item} />
        ))}
      </View>

      <AppText variant="label" tone="muted" style={styles.section}>
        Неделя и деньги
      </AppText>
      <View style={styles.list} accessibilityRole="list">
        {SECONDARY.map((item) => (
          <HubRow key={item.key} item={item} />
        ))}
      </View>

      <AppText variant="label" tone="muted" style={styles.section}>
        Ещё
      </AppText>
      <View style={styles.list} accessibilityRole="list">
        {SETTINGS.map((item) => (
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
    backgroundColor: colors.canvas,
  },
  hero: {
    gap: space.sm,
    paddingVertical: space.sm,
  },
  heroTitle: { fontWeight: '800' },
  lead: {
    lineHeight: 22,
  },
  notice: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  noticeRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  noticeText: { flex: 1, gap: 4, minWidth: 0 },
  section: {
    marginTop: space.sm,
  },
  list: { gap: space.sm },
  card: {
    minHeight: touchMin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  cardPrimary: {
    borderColor: colors.accent,
    borderWidth: 1.5,
  },
  pressed: { opacity: 0.88 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 2, minWidth: 0 },
  cardTitle: { fontWeight: '700' },
});

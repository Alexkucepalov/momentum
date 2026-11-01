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
    key: 'receipt',
    title: 'Импорт покупки',
    subtitle: 'Текст заказа → preview → подтверждение → запасы',
    icon: 'receipt-outline',
    href: '/plan/receipt',
  },
  {
    key: 'week',
    title: 'Меню на неделю',
    subtitle: 'Черновик порций · не дневник',
    icon: 'calendar-outline',
    href: '/plan/week',
  },
  {
    key: 'shop',
    title: 'Покупки',
    subtitle: 'Недостающее из меню и запасов',
    icon: 'cart-outline',
    href: '/plan/shop',
  },
  {
    key: 'budget',
    title: 'Бюджет питания',
    subtitle: 'План / факт / оценка · свои цены',
    icon: 'wallet-outline',
    href: '/plan/budget',
  },
];

/** N2: stores demoted off the main planning path. */
const SETTINGS: HubItem[] = [
  {
    key: 'stores',
    title: 'Магазины',
    subtitle: 'Справочник мест · не live-цены',
    icon: 'storefront-outline',
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
        <View style={[styles.iconWrap, item.primary && styles.iconWrapPrimary]}>
          <Ionicons name={item.icon} size={22} color={colors.ink} />
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
      <AppText variant="label" tone="secondary" accessibilityRole="header">
        План питания · nf-fit
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.lead}>
        Сейчас — что съесть. Рецепты и запасы рядом. Меню и покупки — когда планируешь неделю.
        План не пишет в дневник сам — только по явной команде.
      </AppText>

      <AppCard style={styles.notice} accessibilityLabel="План не равен дневнику" testID="plan-neq-diary">
        <AppText variant="label" tone="accent">
          Запланированное ≠ съеденное
        </AppText>
        <AppText variant="caption" tone="secondary">
          План и меню не пишут в дневник сами. В дневник — только явная порция («В дневник»).
        </AppText>
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
  lead: {
    marginBottom: space.xs,
    lineHeight: 22,
  },
  notice: {
    gap: space.xs,
  },
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
    borderColor: colors.ink,
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
  cardTitle: { fontWeight: '700' },
});

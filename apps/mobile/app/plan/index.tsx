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
  href: '/plan/eat-now' | '/plan/pantry' | '/plan/week' | '/plan/shop' | null;
  soon?: boolean;
};

const ITEMS: HubItem[] = [
  {
    key: 'eat-now',
    title: 'Что съесть сейчас?',
    subtitle: 'По остатку КБЖУ',
    icon: 'flash-outline',
    href: '/plan/eat-now',
  },
  {
    key: 'pantry',
    title: 'Запасы дома',
    subtitle: 'Холодильник, морозилка, партии',
    icon: 'cube-outline',
    href: '/plan/pantry',
  },
  {
    key: 'cook',
    title: 'Что приготовить?',
    subtitle: 'Подбор из рецептов',
    icon: 'restaurant-outline',
    href: '/plan/eat-now',
  },
  {
    key: 'week',
    title: 'Меню на неделю',
    subtitle: '3–7 дней и порции',
    icon: 'calendar-outline',
    href: '/plan/week',
  },
  {
    key: 'shop',
    title: 'Мои покупки',
    subtitle: 'Список и оценка цен',
    icon: 'cart-outline',
    href: '/plan/shop',
  },
];

export default function PlanHubScreen() {
  const router = useRouter();

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <Text style={styles.kicker} accessibilityRole="header">
        Рецепты · Неделя · Покупки · Бюджет
      </Text>
      <Text style={styles.lead}>
        Остаток КБЖУ — ориентир для выбора, не запрет на еду.
      </Text>

      <View style={styles.list} accessibilityRole="list">
        {ITEMS.map((item) => {
          const disabled = item.soon || !item.href;
          return (
            <Pressable
              key={item.key}
              disabled={disabled}
              onPress={() => {
                if (item.href) router.push(item.href);
              }}
              style={({ pressed }) => [
                styles.card,
                disabled && styles.cardSoon,
                pressed && !disabled && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled }}
              accessibilityLabel={
                disabled ? `${item.title}. Пока недоступно` : `${item.title}. ${item.subtitle}`
              }
            >
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={22} color={colors.text} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.subtitle}</Text>
              </View>
              {!disabled ? (
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              ) : (
                <Text style={styles.soon}>Скоро</Text>
              )}
            </Pressable>
          );
        })}
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
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  lead: {
    fontSize: type.body,
    color: colors.textSecondary,
    marginBottom: space.sm,
    lineHeight: 22,
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
  cardSoon: { opacity: 0.72 },
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
  soon: { fontSize: type.micro, fontWeight: '700', color: colors.textMuted },
});

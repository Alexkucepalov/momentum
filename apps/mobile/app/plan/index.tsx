import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';

import { FormScrollView } from '@/src/components/FormScrollView';
import { PlanNotDiaryNote } from '@/src/features/plan/PlanNotDiaryNote';
import { AppText, colors, radius, space, touchMin } from '@/src/design-system';

type LinkItem = {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
};

const NOW: LinkItem[] = [
  { key: 'recipes', title: 'Рецепты', icon: 'book-outline', href: '/recipes' },
  { key: 'pantry', title: 'Запасы', icon: 'cube-outline', href: '/plan/pantry' },
];

const LATER: LinkItem[] = [
  { key: 'week', title: 'Доска недели', icon: 'calendar-outline', href: '/plan/week' },
  { key: 'shop', title: 'Покупки', icon: 'cart-outline', href: '/plan/shop' },
  { key: 'budget', title: 'Бюджет', icon: 'wallet-outline', href: '/plan/budget' },
  { key: 'receipt', title: 'Импорт покупки', icon: 'receipt-outline', href: '/plan/receipt' },
  { key: 'stores', title: 'Магазины', icon: 'storefront-outline', href: '/plan/stores' },
];

function LinkRow({ item, last }: { item: LinkItem; last?: boolean }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(item.href)}
      style={({ pressed }) => [styles.linkRow, !last && styles.linkRowBorder, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      testID={`plan-hub-${item.key}`}
    >
      <View style={styles.linkIcon}>
        <Ionicons name={item.icon} size={20} color={colors.ink} />
      </View>
      <AppText variant="body" style={styles.linkTitle}>
        {item.title}
      </AppText>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function PlanHubScreen() {
  const router = useRouter();

  return (
    <FormScrollView contentContainerStyle={styles.content} testID="plan-hub">
      <Pressable
        onPress={() => router.push('/plan/eat-now')}
        style={({ pressed }) => [styles.hero, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Что съесть сейчас"
        testID="plan-hub-eat-now"
      >
        <View style={styles.heroIcon}>
          <Ionicons name="flash" size={22} color={colors.ink} />
        </View>
        <View style={styles.heroText}>
          <AppText variant="title" tone="ink" style={styles.heroTitle}>
            Что съесть сейчас
          </AppText>
          <AppText variant="caption" tone="ink" style={styles.heroSub}>
            По остатку КБЖУ · запасы и рецепты
          </AppText>
        </View>
        <Ionicons name="arrow-forward" size={20} color={colors.ink} />
      </Pressable>

      <PlanNotDiaryNote style={styles.disclaimer} />

      <View style={styles.group}>
        <AppText variant="label" tone="muted" style={styles.groupLabel}>
          Рядом
        </AppText>
        <View style={styles.sheet}>
          {NOW.map((item, i) => (
            <LinkRow key={item.key} item={item} last={i === NOW.length - 1} />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <AppText variant="label" tone="muted" style={styles.groupLabel}>
          Планирование
        </AppText>
        <View style={styles.sheet}>
          {LATER.map((item, i) => (
            <LinkRow key={item.key} item={item} last={i === LATER.length - 1} />
          ))}
        </View>
      </View>
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.screen,
    paddingBottom: space.xxl,
    gap: space.lg,
    backgroundColor: colors.canvas,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 88,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.trainingStrength,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 4, minWidth: 0 },
  heroTitle: { fontWeight: '500', fontSize: 22, letterSpacing: -0.6 },
  heroSub: { opacity: 0.75 },
  disclaimer: {
    marginTop: -space.sm,
    lineHeight: 18,
  },
  group: { gap: space.sm },
  groupLabel: {
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    paddingHorizontal: space.xs,
  },
  sheet: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touchMin + 12,
    paddingHorizontal: 0,
    paddingVertical: space.md,
  },
  linkRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: { flex: 1, fontWeight: '600' },
  pressed: { opacity: 0.88 },
});

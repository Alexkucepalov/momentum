import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';
import { useRouter } from 'expo-router';

import type { PlannedMeal } from '../../../../../src/storage/types';
import { useAddGuard } from '@/src/hooks/useAddGuard';
import { useData, useAnyRevision } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

const MEAL: Record<string, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

/** Compact «план на сегодня» on Today/Food — log without opening week board. */
export function TodayPlanStrip() {
  const router = useRouter();
  const { repo, dateLocal, refresh, showFlash } = useData();
  const revision = useAnyRevision();
  const allowAdd = useAddGuard();
  void revision;

  const planned = repo
    .listPlannedMealsForDate(dateLocal)
    .filter((m) => m.status === 'planned')
    .slice(0, 6);

  if (planned.length === 0) {
    return (
      <Pressable
        onPress={() => router.push('/plan/week')}
        style={({ pressed }) => [styles.emptyLink, pressed && styles.pressed]}
        accessibilityRole="link"
        accessibilityLabel="Составить план на сегодня"
        hitSlop={8}
      >
        <Text style={styles.emptyLinkText}>Составить план на сегодня →</Text>
      </Pressable>
    );
  }

  const log = (m: PlannedMeal) => {
    if (!allowAdd()) return;
    repo.logPlannedMealToDiary(m.id);
    refresh();
    showFlash(`В дневник: ${m.displayName}`);
  };

  return (
    <View style={styles.wrap} accessibilityRole="summary" accessibilityLabel="План на сегодня">
      <View style={styles.head}>
        <Text style={styles.title}>План на сегодня</Text>
        <Pressable
          onPress={() => router.push('/plan/week')}
          accessibilityRole="button"
          accessibilityLabel="Открыть меню на неделю"
          hitSlop={8}
          style={styles.menuHit}
        >
          <Text style={styles.link}>Меню</Text>
        </Pressable>
      </View>
      {planned.map((m) => (
        <View key={m.id} style={styles.row}>
          <View style={styles.main}>
            <Text style={styles.slot}>{MEAL[m.meal] ?? m.meal}</Text>
            <Text style={styles.name}>
              {m.displayName} · {Math.round(m.grams)} г
            </Text>
          </View>
          <Pressable
            onPress={() => log(m)}
            style={styles.cta}
            accessibilityRole="button"
            accessibilityLabel={`Добавить в дневник ${m.displayName}`}
          >
            <Text style={styles.ctaText}>Съел</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
    marginBottom: space.md,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  link: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  main: { flex: 1, gap: 2 },
  slot: { fontSize: type.micro, fontWeight: '700', color: colors.textMuted },
  name: { fontSize: type.body, fontWeight: '600', color: colors.text },
  cta: {
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  ctaText: { color: colors.primaryButtonText, fontWeight: '800', fontSize: type.caption },
  emptyLink: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: touchMin,
    paddingVertical: space.sm,
    marginBottom: space.md,
  },
  emptyLinkText: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  menuHit: {
    minHeight: touchMin,
    justifyContent: 'center',
    paddingHorizontal: space.xs,
  },
  pressed: { opacity: 0.9 },
});

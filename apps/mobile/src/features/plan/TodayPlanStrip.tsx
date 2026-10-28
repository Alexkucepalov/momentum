import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { PlannedMeal } from '../../../../../src/storage/types';
import { useAddGuard } from '@/src/hooks/useAddGuard';
import { useData } from '@/src/state/DataContext';
import { nothing, nothingRadius, nothingSpace, nothingType } from '@/src/theme/nothing';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

const MEAL: Record<string, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

/** Compact plan strip — default keeps Food tab look; `nothing` for Today. */
export function TodayPlanStrip({ tone = 'default' }: { tone?: 'default' | 'nothing' }) {
  const n = tone === 'nothing';
  const router = useRouter();
  const { repo, dateLocal, refresh, revision, showFlash } = useData();
  const allowAdd = useAddGuard();
  void revision;

  const planned = repo
    .listPlannedMealsForDate(dateLocal)
    .filter((m) => m.status === 'planned')
    .slice(0, 4);

  if (planned.length === 0) {
    return (
      <Pressable
        onPress={() => router.push('/plan/week')}
        style={({ pressed }) => [styles.emptyLink, pressed && styles.pressed]}
        accessibilityRole="link"
        accessibilityLabel="Открыть меню на неделю"
        hitSlop={8}
      >
        <Text style={[styles.emptyLinkText, n && styles.emptyLinkTextN]}>План на сегодня →</Text>
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
        <Text style={[styles.title, n && styles.titleN]}>{n ? 'PLAN' : 'План'}</Text>
        <Pressable
          onPress={() => router.push('/plan/week')}
          accessibilityRole="button"
          accessibilityLabel="Открыть меню на неделю"
          hitSlop={8}
          style={styles.menuHit}
        >
          <Text style={[styles.link, n && styles.linkN]}>Неделя</Text>
        </Pressable>
      </View>
      {planned.map((m) => (
        <View key={m.id} style={[styles.row, n && styles.rowN]}>
          <View style={styles.main}>
            <Text style={[styles.name, n && styles.nameN]} numberOfLines={1}>
              <Text style={[styles.slot, n && styles.slotN]}>{MEAL[m.meal] ?? m.meal} · </Text>
              {m.displayName}
            </Text>
          </View>
          <Pressable
            onPress={() => log(m)}
            style={[styles.cta, n && styles.ctaN]}
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
    marginBottom: space.md,
    gap: space.sm,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: type.caption, fontWeight: '800', color: colors.textSecondary },
  link: { fontSize: type.caption, fontWeight: '700', color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    minHeight: touchMin,
  },
  main: { flex: 1 },
  slot: { fontSize: type.caption, fontWeight: '700', color: colors.textMuted },
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
    minHeight: 36,
    marginBottom: space.md,
  },
  emptyLinkText: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textMuted,
  },
  menuHit: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: space.xs,
  },
  pressed: { opacity: 0.9 },
  titleN: {
    fontSize: nothingType.micro,
    letterSpacing: nothingType.letterWide,
    color: nothing.muted,
  },
  linkN: { color: nothing.secondary, letterSpacing: 0.4 },
  rowN: {
    borderRadius: nothingRadius.sm,
    borderColor: nothing.lineStrong,
    backgroundColor: nothing.surface,
  },
  nameN: { color: nothing.display, fontWeight: '600' },
  slotN: { color: nothing.muted },
  ctaN: { borderRadius: nothingRadius.sm, backgroundColor: nothing.invert },
  emptyLinkTextN: {
    color: nothing.secondary,
    letterSpacing: 0.4,
    marginBottom: nothingSpace.md,
  },
});

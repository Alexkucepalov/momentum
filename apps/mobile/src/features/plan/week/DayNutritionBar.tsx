import { StyleSheet, Text, View } from 'react-native';

import type { DayPlanNutritionSummary } from '../../../../../../src/domain/plannedMealNutrition';
import { colors, space, type } from '@/src/theme/tokens';

function fmt(n: number | null): string {
  return n === null ? '—' : String(Math.round(n));
}

export function DayNutritionBar({
  summary,
  targets,
}: {
  summary: DayPlanNutritionSummary;
  targets: {
    energyKcal: number | null;
    proteinG: number | null;
    fatG: number | null;
    carbG: number | null;
  };
}) {
  if (summary.empty) {
    return (
      <View style={styles.wrap} accessibilityRole="summary" accessibilityLabel="План дня пуст">
        <View style={styles.kcalRow}>
          <Text style={styles.kcalEmpty}>—</Text>
          <Text style={styles.kcalUnit}>ккал</Text>
        </View>
        <Text style={styles.emptyBody}>День без плана. Добавьте первое блюдо — это ещё не дневник.</Text>
      </View>
    );
  }

  const kcal = summary.totals.kcal;
  const target = targets.energyKcal;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={
        summary.incomplete
          ? 'План дня с неполными КБЖУ'
          : `План дня ${fmt(kcal)} килокалорий`
      }
    >
      <View style={styles.kcalRow}>
        <Text style={styles.kcal}>{fmt(kcal)}</Text>
        <Text style={styles.kcalUnit}>
          ккал{target != null ? ` / ${Math.round(target)}` : ''}
        </Text>
      </View>
      <View style={styles.macros}>
        <MacroDot color={colors.protein} label="Б" value={summary.totals.protein} target={targets.proteinG} />
        <MacroDot color={colors.fat} label="Ж" value={summary.totals.fat} target={targets.fatG} />
        <MacroDot color={colors.carbs} label="У" value={summary.totals.carbs} target={targets.carbG} />
      </View>
      {summary.incomplete ? (
        <Text style={styles.incomplete}>Есть неизвестные КБЖУ — сумма неполная</Text>
      ) : null}
    </View>
  );
}

function MacroDot({
  color,
  label,
  value,
  target,
}: {
  color: string;
  label: string;
  value: number | null;
  target: number | null;
}) {
  return (
    <View style={styles.macroItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.macroText}>
        {label} {fmt(value)}
        {target != null ? `/${Math.round(target)}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.md,
    gap: space.sm,
  },
  kcalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  kcal: { fontSize: type.hero, fontWeight: '800', color: colors.text, lineHeight: 40 },
  kcalEmpty: { fontSize: type.title, fontWeight: '600', color: colors.textMuted, lineHeight: 28 },
  kcalUnit: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary },
  macros: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  macroItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  macroText: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary },
  incomplete: { fontSize: type.micro, color: colors.textMuted },
  emptyTitle: { fontSize: type.body, fontWeight: '800', color: colors.text },
  emptyBody: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
});

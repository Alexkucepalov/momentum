import { StyleSheet, Text, View } from 'react-native';

import type { DayPlanNutritionSummary } from '../../../../../../src/domain/plannedMealNutrition';
import { colors, radius, space, type } from '@/src/theme/tokens';

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
        <Text style={styles.emptyTitle}>День без плана</Text>
        <Text style={styles.emptyBody}>Добавь блюдо в слот ниже — это ещё не дневник.</Text>
      </View>
    );
  }

  const kcal = summary.totals.kcal;
  const target = targets.energyKcal;
  const remaining =
    kcal !== null && target !== null && Number.isFinite(target) ? target - kcal : null;

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
      <View style={styles.row}>
        <Text style={styles.kcal}>{fmt(kcal)}</Text>
        <Text style={styles.kcalUnit}>ккал план</Text>
        {target != null ? (
          <Text style={styles.target}>
            / {Math.round(target)}
            {remaining !== null ? ` · ост. ${Math.round(remaining)}` : ''}
          </Text>
        ) : null}
      </View>
      <Text style={styles.macros}>
        Б {fmt(summary.totals.protein)}
        {targets.proteinG != null ? `/${Math.round(targets.proteinG)}` : ''}
        {' · '}Ж {fmt(summary.totals.fat)}
        {targets.fatG != null ? `/${Math.round(targets.fatG)}` : ''}
        {' · '}У {fmt(summary.totals.carbs)}
        {targets.carbG != null ? `/${Math.round(targets.carbG)}` : ''}
      </Text>
      {summary.incomplete ? (
        <Text style={styles.incomplete}>Есть позиции с неизвестными КБЖУ — сумма неполная</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.md,
    gap: 4,
  },
  row: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 },
  kcal: { fontSize: type.title, fontWeight: '800', color: colors.text },
  kcalUnit: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary },
  target: { fontSize: type.caption, color: colors.textMuted, fontWeight: '600' },
  macros: { fontSize: type.caption, color: colors.textSecondary, fontWeight: '600' },
  incomplete: { fontSize: type.micro, color: colors.textMuted, marginTop: 2 },
  emptyTitle: { fontSize: type.body, fontWeight: '800', color: colors.text },
  emptyBody: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
});

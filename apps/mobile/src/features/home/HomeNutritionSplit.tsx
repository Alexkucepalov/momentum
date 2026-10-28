import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { energyProgressRatio } from '../../../../../src/domain/energyProgress';
import type { DailyNutritionTargets, DailyTotals } from '../../../../../src/storage/types';
import { colors, space, type } from '@/src/theme/tokens';
import { AppCard } from '@/src/ui/AppCard';
import { BentoRow } from '@/src/ui/BentoRow';

const RING = 72;
const STROKE = 8;
const R = (RING - STROKE) / 2;
const C = 2 * Math.PI * R;

function fmt(n: number | null): string {
  if (n === null) return '—';
  return String(Math.round(n));
}

/** Soft wellness bento: calories ring + macros (refs 01 + 08). */
export function HomeNutritionSplit({
  totals,
  targets,
  onPress,
}: {
  totals: DailyTotals;
  targets: DailyNutritionTargets | null;
  onPress: () => void;
}) {
  const energyTarget = targets?.energyKcal ?? null;
  const fill = energyProgressRatio(totals.energyKcal, energyTarget);
  const pct = Math.round(fill * 100);
  const progressOffset = C * (1 - fill);

  return (
    <BentoRow>
      <AppCard
        onPress={onPress}
        style={styles.kcalCard}
        accessibilityLabel={`Калории ${fmt(totals.energyKcal)}${energyTarget != null ? ` из ${fmt(energyTarget)}` : ''}`}
      >
        <Text style={styles.label}>Питание</Text>
        <View style={styles.ringWrap}>
          <Svg width={RING} height={RING}>
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              stroke={colors.ringTrack}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              stroke={colors.focus}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${C} ${C}`}
              strokeDashoffset={progressOffset}
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>
          <Text style={styles.pct}>{energyTarget == null ? '—' : `${pct}%`}</Text>
        </View>
        <Text style={styles.kcalLine}>
          <Text style={styles.kcalNow}>{fmt(totals.energyKcal)}</Text>
          {energyTarget != null ? ` / ${fmt(energyTarget)}` : ' ккал'}
        </Text>
      </AppCard>

      <AppCard
        onPress={onPress}
        style={styles.macroCard}
        accessibilityLabel={`Белки ${fmt(totals.proteinG)}, жиры ${fmt(totals.fatG)}, углеводы ${fmt(totals.carbG)}`}
      >
        <Text style={styles.label}>БЖУ</Text>
        <MacroRow
          label="Белки"
          value={totals.proteinG}
          target={targets?.proteinG ?? null}
          color={colors.protein}
        />
        <MacroRow
          label="Углеводы"
          value={totals.carbG}
          target={targets?.carbG ?? null}
          color={colors.carbs}
        />
        <MacroRow
          label="Жиры"
          value={totals.fatG}
          target={targets?.fatG ?? null}
          color={colors.fat}
        />
      </AppCard>
    </BentoRow>
  );
}

function MacroRow({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number | null;
  target: number | null;
  color: string;
}) {
  const ratio =
    value != null && target != null && target > 0 ? Math.min(1, value / target) : 0;
  return (
    <View style={styles.macroRow}>
      <View style={styles.macroHead}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>
          {fmt(value)}
          {target != null ? `/${fmt(target)}` : ''}
        </Text>
      </View>
      <View style={styles.macroTrack}>
        <View
          style={[styles.macroFill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kcalCard: {
    flex: 1,
    minHeight: 168,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  macroCard: {
    flex: 1,
    minHeight: 168,
    gap: space.sm,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textMuted,
  },
  ringWrap: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pct: {
    position: 'absolute',
    fontSize: type.body,
    fontWeight: '800',
    color: colors.text,
  },
  kcalLine: {
    fontSize: type.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  kcalNow: {
    color: colors.focus,
    fontWeight: '800',
  },
  macroRow: { gap: 4 },
  macroHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.textMuted,
  },
  macroValue: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.text,
  },
  macroTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accentSoft,
    overflow: 'hidden',
  },
  macroFill: {
    height: 4,
    borderRadius: 2,
  },
});

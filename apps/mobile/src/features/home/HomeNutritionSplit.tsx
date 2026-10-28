import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { energyProgressRatio } from '../../../../../src/domain/energyProgress';
import type { DailyNutritionTargets, DailyTotals } from '../../../../../src/storage/types';
import { colors, space, surfaceCard, type } from '@/src/theme/tokens';

const RING = 88;
const STROKE = 10;
const R = (RING - STROKE) / 2;
const C = 2 * Math.PI * R;

function fmt(n: number | null): string {
  if (n === null) return '—';
  return String(Math.round(n));
}

/** Ref 01 — calories ring card + macros card. */
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
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, styles.kcalCard, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Калории ${fmt(totals.energyKcal)}${energyTarget != null ? ` из ${fmt(energyTarget)}` : ''}`}
      >
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
          {energyTarget != null ? ` / ${fmt(energyTarget)} ккал` : ' ккал'}
        </Text>
      </Pressable>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, styles.macroCard, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Белки ${fmt(totals.proteinG)}, жиры ${fmt(totals.fatG)}, углеводы ${fmt(totals.carbG)}`}
      >
        <MacroRow
          label="БЕЛКИ"
          value={totals.proteinG}
          target={targets?.proteinG ?? null}
          color={colors.protein}
        />
        <MacroRow
          label="УГЛЕВОДЫ"
          value={totals.carbG}
          target={targets?.carbG ?? null}
          color={colors.carbs}
        />
        <MacroRow
          label="ЖИРЫ"
          value={totals.fatG}
          target={targets?.fatG ?? null}
          color={colors.fat}
        />
      </Pressable>
    </View>
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
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>
        {fmt(value)}г{target != null ? ` / ${fmt(target)}г` : ''}
      </Text>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.md,
  },
  card: {
    ...surfaceCard,
    padding: space.lg,
  },
  kcalCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  macroCard: {
    flex: 1.15,
    justifyContent: 'center',
    gap: space.md,
  },
  pressed: { opacity: 0.92 },
  ringWrap: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pct: {
    position: 'absolute',
    fontSize: type.subtitle,
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
  macroLabel: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  macroValue: {
    fontSize: type.caption,
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

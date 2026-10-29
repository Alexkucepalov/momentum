import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { energyProgressRatio } from '../../../../src/domain/energyProgress';
import type { DailyNutritionTargets, DailyTotals } from '../../../../src/storage/types';
import { colors, radius, space, touchMin, type } from '../theme/tokens';

function fmt(n: number | null): string {
  if (n === null) return '—';
  return String(Math.round(n));
}

const SIZE = 168;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

type Props = {
  totals: DailyTotals;
  targets?: DailyNutritionTargets | null;
  activityKcal?: number | null;
  activityMinutes?: number;
  /** compact = number + bar (Today/Food first screen); ring = legacy large widget */
  variant?: 'compact' | 'ring';
  /** Shown when energy target is missing (e.g. open Profile goals). */
  onSetTarget?: () => void;
};

/** Nutrition summary. Compact by default to keep first viewport usable. */
export function KcalRing({
  totals,
  targets = null,
  activityKcal = null,
  activityMinutes = 0,
  variant = 'compact',
  onSetTarget,
}: Props) {
  if (variant === 'ring') {
    return (
      <RingLayout
        totals={totals}
        targets={targets}
        activityKcal={activityKcal}
        activityMinutes={activityMinutes}
        onSetTarget={onSetTarget}
      />
    );
  }
  return (
    <CompactLayout
      totals={totals}
      targets={targets}
      activityKcal={activityKcal}
      activityMinutes={activityMinutes}
      onSetTarget={onSetTarget}
    />
  );
}

function CompactLayout({
  totals,
  targets,
  activityKcal = null,
  activityMinutes = 0,
  onSetTarget,
}: Omit<Props, 'variant'>) {
  const foodKcal = totals.energyKcal;
  const hasUnknown = totals.hasUnknownFields;
  const energyTarget = targets?.energyKcal ?? null;
  const actMin = activityMinutes ?? 0;
  const actKcal = activityKcal ?? null;
  const remaining =
    foodKcal !== null && energyTarget !== null ? Math.round(energyTarget - foodKcal) : null;
  const fill = energyProgressRatio(foodKcal, energyTarget);

  const entryLabel =
    totals.entryCount === 0
      ? 'пока пусто'
      : `${totals.entryCount} ${
          totals.entryCount === 1 ? 'запись' : totals.entryCount < 5 ? 'записи' : 'записей'
        }`;

  return (
    <View
      style={styles.compactWrap}
      accessibilityRole="summary"
      accessibilityLabel={`Еда ${fmt(foodKcal)} килокалорий${energyTarget != null ? ` из цели ${fmt(energyTarget)}` : ''}. Белки ${fmt(totals.proteinG)} г. Жиры ${fmt(totals.fatG)} г. Углеводы ${fmt(totals.carbG)} г.${hasUnknown ? ' Часть значений неизвестна.' : ''}`}
    >
      <View style={styles.compactHead}>
        <View style={styles.compactKcalCol}>
          <Text style={styles.compactKcal}>{fmt(foodKcal)}</Text>
          <Text style={styles.compactUnit}>
            {totals.entryCount === 0 ? 'ккал еды' : 'ккал записано'}
          </Text>
          <Text style={styles.compactMeta}>{entryLabel}</Text>
        </View>
        <View style={styles.compactSide}>
          {energyTarget == null ? (
            onSetTarget ? (
              <Pressable
                onPress={onSetTarget}
                style={({ pressed }) => [styles.targetCta, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Настроить ориентир калорий"
              >
                <Text style={styles.targetCtaText}>Настроить ориентир</Text>
              </Pressable>
            ) : (
              <Text style={styles.targetHint}>Ориентир — в Профиле</Text>
            )
          ) : (
            <>
              <Text style={styles.sideLabel}>До ориентира</Text>
              <Text style={styles.sideValue}>
                {remaining === null
                  ? '—'
                  : remaining > 0
                    ? `${remaining}`
                    : remaining < 0
                      ? `+${Math.abs(remaining)}`
                      : '0'}
              </Text>
              <Text style={styles.sideHint}>
                {remaining === null
                  ? ''
                  : remaining > 0
                    ? 'ккал осталось'
                    : remaining < 0
                      ? 'ккал сверх'
                      : 'ровно по цели'}
              </Text>
            </>
          )}
          {actMin > 0 ? (
            <Text style={styles.activityHint}>
              Активность{' '}
              {actKcal === null ? `${actMin} мин` : `~${fmt(actKcal)} ккал · ${actMin} мин`}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.barTrack} accessibilityElementsHidden>
        {energyTarget != null && energyTarget > 0 ? (
          <View style={[styles.barFill, { width: `${Math.round(fill * 100)}%` }]} />
        ) : (
          <View style={styles.barNeutral} />
        )}
      </View>

      <View style={styles.macros}>
        <Macro
          label="Белки"
          short="Б"
          value={fmt(totals.proteinG)}
          target={targets?.proteinG ?? null}
          color={colors.protein}
        />
        <Macro
          label="Жиры"
          short="Ж"
          value={fmt(totals.fatG)}
          target={targets?.fatG ?? null}
          color={colors.fat}
        />
        <Macro
          label="Углеводы"
          short="У"
          value={fmt(totals.carbG)}
          target={targets?.carbG ?? null}
          color={colors.carbs}
        />
      </View>

      {hasUnknown ? (
        <Text style={styles.note}>Часть нутриентов неизвестна — не считаем их нулём</Text>
      ) : null}
    </View>
  );
}

function RingLayout({
  totals,
  targets,
  activityKcal = null,
  activityMinutes = 0,
  onSetTarget,
}: Omit<Props, 'variant'>) {
  const foodKcal = totals.energyKcal;
  const hasUnknown = totals.hasUnknownFields;
  const energyTarget = targets?.energyKcal ?? null;
  const actMin = activityMinutes ?? 0;
  const actKcal = activityKcal ?? null;

  const foodFill = energyProgressRatio(foodKcal, energyTarget);

  const remaining =
    foodKcal !== null && energyTarget !== null ? Math.round(energyTarget - foodKcal) : null;

  const progressOffset = C * (1 - foodFill);

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={`Еда ${fmt(foodKcal)} килокалорий${energyTarget != null ? ` из цели ${fmt(energyTarget)}` : ''}. Активность ${fmt(actKcal)} килокалорий за ${actMin} минут. Белки ${fmt(totals.proteinG)} г. Жиры ${fmt(totals.fatG)} г. Углеводы ${fmt(totals.carbG)} г.${hasUnknown ? ' Часть значений неизвестна.' : ''}`}
    >
      <View style={styles.ringRow}>
        <View style={styles.ringOuter}>
          <Svg width={SIZE} height={SIZE}>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={colors.ringTrack}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={colors.ringFill}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${C} ${C}`}
              strokeDashoffset={progressOffset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          </Svg>
          <View style={styles.ringHole} pointerEvents="none">
            <Text style={styles.kcalValue}>{fmt(foodKcal)}</Text>
            <Text style={styles.kcalUnit}>
              {energyTarget != null ? `из ${fmt(energyTarget)} ккал` : 'ккал еды'}
            </Text>
            {totals.entryCount > 0 ? (
              <Text style={styles.entryHint}>
                {totals.entryCount}{' '}
                {totals.entryCount === 1 ? 'запись' : totals.entryCount < 5 ? 'записи' : 'записей'}
              </Text>
            ) : (
              <Text style={styles.entryHint}>пока пусто</Text>
            )}
          </View>
        </View>

        <View style={styles.metaCol}>
          {energyTarget == null && onSetTarget ? (
            <Pressable
              onPress={onSetTarget}
              style={({ pressed }) => [styles.metaTile, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Настроить ориентир калорий"
            >
              <Text style={styles.metaLabel}>Ориентир</Text>
              <Text style={styles.metaValue}>—</Text>
              <Text style={styles.metaHint}>настроить</Text>
            </Pressable>
          ) : (
            <MetaTile
              label="До ориентира"
              value={
                remaining === null
                  ? '—'
                  : remaining > 0
                    ? `${remaining}`
                    : remaining < 0
                      ? `+${Math.abs(remaining)}`
                      : '0'
              }
              hint={
                remaining === null
                  ? 'цель в Профиле'
                  : remaining > 0
                    ? 'ккал осталось'
                    : remaining < 0
                      ? 'ккал сверх'
                      : 'ровно по цели'
              }
            />
          )}
          {actMin > 0 ? (
            <MetaTile
              label="Активность"
              value={actKcal === null ? `${actMin}` : `~${fmt(actKcal)}`}
              hint={actKcal === null ? `${actMin} мин` : `${actMin} мин · MET`}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.macros}>
        <Macro
          label="Белки"
          short="Б"
          value={fmt(totals.proteinG)}
          target={targets?.proteinG ?? null}
          color={colors.protein}
        />
        <Macro
          label="Жиры"
          short="Ж"
          value={fmt(totals.fatG)}
          target={targets?.fatG ?? null}
          color={colors.fat}
        />
        <Macro
          label="Углеводы"
          short="У"
          value={fmt(totals.carbG)}
          target={targets?.carbG ?? null}
          color={colors.carbs}
        />
      </View>

      {hasUnknown ? (
        <Text style={styles.note}>Часть нутриентов неизвестна — не считаем их нулём</Text>
      ) : null}
      {actKcal !== null ? (
        <Text style={styles.note}>Активность не вычитается из еды автоматически</Text>
      ) : null}
    </View>
  );
}

function MetaTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={styles.metaTile}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
      <Text style={styles.metaHint}>{hint}</Text>
    </View>
  );
}

function Macro({
  label,
  short,
  value,
  target,
  color,
}: {
  label: string;
  short: string;
  value: string;
  target: number | null;
  color: string;
}) {
  const ratio =
    target != null && target > 0 && value !== '—'
      ? energyProgressRatio(Number(value), target)
      : null;
  const display = target != null ? `${value}/${Math.round(target)}` : value;

  return (
    <View style={styles.macro} accessibilityLabel={`${label} ${display} грамм`}>
      <View style={styles.macroTop}>
        <View style={[styles.macroDot, { backgroundColor: color }]} />
        <Text style={styles.macroShort}>{short}</Text>
      </View>
      <Text style={styles.macroValue} numberOfLines={1}>
        {display}
      </Text>
      <Text style={styles.macroUnit}>г</Text>
      <View style={styles.macroBarTrack}>
        <View
          style={[
            styles.macroBarFill,
            {
              backgroundColor: color,
              width: `${Math.round((ratio ?? 0) * 100)}%`,
              opacity: ratio === null ? 0.15 : 1,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.md,
  },
  compactHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    marginBottom: space.sm,
  },
  compactKcalCol: { flexShrink: 0, minWidth: 96 },
  compactKcal: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  compactUnit: {
    fontSize: type.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: 2,
  },
  compactMeta: {
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  compactSide: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 4,
  },
  sideLabel: {
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sideValue: {
    fontSize: type.title,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
    letterSpacing: -0.4,
  },
  sideHint: {
    fontSize: type.micro,
    color: colors.textSecondary,
    marginTop: 2,
  },
  targetCta: {
    alignSelf: 'flex-start',
    minHeight: touchMin - 8,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  targetCtaText: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.text,
  },
  targetHint: {
    fontSize: type.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  activityHint: {
    marginTop: space.sm,
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '600',
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: space.md,
    position: 'relative',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ringFill,
  },
  /** Hairline marker when no energy target — not a progress fill. */
  barNeutral: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 6,
    borderRadius: 1,
    backgroundColor: colors.textMuted,
    opacity: 0.45,
  },
  pressed: { opacity: 0.88 },
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.lg,
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    marginBottom: space.lg,
  },
  ringOuter: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringHole: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  kcalValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  kcalUnit: {
    fontSize: type.caption,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
    textAlign: 'center',
  },
  entryHint: {
    marginTop: 4,
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '600',
  },
  metaCol: {
    flex: 1,
    gap: space.sm,
  },
  metaTile: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  metaLabel: {
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaValue: {
    fontSize: type.title,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
    letterSpacing: -0.4,
  },
  metaHint: {
    fontSize: type.micro,
    color: colors.textSecondary,
    marginTop: 2,
  },
  macros: {
    flexDirection: 'row',
    gap: space.sm,
  },
  macro: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: space.md,
  },
  macroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroShort: {
    fontSize: type.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  macroValue: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
  },
  macroUnit: {
    fontSize: type.micro,
    color: colors.textMuted,
    marginTop: 1,
    fontWeight: '600',
  },
  macroBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: space.sm,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: 4,
    borderRadius: 2,
  },
  note: {
    marginTop: space.md,
    fontSize: type.micro,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});

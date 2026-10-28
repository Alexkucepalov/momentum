import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

import { energyProgressRatio } from '../../../../src/domain/energyProgress';
import { colors, space, type } from '@/src/theme/tokens';
import { AppCard } from './AppCard';

const RING = 96;
const STROKE = 12;
const R = (RING - STROKE) / 2;
const C = 2 * Math.PI * R;

function fmt(n: number | null): string {
  if (n === null) return '—';
  return String(Math.round(n));
}

/** Nutrition ref — large kcal + orange ring with remaining/over. */
export function CalorieHero({
  eaten,
  target,
  onEditTarget,
}: {
  eaten: number | null;
  target: number | null;
  onEditTarget?: () => void;
}) {
  const fill = energyProgressRatio(eaten, target);
  const offset = C * (1 - fill);
  const remaining =
    eaten != null && target != null ? Math.round(target - eaten) : null;

  const ringTop =
    remaining == null ? '—' : remaining >= 0 ? String(remaining) : String(Math.abs(remaining));
  const ringBottom = remaining == null ? '' : remaining >= 0 ? 'ещё' : 'сверх';

  return (
    <AppCard style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.label}>КАЛОРИИ</Text>
          <Text style={styles.value}>{fmt(eaten)}</Text>
          <Pressable
            onPress={onEditTarget}
            disabled={!onEditTarget}
            style={styles.targetRow}
            accessibilityRole={onEditTarget ? 'button' : undefined}
            accessibilityLabel="Ориентир калорий"
          >
            <Text style={styles.targetText}>
              {target != null ? `из ${fmt(target)}` : 'без ориентира'}
            </Text>
            {onEditTarget ? (
              <Ionicons name="pencil" size={14} color={colors.textMuted} />
            ) : null}
          </Pressable>
        </View>
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
              stroke={colors.calorieRing}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${C} ${C}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>
          <View style={styles.ringCenter} pointerEvents="none">
            <Text style={styles.ringTop}>{ringTop}</Text>
            {ringBottom ? <Text style={styles.ringBottom}>{ringBottom}</Text> : null}
          </View>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  left: { flex: 1 },
  label: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  value: {
    fontSize: type.hero,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1.5,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  targetText: { fontSize: type.caption, color: colors.textSecondary, fontWeight: '600' },
  ringWrap: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTop: { fontSize: type.caption, fontWeight: '800', color: colors.text },
  ringBottom: { fontSize: type.micro, fontWeight: '700', color: colors.textMuted, marginTop: 1 },
});

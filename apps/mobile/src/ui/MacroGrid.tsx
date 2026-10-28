import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, space, type } from '@/src/theme/tokens';
import { AppCard } from './AppCard';

type Macro = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: number | null;
  target: number | null;
  color: string;
};

function fmt(n: number | null): string {
  if (n === null) return '—';
  return String(Math.round(n));
}

/** Nutrition ref — three equal macro cards. */
export function MacroGrid({
  proteinG,
  carbG,
  fatG,
  proteinTarget,
  carbTarget,
  fatTarget,
}: {
  proteinG: number | null;
  carbG: number | null;
  fatG: number | null;
  proteinTarget: number | null;
  carbTarget: number | null;
  fatTarget: number | null;
}) {
  const items: Macro[] = [
    {
      key: 'p',
      label: 'БЕЛКИ',
      icon: 'barbell-outline',
      value: proteinG,
      target: proteinTarget,
      color: colors.protein,
    },
    {
      key: 'c',
      label: 'УГЛЕВОДЫ',
      icon: 'leaf-outline',
      value: carbG,
      target: carbTarget,
      color: colors.carbs,
    },
    {
      key: 'f',
      label: 'ЖИРЫ',
      icon: 'water-outline',
      value: fatG,
      target: fatTarget,
      color: colors.fat,
    },
  ];

  return (
    <View style={styles.row}>
      {items.map((m) => {
        const ratio =
          m.value != null && m.target != null && m.target > 0
            ? Math.min(1, m.value / m.target)
            : 0;
        const left =
          m.value != null && m.target != null ? Math.max(0, Math.round(m.target - m.value)) : null;
        return (
          <AppCard key={m.key} style={styles.card} padding="md">
            <View style={styles.head}>
              <Ionicons name={m.icon} size={14} color={m.color} />
              <Text style={styles.label}>{m.label}</Text>
            </View>
            <Text style={styles.value}>
              {fmt(m.value)}
              <Text style={styles.target}>
                {m.target != null ? `/${fmt(m.target)}г` : 'г'}
              </Text>
            </Text>
            <View style={styles.track}>
              <View
                style={[styles.fill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: m.color }]}
              />
            </View>
            <Text style={styles.left}>
              {left == null ? '—' : left === 0 ? 'по цели' : `${left}г ещё`}
            </Text>
          </AppCard>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  card: { flex: 1, minHeight: 108 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  label: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  value: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  target: { fontSize: type.caption, fontWeight: '600', color: colors.textMuted },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accentSoft,
    overflow: 'hidden',
    marginTop: space.sm,
  },
  fill: { height: 4, borderRadius: 2 },
  left: { marginTop: 6, fontSize: type.micro, color: colors.textMuted, fontWeight: '600' },
});

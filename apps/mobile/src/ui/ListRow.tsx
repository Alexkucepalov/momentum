import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, space, touchMin, type } from '@/src/theme/tokens';
import { MetaPill } from './MetaPill';

/** Nutrition-ref food/plan row: square icon · title · pills · trailing. */
export function ListRow({
  title,
  pills,
  trailing,
  meta,
  icon,
  iconName = 'restaurant-outline',
  onPress,
  onDelete,
  accessibilityLabel,
}: {
  title: string;
  pills?: string[];
  trailing?: string;
  meta?: string;
  icon?: ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  onDelete?: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}
      accessibilityRole={onPress ? 'button' : 'summary'}
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <View style={styles.icon}>
        {icon ?? <Ionicons name={iconName} size={18} color={colors.text} />}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {pills && pills.length > 0 ? (
          <View style={styles.pills}>
            {pills.map((p) => (
              <MetaPill key={p} label={p} />
            ))}
          </View>
        ) : null}
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
      {onDelete ? (
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={styles.delete}
          accessibilityRole="button"
          accessibilityLabel={`Удалить ${title}`}
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touchMin + 8,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pressed: { opacity: 0.88 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: type.body, fontWeight: '700', color: colors.text },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  meta: { fontSize: type.micro, color: colors.textMuted },
  trailing: { fontSize: type.body, fontWeight: '800', color: colors.text },
  delete: {
    minWidth: 36,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

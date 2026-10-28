import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, space, touchMin, type } from '@/src/theme/tokens';

/** Canonical list row: circular glyph · title · caption · trailing kcal. */
export function ListRow({
  title,
  pills,
  trailing,
  meta,
  icon,
  iconName = 'restaurant-outline',
  divided = true,
  chevron = false,
  onPress,
  onDelete,
  accessibilityLabel,
}: {
  title: string;
  /** Short facts rendered as one caption line (Б · У · Ж), not chips. */
  pills?: string[];
  trailing?: string;
  meta?: string;
  icon?: ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  /** Hairline above the row. Off for the first row in a grouped card. */
  divided?: boolean;
  chevron?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        !divided && styles.rowFirst,
        pressed && onPress && styles.pressed,
      ]}
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
          <Text style={styles.caption} numberOfLines={1}>
            {pills.join('  ')}
          </Text>
        ) : null}
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
      {chevron ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
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
  rowFirst: { borderTopWidth: 0 },
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
  caption: { fontSize: type.micro, fontWeight: '600', color: colors.textSecondary },
  meta: { fontSize: type.caption, color: colors.textMuted },
  trailing: {
    fontSize: type.body,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  delete: {
    minWidth: 36,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, space, touchMin, type } from '../../../theme/tokens';

export function FoodPickRow({
  title,
  meta,
  icon,
  onPress,
  onQuickAdd,
  accessibilityLabel,
}: {
  title: string;
  meta: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  /** One-tap add with remembered grams — muscle memory. */
  onQuickAdd?: () => void;
  accessibilityLabel: string;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.main}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <View style={styles.icon}>
          <Ionicons name={icon} size={18} color={colors.text} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
        <Text style={styles.chev}>порция</Text>
      </Pressable>
      {onQuickAdd ? (
        <Pressable
          style={styles.quick}
          onPress={onQuickAdd}
          accessibilityRole="button"
          accessibilityLabel={`Быстро добавить ${title}`}
        >
          <Ionicons name="add" size={22} color={colors.primaryButtonText} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: space.sm,
    marginBottom: space.sm,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    minHeight: touchMin + 8,
    gap: space.sm,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { fontSize: type.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
  chev: { fontSize: type.micro, fontWeight: '700', color: colors.textMuted },
  quick: {
    width: touchMin,
    borderRadius: radius.md,
    backgroundColor: colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

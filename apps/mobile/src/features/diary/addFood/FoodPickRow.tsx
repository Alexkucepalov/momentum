import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, space, touchMin, type } from '../../../theme/tokens';

export type FoodPickTone = 'recent' | 'favorite' | 'product' | 'recipe';

const TONE_STYLE: Record<
  FoodPickTone,
  { bg: string; fg: string }
> = {
  recent: { bg: colors.toneRecentBg, fg: colors.carbs },
  favorite: { bg: colors.toneFavoriteBg, fg: colors.toneFavoriteFg },
  product: { bg: colors.toneProductBg, fg: colors.protein },
  recipe: { bg: colors.toneRecipeBg, fg: colors.fat },
};

export function FoodPickRow({
  title,
  meta,
  icon,
  tone = 'product',
  onPress,
  onQuickAdd,
  accessibilityLabel,
}: {
  title: string;
  meta: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: FoodPickTone;
  onPress: () => void;
  /** One-tap add with remembered grams — muscle memory. */
  onQuickAdd?: () => void;
  accessibilityLabel: string;
}) {
  const tint = TONE_STYLE[tone];

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.main}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <View style={[styles.icon, { backgroundColor: tint.bg }]}>
          <Ionicons name={icon} size={18} color={tint.fg} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
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
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    minHeight: touchMin + 8,
    gap: space.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { fontSize: type.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
  quick: {
    width: touchMin,
    borderRadius: radius.md,
    backgroundColor: colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

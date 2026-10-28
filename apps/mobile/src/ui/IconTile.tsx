import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { AppCard } from './AppCard';

/** Soft masonry / habit tile (ref 09) — icon + short label. */
export function IconTile({
  icon,
  label,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <AppCard
      padding="md"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? label}
      style={styles.card}
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={22} color={colors.text} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </AppCard>
  );
}

/** Circular glyph for soft list rows (ref 09 middle). */
export function SoftGlyph({
  icon,
  size = 40,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.glyph,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.45)} color={colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    minWidth: '42%',
    minHeight: touchMin + 36,
    gap: space.sm,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.text,
  },
  glyph: {
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

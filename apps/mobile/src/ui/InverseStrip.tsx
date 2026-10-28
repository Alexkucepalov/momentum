import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, space, type } from '@/src/theme/tokens';
import { AppCard } from './AppCard';

/** Dark full-width CTA strip (ref 08 premium card → product job, not paywall). */
export function InverseStrip({
  title,
  subtitle,
  onPress,
  accessibilityLabel,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <AppCard
      variant="dark"
      padding="lg"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? `${title}. ${subtitle}`}
      style={styles.card}
    >
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.chevron} accessibilityElementsHidden>
          <Ionicons name="arrow-forward" size={18} color={colors.text} />
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: space.md,
    backgroundColor: colors.darkBg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  copy: { flex: 1, gap: 2 },
  title: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.darkText,
  },
  subtitle: {
    fontSize: type.caption,
    fontWeight: '600',
    color: colors.darkTextSecondary,
  },
  chevron: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

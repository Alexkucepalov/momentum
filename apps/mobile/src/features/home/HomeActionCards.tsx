import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { AppCard } from '@/src/ui/AppCard';
import { BentoRow } from '@/src/ui/BentoRow';

/** Soft action bento — Activity / Food with black pills (refs 01 + 08). */
export function HomeActionCards({
  onStartWorkout,
  onLogMeal,
}: {
  onStartWorkout: () => void;
  onLogMeal: () => void;
}) {
  return (
    <BentoRow>
      <ActionCard
        title="Активность"
        subtitle="Тренировки и минуты"
        cta="Начать"
        onPress={onStartWorkout}
      />
      <ActionCard
        title="Еда"
        subtitle="Записать питание"
        cta="Записать"
        onPress={onLogMeal}
      />
    </BentoRow>
  );
}

function ActionCard({
  title,
  subtitle,
  cta,
  onPress,
}: {
  title: string;
  subtitle: string;
  cta: string;
  onPress: () => void;
}) {
  return (
    <AppCard style={styles.card} accessibilityRole="none">
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.chevron} accessibilityElementsHidden>
          <Ionicons name="arrow-forward" size={16} color={colors.text} />
        </View>
      </View>
      <Text style={styles.sub}>{subtitle}</Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={cta}
      >
        <Text style={styles.ctaText}>{cta}</Text>
      </Pressable>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 148,
    gap: space.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sub: {
    fontSize: type.caption,
    color: colors.textSecondary,
    marginBottom: space.sm,
  },
  cta: {
    marginTop: 'auto',
    minHeight: touchMin - 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: type.body,
    fontWeight: '800',
    color: colors.primaryButtonText,
  },
  pressed: { opacity: 0.88 },
});

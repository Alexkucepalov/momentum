import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import type { PlannedActivity, WorkoutSession } from '../../../../../src/domain/strength/types';
import { AppText, colors, radius, space } from '@/src/design-system';
import { strengthSessionHref } from './StrengthEntryCard';

export function TodayTrainingCard({ inProgress, todayPlan, onStart }: {
  inProgress: WorkoutSession[]; todayPlan: PlannedActivity[]; onStart: (activity: PlannedActivity) => void;
}) {
  const router = useRouter();
  const draft = inProgress[0];
  const strength = todayPlan.find(a => a.kind === 'strength');
  const cardio = todayPlan.find(a => a.kind === 'cardio');
  const rest = todayPlan.length > 0 && todayPlan.every(a => a.kind === 'rest');
  const plan = strength ?? cardio;
  const title = draft?.title ?? plan?.title ?? (rest ? 'Восстановление' : 'Твой недельный цикл');
  const subtitle = draft ? 'Продолжить с последнего подхода' : plan ? [plan.timeLocal, plan.subtitle, plan.cardioMinutes != null ? `${plan.cardioMinutes} мин` : null].filter(Boolean).join(' · ') : rest ? 'День без запланированной нагрузки' : 'Силовые, вело и дни отдыха';
  const action = () => draft ? router.push(strengthSessionHref(draft.id)) : strength ? onStart(strength) : router.push('/(tabs)/activity' as Href);
  return (
    <View style={styles.section} testID="today-training-card">
      <View style={styles.head}><AppText variant="subtitle">Твой план</AppText><Pressable onPress={() => router.push('/activity')} accessibilityRole="button" accessibilityLabel="Открыть план недели" style={styles.weekLink}><AppText variant="caption" tone="secondary">Неделя</AppText><Ionicons name="arrow-forward" size={14} color={colors.textSecondary} /></Pressable></View>
      <Pressable onPress={action} style={({ pressed }) => [styles.hero, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={draft ? `Продолжить ${title}` : strength ? `Начать ${title}` : 'Открыть недельный цикл'} testID={draft ? 'today-continue-session' : strength ? 'today-start-strength' : 'today-open-cycle'}>
        <View style={styles.copy}><AppText variant="label" tone="secondary" style={styles.eyebrow}>{draft ? 'В процессе' : plan ? 'Сегодня в плане' : 'Движение'}</AppText><AppText style={styles.title}>{title}</AppText>{subtitle ? <AppText variant="caption" tone="secondary" numberOfLines={2}>{subtitle}</AppText> : null}</View>
        <View style={styles.arrow}><Ionicons name={draft ? 'play' : 'arrow-up'} size={20} color={colors.onPrimary} style={!draft ? { transform: [{ rotate: '45deg' }] } : undefined} /></View>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: space.sm, marginTop: space.md }, head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, weekLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, paddingLeft: space.md },
  hero: { flexDirection: 'row', alignItems: 'center', gap: space.lg, borderRadius: radius.card, backgroundColor: colors.trainingStrength, padding: space.screen, minHeight: 118 },
  copy: { flex: 1, gap: space.sm, minWidth: 0 }, eyebrow: { textTransform: 'uppercase', letterSpacing: 1 }, title: { fontSize: 23, lineHeight: 30, letterSpacing: -0.7, fontWeight: '500' },
  arrow: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.8 },
});

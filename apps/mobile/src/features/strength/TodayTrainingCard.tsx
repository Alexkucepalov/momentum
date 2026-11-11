import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';

import type { PlannedActivity, WorkoutSession } from '../../../../../src/domain/strength/types';
import { AppButton, AppCard, AppText, colors, space } from '@/src/design-system';
import { strengthHubHref, strengthSessionHref } from './StrengthEntryCard';

/**
 * Compact Today CTA: continue draft or start today's planned strength.
 * Keeps food-first Today layout — one card, one job.
 */
export function TodayTrainingCard({
  inProgress,
  todayPlan,
  onStart,
}: {
  inProgress: WorkoutSession[];
  todayPlan: PlannedActivity[];
  onStart: (activity: PlannedActivity) => void;
}) {
  const router = useRouter();
  const draft = inProgress[0] ?? null;
  const strength = todayPlan.find((a) => a.kind === 'strength') ?? null;
  const cardio = todayPlan.find((a) => a.kind === 'cardio') ?? null;
  const restOnly =
    !draft &&
    !strength &&
    todayPlan.length > 0 &&
    todayPlan.every((a) => a.kind === 'rest');

  if (!draft && !strength && !cardio && !restOnly) {
    return (
      <AppCard style={styles.card} testID="today-training-card" accessibilityLabel="Тренировка сегодня">
        <AppText variant="label" tone="muted">
          Тренировка
        </AppText>
        <AppText variant="body">Сегодня в плане пусто</AppText>
        <AppText variant="caption" tone="muted">
          Открой Движение → Программа, или выбери шаблон
        </AppText>
        <AppButton
          label="К плану в Движении"
          variant="secondary"
          onPress={() => router.push('/(tabs)/activity' as Href)}
        />
      </AppCard>
    );
  }

  if (draft) {
    return (
      <AppCard style={styles.card} testID="today-training-card" accessibilityLabel="Продолжить тренировку">
        <AppText variant="label" tone="muted">
          Черновик в зале
        </AppText>
        <AppText variant="subtitle">{draft.title}</AppText>
        <AppButton
          label="Продолжить"
          onPress={() => router.push(strengthSessionHref(draft.id))}
          testID="today-continue-session"
        />
      </AppCard>
    );
  }

  if (restOnly) {
    return (
      <AppCard style={styles.card} testID="today-training-card" accessibilityLabel="День отдыха">
        <AppText variant="label" tone="muted">
          Сегодня
        </AppText>
        <AppText variant="subtitle">Отдых</AppText>
        <AppText variant="caption" tone="muted">
          Восстановление — тоже прогресс. По желанию спокойная прогулка.
        </AppText>
      </AppCard>
    );
  }

  if (strength) {
    return (
      <AppCard style={styles.card} testID="today-training-card" accessibilityLabel={`Сегодня ${strength.title}`}>
        <View style={styles.head}>
          <AppText variant="label" tone="muted">
            Сегодня · сила
          </AppText>
          <Pressable onPress={() => router.push(strengthHubHref())} hitSlop={8}>
            <AppText variant="caption" tone="secondary">
              Шаблоны
            </AppText>
          </Pressable>
        </View>
        <AppText variant="subtitle">{strength.title}</AppText>
        {strength.subtitle || strength.timeLocal ? (
          <AppText variant="caption" tone="muted">
            {[strength.timeLocal, strength.subtitle].filter(Boolean).join(' · ')}
          </AppText>
        ) : null}
        <AppButton
          label="Начать тренировку"
          onPress={() => onStart(strength)}
          testID="today-start-strength"
        />
      </AppCard>
    );
  }

  return (
    <AppCard style={styles.card} testID="today-training-card" accessibilityLabel="Кардио сегодня">
      <AppText variant="label" tone="muted">
        Сегодня · кардио
      </AppText>
      <AppText variant="subtitle">{cardio?.title ?? 'Велостанок'}</AppText>
      <AppText variant="caption" tone="muted">
        {cardio?.subtitle ?? 'Зона 2 · запиши длительность в Движении'}
      </AppText>
      <Pressable
        onPress={() => router.push('/(tabs)/activity' as Href)}
        style={styles.linkRow}
        accessibilityRole="button"
        accessibilityLabel="Открыть Движение"
      >
        <AppText variant="body">Открыть Движение</AppText>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.xs,
  },
});

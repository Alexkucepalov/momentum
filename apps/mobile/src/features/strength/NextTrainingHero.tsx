import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PlannedActivity } from '../../../../../src/domain/strength/types';
import type { NextTrainingTarget } from '../../../../../src/domain/strength/nextTraining';
import { AppButton, AppText, colors, radius, space, touchMin } from '@/src/design-system';

export type { NextTrainingTarget };
export { resolveNextTrainingTarget } from '../../../../../src/domain/strength/nextTraining';

/**
 * Single primary CTA for Movement — next / today session.
 * Keeps one job: start or continue. Templates live elsewhere.
 */
export function NextTrainingHero({
  target,
  weekdayLabel,
  onStart,
  onContinue,
  onOpenTemplates,
  onOpenPlan,
}: {
  target: NextTrainingTarget;
  weekdayLabel?: string;
  onStart: (activity: PlannedActivity) => void;
  onContinue: (sessionId: string) => void;
  onOpenTemplates: () => void;
  onOpenPlan: () => void;
}) {
  if (target.kind === 'draft') {
    return (
      <View style={styles.card} testID="next-training-hero">
        <AppText variant="label" tone="muted" style={styles.eyebrow}>
          Черновик в зале
        </AppText>
        <AppText variant="title" style={styles.title}>
          {target.session.title}
        </AppText>
        <AppText variant="caption" tone="muted">
          Можно продолжить после свернуть / kill
        </AppText>
        <AppButton
          label="Продолжить"
          onPress={() => onContinue(target.session.id)}
          testID="hero-continue"
        />
      </View>
    );
  }

  if (target.kind === 'planned') {
    const a = target.activity;
    const kindRu =
      a.kind === 'strength' ? 'Сила' : a.kind === 'cardio' ? 'Кардио' : 'Отдых';
    const when = target.isToday ? 'Сегодня' : weekdayLabel ?? 'В плане';
    const canStart = a.kind === 'strength';

    return (
      <View style={styles.card} testID="next-training-hero">
        <View style={styles.topRow}>
          <AppText variant="label" tone="muted" style={styles.eyebrow}>
            {when} · {kindRu}
          </AppText>
          <Pressable
            onPress={onOpenTemplates}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Шаблоны"
          >
            <AppText variant="caption" tone="secondary">
              Шаблоны
            </AppText>
          </Pressable>
        </View>
        <AppText variant="title" style={styles.title}>
          {a.title}
        </AppText>
        {a.subtitle || a.timeLocal ? (
          <AppText variant="caption" tone="muted">
            {[a.timeLocal, a.subtitle].filter(Boolean).join(' · ')}
          </AppText>
        ) : null}
        {canStart ? (
          <AppButton label="Начать" onPress={() => onStart(a)} testID="hero-start" />
        ) : a.kind === 'cardio' ? (
          <AppButton
            label="Открыть план"
            variant="secondary"
            onPress={onOpenPlan}
            testID="hero-open-plan"
          />
        ) : (
          <AppText variant="caption" tone="muted" style={styles.restNote}>
            Восстановление — тоже часть программы
          </AppText>
        )}
      </View>
    );
  }

  return (
    <View style={styles.card} testID="next-training-hero">
      <AppText variant="label" tone="muted" style={styles.eyebrow}>
        План недели
      </AppText>
      <AppText variant="title" style={styles.title}>
        Пока пусто
      </AppText>
      <AppText variant="caption" tone="muted">
        Заполни программу или добавь тренировку на день
      </AppText>
      <View style={styles.emptyActions}>
        <AppButton label="К плану ниже" variant="secondary" onPress={onOpenPlan} />
        <Pressable
          onPress={onOpenTemplates}
          style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Шаблоны"
        >
          <Ionicons name="barbell-outline" size={18} color={colors.ink} />
          <AppText variant="caption">Шаблоны</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  title: { fontWeight: '800' },
  restNote: { marginTop: space.xs },
  emptyActions: { gap: space.sm, marginTop: space.xs },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    minHeight: touchMin - 8,
    alignSelf: 'flex-start',
  },
  pressed: { opacity: 0.85 },
});

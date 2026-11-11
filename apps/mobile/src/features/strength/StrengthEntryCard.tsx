import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';

import type { WorkoutSession, WorkoutTemplate } from '../../../../../src/domain/strength/types';
import { AppButton, AppCard, AppText, colors, space } from '@/src/design-system';

export function StrengthEntryCard({
  templates,
  inProgress,
  onOpenHub,
  onContinue,
  onStartTemplate,
}: {
  templates: WorkoutTemplate[];
  inProgress: WorkoutSession[];
  onOpenHub: () => void;
  onContinue: (sessionId: string) => void;
  onStartTemplate: (templateId: string) => void;
}) {
  const active = inProgress[0] ?? null;
  const preview = templates.slice(0, 3);

  return (
    <AppCard accessibilityLabel="Силовые тренировки" testID="strength-entry-card">
      <View style={styles.head}>
        <AppText variant="label" tone="muted">
          Силовые
        </AppText>
        <Pressable
          onPress={onOpenHub}
          accessibilityRole="button"
          accessibilityLabel="Все шаблоны силовых"
          hitSlop={8}
        >
          <AppText variant="caption" tone="secondary">
            Все шаблоны
          </AppText>
        </Pressable>
      </View>

      {active ? (
        <View style={styles.activeBlock}>
          <AppText variant="subtitle">{active.title}</AppText>
          <AppText variant="caption" tone="muted">
            Черновик сохранится, если свернуть приложение
          </AppText>
          <AppButton
            label="Продолжить"
            onPress={() => onContinue(active.id)}
            testID="strength-continue"
          />
        </View>
      ) : (
        <View style={styles.list}>
          {preview.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => onStartTemplate(t.id)}
              style={({ pressed }) => [styles.tmplRow, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Начать ${t.name}`}
              testID={`strength-start-${t.id}`}
            >
              <View style={styles.tmplText}>
                <AppText variant="body">{t.name}</AppText>
                {t.subtitle ? (
                  <AppText variant="caption" tone="muted">
                    {t.subtitle}
                  </AppText>
                ) : null}
              </View>
              <Ionicons name="play-circle-outline" size={24} color={colors.ink} />
            </Pressable>
          ))}
          {preview.length === 0 ? (
            <AppButton label="Открыть силовые" onPress={onOpenHub} variant="secondary" />
          ) : null}
        </View>
      )}
    </AppCard>
  );
}

/** Href helpers keep route strings typed at call sites. */
export function strengthHubHref(): Href {
  return '/strength' as Href;
}

export function strengthSessionHref(sessionId: string): Href {
  return `/strength/session/${sessionId}` as Href;
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  activeBlock: {
    gap: space.sm,
  },
  list: {
    gap: space.xs,
  },
  tmplRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
    gap: space.md,
  },
  tmplText: {
    flex: 1,
    gap: 2,
  },
  pressed: { opacity: 0.85 },
});

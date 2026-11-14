import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { HABIT_WEEKDAY_LABELS_RU } from '../../../../../src/domain/habitWeek';
import type { Workout } from '../../../../../src/storage/types';
import { AppCard, AppText, colors, radius, space } from '@/src/design-system';

function sumCalories(workouts: Workout[]): number | null {
  let sum = 0;
  let any = false;
  for (const w of workouts) {
    if (w.calories != null) {
      sum += w.calories;
      any = true;
    }
  }
  return any ? Math.round(sum) : null;
}

export type WeekActivityDay = {
  dateLocal: string;
  minutes: number;
  isToday: boolean;
  selected: boolean;
};

export function TodayActivityCard({
  steps,
  workouts,
  weekDays,
  onSelectDay,
}: {
  steps: number | null;
  workouts: Workout[];
  weekDays?: WeekActivityDay[];
  onSelectDay?: (dateLocal: string) => void;
}) {
  const router = useRouter();
  const kcal = sumCalories(workouts);
  const mins = Math.round(workouts.reduce((s, w) => s + w.durationSec, 0) / 60);
  const weekMax = Math.max(1, ...(weekDays ?? []).map((d) => d.minutes));

  return (
    <AppCard accessibilityLabel="Активность сегодня">
      <View style={styles.head}>
        <AppText variant="label" tone="secondary">
          АКТИВНОСТЬ
        </AppText>
        <Pressable
          onPress={() => router.push('/(tabs)/activity' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Открыть активность"
          hitSlop={8}
        >
          <AppText variant="caption" tone="secondary" style={styles.link}>
            Подробнее →
          </AppText>
        </Pressable>
      </View>

      <View style={styles.metrics}>
        <Metric label="Шаги" value={steps == null ? '—' : steps.toLocaleString('ru-RU')} />
        <Metric label="Тренировки" value={String(workouts.length)} />
        <Metric label="Минуты" value={mins > 0 ? String(mins) : '—'} />
        <Metric label="Ккал" value={kcal == null ? '—' : String(kcal)} />
      </View>

      {weekDays && weekDays.length > 0 ? (
        <View style={styles.week} accessibilityLabel="Минуты за неделю">
          <AppText variant="caption" tone="muted" style={styles.weekLabel}>
            Неделя · минуты тренировок
          </AppText>
          <View style={styles.bars}>
            {weekDays.map((d, i) => {
              const h = d.minutes > 0 ? Math.max(6, Math.round((d.minutes / weekMax) * 36)) : 3;
              const label = HABIT_WEEKDAY_LABELS_RU[i] ?? d.dateLocal.slice(8);
              return (
                <Pressable
                  key={d.dateLocal}
                  onPress={() => onSelectDay?.(d.dateLocal)}
                  style={styles.barCol}
                  accessibilityRole="button"
                  accessibilityLabel={`${label}, ${d.minutes} минут`}
                >
                  <View
                    style={[
                      styles.bar,
                      { height: h },
                      d.selected && styles.barSelected,
                      d.minutes === 0 && styles.barEmpty,
                    ]}
                  />
                  <AppText
                    variant="caption"
                    tone={d.selected || d.isToday ? 'ink' : 'muted'}
                    style={styles.barCap}
                  >
                    {label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {workouts.length === 0 ? (
        <AppText variant="caption" tone="muted" style={styles.empty}>
          Нет тренировок за день. После Garmin они появятся здесь.
        </AppText>
      ) : (
        workouts.slice(0, 3).map((w) => (
          <Pressable
            key={w.id}
            onPress={
              w.source === 'garmin'
                ? () => router.push(`/garmin/workout/${w.id}` as Href)
                : () => router.push('/(tabs)/activity' as Href)
            }
            accessibilityRole="button"
            accessibilityLabel={w.notes?.trim() || w.type}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <View style={styles.itemMain}>
              <AppText variant="body" numberOfLines={1} style={styles.itemTitle}>
                {w.notes?.trim() || w.type}
              </AppText>
              <AppText variant="caption" tone="secondary">
                {Math.round(w.durationSec / 60)} мин
                {w.calories != null ? ` · ${Math.round(w.calories)} ккал` : ''}
                {w.source === 'garmin' ? ' · Garmin' : ''}
              </AppText>
            </View>
            <AppText variant="caption" tone="muted">
              →
            </AppText>
          </Pressable>
        ))
      )}
    </AppCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText variant="subtitle" style={styles.metricValue}>
        {value}
      </AppText>
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: { fontWeight: '700' },
  metrics: {
    flexDirection: 'row',
    marginTop: space.md,
    marginBottom: space.sm,
  },
  metric: { flex: 1, gap: 2 },
  metricValue: { fontWeight: '800' },
  week: { marginTop: space.sm, marginBottom: space.sm },
  weekLabel: { marginBottom: space.sm },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
    minHeight: 48,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  bar: {
    width: '70%',
    maxWidth: 18,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
  },
  barSelected: { backgroundColor: colors.accent, opacity: 1 },
  barEmpty: { backgroundColor: colors.border, height: 3 },
  barCap: { fontSize: 10, fontWeight: '700' },
  empty: { marginTop: space.sm, lineHeight: 18 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: space.sm,
  },
  itemMain: { flex: 1, gap: 2 },
  itemTitle: { fontWeight: '600' },
  pressed: { opacity: 0.75 },
});

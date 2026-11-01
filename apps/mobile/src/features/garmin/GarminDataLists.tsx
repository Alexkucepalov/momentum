import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import type { DailyActivityStats, WeightEntry, Workout, WorkoutType } from '../../../../../src/storage/types';
import { AppCard, AppText, colors, space } from '@/src/design-system';

const TYPE_RU: Record<WorkoutType, string> = {
  walking: 'Ходьба / бег',
  cycling: 'Вело',
  strength: 'Сила',
  football: 'Футбол',
  other: 'Другое',
};

function formatInstant(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatKg(kg: number): string {
  return `${kg.toFixed(kg >= 100 ? 1 : 2)} кг`;
}

function formatDistance(m: number | null): string | null {
  if (m == null) return null;
  if (m >= 1000) return `${(m / 1000).toFixed(2)} км`;
  return `${Math.round(m)} м`;
}

export function GarminSummaryCard({
  weights,
  workouts,
  days,
  lastSuccessfulSyncAt,
}: {
  weights: number;
  workouts: number;
  days: number;
  lastSuccessfulSyncAt: string | null;
}) {
  return (
    <AppCard accessibilityLabel="Сводка данных Garmin">
      <AppText variant="label" tone="secondary">
        ИМПОРТИРОВАНО
      </AppText>
      <View style={styles.summaryRow}>
        <SummaryStat label="Вес" value={String(weights)} />
        <SummaryStat label="Тренировки" value={String(workouts)} />
        <SummaryStat label="Дни шагов" value={String(days)} />
      </View>
      <AppText variant="caption" tone="muted">
        {lastSuccessfulSyncAt
          ? `Синхронизация: ${formatInstant(lastSuccessfulSyncAt)}`
          : 'Успешной синхронизации ещё не было'}
      </AppText>
    </AppCard>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="title">{value}</AppText>
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
    </View>
  );
}

export function GarminWeightSection({ items }: { items: WeightEntry[] }) {
  return (
    <AppCard>
      <AppText variant="subtitle">Вес ({items.length})</AppText>
      {items.length === 0 ? (
        <AppText variant="caption" tone="muted">
          Нет измерений в Garmin Connect. Xiaomi и другие весы сюда не попадают — только то, что
          видно в Connect → Weight.
        </AppText>
      ) : (
        items.map((w) => (
          <View key={w.id} style={styles.row}>
            <View style={styles.rowMain}>
              <AppText variant="body">{formatKg(w.kg)}</AppText>
              <AppText variant="caption" tone="secondary">
                {formatInstant(w.weighedAt)}
              </AppText>
            </View>
            <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.id}>
              {w.externalId ?? '—'}
            </AppText>
          </View>
        ))
      )}
    </AppCard>
  );
}

export function GarminWorkoutSection({ items }: { items: Workout[] }) {
  const router = useRouter();
  return (
    <AppCard>
      <AppText variant="subtitle">Тренировки ({items.length})</AppText>
      {items.length === 0 ? (
        <AppText variant="caption" tone="muted">
          Нет activity из Garmin. Сделай «Полную выгрузку» после синхронизации часов с Connect.
        </AppText>
      ) : (
        items.map((w) => {
          const mins = Math.round(w.durationSec / 60);
          const dist = formatDistance(w.distanceM);
          const parts = [TYPE_RU[w.type], `${mins} мин`, dist];
          if (w.calories != null) parts.push(`${Math.round(w.calories)} ккал`);
          if (w.avgHeartRate != null) parts.push(`пульс ${Math.round(w.avgHeartRate)}`);
          if (w.avgPowerW != null) parts.push(`${Math.round(w.avgPowerW)} Вт`);
          const meta = parts.filter(Boolean).join(' · ');
          return (
            <Pressable
              key={w.id}
              onPress={() => router.push(`/garmin/workout/${w.id}` as Href)}
              accessibilityRole="button"
              accessibilityLabel={`Открыть ${w.notes?.trim() || TYPE_RU[w.type]}`}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.rowMain}>
                <AppText variant="body">{w.notes?.trim() || TYPE_RU[w.type]}</AppText>
                <AppText variant="caption" tone="secondary">
                  {w.dateLocal} · {meta}
                </AppText>
              </View>
              <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.id}>
                детали →
              </AppText>
            </Pressable>
          );
        })
      )}
    </AppCard>
  );
}

export function GarminStepsSection({ items }: { items: DailyActivityStats[] }) {
  return (
    <AppCard>
      <AppText variant="subtitle">Шаги по дням ({items.length})</AppText>
      {items.length === 0 ? (
        <AppText variant="caption" tone="muted">
          Нет дневной статистики шагов. Нажми «Полную выгрузку» — шаги грузятся кусками по 28 дней.
        </AppText>
      ) : (
        items.map((d) => {
          const parts: string[] = [];
          if (d.steps != null) parts.push(`${d.steps.toLocaleString('ru-RU')} шаг`);
          const dist = formatDistance(d.distanceM);
          if (dist) parts.push(dist);
          if (d.activeKcal != null) parts.push(`${Math.round(d.activeKcal)} ккал акт.`);
          return (
            <View key={d.id} style={styles.row}>
              <View style={styles.rowMain}>
                <AppText variant="body">{d.dateLocal}</AppText>
                <AppText variant="caption" tone="secondary">
                  {parts.length > 0 ? parts.join(' · ') : 'нет числовых полей'}
                </AppText>
              </View>
            </View>
          );
        })
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.xs,
  },
  stat: { flex: 1, gap: 2 },
  row: {
    paddingVertical: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: { opacity: 0.72 },
  rowMain: { flex: 1, gap: 2 },
  id: { maxWidth: 88, textAlign: 'right' },
});

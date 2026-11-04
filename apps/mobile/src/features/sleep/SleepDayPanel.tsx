import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { datesInWeekFromStart, weekStartMonday } from '../../../../../src/domain/habitWeek';
import {
  buildSleepStageRows,
  formatSleepClock,
  formatSleepDuration,
  sleepEfficiencyPercent,
  sleepHoursValue,
  type SleepStageKey,
} from '../../../../../src/domain/sleepStats';
import { WeekBarChart } from '@/src/components/WeekBarChart';
import { formatWeekRangeRu } from '@/src/components/weekFormat';
import { useData } from '@/src/state/DataContext';
import {
  AppButton,
  AppCard,
  AppText,
  colors,
  radius,
  space,
} from '@/src/design-system';

const STAGE_COLOR: Record<SleepStageKey, string> = {
  deep: colors.ink,
  light: colors.textSecondary,
  rem: colors.textMuted,
  awake: colors.borderStrong,
};

/** Full night stats from stored Garmin sleep — unknown stays «—». */
export function SleepDayPanel({ todayKey }: { todayKey: string }) {
  const router = useRouter();
  const { repo, dateLocal, setDateLocal, revision } = useData();
  void revision;
  const profile = repo.getProfile();
  const night = repo.getSleepForDate(dateLocal);

  const week = useMemo(() => {
    const start = weekStartMonday(dateLocal);
    const days = datesInWeekFromStart(start).map((d, weekdayIndex) => {
      const n = repo.getSleepForDate(d);
      const hours = n?.sleepSec != null ? n.sleepSec / 3600 : 0;
      return {
        date: d,
        weekdayIndex,
        hours,
        value: hours,
        valueLabel: formatSleepDuration(n?.sleepSec ?? null) ?? '—',
        hasData: n?.sleepSec != null,
        score: n?.sleepScore ?? null,
      };
    });
    const known = days.filter((d) => d.hasData);
    const avgHours =
      known.length === 0 ? null : known.reduce((s, d) => s + d.hours, 0) / known.length;
    const scored = known.filter((d) => d.score != null);
    const avgScore =
      scored.length === 0
        ? null
        : scored.reduce((s, d) => s + (d.score as number), 0) / scored.length;
    return {
      start,
      end: days[6]?.date ?? start,
      days,
      knownCount: known.length,
      avgHours,
      avgScore,
    };
  }, [repo, dateLocal, revision]);

  const stages = night ? buildSleepStageRows(night) : [];
  const hasAnyStage = stages.some((s) => s.sec != null);
  const efficiency = night
    ? sleepEfficiencyPercent(night.sleepSec, night.awakeSec)
    : null;
  const startClock = formatSleepClock(night?.startAt ?? null, profile.timezone);
  const endClock = formatSleepClock(night?.endAt ?? null, profile.timezone);
  const hours = sleepHoursValue(night?.sleepSec ?? null);
  const durationLabel = formatSleepDuration(night?.sleepSec ?? null);

  return (
    <View style={styles.root} testID="sleep-day-panel">
      {!night ? (
        <AppCard style={styles.card}>
          <AppText variant="subtitle" style={styles.emptyTitle}>
            Нет данных за ночь
          </AppText>
          <AppText variant="caption" tone="secondary" style={styles.emptyBody}>
            Нет записи ≠ 0 часов. После синхронизации Garmin здесь появятся длительность, фазы,
            оценка, SpO₂ и дыхание.
          </AppText>
          <AppButton
            label="Открыть Garmin"
            variant="secondary"
            onPress={() => router.push('/garmin' as Href)}
          />
        </AppCard>
      ) : (
        <>
          <AppCard style={styles.card}>
            <View style={styles.heroRow}>
              <View style={styles.heroMain}>
                <AppText variant="label" tone="muted">
                  Длительность
                </AppText>
                <AppText variant="metric" style={styles.heroValue}>
                  {hours == null ? '—' : hours}
                  {hours != null ? (
                    <AppText variant="caption" tone="muted">
                      {' '}
                      ч
                    </AppText>
                  ) : null}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  {durationLabel ? `${durationLabel}` : 'время неизвестно'}
                </AppText>
              </View>
              <View style={styles.heroScore}>
                <AppText variant="label" tone="muted">
                  Оценка
                </AppText>
                <AppText variant="metric" style={styles.heroValue}>
                  {night.sleepScore == null ? '—' : Math.round(night.sleepScore)}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  Garmin
                </AppText>
              </View>
            </View>

            <View style={styles.window}>
              <View style={styles.windowCell}>
                <AppText variant="label" tone="muted">
                  Заснул
                </AppText>
                <AppText variant="subtitle" style={styles.windowValue}>
                  {startClock ?? '—'}
                </AppText>
              </View>
              <AppText variant="caption" tone="muted">
                →
              </AppText>
              <View style={styles.windowCell}>
                <AppText variant="label" tone="muted">
                  Проснулся
                </AppText>
                <AppText variant="subtitle" style={styles.windowValue}>
                  {endClock ?? '—'}
                </AppText>
              </View>
              <View style={styles.windowCell}>
                <AppText variant="label" tone="muted">
                  Эффект.
                </AppText>
                <AppText variant="subtitle" style={styles.windowValue}>
                  {efficiency == null ? '—' : `${efficiency}%`}
                </AppText>
              </View>
            </View>

            {hasAnyStage ? (
              <View style={styles.stagesBlock} accessibilityLabel="Фазы сна">
                <AppText variant="label" tone="muted" style={styles.blockLabel}>
                  Фазы
                </AppText>
                <View style={styles.stagesBar}>
                  {stages.map((s) =>
                    s.barShare > 0 ? (
                      <View
                        key={s.key}
                        style={[
                          styles.stageSeg,
                          {
                            flex: Math.max(s.barShare, 0.02),
                            backgroundColor: STAGE_COLOR[s.key],
                          },
                        ]}
                      />
                    ) : null,
                  )}
                </View>
                {stages.map((s) => (
                  <View key={s.key} style={styles.stageRow}>
                    <View
                      style={[styles.stageDot, { backgroundColor: STAGE_COLOR[s.key] }]}
                    />
                    <AppText variant="body" style={styles.stageName}>
                      {s.labelRu}
                    </AppText>
                    <AppText variant="caption" tone="secondary" style={styles.stagePct}>
                      {s.percent == null ? '—' : `${s.percent}%`}
                    </AppText>
                    <AppText variant="body" style={styles.stageDur}>
                      {s.durationLabel ?? '—'}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : (
              <AppText variant="caption" tone="muted">
                Фазы за эту ночь не пришли из Garmin
              </AppText>
            )}
          </AppCard>

          <AppCard style={styles.vitalsCard}>
            <AppText variant="label" tone="muted" style={styles.blockLabel}>
              Показатели
            </AppText>
            <View style={styles.vitalsRow}>
              <Vital
                label="SpO₂ ср."
                value={night.avgSpo2 == null ? '—' : `${night.avgSpo2.toFixed(1)}%`}
              />
              <View style={styles.vitalRule} />
              <Vital
                label="Дыхание"
                value={
                  night.avgRespiration == null ? '—' : `${night.avgRespiration.toFixed(1)}`
                }
                unit={night.avgRespiration == null ? undefined : '/мин'}
              />
              <View style={styles.vitalRule} />
              <Vital
                label="Источник"
                value={night.source === 'garmin' ? 'Garmin' : night.source}
              />
            </View>
          </AppCard>
        </>
      )}

      <WeekBarChart
        title="Неделя сна"
        subtitle={`${formatWeekRangeRu(week.start, week.end)} · ${week.knownCount} ноч.${
          week.avgHours == null ? '' : ` · ср. ${week.avgHours.toFixed(1)} ч`
        }${week.avgScore == null ? '' : ` · оценка ${Math.round(week.avgScore)}`}`}
        selectedDate={dateLocal}
        todayDate={todayKey}
        onSelectDate={setDateLocal}
        footnote="Пустой столбик — нет импорта, не «ноль часов»."
        days={week.days.map((d) => ({
          dateLocal: d.date,
          weekdayIndex: d.weekdayIndex,
          value: d.value,
          valueLabel: d.valueLabel,
        }))}
      />
    </View>
  );
}

function Vital({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <View style={styles.vital}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <AppText variant="subtitle" style={styles.vitalValue}>
        {value}
        {unit ? (
          <AppText variant="caption" tone="muted">
            {' '}
            {unit}
          </AppText>
        ) : null}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
  card: { gap: space.md, padding: space.lg },
  emptyTitle: { fontWeight: '800' },
  emptyBody: { lineHeight: 18 },
  heroRow: { flexDirection: 'row', gap: space.md },
  heroMain: { flex: 1.2, gap: 2 },
  heroScore: {
    flex: 1,
    gap: 2,
    paddingLeft: space.md,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  heroValue: { fontWeight: '800' },
  window: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    padding: space.md,
  },
  windowCell: { flex: 1, gap: 2 },
  windowValue: { fontWeight: '700' },
  blockLabel: {
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  stagesBlock: { gap: space.sm },
  stagesBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  stageSeg: { height: '100%' },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 32,
  },
  stageDot: { width: 8, height: 8, borderRadius: 2 },
  stageName: { flex: 1, fontWeight: '600' },
  stagePct: { width: 48, textAlign: 'right' },
  stageDur: { width: 48, textAlign: 'right', fontWeight: '700' },
  vitalsCard: { gap: space.sm, padding: space.lg },
  vitalsRow: { flexDirection: 'row', alignItems: 'stretch' },
  vital: { flex: 1, alignItems: 'center', gap: 2 },
  vitalValue: { fontWeight: '800' },
  vitalRule: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
});

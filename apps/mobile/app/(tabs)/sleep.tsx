import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { datesInWeekFromStart, weekStartMonday } from '../../../../src/domain/habitWeek';
import { localDateKey } from '../../../../src/storage/validation';
import { DayStrip } from '@/src/components/DayStrip';
import { DaySwipeArea } from '@/src/components/DaySwipeArea';
import { FlashBar } from '@/src/components/FlashBar';
import { FormScrollView } from '@/src/components/FormScrollView';
import { WeekBarChart } from '@/src/components/WeekBarChart';
import { formatWeekRangeRu } from '@/src/components/weekFormat';
import { DayCalendarSheet } from '@/src/features/calendar/DayCalendarSheet';
import { useData } from '@/src/state/DataContext';
import {
  AppButton,
  AppCard,
  AppText,
  MetricCard,
  colors,
  radius,
  space,
} from '@/src/design-system';

function fmtHours(sec: number | null): string {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

function stageRatio(part: number | null, total: number | null): number {
  if (part == null || total == null || total <= 0 || part < 0) return 0;
  return Math.min(1, part / total);
}

export default function SleepScreen() {
  const router = useRouter();
  const { repo, dateLocal, setDateLocal, revision } = useData();
  void revision;
  const [calendarOpen, setCalendarOpen] = useState(false);
  const profile = repo.getProfile();
  const todayKey = localDateKey(new Date(), profile.timezone);
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
        valueLabel: n?.sleepSec == null ? '·' : fmtHours(n.sleepSec),
        hasData: n?.sleepSec != null,
      };
    });
    const known = days.filter((d) => d.hasData);
    const avgHours =
      known.length === 0
        ? null
        : known.reduce((s, d) => s + d.hours, 0) / known.length;
    return { start, end: days[6]?.date ?? start, days, knownCount: known.length, avgHours };
  }, [repo, dateLocal, revision]);

  const deepR = stageRatio(night?.deepSec ?? null, night?.sleepSec ?? null);
  const lightR = stageRatio(night?.lightSec ?? null, night?.sleepSec ?? null);
  const remR = stageRatio(night?.remSec ?? null, night?.sleepSec ?? null);
  const awakeR = stageRatio(night?.awakeSec ?? null, night?.sleepSec ?? null);

  return (
    <View style={styles.root} testID="sleep-screen">
      <DaySwipeArea dateLocal={dateLocal} onDateChange={setDateLocal}>
        <FormScrollView contentContainerStyle={styles.content}>
          <DayStrip
            selected={dateLocal}
            today={todayKey}
            onSelect={setDateLocal}
            onOpenCalendar={() => setCalendarOpen(true)}
          />
          <AppText variant="caption" tone="muted" style={styles.hint}>
            Данные из Garmin Connect после синхронизации. Нет записи ≠ 0 часов.
          </AppText>

          <AppCard style={styles.card}>
            <MetricCard
              label="Сон"
              value={night?.sleepSec == null ? null : Math.round((night.sleepSec / 3600) * 10) / 10}
              unit="ч"
              meta={
                night?.sleepScore != null
                  ? `оценка Garmin ${Math.round(night.sleepScore)}`
                  : night
                    ? 'без оценки'
                    : 'нет данных'
              }
            />
            <View style={styles.metaRow}>
              <AppText variant="caption" tone="secondary">
                Глубокий {fmtHours(night?.deepSec ?? null)}
              </AppText>
              <AppText variant="caption" tone="secondary">
                Лёгкий {fmtHours(night?.lightSec ?? null)}
              </AppText>
              <AppText variant="caption" tone="secondary">
                REM {fmtHours(night?.remSec ?? null)}
              </AppText>
              <AppText variant="caption" tone="secondary">
                Бодр. {fmtHours(night?.awakeSec ?? null)}
              </AppText>
            </View>

            {night?.sleepSec != null ? (
              <View style={styles.stages} accessibilityLabel="Фазы сна">
                <View style={[styles.stage, styles.deep, { flex: Math.max(deepR, 0.02) }]} />
                <View style={[styles.stage, styles.light, { flex: Math.max(lightR, 0.02) }]} />
                <View style={[styles.stage, styles.rem, { flex: Math.max(remR, 0.02) }]} />
                <View style={[styles.stage, styles.awake, { flex: Math.max(awakeR, 0.02) }]} />
              </View>
            ) : null}

            <View style={styles.extra}>
              <AppText variant="caption" tone="muted">
                SpO₂ ср.{' '}
                {night?.avgSpo2 == null ? '—' : `${night.avgSpo2.toFixed(1)}%`}
                {' · '}
                дыхание{' '}
                {night?.avgRespiration == null ? '—' : night.avgRespiration.toFixed(1)}
              </AppText>
            </View>
          </AppCard>

          <WeekBarChart
            title="Неделя сна"
            subtitle={`${formatWeekRangeRu(week.start, week.end)} · ${week.knownCount} ночей · ср. ${
              week.avgHours == null ? '—' : `${week.avgHours.toFixed(1)} ч`
            }`}
            selectedDate={dateLocal}
            todayDate={todayKey}
            onSelectDate={setDateLocal}
            footnote="Пустой столбик — нет импорта Garmin, не «ноль часов»."
            days={week.days.map((d) => ({
              dateLocal: d.date,
              weekdayIndex: d.weekdayIndex,
              value: d.value,
              valueLabel: d.valueLabel,
            }))}
          />

          {!night ? (
            <AppCard style={styles.empty}>
              <AppText variant="subtitle" style={styles.emptyTitle}>
                Пока нет сна за день
              </AppText>
              <AppText variant="caption" tone="secondary" style={styles.emptyBody}>
                Подключи Garmin Personal API и синхронизируй — ночные summaries появятся здесь.
              </AppText>
              <AppButton
                label="Открыть Garmin"
                variant="secondary"
                onPress={() => router.push('/garmin' as Href)}
              />
            </AppCard>
          ) : null}
        </FormScrollView>
      </DaySwipeArea>
      <DayCalendarSheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} />
      <FlashBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.lg, paddingBottom: 48, gap: space.sm },
  hint: { marginBottom: space.sm },
  card: { gap: space.sm, marginBottom: space.md },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  stages: {
    flexDirection: 'row',
    height: 10,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.border,
    marginTop: space.sm,
  },
  stage: { height: '100%' },
  deep: { backgroundColor: colors.ink },
  light: { backgroundColor: colors.textSecondary },
  rem: { backgroundColor: colors.textMuted },
  awake: { backgroundColor: colors.border },
  extra: { marginTop: space.xs },
  empty: { gap: space.sm, marginTop: space.md },
  emptyTitle: { fontWeight: '800' },
  emptyBody: { lineHeight: 18 },
});

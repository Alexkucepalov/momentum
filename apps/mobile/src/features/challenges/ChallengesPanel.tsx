import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ChallengeMetric } from '../../../../../src/storage/types';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useData } from '../../state/DataContext';
import { colors, radius, space, surfaceCard, touchMin, type } from '../../theme/tokens';

const METRICS: { value: ChallengeMetric; label: string }[] = [
  { value: 'workouts_count', label: 'Тренировки' },
  { value: 'activity_minutes', label: 'Минуты активности' },
  { value: 'food_log_days', label: 'Дни с едой' },
  { value: 'habit_completions', label: 'Отметки привычки' },
];

const PERIODS: { days: number; label: string }[] = [
  { days: 7, label: '7 дней' },
  { days: 14, label: '14 дней' },
  { days: 30, label: '30 дней' },
];

function shiftDays(dateLocal: string, days: number): string {
  const [y, m, d] = dateLocal.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function ChallengesPanel() {
  const { repo, dateLocal, refresh, revision, showFlash } = useData();
  void revision;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [metric, setMetric] = useState<ChallengeMetric>('workouts_count');
  const [targetRaw, setTargetRaw] = useState('3');
  const [periodDays, setPeriodDays] = useState(14);
  const [customEnd, setCustomEnd] = useState('');
  const [habitId, setHabitId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const habits = repo.listFlexibleHabits();
  const challenges = repo.listChallenges();

  const rows = useMemo(
    () =>
      challenges.map((c) => {
        const progress = repo.challengeProgress(c.id);
        return { challenge: c, progress };
      }),
    [challenges, repo, revision],
  );

  const create = () => {
    try {
      setError(null);
      const target = Number(targetRaw.replace(',', '.'));
      let periodEnd: string;
      if (periodDays > 0) {
        periodEnd = shiftDays(dateLocal, periodDays - 1);
      } else {
        const end = customEnd.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(end)) {
          throw new Error('Укажи дату окончания в формате ГГГГ-ММ-ДД');
        }
        periodEnd = end;
      }
      const challenge = repo.createChallenge({
        name: name.trim() || `За ${periodDays > 0 ? periodDays : 'срок'} · цель ${target}`,
        metric,
        target,
        periodStart: dateLocal,
        periodEnd,
        habitId: metric === 'habit_completions' ? habitId : null,
      });
      setName('');
      setTargetRaw('3');
      setPeriodDays(14);
      setCustomEnd('');
      setOpen(false);
      refresh();
      showFlash(`Челлендж «${challenge.name}»`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не создано');
    }
  };

  const abandon = (id: string, title: string) => {
    Alert.alert('Снять челлендж?', `«${title}» останется в истории как отменённый.`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Снять',
        style: 'destructive',
        onPress: () => {
          repo.abandonChallenge(id);
          refresh();
          showFlash(`Снят: ${title}`);
        },
      },
    ]);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="flag-outline" size={20} color={colors.text} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heading} accessibilityRole="header">
            Челленджи
          </Text>
          <Text style={styles.sub}>
            Личная цель на срок. Прогресс — наблюдение, без штрафов и «сорванных» серий.
          </Text>
        </View>
      </View>

      {rows.length === 0 && !open ? (
        <EmptyState
          icon="flag-outline"
          title="Нет активных челленджей"
          body="Например: 3 тренировки за 2 недели или 5 дней с записями еды."
          actionLabel="Новый челлендж"
          onAction={() => {
            setOpen(true);
            setError(null);
          }}
        />
      ) : null}

      {rows.map(({ challenge: c, progress }) => (
        <View key={c.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>{c.name}</Text>
              <Text style={styles.meta}>
                {progress.current} из {progress.target}
                {c.status === 'completed' ? ' · готово' : ''}
              </Text>
            </View>
            {c.status === 'active' ? (
              <Pressable
                onPress={() => abandon(c.id, c.name)}
                accessibilityRole="button"
                accessibilityLabel={`Снять ${c.name}`}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.round(progress.ratio * 100)}%` }]} />
          </View>
          <Text style={styles.period}>
            {c.periodStart} → {c.periodEnd}
          </Text>
        </View>
      ))}

      {open ? (
        <View style={styles.composer}>
          <Text style={styles.composerTitle}>Новый челлендж</Text>
          <Text style={styles.phrase}>
            За выбранный срок я хочу сделать цель ниже — без штрафов, просто наблюдение.
          </Text>
          <Text style={styles.fieldLabel}>Как назовём?</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="например 12 тренировок за месяц"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            accessibilityLabel="Название челленджа"
          />
          <Text style={styles.fieldLabel}>Что будем считать?</Text>
          <View style={styles.metricRow}>
            {METRICS.map((m) => {
              const on = metric === m.value;
              return (
                <Pressable
                  key={m.value}
                  style={({ pressed }) => [
                    styles.metricChip,
                    on && styles.metricOn,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setMetric(m.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.metricText, on && styles.metricTextOn]}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {metric === 'habit_completions' ? (
            <>
              <Text style={styles.fieldLabel}>Какую привычку?</Text>
              <View style={styles.metricRow}>
                {habits.length === 0 ? (
                  <Text style={styles.hint}>Сначала добавь привычку</Text>
                ) : (
                  habits.map((h) => {
                    const on = habitId === h.id;
                    return (
                      <Pressable
                        key={h.id}
                        style={({ pressed }) => [
                          styles.metricChip,
                          on && styles.metricOn,
                          pressed && styles.pressed,
                        ]}
                        onPress={() => setHabitId(h.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                      >
                        <Text style={[styles.metricText, on && styles.metricTextOn]}>{h.name}</Text>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </>
          ) : null}
          <Text style={styles.fieldLabel}>Сколько хочешь выполнить?</Text>
          <TextInput
            value={targetRaw}
            onChangeText={setTargetRaw}
            keyboardType="decimal-pad"
            style={styles.input}
            accessibilityLabel="Целевое значение"
          />
          <Text style={styles.fieldLabel}>До какого числа? (срок)</Text>
          <View style={styles.metricRow}>
            {PERIODS.map((p) => {
              const on = periodDays === p.days;
              return (
                <Pressable
                  key={p.days}
                  style={({ pressed }) => [
                    styles.metricChip,
                    on && styles.metricOn,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    setPeriodDays(p.days);
                    setCustomEnd('');
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.metricText, on && styles.metricTextOn]}>{p.label}</Text>
                </Pressable>
              );
            })}
            <Pressable
              style={({ pressed }) => [
                styles.metricChip,
                periodDays === 0 && styles.metricOn,
                pressed && styles.pressed,
              ]}
              onPress={() => setPeriodDays(0)}
              accessibilityRole="button"
              accessibilityState={{ selected: periodDays === 0 }}
            >
              <Text style={[styles.metricText, periodDays === 0 && styles.metricTextOn]}>
                Своя дата
              </Text>
            </Pressable>
          </View>
          {periodDays === 0 ? (
            <TextInput
              value={customEnd}
              onChangeText={setCustomEnd}
              placeholder={`до ${shiftDays(dateLocal, 29)}`}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              accessibilityLabel="Дата окончания ГГГГ-ММ-ДД"
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.hint}>
              С {dateLocal} по {shiftDays(dateLocal, periodDays - 1)}
            </Text>
          )}
          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="assertive">
              {error}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              onPress={() => {
                setOpen(false);
                setError(null);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>Отмена</Text>
            </Pressable>
            <View style={styles.flex}>
              <PrimaryButton label="Создать" onPress={create} />
            </View>
          </View>
        </View>
      ) : rows.length > 0 ? (
        <Pressable
          style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}
          onPress={() => {
            setOpen(true);
            setError(null);
          }}
          accessibilityRole="button"
          accessibilityLabel="Новый челлендж"
        >
          <Ionicons name="add" size={20} color={colors.text} />
          <Text style={styles.addRowText}>Ещё челлендж</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.xl },
  hero: { flexDirection: 'row', gap: space.md, marginBottom: space.lg },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heading: { fontSize: type.subtitle, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sub: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
  card: {
    ...surfaceCard,
    padding: space.lg,
    marginBottom: space.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  flex: { flex: 1 },
  cardTitle: { fontWeight: '800', color: colors.text, fontSize: type.body },
  meta: { color: colors.textSecondary, fontSize: type.caption, marginTop: 2 },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background,
    marginTop: space.md,
    overflow: 'hidden',
  },
  barFill: { height: 8, backgroundColor: colors.accent },
  period: { marginTop: space.sm, fontSize: type.micro, color: colors.textMuted },
  composer: {
    ...surfaceCard,
    padding: space.lg,
  },
  composerTitle: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
    marginBottom: space.sm,
  },
  phrase: {
    fontSize: type.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: space.md,
  },
  fieldLabel: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: space.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    marginBottom: space.md,
    color: colors.text,
    fontSize: type.body,
  },
  metricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginBottom: space.md },
  metricChip: {
    paddingHorizontal: space.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  metricOn: { backgroundColor: colors.primaryButton, borderColor: colors.primaryButton },
  metricText: { fontSize: type.micro, fontWeight: '600', color: colors.textSecondary },
  metricTextOn: { color: colors.primaryButtonText },
  hint: { fontSize: type.micro, color: colors.textMuted, marginBottom: space.md, lineHeight: 16 },
  actions: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  secondaryBtn: {
    minHeight: touchMin,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontWeight: '700', color: colors.text },
  addRow: {
    minHeight: touchMin,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  addRowText: { fontWeight: '700', color: colors.text, fontSize: type.body },
  error: { color: colors.danger, marginBottom: space.sm, fontSize: type.caption },
  pressed: { opacity: 0.88 },
});

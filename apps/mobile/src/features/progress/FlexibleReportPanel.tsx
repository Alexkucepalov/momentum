import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatDateRu, parseDateRu } from '../../../../../src/domain/dateFormatRu';
import {
  REPORT_CATEGORY_LABELS_RU,
  buildFlexibleReport,
  flexibleReportToHtml,
  type ReportCategory,
} from '../../../../../src/domain/flexibleReport';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useData } from '../../state/DataContext';
import { colors, elevation, radius, space, touchMin, type } from '../../theme/tokens';
import { collectFlexibleReportInput } from './collectFlexibleReport';
import { shareHtmlAsPdf } from './shareReportPdf';

const ALL_CATS: ReportCategory[] = ['profile', 'nutrition', 'activity', 'weight', 'habits'];

const PRESETS: { label: string; days: number }[] = [
  { label: '7 дней', days: 7 },
  { label: '14 дней', days: 14 },
  { label: '30 дней', days: 30 },
];

function shiftDaysIso(dateLocal: string, delta: number): string {
  const [y, m, d] = dateLocal.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}

export function FlexibleReportPanel() {
  const { repo, dateLocal, revision, showFlash } = useData();
  void revision;
  const [start, setStart] = useState(() => formatDateRu(shiftDaysIso(dateLocal, -6)));
  const [end, setEnd] = useState(() => formatDateRu(dateLocal));
  const [cats, setCats] = useState<ReportCategory[]>([...ALL_CATS]);
  const [busy, setBusy] = useState(false);

  const selectedLabel = useMemo(
    () =>
      cats.length === 0
        ? 'ничего не выбрано'
        : cats.map((c) => REPORT_CATEGORY_LABELS_RU[c]).join(' · '),
    [cats],
  );

  const toggle = (c: ReportCategory) => {
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const applyPreset = (days: number) => {
    setEnd(formatDateRu(dateLocal));
    setStart(formatDateRu(shiftDaysIso(dateLocal, -(days - 1))));
  };

  const generate = async () => {
    try {
      setBusy(true);
      const periodStart = parseDateRu(start);
      const periodEnd = parseDateRu(end);
      const input = collectFlexibleReportInput(repo, {
        periodStart,
        periodEnd,
        categories: cats,
      });
      const report = buildFlexibleReport(input);
      const html = flexibleReportToHtml(report, input.generatedAtIso);

      if (Platform.OS === 'web') {
        // Web: open printable HTML — user can «Save as PDF» in the browser.
        const g = globalThis as unknown as {
          open?: (url: string, target: string) => { document: { write: (h: string) => void; close: () => void } } | null;
        };
        const w = g.open?.('', '_blank');
        if (!w) {
          Alert.alert('Отчёт', 'Разреши всплывающие окна или сформируй PDF на Android.');
          return;
        }
        w.document.write(html);
        w.document.close();
        showFlash('Отчёт открыт — сохрани как PDF в браузере');
        return;
      }

      const stamp = `${periodStart}_${periodEnd}`.replace(/[^0-9_-]/g, '');
      const mode = await shareHtmlAsPdf(html, `momentum-report-${stamp}`);
      if (mode === 'shared') {
        showFlash('PDF готов — выбери куда сохранить или отправить');
      } else if (mode === 'printed') {
        showFlash('Открыт системный лист печати — можно «Сохранить как PDF»');
      } else {
        showFlash('PDF сохранён в кэше приложения');
      }
    } catch (e) {
      Alert.alert('Отчёт', e instanceof Error ? e.message : 'Не удалось сформировать');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <View style={styles.icon}>
          <Ionicons name="document-text-outline" size={20} color={colors.text} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title} accessibilityRole="header">
            Гибкий отчёт
          </Text>
          <Text style={styles.sub}>
            Сам выбираешь период и разделы. PDF собирается на устройстве — без облака и без
            выдуманных КБЖУ.
          </Text>
        </View>
      </View>

      <Text style={styles.label}>Период</Text>
      <View style={styles.presets}>
        {PRESETS.map((p) => (
          <Pressable
            key={p.days}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            onPress={() => applyPreset(p.days)}
            accessibilityRole="button"
            accessibilityLabel={p.label}
          >
            <Text style={styles.chipText}>{p.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.dateRow}>
        <View style={styles.dateCol}>
          <Text style={styles.micro}>С</Text>
          <TextInput
            value={start}
            onChangeText={setStart}
            autoCapitalize="none"
            placeholder="ДД.ММ.ГГГГ"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            accessibilityLabel="Дата начала отчёта"
            keyboardType="numbers-and-punctuation"
          />
        </View>
        <View style={styles.dateCol}>
          <Text style={styles.micro}>По</Text>
          <TextInput
            value={end}
            onChangeText={setEnd}
            autoCapitalize="none"
            placeholder="ДД.ММ.ГГГГ"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            accessibilityLabel="Дата конца отчёта"
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>

      <Text style={styles.label}>Что включить</Text>
      <View style={styles.presets}>
        {ALL_CATS.map((c) => {
          const on = cats.includes(c);
          return (
            <Pressable
              key={c}
              style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}
              onPress={() => toggle(c)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={REPORT_CATEGORY_LABELS_RU[c]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {REPORT_CATEGORY_LABELS_RU[c]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>{selectedLabel}</Text>

      <PrimaryButton
        label={busy ? 'Собираю…' : Platform.OS === 'web' ? 'Открыть отчёт' : 'Сформировать PDF'}
        onPress={() => void generate()}
        disabled={busy || cats.length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...elevation.card,
    padding: space.lg,
    marginBottom: space.xl,
  },
  hero: { flexDirection: 'row', gap: space.md, marginBottom: space.lg },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  title: { fontSize: type.subtitle, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sub: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
  label: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: space.sm,
  },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginBottom: space.md },
  chip: {
    paddingHorizontal: space.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipOn: { backgroundColor: colors.primaryButton, borderColor: colors.primaryButton },
  chipText: { fontSize: type.micro, fontWeight: '600', color: colors.textSecondary },
  chipTextOn: { color: colors.primaryButtonText },
  dateRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  dateCol: { flex: 1 },
  micro: { fontSize: type.micro, color: colors.textMuted, marginBottom: 4, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    color: colors.text,
    fontSize: type.body,
    backgroundColor: colors.background,
  },
  hint: {
    fontSize: type.micro,
    color: colors.textMuted,
    marginBottom: space.md,
    lineHeight: 16,
  },
  pressed: { opacity: 0.88 },
});

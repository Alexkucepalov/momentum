import { useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { ThemedTextInput as TextInput } from '@/src/design-system/components/ThemedTextInput';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { formatDateRu, parseDateRu } from '../../../../../src/domain/dateFormatRu';
import {
  REPORT_CATEGORY_LABELS_RU,
  buildFlexibleReport,
  flexibleReportToHtml,
  flexibleReportToPlainText,
  type ReportCategory,
} from '../../../../../src/domain/flexibleReport';
import { useData, useAnyRevision } from '../../state/DataContext';
import {
  AppButton,
  AppCard,
  AppText,
  Chip,
  colors,
  radius,
  space,
  touchMin,
  type,
} from '@/src/design-system';
import { collectFlexibleReportInput } from './collectFlexibleReport';
import { shareHtmlAsPdf } from './shareReportPdf';

const ALL_CATS: ReportCategory[] = ['profile', 'nutrition', 'activity', 'weight', 'habits'];

/** M7: user-facing presets emphasize 7 and 30 days. */
const PRESETS: { label: string; days: number }[] = [
  { label: '7 дней', days: 7 },
  { label: '30 дней', days: 30 },
  { label: '14 дней', days: 14 },
];

function shiftDaysIso(dateLocal: string, delta: number): string {
  const [y, m, d] = dateLocal.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}

/** User-initiated PDF / ChatGPT text only — no silent upload (M9). */
export function FlexibleReportPanel() {
  const { repo, dateLocal, showFlash } = useData();
  const revision = useAnyRevision();
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

  const buildReport = () => {
    const periodStart = parseDateRu(start);
    const periodEnd = parseDateRu(end);
    const input = collectFlexibleReportInput(repo, {
      periodStart,
      periodEnd,
      categories: cats,
    });
    return { input, report: buildFlexibleReport(input), periodStart, periodEnd };
  };

  const generate = async () => {
    try {
      setBusy(true);
      const { input, report, periodStart, periodEnd } = buildReport();
      const html = flexibleReportToHtml(report, input.generatedAtIso);

      if (Platform.OS === 'web') {
        const g = globalThis as unknown as {
          open?: (url: string, target: string) => {
            document: { write: (h: string) => void; close: () => void };
          } | null;
        };
        const w = g.open?.('', '_blank');
        if (!w) {
          showFlash('Разреши всплывающие окна или сформируй PDF на Android.');
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
      showFlash(e instanceof Error ? e.message : 'Не удалось сформировать');
    } finally {
      setBusy(false);
    }
  };

  const copyForChatGpt = async () => {
    try {
      setBusy(true);
      const { input, report } = buildReport();
      const text = flexibleReportToPlainText(report, input.generatedAtIso);
      await Clipboard.setStringAsync(text);
      showFlash('Текст отчёта скопирован — вставь в ChatGPT');
    } catch (e) {
      showFlash(e instanceof Error ? e.message : 'Не удалось скопировать');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppCard style={styles.wrap} testID="flexible-report-panel">
      <View style={styles.hero}>
        <View style={styles.icon}>
          <Ionicons name="document-text-outline" size={20} color={colors.ink} />
        </View>
        <View style={styles.flex}>
          <AppText variant="subtitle" style={styles.title} accessibilityRole="header">
            Гибкий отчёт
          </AppText>
          <AppText variant="caption" tone="secondary" style={styles.sub}>
            Только по твоей кнопке: PDF на устройстве или текст для ChatGPT. Без прямого коннекта и
            без выдуманных КБЖУ.
          </AppText>
        </View>
      </View>

      <AppText variant="label" tone="secondary" style={styles.label}>
        Период
      </AppText>
      <View style={styles.presets}>
        {PRESETS.map((p) => (
          <Chip
            key={p.days}
            label={p.label}
            onPress={() => applyPreset(p.days)}
            accessibilityLabel={p.label}
          />
        ))}
      </View>
      <View style={styles.dateRow}>
        <View style={styles.dateCol}>
          <AppText variant="caption" tone="muted" style={styles.micro}>
            С
          </AppText>
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
          <AppText variant="caption" tone="muted" style={styles.micro}>
            По
          </AppText>
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

      <AppText variant="label" tone="secondary" style={styles.label}>
        Что включить
      </AppText>
      <View style={styles.presets}>
        {ALL_CATS.map((c) => (
          <Chip
            key={c}
            label={REPORT_CATEGORY_LABELS_RU[c]}
            selected={cats.includes(c)}
            onPress={() => toggle(c)}
            accessibilityLabel={REPORT_CATEGORY_LABELS_RU[c]}
          />
        ))}
      </View>
      <AppText variant="caption" tone="muted" style={styles.hint}>
        {selectedLabel}
      </AppText>

      <AppButton
        label={busy ? 'Собираю…' : Platform.OS === 'web' ? 'Открыть отчёт' : 'Сформировать PDF'}
        onPress={() => void generate()}
        disabled={busy || cats.length === 0}
      />
      <View style={{ height: space.sm }} />
      <AppButton
        label="Копировать текст для ChatGPT"
        variant="secondary"
        onPress={() => void copyForChatGpt()}
        disabled={busy || cats.length === 0}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.xl,
    gap: space.xs,
  },
  hero: { flexDirection: 'row', gap: space.md, marginBottom: space.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  title: { fontWeight: '800', marginBottom: 4 },
  sub: { lineHeight: 18 },
  label: { marginBottom: space.sm, marginTop: space.sm },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginBottom: space.md },
  dateRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  dateCol: { flex: 1 },
  micro: { marginBottom: 4, fontWeight: '700' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    color: colors.ink,
    fontSize: type.body,
    backgroundColor: colors.surface,
  },
  hint: {
    marginBottom: space.md,
    lineHeight: 16,
  },
});

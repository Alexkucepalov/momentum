import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { parseZeppBodyCsv } from '../../../../../src/domain/zepp/parseZeppBodyCsv';
import { AppButton, AppCard, AppText, space } from '@/src/design-system';
import { useData } from '@/src/state/DataContext';

/**
 * Import BODY_*.csv from Zepp Life privacy export (Xiaomi scale).
 * Offline — no Huami login. Weight only; unknown rows skipped.
 */
export function ZeppCsvImportCard() {
  const { repo, refresh, showFlash } = useData();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const onImport = async () => {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      const pick = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (pick.canceled || !pick.assets?.[0]?.uri) {
        setNote('Файл не выбран');
        return;
      }
      const uri = pick.assets[0].uri;
      const text = await FileSystem.readAsStringAsync(uri);
      const rows = parseZeppBodyCsv(text);
      if (rows.length === 0) {
        setNote('В файле нет валидных строк веса (нужен BODY_*.csv из Zepp Life)');
        showFlash('Вес из CSV не найден');
        return;
      }
      let n = 0;
      for (const r of rows) {
        const saved = repo.upsertIntegratedWeight({
          kg: r.kg,
          weighedAt: r.weighedAt,
          source: 'zepp',
          externalId: r.externalId,
        });
        if (saved) n += 1;
      }
      refresh();
      const msg = `Импортировано взвешиваний: ${n}`;
      setNote(msg);
      showFlash(msg);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось прочитать CSV';
      setNote(msg);
      showFlash(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppCard>
      <AppText variant="subtitle">Вес Xiaomi / Zepp Life</AppText>
      <AppText variant="caption" tone="secondary" style={styles.hint}>
        В Zepp Life: Профиль → Конфиденциальность → экспорт данных → BODY_*.csv из письма. Импорт
        только на устройство, без логина Huami.
      </AppText>
      <AppButton
        label={busy ? 'Читаю CSV…' : 'Импорт BODY CSV'}
        variant="secondary"
        onPress={() => void onImport()}
        disabled={busy}
      />
      {note ? (
        <AppText variant="caption" tone="secondary" style={styles.note}>
          {note}
        </AppText>
      ) : null}
      <View style={{ height: space.xs }} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  hint: { lineHeight: 18, marginBottom: space.sm },
  note: { marginTop: space.sm, lineHeight: 18 },
});

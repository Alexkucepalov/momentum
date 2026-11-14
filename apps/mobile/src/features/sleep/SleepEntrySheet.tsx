import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwipeToDismissSheet } from '@/src/components/SwipeToDismissSheet';
import { AppButton, AppText, Field, colors, space, touchMin } from '@/src/design-system';

export function SleepEntrySheet({ visible, dateLabel, seconds, onClose, onSave, onDelete }: {
  visible: boolean; dateLabel: string; seconds: number | null; onClose: () => void; onSave: (seconds: number) => void; onDelete?: () => void;
}) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('0');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!visible) return; setHours(seconds == null ? '' : String(Math.floor(seconds / 3600))); setMinutes(seconds == null ? '0' : String(Math.round(seconds % 3600 / 60))); setError(null); }, [visible, seconds]);
  const save = () => {
    try {
      if (!/^\d{1,2}$/.test(hours.trim()) || !/^\d{1,2}$/.test(minutes.trim())) throw new Error('Укажи часы и минуты целыми числами');
      const h = Number(hours), m = Number(minutes);
      if (m > 59 || h > 24 || h * 60 + m > 1440) throw new Error('Минуты — от 0 до 59, длительность — до 24 часов');
      onSave(h * 3600 + m * 60);
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось сохранить сон'); }
  };
  return <SwipeToDismissSheet visible={visible} onClose={onClose} maxHeightRatio={0.85} testID="sleep-entry-sheet"><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.head}><View style={styles.title}><AppText variant="title">Записать сон</AppText><AppText variant="caption" tone="secondary">Ночь на {dateLabel}</AppText></View><Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Закрыть запись сна" style={styles.close}><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View>
    <AppText variant="body" tone="secondary">Сколько ты спал? Сохраним длительность как ручную запись.</AppText>
    <View style={styles.row}><View style={styles.field}><Field label="Часы сна" value={hours} onChangeText={setHours} keyboardType="number-pad" placeholder="7" maxLength={2} /></View><View style={styles.field}><Field label="Минуты сна" value={minutes} onChangeText={setMinutes} keyboardType="number-pad" maxLength={2} /></View></View>
    {error ? <AppText variant="caption" tone="danger" accessibilityRole="alert">{error}</AppText> : null}
    <AppButton label="Сохранить сон" onPress={save} testID="sleep-entry-save" />
    {onDelete ? <AppButton label="Удалить ручную запись" variant="ghost" onPress={onDelete} /> : null}
  </ScrollView></SwipeToDismissSheet>;
}
const styles = StyleSheet.create({ content: { padding: space.screen, gap: space.md }, head: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm }, title: { flex: 1, gap: space.xs }, close: { minWidth: touchMin, minHeight: touchMin, justifyContent: 'center', alignItems: 'center' }, row: { flexDirection: 'row', gap: space.md }, field: { flex: 1, minWidth: 0 } });

import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { AppText, colors, radius, space, touchMin } from '../design-system';

export function StatCards({ waterMl, waterTargetMl, activityMinutes, steps, sleepSec, onAddWater }: {
  waterMl: number; waterTargetMl: number | null; activityMinutes: number; steps: number | null; sleepSec: number | null; onAddWater: (ml: number) => void;
}) {
  const router = useRouter();
  const hours = sleepSec == null ? null : Math.floor(sleepSec / 3600);
  const minutes = sleepSec == null ? null : Math.floor((sleepSec % 3600) / 60);
  const water = (waterMl / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  const target = waterTargetMl != null && waterTargetMl > 0 ? ` / ${(waterTargetMl / 1000).toLocaleString('ru-RU')} л` : ' л';
  return (
    <View style={styles.wrap} testID="today-stat-cards">
      <View style={styles.row}>
        <Pressable style={styles.metric} onPress={() => router.push('/activity')} accessibilityRole="button" accessibilityLabel={`Шаги ${steps == null ? 'нет данных' : steps}. Открыть движение`}>
          <View style={styles.label}><Ionicons name="footsteps-outline" size={16} color={colors.textSecondary} /><AppText variant="caption" tone="secondary">Шаги</AppText></View>
          <AppText variant="subtitle" style={styles.value}>{steps == null ? '—' : steps.toLocaleString('ru-RU')}</AppText>
          <AppText variant="label" tone="muted">{steps == null ? 'нет данных' : 'за выбранный день'}</AppText>
        </Pressable>
        <Pressable style={styles.metric} onPress={() => router.push('/activity?segment=sleep' as Href)} accessibilityRole="button" accessibilityLabel={`Сон ${hours == null ? 'нет данных' : `${hours} часов ${minutes} минут`}. Открыть сон`}>
          <View style={styles.label}><Ionicons name="moon-outline" size={16} color={colors.textSecondary} /><AppText variant="caption" tone="secondary">Сон</AppText></View>
          <AppText variant="subtitle" style={styles.value}>{hours == null ? '—' : `${hours} ч ${minutes} мин`}</AppText>
          <AppText variant="label" tone="muted">{hours == null ? 'нет данных' : 'за последнюю ночь'}</AppText>
        </Pressable>
      </View>
      <View style={styles.water}>
        <Ionicons name="water-outline" size={20} color={colors.ink} />
        <View style={styles.waterText}><AppText variant="body" style={styles.waterValue}>{water}<AppText variant="caption" tone="secondary">{target}</AppText></AppText><AppText variant="label" tone="muted">Вода за день</AppText></View>
        <Pressable onPress={() => onAddWater(250)} style={({ pressed }) => [styles.add, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Добавить 250 миллилитров воды"><AppText variant="caption">+250 мл</AppText></Pressable>
      </View>
      {activityMinutes > 0 ? <AppText variant="caption" tone="secondary">Активность за день · {activityMinutes} мин</AppText> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { gap: space.md, marginVertical: space.lg }, row: { flexDirection: 'row', gap: space.lg },
  metric: { flex: 1, minWidth: 0, gap: space.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingBottom: space.md },
  label: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.xs }, value: { fontSize: 25, fontWeight: '500', letterSpacing: -0.7 },
  water: { flexDirection: 'row', alignItems: 'center', gap: space.md }, waterText: { flex: 1, gap: 2 }, waterValue: { fontWeight: '600' },
  add: { minHeight: touchMin, paddingHorizontal: space.md, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.75 },
});

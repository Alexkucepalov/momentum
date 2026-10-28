import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { localDateKey } from '../../../../src/storage/validation';
import { colors, space, touchMin, type } from '../theme/tokens';
import { AppCard } from '@/src/ui/AppCard';
import { dateChrome } from '@/src/ui/dateChrome';

function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

function formatTitle(iso: string, today: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dayMonth = dt.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  if (iso === today) return `Сегодня, ${dayMonth}`;
  if (iso === addDays(today, -1)) return `Вчера, ${dayMonth}`;
  if (iso === addDays(today, 1)) return `Завтра, ${dayMonth}`;
  const weekday = dt.toLocaleDateString('ru-RU', { weekday: 'short', timeZone: 'UTC' });
  return `${weekday}, ${dayMonth}`;
}

export function DateSwitcher({
  selected,
  timeZone,
  onSelect,
  onOpenCalendar,
}: {
  selected: string;
  timeZone: string;
  onSelect: (dateLocal: string) => void;
  /** Opens full month calendar with day overview. */
  onOpenCalendar?: () => void;
}) {
  const today = localDateKey(new Date(), timeZone);
  const title = formatTitle(selected, today);

  return (
    <AppCard
      padding="none"
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={title}
    >
      <Pressable
        onPress={() => onSelect(addDays(selected, -1))}
        style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Предыдущий день"
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <Pressable
        onPress={() => (onOpenCalendar ? onOpenCalendar() : onSelect(today))}
        onLongPress={() => onSelect(today)}
        style={({ pressed }) => [styles.center, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={
          onOpenCalendar
            ? `${title}. Открыть календарь. Долгое нажатие — к сегодня`
            : `${title}. Нажмите, чтобы вернуться к сегодня`
        }
      >
        <Text style={styles.title}>{title}</Text>
        {onOpenCalendar ? (
          <Text style={styles.jump}>календарь</Text>
        ) : selected !== today ? (
          <Text style={styles.jump}>к сегодня</Text>
        ) : null}
      </Pressable>
      <Pressable
        onPress={() => onSelect(addDays(selected, 1))}
        style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Следующий день"
      >
        <Ionicons name="chevron-forward" size={22} color={colors.text} />
      </Pressable>
      {onOpenCalendar ? (
        <Pressable
          onPress={onOpenCalendar}
          style={({ pressed }) => [styles.calBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Открыть календарь"
        >
          <Ionicons name="calendar-outline" size={20} color={colors.text} />
        </Pressable>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.lg,
    minHeight: dateChrome.controlMin + 8,
    paddingHorizontal: space.xs,
  },
  arrow: {
    width: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  title: {
    fontSize: type.subtitle,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  jump: {
    marginTop: 2,
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '600',
  },
  calBtn: {
    width: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.xs,
  },
  pressed: { opacity: 0.88 },
});

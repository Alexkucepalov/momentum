import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

import type { HabitWeekDayMark } from '../../../../../src/domain/habitWeek';
import { formatHabitWeekLabel } from '../../../../../src/domain/habitWeek';
import type { HabitAutoSource, HabitKind } from '../../../../../src/storage/types';
import { colors, radius, space, touchMin, type } from '../../theme/tokens';
import { HabitFormFields } from './HabitFormFields';
import { HabitProgressBar } from './HabitProgressBar';
import { HabitWeekStrip } from './HabitWeekStrip';

export function HabitCard({
  name,
  dayLabel = 'выбранный день',
  paused = false,
  kind,
  unit,
  completed,
  target,
  loggedToday,
  marks,
  editing,
  editName,
  editTimes,
  editKind,
  editUnit,
  editTargetValue,
  editAutoSource,
  onChangeEditName,
  onChangeEditTimes,
  onChangeEditKind,
  onChangeEditUnit,
  onChangeEditTargetValue,
  onChangeEditAutoSource,
  onToggleToday,
  onAddQuantity,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onPause,
}: {
  name: string;
  dayLabel?: string;
  paused?: boolean;
  kind: HabitKind;
  unit: string | null;
  completed: number;
  target: number;
  loggedToday: boolean;
  marks: HabitWeekDayMark[];
  editing: boolean;
  editName: string;
  editTimes: number;
  editKind: HabitKind;
  editUnit: string;
  editTargetValue: string;
  editAutoSource: HabitAutoSource;
  onChangeEditName: (t: string) => void;
  onChangeEditTimes: (n: number) => void;
  onChangeEditKind: (k: HabitKind) => void;
  onChangeEditUnit: (t: string) => void;
  onChangeEditTargetValue: (t: string) => void;
  onChangeEditAutoSource: (s: HabitAutoSource) => void;
  onToggleToday: () => void;
  onAddQuantity: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onPause: () => void;
}) {
  if (editing) {
    return (
      <View style={styles.card}>
        <Text style={styles.editTitle}>Изменить привычку</Text>
        <HabitFormFields
          name={editName}
          times={editTimes}
          kind={editKind}
          unit={editUnit}
          targetValue={editTargetValue}
          autoSource={editAutoSource}
          onChangeName={onChangeEditName}
          onChangeTimes={onChangeEditTimes}
          onChangeKind={onChangeEditKind}
          onChangeUnit={onChangeEditUnit}
          onChangeTargetValue={onChangeEditTargetValue}
          onChangeAutoSource={onChangeEditAutoSource}
        />
        <View style={styles.editActions}>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            onPress={onCancelEdit}
            accessibilityRole="button"
            accessibilityLabel="Отмена"
          >
            <Text style={styles.secondaryText}>Отмена</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            onPress={onSaveEdit}
            accessibilityRole="button"
            accessibilityLabel="Сохранить привычку"
          >
            <Text style={styles.primaryText}>Сохранить</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const weekLabel = formatHabitWeekLabel(completed, target, kind === 'quantity' ? unit : null);

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.titleBlock}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.meta}>{weekLabel}</Text>
        </View>
        <View style={styles.iconActions}>
          <Pressable
            onPress={onPause}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={`${paused ? 'Возобновить' : 'Приостановить'} ${name}`}
            hitSlop={6}
          >
            <Ionicons name="pause-outline" size={18} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={onStartEdit}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={`Изменить ${name}`}
            hitSlop={6}
          >
            <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={onDelete}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={`Удалить ${name}`}
            hitSlop={6}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>
      </View>

      {paused ? <Text style={styles.pausedHint}>На паузе. Возобнови привычку, чтобы отмечать дни.</Text> : null}
      <HabitProgressBar completed={completed} target={target} />
      <HabitWeekStrip marks={marks} />

      {kind === 'quantity' ? (
        <View style={styles.qtyActions}>
          <Pressable
            style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
            onPress={onAddQuantity}
            disabled={paused}
            aria-disabled={paused}
            accessibilityRole="button"
            accessibilityLabel={`Изменить количество ${name}`}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.text} />
            <Text style={styles.toggleText}>Значение за день{unit ? ` · ${unit}` : ''}</Text>
          </Pressable>
          {loggedToday ? (
            <Pressable
              style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}
              onPress={onToggleToday}
            disabled={paused}
            aria-disabled={paused}
              accessibilityRole="button"
              accessibilityLabel={`Сбросить ${dayLabel} ${name}`}
            >
              <Text style={styles.clearText}>Сбросить день</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.toggle,
            loggedToday && styles.toggleOn,
            pressed && styles.pressed,
          ]}
          onPress={onToggleToday}
            disabled={paused}
            aria-disabled={paused}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: loggedToday }}
          aria-checked={loggedToday}
          accessibilityLabel={`${name} · ${dayLabel}`}
        >
          <Ionicons
            name={loggedToday ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={loggedToday ? colors.primaryButtonText : colors.text}
          />
          <Text style={[styles.toggleText, loggedToday && styles.toggleTextOn]}>
            {loggedToday ? 'День отмечен' : 'Отметить день'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pausedHint: { color: colors.textSecondary, fontSize: type.caption, marginBottom: space.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.md,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
  },
  titleBlock: { flex: 1 },
  name: {
    fontWeight: '800',
    color: colors.text,
    fontSize: type.body,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: type.caption,
    marginTop: 2,
  },
  iconActions: { flexDirection: 'row', gap: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyActions: { marginTop: space.md, gap: space.sm },
  toggle: {
    marginTop: space.md,
    minHeight: touchMin,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  toggleOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  toggleText: { fontWeight: '700', color: colors.text, fontSize: type.body },
  toggleTextOn: { color: colors.primaryButtonText },
  clearBtn: {
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: { fontWeight: '600', color: colors.textSecondary, fontSize: type.caption },
  editTitle: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
    marginBottom: space.md,
  },
  editActions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  secondaryBtn: {
    flex: 1,
    minHeight: touchMin,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontWeight: '700', color: colors.text },
  primaryBtn: {
    flex: 1,
    minHeight: touchMin,
    borderRadius: radius.md,
    backgroundColor: colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontWeight: '700', color: colors.primaryButtonText },
  pressed: { opacity: 0.88 },
});

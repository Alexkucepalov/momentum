import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PlannedMeal } from '../../../../../../src/storage/types';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { usePlanDrag } from './planDragContext';

export function PlannedMealCard({
  meal,
  macrosLine,
  onPortion,
  onMove,
  onCopy,
  onReplace,
  onDelete,
  onLog,
}: {
  meal: PlannedMeal;
  macrosLine: string;
  onPortion: () => void;
  onMove: () => void;
  onCopy: () => void;
  onReplace: () => void;
  onDelete: () => void;
  onLog: () => void;
}) {
  const logged = meal.status === 'logged';
  const { session, beginDrag } = usePlanDrag();
  const dragging = session?.meal.id === meal.id;
  const handleRef = useRef<View>(null);

  const startDrag = () => {
    if (logged) return;
    handleRef.current?.measureInWindow((x, y, width, height) => {
      beginDrag(meal, x + width / 2, y + height / 2);
    });
  };

  return (
    <View
      style={[styles.card, dragging && styles.cardDragging]}
      accessibilityRole="summary"
      accessibilityLabel={`${meal.displayName}. Удерживай ручку, чтобы перенести`}
    >
      <View style={styles.head}>
        {!logged ? (
          <View ref={handleRef} collapsable={false}>
            <Pressable
              onLongPress={startDrag}
              delayLongPress={220}
              style={({ pressed }) => [styles.handle, pressed && styles.handlePressed]}
              accessibilityRole="button"
              accessibilityLabel={`Перетащить ${meal.displayName}`}
              accessibilityHint="Удерживайте, затем наведите на слот или день"
            >
              <Ionicons name="menu" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : null}
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={2}>
            {meal.displayName}
          </Text>
          <Text style={styles.meta}>
            {Math.round(meal.grams)} г · {macrosLine}
            {logged ? ' · в дневнике' : ''}
          </Text>
        </View>
      </View>
      {!logged && !dragging ? (
        <View style={styles.actions}>
          <Action icon="resize-outline" label="Порция" onPress={onPortion} />
          <Action icon="arrow-forward-outline" label="Перенести" onPress={onMove} />
          <Action icon="copy-outline" label="Копировать" onPress={onCopy} />
          <Action icon="swap-horizontal-outline" label="Заменить" onPress={onReplace} />
          <Action icon="trash-outline" label="Удалить" onPress={onDelete} danger />
          <Action icon="restaurant-outline" label="В дневник" onPress={onLog} primary />
        </View>
      ) : null}
      {!logged && !session ? (
        <Text style={styles.dragHint}>⋯ удерживай слева, чтобы перенести</Text>
      ) : null}
    </View>
  );
}

function Action({
  icon,
  label,
  onPress,
  primary,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.action, primary && styles.actionPrimary, danger && styles.actionDanger]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons
        name={icon}
        size={14}
        color={primary ? colors.primaryButtonText : danger ? colors.danger : colors.text}
      />
      <Text
        style={[
          styles.actionText,
          primary && styles.actionTextPrimary,
          danger && styles.actionTextDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: 4,
    marginBottom: space.sm,
  },
  cardDragging: {
    opacity: 0.35,
    borderStyle: 'dashed',
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  handle: {
    width: touchMin,
    height: touchMin,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
    marginLeft: -4,
  },
  handlePressed: { backgroundColor: colors.border },
  text: { flex: 1 },
  title: { fontSize: type.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: type.caption, color: colors.textSecondary },
  dragHint: {
    fontSize: type.micro,
    color: colors.textMuted,
    marginTop: 2,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  actionPrimary: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  actionDanger: { borderColor: colors.danger },
  actionText: { fontSize: type.micro, fontWeight: '700', color: colors.text },
  actionTextPrimary: { color: colors.primaryButtonText },
  actionTextDanger: { color: colors.danger },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PlannedMeal } from '../../../../../../src/storage/types';
import { FormScrollView } from '@/src/components/FormScrollView';
import { SwipeToDismissSheet } from '@/src/components/SwipeToDismissSheet';
import { colors, elevation, radius, space, touchMin, type } from '@/src/theme/tokens';

type ActionId = 'portion' | 'replace' | 'move' | 'copy' | 'delete' | 'log';

const ACTIONS: Array<{
  id: ActionId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
  primary?: boolean;
}> = [
  { id: 'portion', label: 'Изменить порцию', icon: 'resize-outline' },
  { id: 'replace', label: 'Заменить блюдо', icon: 'swap-horizontal-outline' },
  { id: 'move', label: 'Переместить', icon: 'arrow-forward-outline' },
  { id: 'copy', label: 'Копировать', icon: 'copy-outline' },
  { id: 'delete', label: 'Удалить', icon: 'trash-outline', danger: true },
  { id: 'log', label: 'В дневник', icon: 'restaurant-outline', primary: true },
];

/** Reference screen 5 — actions live in a sheet, not on the card. */
export function MealActionSheet({
  visible,
  meal,
  macrosLine,
  onClose,
  onAction,
}: {
  visible: boolean;
  meal: PlannedMeal | null;
  macrosLine: string;
  onClose: () => void;
  onAction: (id: ActionId) => void;
}) {
  if (!meal) return null;

  return (
    <SwipeToDismissSheet visible={visible} onClose={onClose} maxHeightRatio={0.55}>
      <FormScrollView variant="sheet" contentContainerStyle={styles.body}>
        <Text style={styles.title} numberOfLines={2} accessibilityRole="header">
          {meal.displayName}
        </Text>
        <Text style={styles.meta}>
          {Math.round(meal.grams)} г · {macrosLine}
        </Text>
        <View style={styles.list}>
          {ACTIONS.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => onAction(a.id)}
              style={({ pressed }) => [
                styles.row,
                a.primary && styles.rowPrimary,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={a.label}
            >
              <Ionicons
                name={a.icon}
                size={20}
                color={
                  a.primary
                    ? colors.primaryButtonText
                    : a.danger
                      ? colors.danger
                      : colors.text
                }
              />
              <Text
                style={[
                  styles.rowText,
                  a.primary && styles.rowTextPrimary,
                  a.danger && styles.rowTextDanger,
                ]}
              >
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={onClose} style={styles.cancel} accessibilityRole="button">
          <Text style={styles.cancelText}>Отмена</Text>
        </Pressable>
      </FormScrollView>
    </SwipeToDismissSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.sm },
  title: { fontSize: type.title, fontWeight: '800', color: colors.text },
  meta: { fontSize: type.caption, color: colors.textSecondary, marginBottom: space.sm },
  list: { gap: space.sm },
  row: {
    minHeight: touchMin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
  },
  rowPrimary: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  rowText: { flex: 1, fontSize: type.body, fontWeight: '700', color: colors.text },
  rowTextPrimary: { color: colors.primaryButtonText },
  rowTextDanger: { color: colors.danger },
  cancel: { minHeight: touchMin, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontWeight: '700', color: colors.textSecondary },
  pressed: { opacity: 0.88 },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { SavedMeal } from '../../../../../../src/storage/types';
import { colors, elevation, radius, space, touchMin, type } from '../../../theme/tokens';

export function SavedMealsPanel({
  meals,
  onLog,
  onDelete,
}: {
  meals: SavedMeal[];
  onLog: (meal: SavedMeal) => void;
  onDelete: (meal: SavedMeal) => void;
}) {
  if (meals.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Пока нет сохранённых приёмов</Text>
        <Text style={styles.emptyBody}>
          В дневнике у приёма нажми «Сохранить приём» — потом добавишь весь набор одним тапом (как My
          Meals в MFP).
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.tip}>Тап — добавить все позиции в текущий приём пищи.</Text>
      {meals.map((m) => (
        <View key={m.id} style={styles.row}>
          <Pressable
            style={styles.main}
            onPress={() => onLog(m)}
            accessibilityRole="button"
            accessibilityLabel={`Добавить сохранённый приём ${m.name}`}
          >
            <View style={styles.icon}>
              <Ionicons name="bookmark-outline" size={18} color={colors.text} />
            </View>
            <View style={styles.body}>
              <Text style={styles.name} numberOfLines={1}>
                {m.name}
              </Text>
              <Text style={styles.meta}>{m.items.length} позиций</Text>
            </View>
            <Text style={styles.plus}>+</Text>
          </Pressable>
          <Pressable
            onPress={() => onDelete(m)}
            style={styles.trash}
            accessibilityRole="button"
            accessibilityLabel={`Удалить ${m.name}`}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tip: {
    fontSize: type.caption,
    color: colors.textMuted,
    marginBottom: space.md,
    lineHeight: 18,
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...elevation.card,
    padding: space.xl,
  },
  emptyTitle: { fontSize: type.subtitle, fontWeight: '700', color: colors.text },
  emptyBody: {
    marginTop: space.sm,
    fontSize: type.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...elevation.card,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minHeight: touchMin,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.sm,
  },
  body: { flex: 1 },
  name: { fontWeight: '700', color: colors.text, fontSize: type.body },
  meta: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
  plus: { fontSize: 22, fontWeight: '700', color: colors.text, paddingLeft: space.sm },
  trash: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

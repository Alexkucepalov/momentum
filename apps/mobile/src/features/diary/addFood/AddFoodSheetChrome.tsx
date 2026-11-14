import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedTextInput as TextInput } from '@/src/design-system/components/ThemedTextInput';
import { Ionicons } from '@expo/vector-icons';

import type { MealSlot } from '../../../../../../src/storage/types';
import { AppText, colors, radius, space, touchMin, type } from '@/src/design-system';
import { AddFoodActionChip } from './AddFoodActionChip';
import type { AddFoodTab } from './types';

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

const MEALS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

type AddFoodSheetChromeProps = {
  dateLabel: string;
  meal: MealSlot;
  onChangeMeal: (m: MealSlot) => void;
  mealPickerOpen: boolean;
  onToggleMealPicker: () => void;
  onClose: () => void;
  query: string;
  onChangeQuery: (t: string) => void;
  searching: boolean;
  tab: AddFoodTab;
  onSelectTab: (t: AddFoodTab) => void;
  onOpenScan: () => void;
};

/** Header, meal picker, search, and secondary action chips for AddFoodSheet. */
export function AddFoodSheetChrome({
  dateLabel,
  meal,
  onChangeMeal,
  mealPickerOpen,
  onToggleMealPicker,
  onClose,
  query,
  onChangeQuery,
  searching,
  tab,
  onSelectTab,
  onOpenScan,
}: AddFoodSheetChromeProps) {
  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="title" style={styles.title} accessibilityRole="header">
            Добавить еду
          </AppText>
          <Pressable
            style={styles.mealContext}
            onPress={onToggleMealPicker}
            accessibilityRole="button"
            accessibilityLabel={`Приём: ${MEAL_LABELS[meal]}. Нажмите, чтобы сменить`}
          >
            <AppText variant="caption" tone="muted" style={styles.mealContextText}>
              {dateLabel} · {MEAL_LABELS[meal].toLowerCase()}
            </AppText>
            <Ionicons
              name={mealPickerOpen ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Закрыть"
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={22} color={colors.ink} />
        </Pressable>
      </View>

      {mealPickerOpen ? (
        <View style={styles.mealPicker} accessibilityRole="menu">
          {MEALS.map((m) => {
            const on = meal === m;
            return (
              <Pressable
                key={m}
                style={[styles.mealOpt, on && styles.mealOptOn]}
                onPress={() => onChangeMeal(m)}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: on }}
                accessibilityLabel={MEAL_LABELS[m]}
              >
                <AppText
                  variant="caption"
                  tone={on ? 'inverse' : 'ink'}
                  style={styles.mealOptText}
                >
                  {MEAL_LABELS[m]}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Поиск по продуктам и рецептам"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          accessibilityLabel="Поиск по продуктам и рецептам"
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => onChangeQuery('')}
            accessibilityRole="button"
            accessibilityLabel="Очистить поиск"
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {!searching ? (
        <View style={styles.actions} accessibilityRole="toolbar">
          <AddFoodActionChip icon="barcode-outline" label="Сканер" onPress={onOpenScan} />
          <AddFoodActionChip
            icon="create-outline"
            label="Вручную"
            onPress={() => onSelectTab('manual')}
            active={tab === 'manual'}
          />
          <AddFoodActionChip
            icon="flash-outline"
            label="Быстро"
            onPress={() => onSelectTab('quick')}
            active={tab === 'quick'}
          />
          <AddFoodActionChip
            icon="bookmark-outline"
            label="Приёмы"
            onPress={() => onSelectTab('meals')}
            active={tab === 'meals'}
          />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: space.lg,
    marginBottom: space.md,
  },
  headerText: { flex: 1, paddingRight: space.md },
  title: { fontWeight: '800' },
  mealContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
    minHeight: touchMin,
  },
  mealContextText: { fontWeight: '600' },
  closeBtn: {
    width: touchMin,
    height: touchMin,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingHorizontal: space.lg,
    marginBottom: space.md,
  },
  mealOpt: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: touchMin,
    justifyContent: 'center',
  },
  mealOptOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  mealOptText: { fontWeight: '600' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    paddingHorizontal: space.md,
    minHeight: touchMin,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontSize: type.body, color: colors.ink },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
  },
});

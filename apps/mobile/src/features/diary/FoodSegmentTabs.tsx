import { StyleSheet, View } from 'react-native';

import { SegmentedControl, space } from '@/src/design-system';

export type FoodSegment = 'diary' | 'catalog';

/** Primary Food IA: diary vs catalog — DS SegmentedControl. */
export function FoodSegmentTabs({
  value,
  onChange,
}: {
  value: FoodSegment;
  onChange: (segment: FoodSegment) => void;
}) {
  return (
    <View style={styles.wrap}>
      <SegmentedControl<FoodSegment>
        accessibilityLabel="Раздел питания"
        value={value}
        onChange={onChange}
        options={[
          { id: 'diary', label: 'Дневник' },
          { id: 'catalog', label: 'Каталог' },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md },
});

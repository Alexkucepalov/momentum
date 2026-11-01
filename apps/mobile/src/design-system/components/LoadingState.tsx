import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, space } from '../tokens';
import { AppText } from './AppText';

type LoadingStateProps = {
  label?: string;
  testID?: string;
};

export function LoadingState({ label = 'Загрузка…', testID }: LoadingStateProps) {
  return (
    <View style={styles.wrap} testID={testID} accessibilityLabel={label}>
      <ActivityIndicator color={colors.ink} />
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.xl,
  },
});

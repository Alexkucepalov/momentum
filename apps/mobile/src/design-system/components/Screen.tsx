import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, space } from '../tokens';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
};

export function Screen({
  children,
  scroll = false,
  style,
  contentStyle,
  accessibilityLabel,
  testID,
}: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, contentStyle]} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.root, style]} edges={['left', 'right']} testID={testID}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.screen,
    paddingVertical: space.lg,
    gap: space.md,
  },
});

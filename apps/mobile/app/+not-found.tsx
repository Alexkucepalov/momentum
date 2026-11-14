import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';

import { colors, space } from '@/src/theme/tokens';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.container}>
        <Text style={styles.title} accessibilityRole="header">
          Screen not found
        </Text>
        <Link href="/" style={styles.link} accessibilityRole="link">
          <Text style={styles.linkText}>Go to Today</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
    backgroundColor: colors.background,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  link: { marginTop: space.lg, minHeight: 48, justifyContent: 'center' },
  linkText: { color: colors.accent, fontWeight: '600' },
});

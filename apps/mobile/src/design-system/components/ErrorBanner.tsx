import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, space, touchMin } from '../tokens';
import { AppText } from './AppText';

type ErrorBannerProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

export function ErrorBanner({ message, actionLabel, onAction, testID }: ErrorBannerProps) {
  return (
    <View style={styles.wrap} testID={testID} accessibilityRole="alert">
      <AppText variant="body" tone="danger" style={styles.msg}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <AppText variant="caption" style={styles.actionLabel}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.danger,
    padding: space.md,
    gap: space.sm,
    marginBottom: space.md,
  },
  msg: { fontWeight: '600', lineHeight: 20 },
  action: {
    minHeight: touchMin,
    justifyContent: 'center',
  },
  actionLabel: { fontWeight: '800', color: colors.ink },
  pressed: { opacity: 0.85 },
});

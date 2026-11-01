import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton, AppText, colors, radius, space } from '@/src/design-system';

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  icon = 'nutrition-outline',
  compact = false,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Smaller padding / icon — for first-viewport empty prompts. */
  compact?: boolean;
}) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]} accessibilityRole="summary">
      <View style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
        <Ionicons name={icon} size={compact ? 22 : 28} color={colors.textMuted} />
      </View>
      <AppText variant="subtitle" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="body" tone="secondary" style={[styles.body, compact && styles.bodyCompact]}>
        {body}
      </AppText>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} style={styles.btn} />
      ) : null}
      {secondaryActionLabel && onSecondaryAction ? (
        <AppButton
          label={secondaryActionLabel}
          onPress={onSecondaryAction}
          variant="secondary"
          style={styles.btn}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.xl,
    marginBottom: space.lg,
    alignItems: 'center',
    gap: space.sm,
  },
  wrapCompact: {
    padding: space.md,
    marginBottom: space.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  iconWrapCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  title: { fontWeight: '800', textAlign: 'center' },
  body: { textAlign: 'center', lineHeight: 20 },
  bodyCompact: { fontSize: 13 },
  btn: { alignSelf: 'stretch', marginTop: space.xs },
});

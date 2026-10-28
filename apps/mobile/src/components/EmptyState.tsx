import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PrimaryButton } from './PrimaryButton';
import { colors, space, type } from '../theme/tokens';
import { AppCard } from '@/src/ui/AppCard';

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
    <AppCard
      style={[styles.wrap, compact && styles.wrapCompact]}
      accessibilityRole="summary"
      padding={compact ? 'md' : 'lg'}
    >
      <View style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
        <Ionicons name={icon} size={compact ? 22 : 28} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.body, compact && styles.bodyCompact]}>{body}</Text>
      {actionLabel && onAction ? <PrimaryButton label={actionLabel} onPress={onAction} /> : null}
      {secondaryActionLabel && onSecondaryAction ? (
        <View style={styles.secondaryWrap}>
          <PrimaryButton label={secondaryActionLabel} onPress={onSecondaryAction} />
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.lg,
    alignItems: 'center',
  },
  wrapCompact: {
    marginBottom: space.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  iconWrapCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: space.sm,
  },
  title: {
    fontSize: type.subtitle,
    fontWeight: '700',
    color: colors.text,
    marginBottom: space.sm,
    textAlign: 'center',
  },
  body: {
    fontSize: type.body,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: space.lg,
    textAlign: 'center',
  },
  bodyCompact: {
    fontSize: type.caption,
    lineHeight: 18,
    marginBottom: space.md,
  },
  secondaryWrap: { marginTop: space.sm, alignSelf: 'stretch' },
});

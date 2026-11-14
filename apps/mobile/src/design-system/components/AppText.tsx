import { StyleSheet, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { ThemedText as Text } from './ThemedText';

import { colors, type as typeScale } from '../tokens';

type Variant = 'metric' | 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';
type Tone = 'ink' | 'secondary' | 'muted' | 'accent' | 'inverse' | 'danger';

const toneColor: Record<Tone, string> = {
  ink: colors.ink,
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  accent: colors.accent,
  inverse: colors.textOnInverse,
  danger: colors.danger,
};

type AppTextProps = TextProps & {
  variant?: Variant;
  tone?: Tone;
  style?: StyleProp<TextStyle>;
};

export function AppText({
  variant = 'body',
  tone = 'ink',
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        styles.base,
        variant === 'metric' && styles.metric,
        variant === 'hero' && styles.hero,
        variant === 'title' && styles.title,
        variant === 'subtitle' && styles.subtitle,
        variant === 'body' && styles.body,
        variant === 'caption' && styles.caption,
        variant === 'label' && styles.label,
        { color: toneColor[tone] },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.ink,
  },
  metric: {
    fontSize: typeScale.metric,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  hero: {
    fontSize: typeScale.hero,
    fontWeight: '500',
    letterSpacing: -0.4,
  },
  title: {
    fontSize: typeScale.title,
    fontWeight: '500',
    letterSpacing: -0.9,
  },
  subtitle: {
    fontSize: typeScale.subtitle,
    fontWeight: '600',
  },
  body: {
    fontSize: typeScale.body,
    fontWeight: '400',
    lineHeight: 21,
  },
  caption: {
    fontSize: typeScale.caption,
    fontWeight: '400',
  },
  label: {
    fontSize: typeScale.label,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, space } from '../tokens';
import { AppText } from './AppText';

type ChartFrameProps = {
  title: string;
  subtitle?: string | null;
  footnote?: string | null;
  children: ReactNode;
  testID?: string;
};

/** Shared chrome for week bars, sleep stages, sparklines. */
export function ChartFrame({ title, subtitle, footnote, children, testID }: ChartFrameProps) {
  return (
    <View style={styles.wrap} testID={testID} accessibilityLabel={title}>
      <AppText variant="label" tone="muted">
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="caption" tone="secondary" style={styles.sub}>
          {subtitle}
        </AppText>
      ) : null}
      <View style={styles.plot}>{children}</View>
      {footnote ? (
        <AppText variant="caption" tone="muted" style={styles.foot}>
          {footnote}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space.screen,
    marginBottom: space.md,
    gap: space.sm,
  },
  sub: { marginTop: -4 },
  plot: { minHeight: 48 },
  foot: { lineHeight: 18 },
});

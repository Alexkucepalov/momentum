import { StyleSheet, View } from 'react-native';

import type { WorkoutSession } from '../../../../../src/domain/strength/types';
import { AppButton, AppText, colors, radius, space } from '@/src/design-system';

/** Slim continue bar — only when a draft session exists. */
export function DraftSessionBanner({
  session,
  onContinue,
}: {
  session: WorkoutSession;
  onContinue: () => void;
}) {
  return (
    <View style={styles.wrap} testID="draft-session-banner">
      <View style={styles.text}>
        <AppText variant="caption" tone="inverse" style={styles.eyebrow}>
          Черновик
        </AppText>
        <AppText variant="subtitle" tone="inverse" numberOfLines={1}>
          {session.title}
        </AppText>
      </View>
      <AppButton
        label="Продолжить"
        variant="secondary"
        onPress={onContinue}
        testID="draft-continue"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.xl,
    backgroundColor: colors.accent,
  },
  text: { flex: 1, gap: 2 },
  eyebrow: { opacity: 0.75, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});

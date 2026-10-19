import { StyleSheet, View } from 'react-native';

import { habitWeekProgressRatio } from '../../../../../src/domain/habitWeek';
import { colors, radius, space } from '../../theme/tokens';

/** Calm fill — never red for incomplete weeks. */
export function HabitProgressBar({
  completed,
  target,
}: {
  completed: number;
  target: number;
}) {
  const ratio = habitWeekProgressRatio(completed, target);
  const met = target > 0 && completed >= target;
  return (
    <View
      style={styles.track}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[
          styles.fill,
          { width: `${Math.round(ratio * 100)}%` },
          met && styles.fillMet,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    overflow: 'hidden',
    marginTop: space.sm,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.textSecondary,
  },
  fillMet: {
    backgroundColor: colors.text,
  },
});

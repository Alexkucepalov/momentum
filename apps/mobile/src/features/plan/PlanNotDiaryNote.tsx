import type { StyleProp, TextStyle } from 'react-native';

import { AppText } from '@/src/design-system';

/** Shared plan ≠ diary caption — one wording everywhere. */
export function PlanNotDiaryNote({
  style,
  extra,
}: {
  style?: StyleProp<TextStyle>;
  /** Optional trailing context (e.g. « · черновик»). */
  extra?: string;
}) {
  return (
    <AppText variant="caption" tone="muted" style={style} testID="plan-neq-diary">
      План не пишет в дневник сам — только явная порция{extra ?? ''}
    </AppText>
  );
}

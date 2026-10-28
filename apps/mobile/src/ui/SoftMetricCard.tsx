import type { ReactNode } from 'react';

import { BentoStat } from './BentoStat';

/**
 * @deprecated Use `BentoStat`. Kept for temporary call-site compatibility.
 * `visual` / `tall` ignored — Nutrition Soft Light uses one metric cell.
 */
export function SoftMetricCard({
  label,
  value,
  meta,
  wide,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  value: string;
  meta?: string;
  visual?: ReactNode;
  tall?: boolean;
  wide?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  void accessibilityLabel;
  return <BentoStat label={label} value={value} meta={meta} wide={wide} onPress={onPress} />;
}

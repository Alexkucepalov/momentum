import type { ReactNode } from 'react';

import { BentoStat } from './BentoStat';

/**
 * @deprecated Use `BentoStat`. Compat alias for Nutrition Soft Light (PR-A).
 * `visual` / `tall` are ignored — one metric cell pattern only.
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
  return (
    <BentoStat
      label={label}
      value={value}
      meta={meta}
      wide={wide}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

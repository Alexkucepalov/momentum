import { AppButton } from '@/src/design-system';

/**
 * @deprecated Use `AppButton` from `@/src/design-system`.
 * Thin compatibility wrapper — same primary CTA contract.
 */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  accessibilityHint,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
}) {
  return (
    <AppButton
      label={label}
      onPress={onPress}
      disabled={disabled}
      accessibilityHint={accessibilityHint}
      variant="primary"
    />
  );
}

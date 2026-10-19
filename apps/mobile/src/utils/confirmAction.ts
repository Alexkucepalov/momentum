import { Alert, Platform } from 'react-native';

/**
 * Confirm dialog that works on web (RN Alert buttons are unreliable in browsers).
 */
export function confirmAction(
  title: string,
  message: string,
  options: {
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
  },
): void {
  const confirmLabel = options.confirmLabel ?? 'OK';
  const cancelLabel = options.cancelLabel ?? 'Отмена';

  if (Platform.OS === 'web') {
    const ok =
      typeof globalThis.confirm === 'function'
        ? globalThis.confirm(`${title}\n\n${message}`)
        : true;
    if (ok) options.onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    {
      text: confirmLabel,
      style: options.destructive ? 'destructive' : 'default',
      onPress: options.onConfirm,
    },
  ]);
}

export function alertMessage(title: string, message: string): void {
  if (Platform.OS === 'web' && typeof globalThis.alert === 'function') {
    globalThis.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

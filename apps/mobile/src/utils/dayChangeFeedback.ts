import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Light haptic when the shared diary day changes (swipe / strip / switcher). */
export async function feedbackDayChange(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Haptics unavailable on some emulators — ignore.
  }
}

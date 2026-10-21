import * as ImagePicker from 'expo-image-picker';

/** Pick a full-screen order/cart screenshot (no crop — keeps line layout). */
export async function pickPurchaseScreenshotFromLibrary(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Нужен доступ к галерее, чтобы выбрать скрин заказа');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.9,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}

/** Capture order/cart from camera (local only). */
export async function takePurchaseScreenshot(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Нужен доступ к камере, чтобы снять экран заказа');
  }
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.9,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}

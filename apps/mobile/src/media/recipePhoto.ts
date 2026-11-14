import * as FileSystem from 'expo-file-system/legacy';

import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { getLocalDataWipeEpoch } from '../../../../src/domain/localDataWipeEpoch';

async function ensureRecipesDir(): Promise<string | null> {
  const base = FileSystem.documentDirectory;
  if (!base) return null;
  const dir = `${base}recipes/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

/** Copy picked image into app documents so it survives cache cleanup. */
export async function persistRecipePhoto(sourceUri: string, recipeKey: string): Promise<string> {
  const epoch = getLocalDataWipeEpoch();
  if (Platform.OS === 'web') return sourceUri;
  const dir = await ensureRecipesDir();
  if (!dir) throw new Error('Не удалось сохранить фото. Повтори попытку или убери фото.');
  const safe = recipeKey.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dest = `${dir}${safe}-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  if (epoch !== getLocalDataWipeEpoch()) {
    await FileSystem.deleteAsync(dest, { idempotent: true });
    throw new Error('Данные изменились. Открой рецепт заново.');
  }
  return dest;
}

export async function pickRecipePhotoFromLibrary(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Нужен доступ к галерее, чтобы прикрепить фото');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.72,
    allowsEditing: true,
    aspect: [4, 3],
  });
  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}

export async function takeRecipePhoto(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Нужен доступ к камере, чтобы сфотографировать блюдо');
  }
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.72,
    allowsEditing: true,
    aspect: [4, 3],
  });
  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}

/** Only app-owned copies; gallery originals are never removed. */
export async function clearRecipePhotos(): Promise<void> {
  if (Platform.OS === 'web') return;
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error('Каталог фото недоступен');
  await FileSystem.deleteAsync(`${base}recipes/`, { idempotent: true });
}

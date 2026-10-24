import * as FileSystem from 'expo-file-system/legacy';

/** Local draft for «Рецепт из текста» — survives leaving the screen / cold restart. */
const FILE_NAME = 'momentum-recipe-import-draft.txt';

function draftUri(): string | null {
  const base = FileSystem.documentDirectory;
  if (!base) return null;
  return `${base}${FILE_NAME}`;
}

export async function loadImportTextDraft(): Promise<string> {
  const uri = draftUri();
  if (!uri) return '';
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return '';
    return await FileSystem.readAsStringAsync(uri);
  } catch {
    return '';
  }
}

export async function saveImportTextDraft(raw: string): Promise<void> {
  const uri = draftUri();
  if (!uri) return;
  const text = raw.trimEnd();
  if (!text.trim()) {
    await clearImportTextDraft();
    return;
  }
  try {
    await FileSystem.writeAsStringAsync(uri, text);
  } catch {
    // Best-effort — import still works without persistence.
  }
}

export async function clearImportTextDraft(): Promise<void> {
  const uri = draftUri();
  if (!uri) return;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore
  }
}

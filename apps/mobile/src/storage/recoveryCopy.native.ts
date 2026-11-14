import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const folder = () => {
  if (!FileSystem.cacheDirectory) throw new Error("Каталог копий недоступен");
  return `${FileSystem.cacheDirectory}nf-fit-recovery/`;
};
export async function saveRecoveryCopy(payload: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Сохранение копии недоступно");
  await FileSystem.makeDirectoryAsync(folder(), { intermediates: true });
  const file = `${folder()}nf-fit-recovery-${Date.now()}.txt`;
  await FileSystem.writeAsStringAsync(file, payload, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await Sharing.shareAsync(file, {
    mimeType: "text/plain",
    dialogTitle: "Сохранить личную копию nf-fit",
  });
}
/** Full local wipe also removes recovery copies kept in this app's private cache. */
export async function clearRecoveryCopies(): Promise<void> {
  await FileSystem.deleteAsync(folder(), { idempotent: true });
}

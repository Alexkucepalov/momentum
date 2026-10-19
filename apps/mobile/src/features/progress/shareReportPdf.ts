import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Print HTML → PDF, then copy into app cache so Android Sharing can read it.
 * expo-print often writes under a path Sharing rejects («Not allowed to read file»).
 */
export async function shareHtmlAsPdf(html: string, fileNameBase = 'momentum-report'): Promise<'shared' | 'printed' | 'saved'> {
  if (Platform.OS === 'web') {
    throw new Error('На web используй отдельный HTML-путь');
  }

  const printed = await Print.printToFileAsync({ html, base64: false });
  const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!baseDir) {
    // Last resort: system print sheet (Save as PDF).
    await Print.printAsync({ html });
    return 'printed';
  }

  const safe = fileNameBase.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dest = `${baseDir}${safe}-${Date.now()}.pdf`;

  try {
    const info = await FileSystem.getInfoAsync(printed.uri);
    if (info.exists) {
      await FileSystem.copyAsync({ from: printed.uri, to: dest });
    } else {
      // Some devices return content:// — moveAsync/copy may still work
      await FileSystem.copyAsync({ from: printed.uri, to: dest });
    }
  } catch {
    // If copy fails, try sharing the original URI anyway, then print fallback.
    const canShareOrig = await Sharing.isAvailableAsync();
    if (canShareOrig) {
      try {
        await Sharing.shareAsync(printed.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Momentum — личный отчёт',
          UTI: 'com.adobe.pdf',
        });
        return 'shared';
      } catch {
        await Print.printAsync({ html });
        return 'printed';
      }
    }
    await Print.printAsync({ html });
    return 'printed';
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    try {
      await Sharing.shareAsync(dest, {
        mimeType: 'application/pdf',
        dialogTitle: 'Momentum — личный отчёт',
        UTI: 'com.adobe.pdf',
      });
      return 'shared';
    } catch {
      await Print.printAsync({ html });
      return 'printed';
    }
  }

  return 'saved';
}

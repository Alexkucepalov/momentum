import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { setTelemetryEnabled, useResourceDownload } from 'react-native-executorch';
import { OCR_RUSSIAN, useOCR, initExecutorch } from 'react-native-executorch/legacy';

import {
  purchaseTextFromOcrDetections,
  type PurchaseOcrResult,
} from './purchaseScreenshotOcr';

// The modern downloader owns caching and its public analytics opt-out.
setTelemetryEnabled(false);
// Legacy OCR still accepts URI images. Its adapter serves only files already
// resolved by the modern downloader, so no legacy download telemetry can fire.
initExecutorch({ resourceFetcher: {
  async fetch(callback, ...sources) {
    const paths = sources.map(source => {
      if (typeof source !== 'string' || /^https?:\/\//i.test(source)) throw new Error('OCR ожидает локальный файл');
      return source.replace(/^file:\/\//, '');
    });
    callback(1);
    return { paths, wasDownloaded: paths.map(() => false) };
  },
  readAsString: path => FileSystem.readAsStringAsync(path.startsWith('file://') ? path : `file://${path}`),
} });

/**
 * On-device Cyrillic OCR for order/cart screenshots (Самокат / METRO).
 * Photos stay on device; first run may download model weights (not the image).
 * Pass `enabled` only when user opens «Скрин» so we don't download models early.
 */
export function usePurchaseScreenshotOcr(enabled = true) {
  const web = Platform.OS === 'web';
  const { resource, downloadProgress, downloadError } = useResourceDownload(OCR_RUSSIAN, { preventLoad: web || !enabled });
  const { isReady, isGenerating, error: runtimeError, forward } = useOCR({
    model: resource ?? OCR_RUSSIAN,
    preventLoad: web || !enabled || !resource,
  });
  const error = downloadError ?? runtimeError;

  const recognizeUri = useCallback(
    async (uri: string): Promise<PurchaseOcrResult> => {
      if (web) {
        throw new Error('OCR скрина работает в Android-сборке, не на web. Вставь текст заказа.');
      }
      if (!isReady || !forward) {
        throw new Error(
          downloadProgress > 0 && downloadProgress < 1
            ? `Модель OCR ещё качается… ${Math.round(downloadProgress * 100)}%`
            : 'OCR ещё не готов. Подожди загрузку модели или вставь текст.',
        );
      }
      if (error) {
        throw new Error(error.message || 'Ошибка OCR. Вставь текст заказа вручную.');
      }
      const detections = await forward(uri);
      return purchaseTextFromOcrDetections(
        detections.map((d) => ({ text: d.text, score: d.score })),
      );
    },
    [web, isReady, forward, downloadProgress, error],
  );

  return {
    isReady: web ? false : isReady,
    isGenerating,
    downloadProgress: web ? 0 : downloadProgress,
    modelError: error,
    recognizeUri,
  };
}

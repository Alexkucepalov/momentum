import { useCallback } from 'react';
import { Platform } from 'react-native';
import { OCR_RUSSIAN, useOCR } from 'react-native-executorch/legacy';

import {
  purchaseTextFromOcrDetections,
  type PurchaseOcrResult,
} from './purchaseScreenshotOcr';

/**
 * On-device Cyrillic OCR for order/cart screenshots (Самокат / METRO).
 * Photos stay on device; first run may download model weights (not the image).
 * Pass `enabled` only when user opens «Скрин» so we don't download models early.
 */
export function usePurchaseScreenshotOcr(enabled = true) {
  const web = Platform.OS === 'web';
  const { isReady, isGenerating, downloadProgress, error, forward } = useOCR({
    model: OCR_RUSSIAN,
    preventLoad: web || !enabled,
  });

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

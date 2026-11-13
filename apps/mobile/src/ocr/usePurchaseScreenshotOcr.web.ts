import { useCallback } from 'react';
import type { PurchaseOcrResult } from './purchaseScreenshotOcr';

/** Native OCR must not initialize a model, downloader or native bridge on web. */
export function usePurchaseScreenshotOcr(_enabled = true) {
  const recognizeUri = useCallback(async (_uri: string): Promise<PurchaseOcrResult> => {
    throw new Error('OCR скрина работает в Android-сборке. Здесь можно вставить текст заказа.');
  }, []);
  return { isReady: false, isGenerating: false, downloadProgress: 0, modelError: null, recognizeUri };
}

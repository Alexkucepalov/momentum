import { useCallback } from 'react';

import type { PurchaseOcrResult } from './purchaseScreenshotOcr';

/** Web stub: on-device ExecuTorch OCR is Android/iOS native only. */
export function usePurchaseScreenshotOcr(_enabled = true) {
  const recognizeUri = useCallback(async (_uri: string): Promise<PurchaseOcrResult> => {
    throw new Error('OCR скрина работает в Android-сборке, не на web. Вставь текст заказа.');
  }, []);

  return {
    isReady: false,
    isGenerating: false,
    downloadProgress: 0,
    modelError: null as Error | null,
    recognizeUri,
  };
}

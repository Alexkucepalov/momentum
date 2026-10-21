import { joinOcrDetections } from '../../../../src/domain/cleanOcrPurchaseText';

export type PurchaseOcrEngine = 'executorch-ru';

export type PurchaseOcrResult = {
  text: string;
  engine: PurchaseOcrEngine;
  detectionCount: number;
};

export type PurchaseOcrDetection = {
  text: string;
  score?: number;
};

/** Map native detections → paste-ready text (local only). */
export function purchaseTextFromOcrDetections(
  detections: PurchaseOcrDetection[],
): PurchaseOcrResult {
  const text = joinOcrDetections(detections);
  if (!text.trim()) {
    throw new Error('OCR не нашёл текст на скрине. Попробуй другой кадр или вставь текст заказа.');
  }
  return {
    text,
    engine: 'executorch-ru',
    detectionCount: detections.length,
  };
}

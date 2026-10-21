import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { cleanOcrPurchaseText, joinOcrDetections } = mods['domain/cleanOcrPurchaseText'];
const { parsePurchasePaste } = mods['domain/parsePurchasePaste'];
const { purchaseTextFromOcrDetections } = (() => {
  // Mobile helper mirrors domain join — test domain path used by adapter.
  return {
    purchaseTextFromOcrDetections(detections) {
      const text = joinOcrDetections(detections);
      if (!text.trim()) throw new Error('empty');
      return text;
    },
  };
})();

test('cleanOcrPurchaseText collapses OCR noise without inventing totals', () => {
  const raw = `Магазин:  Самокат\nМолоко  1 л — 89 ₽\n·\nХлеб 1 шт 45\nИтого: 134`;
  const cleaned = cleanOcrPurchaseText(raw);
  assert.match(cleaned, /Самокат/);
  assert.doesNotMatch(cleaned, /^·$/m);
  const parsed = parsePurchasePaste(cleaned);
  assert.ok(parsed.lines.length >= 2);
});

test('OCR-like Самокат paste still parses food lines', () => {
  const ocrLike = cleanOcrPurchaseText(`Магазин Самокат
Молоко паст 3 2% 1 л 119 руб
Творог 5% 180 г 89
Пакет майка 5
Итого 213`);
  const parsed = parsePurchasePaste(ocrLike);
  assert.equal(parsed.storeLabel, 'Самокат');
  const foods = parsed.lines.filter((l) => l.isFood && !l.excluded);
  assert.ok(foods.length >= 2);
});

test('OCR-like METRO paste keeps unknown qty as null when missing', () => {
  const ocrLike = cleanOcrPurchaseText(`Магазин: METRO
Куриное филе охл
Яйцо С1 10 шт 129 ₽
Итого: 129`);
  const parsed = parsePurchasePaste(ocrLike);
  assert.match(parsed.storeLabel ?? '', /METRO/i);
  const fillet = parsed.lines.find((l) => /филе/i.test(l.displayName));
  assert.ok(fillet);
  assert.equal(fillet.quantity, null);
  assert.equal(fillet.lineTotalRub, null);
});

test('joinOcrDetections builds paste text', () => {
  const text = purchaseTextFromOcrDetections([
    { text: 'Магазин: Самокат' },
    { text: 'Хлеб 1 шт 40' },
    { text: 'Итого: 40' },
  ]);
  const parsed = parsePurchasePaste(text);
  assert.equal(parsed.lines.filter((l) => l.isFood).length, 1);
});

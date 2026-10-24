import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const {
  PURCHASE_PREVIEW_VIEWPORTS_DP,
  purchasePreviewInnerFieldWidthDp,
  purchasePreviewFitsViewport,
  PREVIEW_MIN_FIELD_WIDTH_DP,
} = loadSrcModules()['domain/purchasePreviewLayout'];

test('Q-04: preview field width fits 320/360/390 dp with page+card padding', () => {
  for (const vp of PURCHASE_PREVIEW_VIEWPORTS_DP) {
    const inner = purchasePreviewInnerFieldWidthDp(vp);
    assert.ok(
      purchasePreviewFitsViewport(vp),
      `${vp}dp → inner ${inner} < ${PREVIEW_MIN_FIELD_WIDTH_DP}`,
    );
    assert.ok(inner >= PREVIEW_MIN_FIELD_WIDTH_DP);
  }
  // 320 − 16*2 − 12*2 − 1*2 = 320 − 32 − 24 − 2 = 262
  assert.equal(purchasePreviewInnerFieldWidthDp(320), 262);
});

test('Q-04: rejects non-positive viewport', () => {
  assert.throws(() => purchasePreviewInnerFieldWidthDp(0));
  assert.throws(() => purchasePreviewInnerFieldWidthDp(-1));
});

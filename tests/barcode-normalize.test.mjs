import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { barcodeLookupCandidates, isPlausibleBarcode } = loadSrcModules()['integrations/barcodeNormalize'];

test('UPC-A expands to EAN-13 candidate', () => {
  const list = barcodeLookupCandidates('012345678905');
  assert.ok(list.includes('012345678905'));
  assert.ok(list.includes('0012345678905'));
});

test('EAN-13 with leading zero also tries 12-digit form', () => {
  const list = barcodeLookupCandidates('0460000000000');
  assert.ok(list.includes('0460000000000'));
  assert.ok(list.includes('460000000000'));
});

test('rejects too-short codes', () => {
  assert.equal(isPlausibleBarcode('123'), false);
  assert.deepEqual(barcodeLookupCandidates('12-34'), []);
});

test('GTIN-14 strips indicator and tries EAN-13', () => {
  const list = barcodeLookupCandidates('04607022390843');
  assert.ok(list.includes('04607022390843'));
  assert.ok(list.includes('4607022390843'));
});

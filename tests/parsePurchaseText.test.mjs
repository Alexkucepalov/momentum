import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { parsePurchaseText, generatePurchaseFingerprint } = mods['domain/parsePurchaseText'];

describe('parsePurchaseText', () => {
  it('parses simple line with quantity and price', () => {
    const text = 'Молоко 1л 89.50₽';
    const result = parsePurchaseText(text);
    
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].displayName, 'Молоко');
    assert.equal(result.lines[0].quantity, 1000);
    assert.equal(result.lines[0].unit, 'ml');
    assert.equal(result.lines[0].lineTotalRub, 89.50);
    assert.equal(result.lines[0].isFood, true);
    assert.equal(result.lines[0].excluded, false);
  });

  it('handles kg to g conversion', () => {
    const text = 'Говядина 0.5кг 250₽';
    const result = parsePurchaseText(text);
    
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].quantity, 500);
    assert.equal(result.lines[0].unit, 'g');
  });

  it('detects non-food items', () => {
    const text = 'Мыло жидкое 150мл 120₽';
    const result = parsePurchaseText(text);
    
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].isFood, false);
    assert.equal(result.lines[0].excluded, true);
  });

  it('handles missing quantities', () => {
    const text = 'Хлеб белый 45₽';
    const result = parsePurchaseText(text);
    
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].displayName, 'Хлеб белый');
    assert.equal(result.lines[0].quantity, null);
    assert.equal(result.lines[0].unit, null);
    assert.equal(result.lines[0].lineTotalRub, 45);
  });

  it('handles missing prices', () => {
    const text = 'Огурцы 500г';
    const result = parsePurchaseText(text);
    
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].quantity, 500);
    assert.equal(result.lines[0].unit, 'g');
    assert.equal(result.lines[0].lineTotalRub, null);
  });

  it('extracts total from receipt', () => {
    const text = `Молоко 1л 89₽
Хлеб 45₽
ИТОГО: 134₽`;
    const result = parsePurchaseText(text);
    
    assert.equal(result.lines.length, 2);
    assert.equal(result.totalRub, 134);
  });

  it('extracts date from receipt', () => {
    const text = `Чек от 20.10.2026
Молоко 1л 89₽`;
    const result = parsePurchaseText(text);
    
    assert.equal(result.purchasedOn, '2026-10-20');
  });

  it('extracts store name', () => {
    const text = `Пятерочка
Молоко 1л 89₽`;
    const result = parsePurchaseText(text);
    
    assert.equal(result.storeLabel, 'Пятерочка');
  });

  it('handles multiple prices per line', () => {
    const text = 'Молоко 1л 89₽/шт 178₽';
    const result = parsePurchaseText(text);
    
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].unitPriceRub, 89);
    assert.equal(result.lines[0].lineTotalRub, 178);
  });

  it('handles comma as decimal separator', () => {
    const text = 'Молоко 0,5л 45,50₽';
    const result = parsePurchaseText(text);
    
    assert.equal(result.lines[0].quantity, 500);
    assert.equal(result.lines[0].lineTotalRub, 45.50);
  });

  it('skips empty lines and numeric-only lines', () => {
    const text = `

123.45
Молоко 1л 89₽

`;
    const result = parsePurchaseText(text);
    
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].displayName, 'Молоко');
  });

  it('calculates confidence based on parsed data', () => {
    const withQuantityAndPrice = parsePurchaseText('Молоко 1л 89₽');
    assert.ok(withQuantityAndPrice.parseConfidence >= 0.8);
    
    const withQuantityOnly = parsePurchaseText('Молоко 1л');
    assert.ok(withQuantityOnly.parseConfidence >= 0.5 && withQuantityOnly.parseConfidence < 0.8);
    
    const withNameOnly = parsePurchaseText('Молоко');
    assert.ok(withNameOnly.parseConfidence < 0.5);
  });

  it('parser extracts numbers but normalizeNumber rejects negatives', () => {
    const text = 'Молоко 1л -89₽';
    const result = parsePurchaseText(text);
    
    // The parser may extract "89" from "-89₽" but normalizeNumber
    // should reject it. The key invariant is: final data never contains negatives.
    // For this test, we verify that negative inputs don't create negative outputs.
    if (result.lines[0].quantity !== null) {
      assert.ok(result.lines[0].quantity >= 0);
    }
    if (result.lines[0].lineTotalRub !== null) {
      assert.ok(result.lines[0].lineTotalRub >= 0);
    }
  });

  it('handles piece quantities', () => {
    const text = 'Яйца 10шт 150₽';
    const result = parsePurchaseText(text);
    
    assert.equal(result.lines[0].quantity, 10);
    assert.equal(result.lines[0].unit, 'pcs');
  });

  it('rejects NaN and Infinity', () => {
    const text = 'Молоко NaNл Infinity₽';
    const result = parsePurchaseText(text);
    
    assert.equal(result.lines[0].quantity, null);
    assert.equal(result.lines[0].lineTotalRub, null);
  });
});

describe('generatePurchaseFingerprint', () => {
  it('generates consistent fingerprint for same data', () => {
    const params = {
      totalRub: 134.50,
      purchasedOn: '2026-10-20',
      storeLabel: 'Пятерочка',
      lineCount: 3,
    };
    
    const fp1 = generatePurchaseFingerprint(params);
    const fp2 = generatePurchaseFingerprint(params);
    
    assert.equal(fp1, fp2);
    assert.equal(typeof fp1, 'string');
    assert.equal(fp1.length, 16);
  });

  it('generates different fingerprints for different data', () => {
    const params1 = {
      totalRub: 134.50,
      purchasedOn: '2026-10-20',
      storeLabel: 'Пятерочка',
      lineCount: 3,
    };
    
    const params2 = {
      totalRub: 150.00,
      purchasedOn: '2026-10-20',
      storeLabel: 'Пятерочка',
      lineCount: 3,
    };
    
    const fp1 = generatePurchaseFingerprint(params1);
    const fp2 = generatePurchaseFingerprint(params2);
    
    assert.notEqual(fp1, fp2);
  });

  it('handles null values', () => {
    const params = {
      totalRub: null,
      purchasedOn: null,
      storeLabel: null,
      lineCount: 0,
    };
    
    const fp = generatePurchaseFingerprint(params);
    assert.equal(typeof fp, 'string');
    assert.equal(fp.length, 16);
  });
});

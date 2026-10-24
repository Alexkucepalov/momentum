import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseProductListText } from '../src/domain/parseProductListText.ts';

await describe('parseProductListText', async () => {
  await test('empty input returns empty with warning', () => {
    const result = parseProductListText('');
    assert.deepStrictEqual(result.products, []);
    assert.ok(result.warnings.length > 0);
    assert.ok(result.warnings[0].includes('пустые'));
  });

  await test('whitespace-only returns empty with warning', () => {
    const result = parseProductListText('   \n\n   \n');
    assert.deepStrictEqual(result.products, []);
    assert.ok(result.warnings.length > 0);
  });

  await test('single product name', () => {
    const result = parseProductListText('Молоко');
    assert.deepStrictEqual(result.products, [{ displayName: 'Молоко' }]);
    assert.deepStrictEqual(result.warnings, []);
  });

  await test('multiple products on separate lines', () => {
    const result = parseProductListText('Молоко\nХлеб\nТворог');
    assert.deepStrictEqual(result.products, [
      { displayName: 'Молоко' },
      { displayName: 'Хлеб' },
      { displayName: 'Творог' },
    ]);
    assert.deepStrictEqual(result.warnings, []);
  });

  await test('strips list bullets and numbers', () => {
    const result = parseProductListText('• Молоко\n* Хлеб\n- Творог\n1. Яйца\n2) Масло');
    assert.deepStrictEqual(result.products, [
      { displayName: 'Молоко' },
      { displayName: 'Хлеб' },
      { displayName: 'Творог' },
      { displayName: 'Яйца' },
      { displayName: 'Масло' },
    ]);
  });

  await test('skips empty lines between products', () => {
    const result = parseProductListText('Молоко\n\nХлеб\n   \nТворог');
    assert.deepStrictEqual(result.products, [
      { displayName: 'Молоко' },
      { displayName: 'Хлеб' },
      { displayName: 'Творог' },
    ]);
  });

  await test('skips common header lines', () => {
    const result = parseProductListText('Продукты:\nМолоко\nСписок\nХлеб');
    assert.deepStrictEqual(result.products, [
      { displayName: 'Молоко' },
      { displayName: 'Хлеб' },
    ]);
  });

  await test('removes trailing price in rubles', () => {
    const result = parseProductListText('Молоко - 89 ₽\nХлеб, 45 руб\nТворог - 120 р.');
    assert.deepStrictEqual(result.products, [
      { displayName: 'Молоко' },
      { displayName: 'Хлеб' },
      { displayName: 'Творог' },
    ]);
  });

  await test('removes trailing notes in parentheses', () => {
    const result = parseProductListText('Молоко (1 литр)\nХлеб (батон белый)');
    assert.deepStrictEqual(result.products, [
      { displayName: 'Молоко' },
      { displayName: 'Хлеб' },
    ]);
  });

  await test('preserves compound names like percentages', () => {
    const result = parseProductListText('Молоко 2.5%\nТворог 5%\nЙогурт 1.5%');
    assert.deepStrictEqual(result.products, [
      { displayName: 'Молоко 2.5%' },
      { displayName: 'Творог 5%' },
      { displayName: 'Йогурт 1.5%' },
    ]);
  });

  await test('deduplicates case-insensitive', () => {
    const result = parseProductListText('Молоко\nмолоко\nМОЛОКО\nХлеб');
    assert.deepStrictEqual(result.products, [
      { displayName: 'Молоко' },
      { displayName: 'Хлеб' },
    ]);
  });

  await test('handles mixed Russian and English', () => {
    const result = parseProductListText('Milk\nХлеб\nButter\nТворог');
    assert.deepStrictEqual(result.products, [
      { displayName: 'Milk' },
      { displayName: 'Хлеб' },
      { displayName: 'Butter' },
      { displayName: 'Творог' },
    ]);
  });

  await test('real-world example: shopping list from delivery', () => {
    const text = `Мои продукты:
• Молоко 2.5% - 89 ₽
• Хлеб (батон) - 45 руб
• Творог 5%
* Яйца С0
- Масло сливочное, 250 г
1. Гречка
2) Рис`;
    
    const result = parseProductListText(text);
    assert.strictEqual(result.products.length, 7);
    assert.strictEqual(result.products[0].displayName, 'Молоко 2.5%');
    assert.strictEqual(result.products[1].displayName, 'Хлеб');
    assert.strictEqual(result.products[2].displayName, 'Творог 5%');
  });

  await test('handles only headers with no products', () => {
    const result = parseProductListText('Продукты:\nСписок\nMy products');
    assert.deepStrictEqual(result.products, []);
    assert.ok(result.warnings.length > 0);
    assert.ok(result.warnings[0].includes('распознать'));
  });
});

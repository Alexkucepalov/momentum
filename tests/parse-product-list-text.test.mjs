import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { parseProductListText } = loadSrcModules()['domain/parseProductListText'];

test('parseProductListText extracts names without inventing macros', () => {
  const parsed = parseProductListText(`Продукты:
- Творог 5%
• Куриная грудка
Овсянка
`);
  assert.equal(parsed.items.length, 3);
  assert.equal(parsed.items[0].name, 'Творог 5%');
  assert.equal(parsed.items[0].energyKcal, null);
  assert.equal(parsed.items[1].proteinG, null);
  assert.match(parsed.items[2].name, /Овсянка/i);
});

test('parseProductListText accepts explicit per-100g macros only', () => {
  const withPer100 = parseProductListText(
    'Греческий йогурт — 59 ккал /100г · Б 10 · Ж 0.4 · У 3.6',
  );
  assert.equal(withPer100.items.length, 1);
  assert.match(withPer100.items[0].name, /йогурт/i);
  assert.equal(withPer100.items[0].energyKcal, 59);
  assert.equal(withPer100.items[0].proteinG, 10);

  const portionOnly = parseProductListText('Творог 200 г — 242 ккал · Б 34');
  assert.equal(portionOnly.items.length, 1);
  assert.equal(portionOnly.items[0].energyKcal, null);
  assert.equal(portionOnly.items[0].proteinG, null);
});

test('parseProductListText empty and duplicates', () => {
  assert.equal(parseProductListText('').items.length, 0);
  assert.ok(parseProductListText('').warnings.some((w) => /Пустой/.test(w)));

  const dup = parseProductListText(`Творог\nтворог\nЙогурт`);
  assert.equal(dup.items.length, 2);
  assert.ok(dup.warnings.some((w) => /Дубликат/i.test(w)));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(
  new URL('../src/domain/calendarMonth.ts', import.meta.url),
  'utf8',
);
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', transpiled)(mod, mod.exports);
const {
  buildMonthCells,
  addMonths,
  weightKgForDateLocal,
  toDateLocal,
} = mod.exports;

test('buildMonthCells Monday-first for October 2026', () => {
  // 2026-10-01 is Thursday → 3 null pads (Mon Tue Wed)
  const cells = buildMonthCells(2026, 9);
  assert.equal(cells[0], null);
  assert.equal(cells[1], null);
  assert.equal(cells[2], null);
  assert.equal(cells[3], '2026-10-01');
  assert.equal(cells.filter((c) => c != null).length, 31);
  assert.equal(cells.length % 7, 0);
});

test('addMonths clamps day', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2026-03-15', -1), '2026-02-15');
});

test('weightKgForDateLocal picks latest on that local day', () => {
  const kg = weightKgForDateLocal(
    [
      { weighedAt: '2026-10-17T08:00:00.000Z', kg: 70 },
      { weighedAt: '2026-10-17T18:00:00.000Z', kg: 69.5 },
      { weighedAt: '2026-10-16T12:00:00.000Z', kg: 71 },
    ],
    '2026-10-17',
    (iso) => iso.slice(0, 10),
  );
  assert.equal(kg, 69.5);
  assert.equal(toDateLocal(2026, 9, 17), '2026-10-17');
});

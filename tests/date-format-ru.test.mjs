import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { formatDateRu, parseDateRu } = loadSrcModules()['domain/dateFormatRu'];

test('formatDateRu uses DD.MM.YYYY', () => {
  assert.equal(formatDateRu('2026-11-10'), '10.11.2026');
  assert.equal(formatDateRu('2026-01-05'), '05.01.2026');
});

test('parseDateRu accepts RU and ISO', () => {
  assert.equal(parseDateRu('10.11.2026'), '2026-11-10');
  assert.equal(parseDateRu('5.1.2026'), '2026-01-05');
  assert.equal(parseDateRu('2026-11-10'), '2026-11-10');
  assert.throws(() => parseDateRu('32.01.2026'), /Некорректная|Дата/);
  assert.throws(() => parseDateRu('abc'), /Дата/);
});

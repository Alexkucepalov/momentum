import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { parseExportJson } = mods['domain/importExport'];

test('parseExportJson validates shape', () => {
  assert.equal(parseExportJson('').ok, false);
  assert.equal(parseExportJson('[]').ok, false);
  assert.equal(parseExportJson('{"version":8}').ok, false);
  const ok = parseExportJson(
    JSON.stringify({
      version: 8,
      profile: { id: 'x', timezone: 'UTC', locale: 'ru', units: 'metric' },
      products: [],
      recipes: [],
      entries: [],
      ingredients: [],
    }),
  );
  assert.equal(ok.ok, true);
});

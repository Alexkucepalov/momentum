import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { parseOptionalNonNegativeNumber } = mods['domain/strength/parseSetInput'];

describe('parseOptionalNonNegativeNumber', () => {
  it('empty is unknown null, not zero', () => {
    assert.deepEqual(parseOptionalNonNegativeNumber(''), { ok: true, value: null });
    assert.deepEqual(parseOptionalNonNegativeNumber('  '), { ok: true, value: null });
  });

  it('parses decimals with comma', () => {
    assert.deepEqual(parseOptionalNonNegativeNumber('40,5'), { ok: true, value: 40.5 });
    assert.deepEqual(parseOptionalNonNegativeNumber('0'), { ok: true, value: 0 });
  });

  it('rejects negative and garbage', () => {
    assert.equal(parseOptionalNonNegativeNumber('-1').ok, false);
    assert.equal(parseOptionalNonNegativeNumber('abc').ok, false);
  });
});

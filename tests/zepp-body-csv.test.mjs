import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const { parseZeppBodyCsv } = loadSrcModules()['domain/zepp/parseZeppBodyCsv'];

describe('zepp BODY csv', () => {
  it('parses header + weight rows and skips invalid', () => {
    const csv = `time,weight,height,bmi
2026-01-01 06:09:29+0000,76.4,175,24.9
2026-01-02 07:00:00+0000,not-a-number,175,0
2026-01-03 08:00:00+0000,75.8,175,24.7
`;
    const rows = parseZeppBodyCsv(csv);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].kg, 76.4);
    assert.match(rows[0].externalId, /^zepp-weight:/);
    assert.equal(rows[1].kg, 75.8);
  });
});

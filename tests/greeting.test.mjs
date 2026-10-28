import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { loadSrcModules } from './loadTsModules.mjs';

const { dayGreeting } = loadSrcModules()['domain/greeting'];

describe('dayGreeting', () => {
  it('returns RU greeting by hour buckets', () => {
    assert.equal(dayGreeting(new Date('2026-10-29T03:00:00')), 'Доброй ночи');
    assert.equal(dayGreeting(new Date('2026-10-29T08:00:00')), 'Доброе утро');
    assert.equal(dayGreeting(new Date('2026-10-29T14:00:00')), 'Добрый день');
    assert.equal(dayGreeting(new Date('2026-10-29T20:00:00')), 'Добрый вечер');
  });
});

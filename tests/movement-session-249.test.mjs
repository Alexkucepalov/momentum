import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('movement session UX #249', () => {
  it('Movement week edits via card tap; no draft banner strip', () => {
    const activity = readFileSync(
      join(root, 'apps/mobile/app/(tabs)/activity.tsx'),
      'utf8',
    );
    assert.ok(!activity.includes('DraftSessionBanner'));
    assert.ok(activity.includes('onEdit='));
    assert.ok(!activity.includes('onMenu='));
    const board = readFileSync(
      join(root, 'apps/mobile/src/features/strength/StrengthWeekBoard.tsx'),
      'utf8',
    );
    assert.ok(board.includes('onEdit:'));
    assert.ok(board.includes('Нажми карточку'));
  });

  it('live session has no rest timer UI', () => {
    const session = readFileSync(
      join(root, 'apps/mobile/app/strength/session/[id].tsx'),
      'utf8',
    );
    assert.ok(!session.includes('RestTimerBar'));
    assert.ok(session.includes('setSessionRestDeadline'));
    assert.ok(session.includes('strength-session'));
  });
});

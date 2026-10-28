import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokensPath = join(root, 'apps/mobile/src/theme/tokens.ts');
const contractPath = join(root, 'docs/design/CONTRACT.md');

describe('Nutrition Soft Light design contract (PR-A)', () => {
  const tokens = readFileSync(tokensPath, 'utf8');
  const contract = readFileSync(contractPath, 'utf8');

  it('keeps CONTRACT.md as the documented shell', () => {
    assert.match(contract, /Nutrition Soft Light/);
    assert.match(contract, /AppCard/);
    assert.match(contract, /BentoStat/);
    assert.match(contract, /surfaceCard/);
  });

  it('locks canvas, surface, text, and primary CTA colors', () => {
    assert.match(tokens, /background:\s*'#F5F5F5'/);
    assert.match(tokens, /surface:\s*'#FFFFFF'/);
    assert.match(tokens, /text:\s*'#111111'/);
    assert.match(tokens, /textSecondary:\s*'#6B7280'/);
    assert.match(tokens, /textMuted:\s*'#9CA3AF'/);
    assert.match(tokens, /primaryButton:\s*'#111111'/);
    assert.match(tokens, /focus:\s*'#EF6E58'/);
  });

  it('uses radius.xl 24 as default card (not 32)', () => {
    const radiusBlock = tokens.match(/export const radius = \{[\s\S]*?\} as const/)?.[0] ?? '';
    assert.match(radiusBlock, /^\s*xl:\s*24,/m);
    assert.doesNotMatch(radiusBlock, /^\s*xl:\s*32,/m);
  });

  it('keeps space scale 4/8/12/16/24/32 and touchMin 48', () => {
    assert.match(tokens, /xs:\s*4/);
    assert.match(tokens, /sm:\s*8/);
    assert.match(tokens, /md:\s*12/);
    assert.match(tokens, /lg:\s*16/);
    assert.match(tokens, /xl:\s*24/);
    assert.match(tokens, /xxl:\s*32/);
    assert.match(tokens, /export const touchMin = 48/);
  });

  it('documents surfaceCard as deprecated alias', () => {
    assert.match(tokens, /@deprecated Prefer `<AppCard \/>`/);
    assert.match(tokens, /export const surfaceCard/);
  });

  it('reserves Add Food tone wells for PR #135 without replacing macros', () => {
    assert.match(tokens, /toneRecentBg/);
    assert.match(tokens, /toneFavoriteBg/);
    assert.match(tokens, /protein:\s*'#E5484D'/);
    assert.match(tokens, /carbs:\s*'#F5A524'/);
    assert.match(tokens, /fat:\s*'#8B5CF6'/);
  });
});

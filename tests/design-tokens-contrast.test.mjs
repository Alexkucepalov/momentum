import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { colors } = mods['design-system/tokens'];

function relativeLuminance(hex) {
  const h = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrastRatio(fg, bg) {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

test('textMuted meets WCAG AA 4.5:1 on canvas and surface', () => {
  assert.ok(contrastRatio(colors.textMuted, colors.canvas) >= 4.5);
  assert.ok(contrastRatio(colors.textMuted, colors.surface) >= 4.5);
  assert.ok(contrastRatio(colors.textSecondary, colors.canvas) >= 4.5);
});

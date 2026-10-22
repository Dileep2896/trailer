import test from 'node:test';
import assert from 'node:assert/strict';
import { splitPanelsWide } from '../src/split.mjs';

// The 16:9 frame and its title-safe insets (src/frame.ts SAFE['16:9']).
const WIDE = { W: 1920, H: 1080, safe: { top: 64, bottom: 48, left: 96, right: 96 } };
// Panel pads its content this far in from its rect (v3/scenes/stage.tsx).
const PAD = 60;

test('16:9 split panels keep their content inside the title-safe area', () => {
  const { left, right } = splitPanelsWide(WIDE, 64, 1032);
  assert.ok(left.r.x >= WIDE.safe.left, `left panel starts at ${left.r.x}, inside the left inset`);
  assert.ok(right.r.x + right.r.w <= WIDE.W - WIDE.safe.right, 'right panel ends inside the right inset');
  // Padded content of both halves stays inside the safe box as well.
  assert.ok(left.r.x + PAD >= WIDE.safe.left);
  assert.ok(right.r.x + right.r.w - PAD <= WIDE.W - WIDE.safe.right);
});

test('16:9 split panels meet at the divider and keep full-bleed backgrounds', () => {
  const { left, right } = splitPanelsWide(WIDE, 64, 1032);
  assert.equal(left.r.x + left.r.w, WIDE.W / 2);
  assert.equal(right.r.x, WIDE.W / 2);
  assert.deepEqual(left.bg, { x: 0, y: 0, w: 960, h: 1080 });
  assert.deepEqual(right.bg, { x: 960, y: 0, w: 960, h: 1080 });
  assert.equal(left.r.y, 64);
  assert.equal(left.r.h, 968);
  assert.equal(right.r.h, 968);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { FPS, V3_DEFAULTS, buildTimeline, beatFrames } from '../src/timeline.mjs';
import { normalizeConfig } from '../src/config.mjs';
import { base, media } from './helpers.mjs';

test('scenes are cut on the half-beat grid', () => {
  const tl = buildTimeline(base(), media(2, 2));
  const grid = beatFrames(normalizeConfig(base())) / 2; // 7.5 frames at 120 BPM
  assert.equal(grid, 7.5);
  for (const s of tl.scenes) assert.equal((s.from / grid) % 1 === 0 || Math.abs(s.from / grid - Math.round(s.from / grid)) < 0.07, true);
  assert.equal(tl.scenes[1].from, tl.scenes[0].from + tl.scenes[0].duration);
});

test('a scene lasts lead + voice + tail, never less than its minimum', () => {
  const short = buildTimeline(base(), media(0.5, 0.5));
  assert.ok(short.scenes[0].duration >= V3_DEFAULTS.kinetic.min);
  const long = buildTimeline(base(), media(6, 1));
  const need = V3_DEFAULTS.kinetic.lead + Math.ceil(6 * FPS) + V3_DEFAULTS.kinetic.tail;
  assert.ok(long.scenes[0].duration >= need && long.scenes[0].duration < need + 8);
  assert.equal(long.lines[0].local, V3_DEFAULTS.kinetic.lead);
});

test('breath sets the tail and hold the minimum', () => {
  const c = base();
  c.scenes[0].breath = 2;
  const a = buildTimeline(c, media(2, 1));
  const b = buildTimeline(base(), media(2, 1));
  assert.ok(a.scenes[0].duration > b.scenes[0].duration);
  const h = base();
  h.scenes[0].hold = 6;
  assert.ok(buildTimeline(h, media(1, 1)).scenes[0].duration >= 180);
});

test('the gap sits only between lines of a scene', () => {
  const c = base();
  c.scenes[0].say = [{ text: 'One two.', gap: 20 }, 'Three four.'];
  const tl = buildTimeline(c, media(1, 1, 1));
  const [l1, l2] = tl.lines;
  assert.equal(l2.local - (l1.local + l1.frames), 20);
});

test('fitSeconds trims slack until met, and reports when the voice is too long', () => {
  const c = base({ fitSeconds: 10 });
  const tl = buildTimeline(c, media(3, 3));
  assert.equal(tl.fit.met, true);
  assert.ok(tl.total <= 300);
  const over = buildTimeline(base({ fitSeconds: 10 }), media(9, 9));
  assert.equal(over.fit.met, false);
});

test('the timeline is the same at every aspect', () => {
  const frames = ['16:9', '9:16', '1:1'].map((aspect) => buildTimeline(normalizeConfig(base(), { aspect }), media(2, 2)).total);
  assert.equal(new Set(frames).size, 1);
});

test('a cut keeps only its scenes', () => {
  const c = base({ cuts: { short: { aspect: '9:16', scenes: ['end'] } } });
  const tl = buildTimeline(normalizeConfig(c, { cut: 'short' }), media(1));
  assert.deepEqual(tl.scenes.map((s) => s.id), ['end']);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeConfig } from '../src/config.mjs';
import { buildTimeline, settleFrame, settledFrameAt, settledStart } from '../src/timeline.mjs';
import { envKeySource, lintFormat, projectPaths } from '../scripts/lib.mjs';
import { stillFrames } from '../scripts/render.mjs';
import { base, media } from './helpers.mjs';

test('frame 0 is settled for 9:16, 1:1 and looping films, live for a plain 16:9', () => {
  assert.equal(settledStart(normalizeConfig(base())), false);
  assert.equal(settledStart(normalizeConfig(base({ aspect: '9:16' }))), true);
  assert.equal(settledStart(normalizeConfig(base({ aspect: '1:1' }))), true);
  const looped = base();
  looped.scenes[1].loop = true;
  assert.equal(settledStart(normalizeConfig(looped)), true);
  const live = base({ aspect: '9:16' });
  live.scenes[0].firstFrame = 'live';
  assert.equal(settledStart(normalizeConfig(live)), false);
});

test('the settle frame sits after the first cue and before the second line', () => {
  const c = base();
  c.scenes[0].say = ['First line here.', 'Second line here.'];
  const tl = buildTimeline(c, media(2, 2, 2));
  const s = tl.scenes[0];
  const f = settleFrame(s);
  assert.ok(f >= s.lines[0].local + 12, `settle ${f} is after the first cue`);
  assert.ok(f < s.lines[1].local, `settle ${f} is before the second line`);
  assert.ok(f <= s.duration - 14);
});

test('a short without loop on its last scene warns; loop elsewhere warns', () => {
  const c = base({ aspect: '9:16', targetSeconds: 20 });
  assert.ok(lintFormat(normalizeConfig(c)).some((w) => /has no "loop": true/.test(w)));
  c.scenes[1].loop = true;
  assert.ok(!lintFormat(normalizeConfig(c)).some((w) => /loop/.test(w)));
  const d = base();
  d.scenes[0].loop = true;
  assert.ok(lintFormat(normalizeConfig(d)).some((w) => /only works on the last scene/.test(w)));
});

test('--stills takes scenes, cues, seconds and scene ids, and rejects anything else', () => {
  const tl = buildTimeline(base(), media(2, 2));
  assert.equal(stillFrames('scenes', tl).length, 2);
  assert.equal(stillFrames('cues', tl).length, 2);
  const mixed = stillFrames('0,1.5,end', tl);
  assert.deepEqual(mixed.map((s) => s.name), ['t-0_00s', 't-1_50s', 'scene-02-end']);
  assert.throws(() => stillFrames('hook,board', tl), /not "board"/);
  assert.throws(() => stillFrames('', tl), /--stills takes/);
});

test('envKeySource reports where the key came from', () => {
  const dir = mkdtempSync(join(tmpdir(), 'trailer-src-'));
  const p = projectPaths(dir);
  const saved = process.env.DEEPGRAM_API_KEY;
  delete process.env.DEEPGRAM_API_KEY;
  try {
    assert.equal(envKeySource('DEEPGRAM_API_KEY', p).source, null);
    writeFileSync(join(dir, '.env'), 'DEEPGRAM_API_KEY=fake\n');
    assert.equal(envKeySource('DEEPGRAM_API_KEY', p).source, '.env');
    mkdirSync(join(dir, '.trailer'), { recursive: true });
    writeFileSync(join(dir, '.trailer', '.env'), 'DEEPGRAM_API_KEY=fake2\n');
    assert.equal(envKeySource('DEEPGRAM_API_KEY', p).source, '.trailer/.env');
    process.env.DEEPGRAM_API_KEY = 'fake3';
    assert.equal(envKeySource('DEEPGRAM_API_KEY', p).source, 'environment');
  } finally {
    if (saved === undefined) delete process.env.DEEPGRAM_API_KEY;
    else process.env.DEEPGRAM_API_KEY = saved;
  }
});

test('a settled scene 1 holds its settled frame until the live scene catches up (no blank frame 1)', () => {
  const tl = buildTimeline(normalizeConfig(base({ aspect: '9:16' })), { lines: [{ src: null, seconds: 2, words: null }, { src: null, seconds: 2, words: null }] });
  const settle = settleFrame(tl.scenes[0]);
  assert.ok(settle > 1);
  // Frames 0, 1 and 5 all show the settled picture, never an earlier (emptier) frame.
  for (const f of [0, 1, 5, settle - 1]) assert.equal(settledFrameAt(f, settle), settle);
  // From the settled frame on, the scene plays live, so later cues still animate.
  for (const f of [settle, settle + 1, settle + 30]) assert.equal(settledFrameAt(f, settle), f);
  // Shown frames never go backwards: the hold joins the live scene without a jump.
  let prev = -1;
  for (let f = 0; f < settle + 40; f += 1) {
    const shown = settledFrameAt(f, settle);
    assert.ok(shown >= prev);
    prev = shown;
  }
});

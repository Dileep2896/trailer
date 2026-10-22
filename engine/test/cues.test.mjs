import test from 'node:test';
import assert from 'node:assert/strict';
import { cueFrame, spreadCues } from '../src/cues.mjs';

// A scene of 200 frames with two lines; line 0 has timed words.
const t = {
  duration: 200,
  lines: [
    { local: 10, frames: 60, text: 'Driftcheck reads every config file', words: [
      { w: 'Driftcheck', start: 0, end: 0.5 }, { w: 'reads', start: 0.5, end: 0.8 }, { w: 'every', start: 0.8, end: 1.1 }, { w: 'config', start: 1.1, end: 1.5 }, { w: 'file', start: 1.5, end: 1.9 },
    ] },
    { local: 90, frames: 60, text: 'every config, every time', words: null },
  ],
};

test('numbers are line starts, fractions go into the line', () => {
  assert.equal(cueFrame(t, 0), 10);
  assert.equal(cueFrame(t, 1), 90);
  assert.equal(cueFrame(t, 0.5), 40);
  assert.equal(cueFrame(t, 7, 33), 33);
});

test('words, prefixes of 4+ letters, #n and line:word', () => {
  assert.equal(cueFrame(t, 'reads'), 10 + 15);
  assert.equal(cueFrame(t, 'conf'), 10 + 33);
  assert.equal(cueFrame(t, 'con', -1), -1); // a 3-letter prefix does not match
  assert.equal(cueFrame(t, 'every#2'), cueFrame(t, '1:every'));
  assert.ok(cueFrame(t, 'every#2') >= 90);
  assert.equal(cueFrame(t, 'nonexistent', 5), 5);
});

test('seconds, negative seconds, start and end', () => {
  assert.equal(cueFrame(t, '2.5s'), 75);
  assert.equal(cueFrame(t, '-1s'), 170);
  assert.equal(cueFrame(t, 'start'), 0);
  assert.equal(cueFrame(t, 'end'), 200);
});

test('the object form', () => {
  assert.equal(cueFrame(t, { word: 'reads', offset: 1 }), 25 + 30);
  assert.equal(cueFrame(t, { line: 1 }), 90);
  assert.equal(cueFrame(t, { s: 1 }), 30);
  assert.equal(cueFrame(t, { word: 'file', edge: 'end' }), 10 + 57);
});

test('spreadCues uses lines when there are enough, else spreads', () => {
  assert.deepEqual(spreadCues(t, 2), [10, 90]);
  const three = spreadCues(t, 3);
  assert.equal(three.length, 3);
  assert.ok(three[0] < three[1] && three[1] < three[2]);
  assert.deepEqual(spreadCues(t, 0), []);
});

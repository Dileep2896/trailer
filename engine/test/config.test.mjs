import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCut, deepMerge, normalizeConfig } from '../src/config.mjs';
import { resolveCaptions } from '../src/options.mjs';
import { resolveVoice } from '../scripts/lib.mjs';
import { base } from './helpers.mjs';

test('say is flattened into lines in scene order', () => {
  const c = base();
  c.scenes[0].say = ['One.', { text: 'Two.', gap: 4 }];
  const n = normalizeConfig(c);
  assert.deepEqual(n.lines, [
    { scene: 'hook', text: 'One.' },
    { scene: 'hook', text: 'Two.', gap: 4 },
    { scene: 'end', text: 'Testbed. Try it today.' },
  ]);
  assert.equal(n.kit, 3);
  assert.equal(n.aspect, '16:9');
  assert.equal(n.targetSeconds, 60);
});

test('normalizing is idempotent', () => {
  const n = normalizeConfig(base());
  assert.equal(normalizeConfig(n), n);
});

test('deepMerge merges objects and replaces arrays and scalars', () => {
  assert.deepEqual(deepMerge({ a: { b: 1, c: 2 }, l: [1, 2], s: 'x' }, { a: { c: 3 }, l: [9], s: 'y' }), { a: { b: 1, c: 3 }, l: [9], s: 'y' });
});

test('a cut picks its scenes in its order, merges overrides and takes its own settings', () => {
  const c = base({
    fitSeconds: 64,
    captions: { style: 'box' },
    cuts: { short: { aspect: '9:16', targetSeconds: 25, scenes: ['end', 'hook'], overrides: { hook: { say: 'Short hook.' } }, captions: { size: 70 } } },
  });
  const n = normalizeConfig(c, { cut: 'short' });
  assert.deepEqual(n.scenes.map((s) => s.id), ['end', 'hook']);
  assert.equal(n.scenes[1].say, 'Short hook.');
  assert.equal(n.aspect, '9:16');
  assert.equal(n.targetSeconds, 25);
  assert.equal(n.fitSeconds, undefined);
  assert.deepEqual(n.captions, { style: 'box', size: 70 });
  assert.equal(n.lines[1].text, 'Short hook.');
  assert.throws(() => applyCut(c, 'nope'), /no cut "nope"/);
  assert.throws(() => normalizeConfig(base({ cuts: { x: { scenes: ['ghost'] } } }), { cut: 'x' }), /ghost/);
});

test('variants deep-merge for their aspect only', () => {
  const c = base();
  c.scenes[0].layout = 'center';
  c.scenes[0].variants = { '9:16': { layout: 'stack', beats: [{ text: 'Hi.' }] } };
  assert.equal(normalizeConfig(c, { aspect: '9:16' }).scenes[0].layout, 'stack');
  assert.deepEqual(normalizeConfig(c, { aspect: '9:16' }).scenes[0].beats, [{ text: 'Hi.' }]);
  assert.equal(normalizeConfig(c, { aspect: '16:9' }).scenes[0].layout, 'center');
  assert.throws(() => normalizeConfig(c, { aspect: '4:3' }), /aspect/);
});

test('legacy aliases: kit and voiceSpeed', () => {
  const legacy = { kit: 3, projectName: 'Old', voiceSpeed: 1.05, scenes: [{ type: 'kinetic', beats: [{ text: 'x' }] }], lines: [{ scene: 'kinetic', text: 'Old line.' }] };
  const n = normalizeConfig(legacy);
  assert.equal(n.kit, 3);
  assert.deepEqual(n.voice, { speed: 1.05 });
  assert.equal(n.lines[0].text, 'Old line.');
  assert.equal(resolveVoice(n).speed, 1.05);
});

test('captions follow the aspect unless a cut says otherwise', () => {
  const film = base({ captions: { position: 'bottom', size: 50, maxWords: 6 } });
  const p = resolveCaptions(normalizeConfig(film, { aspect: '9:16' }));
  assert.deepEqual([p.position, p.size, p.maxWords], ['center-low', 64, 3]);
  const cut = normalizeConfig(base({ captions: { position: 'bottom' }, cuts: { s: { aspect: '9:16', captions: { position: 'top', maxWords: 5 } } } }), { cut: 's' });
  const q = resolveCaptions(cut);
  assert.deepEqual([q.position, q.maxWords, q.size], ['top', 5, 64]);
  assert.equal(resolveCaptions(normalizeConfig(film)).position, 'bottom');
});

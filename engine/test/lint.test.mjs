import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeConfig } from '../src/config.mjs';
import { bannedTerms, lintCopy, lintCues, lintFormat, projectPaths, validate, wordBudget } from '../scripts/lib.mjs';
import { base, media } from './helpers.mjs';
import { buildTimeline, estimateLineSeconds } from '../src/timeline.mjs';

const N = (c, o) => normalizeConfig(c, o);

test('first person is an error in third person, allowed in first', () => {
  const c = base();
  c.scenes[0].say = 'We built this because our team was tired.';
  assert.equal(lintCopy(N(c)).errors.length >= 1, true);
  assert.equal(lintCopy(N({ ...c, narration: { person: 'first' } })).errors.length, 0);
  assert.equal(lintCopy(N({ ...c, narration: { person: 'any' } })).errors.length, 0);
});

test('attributed quotes and in-world chat are warnings, not errors', () => {
  const c = base();
  c.scenes.splice(1, 0, { id: 'ev', type: 'evidence', cards: [{ kind: 'quote', text: 'I lost a whole day to this.', source: 'a user' }], say: 'Users noticed.' });
  const r = lintCopy(N(c));
  assert.equal(r.errors.length, 0);
  assert.equal(r.warnings.length, 1);
});

test('forbiddenTerms warn; private banned terms are errors', () => {
  const c = base({ forbiddenTerms: ['blazing'] });
  c.scenes[0].say = 'Testbed is blazing fast for Acmecorp.';
  const dir = mkdtempSync(join(tmpdir(), 'trailer-lint-'));
  mkdirSync(join(dir, '.trailer', 'private'), { recursive: true });
  writeFileSync(join(dir, '.trailer', 'private', 'banned-terms.txt'), '# private\nAcmecorp\n');
  const banned = bannedTerms(projectPaths(dir));
  assert.deepEqual(banned, ['Acmecorp']);
  const r = lintCopy(N(c), [], { banned });
  assert.equal(r.warnings.filter((w) => w.includes('blazing')).length, 1);
  assert.equal(r.errors.length, 1);
  assert.ok(!r.errors[0].includes('Acmecorp"') || r.errors[0].includes('banned term'));
});

test('the word budget per film, short and cut', () => {
  assert.deepEqual(wordBudget(N(base())), [105, 123]);
  assert.deepEqual(wordBudget(N(base({ targetSeconds: 25 }))), [48, 57]);
  const cut = N(base({ cuts: { sq: { aspect: '1:1', targetSeconds: 40 } } }), { cut: 'sq' });
  assert.deepEqual(wordBudget(cut), [77, 91]);
});

test('portrait warns about 16:9 coordinates without a variant', () => {
  const c = base();
  c.scenes[0] = { id: 'hook', type: 'cast', cast: [{ who: 'blob', x: 400 }], say: 'Hi.' };
  assert.ok(lintFormat(N(c, { aspect: '9:16' })).some((w) => w.includes('16:9 px')));
  assert.ok(!lintFormat(N(c, { aspect: '16:9' })).some((w) => w.includes('16:9 px')));
  c.scenes[0].variants = { '9:16': { cast: [{ who: 'blob' }] } };
  assert.ok(!lintFormat(N(c, { aspect: '9:16' })).some((w) => w.includes('16:9 px')));
});

test('a short that does not open on words warns', () => {
  const c = base({ targetSeconds: 20 });
  c.scenes.unshift({ id: 'calm', type: 'calendar', pages: [{ day: 'MON' }], lead: 20, say: 'Monday.' });
  const w = lintFormat(N(c, { aspect: '9:16' }));
  assert.ok(w.some((m) => m.includes('open on words')));
  assert.ok(w.some((m) => m.includes('moving at frame 0')));
});

test('validate catches broken references as errors', () => {
  const c = base({ cuts: { short: { scenes: ['ghost'] } } });
  c.scenes.push({ id: 'shot', type: 'screenshot', page: 'missing', say: 'x' });
  c.scenes.push({ id: 'hook', type: 'kinetic', beats: [{ text: 'dup' }] });
  const { errors } = validate(N(c), c);
  assert.ok(errors.some((e) => e.includes('ghost')));
  assert.ok(errors.some((e) => e.includes('page "missing"')));
  assert.ok(errors.some((e) => e.includes('share the id')));
  const bad = base({ voice: { model: 'aura-hermes', speed: 1.4 } });
  const v = validate(N(bad), bad).errors.join('\n');
  assert.match(v, /voice\.model/);
  assert.match(v, /voice\.speed/);
});

test('cues that are not spoken in the scene warn, including after a cut rewrites say', () => {
  const c = base();
  c.scenes[0].beats = [{ text: 'Every file.', at: 'checks' }, { text: 'Fast.', at: 'quickly' }, { text: 'Later.', at: '1.5s' }];
  const w = lintCues(N(c));
  assert.equal(w.length, 1);
  assert.match(w[0], /"quickly"/);
  // prefixes of 4+ letters match, like the video does ("check" matches "checks")
  c.scenes[0].beats = [{ text: 'x', at: 'check' }, { text: 'y', at: 3 }];
  const w2 = lintCues(N(c));
  assert.equal(w2.length, 1);
  assert.match(w2[0], /points past/);
  // a cut that rewrites the line breaks the cue
  const cut = { ...base(), cuts: { s: { aspect: '9:16', targetSeconds: 20, scenes: ['hook', 'end'], overrides: { hook: { say: 'Testbed reads it all.' } } } } };
  cut.scenes[0].beats = [{ text: 'x', at: 'checks' }];
  assert.equal(lintCues(N(cut)).length, 0);
  assert.equal(lintCues(N(cut, { cut: 's' })).length, 1);
});

/* ------------------------------------------------------------------ shorts: hook, frame 0, loop, 1:1 cast */

const shortCfg = (over = {}) =>
  base({
    aspect: '9:16',
    targetSeconds: 20,
    scenes: [
      { id: 'hook', type: 'kinetic', lead: 2, beats: [{ text: 'Hello there.', at: 0 }], say: 'Testbed checks every file.' },
      { id: 'end', type: 'outro', say: 'Testbed. Try it today.', loop: true },
    ],
    ...over,
  });

test('a short may open on a ui scene already mid-action', () => {
  const c = shortCfg();
  c.scenes[0] = { id: 'hook', type: 'ui', lead: 2, elements: [{ type: 'header', title: 'Queue' }], say: 'Testbed flags the file.' };
  assert.ok(!lintFormat(N(c)).some((w) => w.includes('should open on')));
  c.scenes[0] = { id: 'hook', type: 'calendar', lead: 2, pages: [{ day: 'MON' }], say: 'Monday.' };
  assert.ok(lintFormat(N(c)).some((w) => w.includes('should open on')));
});

test('a short warns when the first word is spoken after 1 s', () => {
  const c = N(shortCfg());
  const early = buildTimeline(c, media(2, 2));
  assert.ok(!lintFormat(c, { tl: early }).some((w) => w.includes('first word is spoken')));
  // The voice has 1.2 s of air before its first word.
  const late = buildTimeline(c, { lines: [{ src: null, seconds: 3, words: [{ w: 'Testbed', start: 1.2, end: 1.6 }] }, { src: null, seconds: 2, words: null }] });
  assert.ok(lintFormat(c, { tl: late }).some((w) => w.includes('first word is spoken at 1.3 s')));
  const slow = N(shortCfg());
  slow.scenes[0].lead = 40;
  assert.ok(lintFormat(slow, { tl: buildTimeline(slow, media(2, 2)) }).some((w) => w.includes('first word is spoken')));
});

test('a short warns on a blank frame 0 and on a last scene with no loop', () => {
  assert.ok(!lintFormat(N(shortCfg())).some((w) => w.includes('frame 0 is blank')));
  const live = shortCfg();
  live.scenes[0].firstFrame = 'live';
  assert.ok(lintFormat(N(live)).some((w) => w.includes('frame 0 is blank')));
  const noLoop = shortCfg();
  delete noLoop.scenes[1].loop;
  assert.ok(lintFormat(N(noLoop)).some((w) => w.includes('no "loop": true')));
  // A 1:1 short (a square cut) wants the loop too; a 60 s 1:1 film does not.
  const sq = shortCfg({ aspect: '1:1' });
  delete sq.scenes[1].loop;
  assert.ok(lintFormat(N(sq)).some((w) => w.includes('no "loop": true')));
  assert.ok(!lintFormat(N({ ...sq, targetSeconds: 60 })).some((w) => w.includes('no "loop": true')));
  // A 16:9 cut of 30 s or less starts empty unless it loops.
  const wide = shortCfg({ aspect: '16:9' });
  delete wide.scenes[1].loop;
  assert.ok(lintFormat(N(wide)).some((w) => w.includes('frame 0 is blank')));
});

test('1:1 flags a cast position only when the mapping leaves the safe area', () => {
  const c = base({ aspect: '1:1' });
  c.scenes[0] = { id: 'hook', type: 'cast', cast: [{ who: 'blob', x: 1560, size: 320 }], say: 'Hi.' };
  assert.ok(!lintFormat(N(c)).some((w) => w.includes('16:9') || w.includes('safe area')));
  c.scenes[0].cast = [{ who: 'blob', x: 1900, size: 420 }];
  assert.ok(lintFormat(N(c)).some((w) => w.includes('leaves the 1:1 safe area')));
  c.scenes[0].cast = [{ who: 'blob', x: 960, move: [{ at: 1, x: 40 }], size: 300 }];
  assert.ok(lintFormat(N(c)).some((w) => w.includes('leaves the 1:1 safe area')));
  c.scenes[0].variants = { '1:1': { cast: [{ who: 'blob' }] } };
  assert.ok(!lintFormat(N(c)).some((w) => w.includes('safe area')));
  // 9:16 keeps the general reminder for any mapped coordinate.
  const p = base();
  p.scenes[0] = { id: 'hook', type: 'cast', cast: [{ who: 'blob', x: 960 }], say: 'Hi.' };
  assert.ok(lintFormat(N(p, { aspect: '9:16' })).some((w) => w.includes('16:9 px')));
});

test('the silent estimate tracks aura-2 at 1.0', () => {
  // Measured aura-2-hermes-en lengths (trimmed) for the example's lines.
  const measured = [
    ['Friday deploy. Staging is green. Production is down.', 4.72],
    ['Enter Driftcheck.', 1.33],
    ['Driftcheck lines up every key of every environment before a deploy, so drift shows up in red.', 6.49],
    ['Friday, six p.m. The release passed every check in staging. Twenty minutes later, checkout is down in production.', 9.52],
    ['One setting. Staging waits eight seconds for the payment provider. Production never got the key, so it gives up after two.', 7.96],
  ];
  for (const [text, sec] of measured) assert.ok(Math.abs(estimateLineSeconds(text) - sec) < 1.5, `${text}: ${estimateLineSeconds(text)} vs ${sec}`);
  const total = measured.reduce((n, [t]) => n + estimateLineSeconds(t), 0);
  assert.ok(Math.abs(total - measured.reduce((n, [, s]) => n + s, 0)) < 2);
  assert.equal(estimateLineSeconds('Enter Driftcheck.', 1.1) < estimateLineSeconds('Enter Driftcheck.'), true);
});

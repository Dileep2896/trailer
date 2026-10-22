// The no-voice mode (voice.provider "text"): on-screen text at a reading pace, no API call,
// no fallback, music and sound effects only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FPS, READING, buildTimeline, estimateLineSeconds, estimateReadSeconds, readingWords, settledStart } from '../src/timeline.mjs';
import { captionChunks } from '../src/captions.mjs';
import { cueFrame } from '../src/cues.mjs';
import { normalizeConfig } from '../src/config.mjs';
import { isTextMode, resolveCaptions } from '../src/options.mjs';
import { WORD_RATES, lintFormat, projectPaths, resolveVoice, validate, withVoiceEngine, wordBudget } from '../scripts/lib.mjs';
import { TEXT_HINT, chain, voice } from '../scripts/voice.mjs';
import { base } from './helpers.mjs';

const TEXT = { voice: { provider: 'text' } };
const N = (c, o) => normalizeConfig(c, o);

test('reading pace: words at 2.2 a second plus a hold per line, slower than the narrator, never under the minimum', () => {
  assert.equal(READING.wordsPerSecond, 2.2);
  // 10 words: 4.5 s of reading + 0.7 s to notice the phrase.
  assert.equal(estimateReadSeconds('Driftcheck compares every environment and flags the key that drifted'), +(10 / 2.2 + 0.7).toFixed(3));
  assert.equal(estimateReadSeconds('Go.'), READING.min);
  // A sentence break and a comma add a little.
  assert.ok(estimateReadSeconds('One two three. Four, five six.') > estimateReadSeconds('One two three four five six'));
  for (const line of ['Staging passed. Production did not.', 'Driftcheck reads every environment file and lists the keys that differ.', 'Ship it.'])
    assert.ok(estimateReadSeconds(line) > estimateLineSeconds(line), line);
});

test('the text mode is a config choice, and --voice-engine text writes it into the config', () => {
  assert.equal(isTextMode(N(base(TEXT))), true);
  assert.equal(isTextMode(N(base())), false);
  assert.equal(isTextMode(N(base({ voice: 'aura-2-thalia-en' }))), false);
  const forced = withVoiceEngine(N(base({ voice: { model: 'aura-2-thalia-en' } })), { engine: 'text' });
  assert.equal(isTextMode(forced), true);
  assert.equal(forced.voice.model, 'aura-2-thalia-en');
  // --voice-engine none on a text config makes a silent draft instead.
  assert.equal(isTextMode(withVoiceEngine(N(base(TEXT)), { engine: 'none' })), false);
  assert.equal(resolveVoice(base(TEXT)).provider, 'text');
  assert.equal(resolveVoice(base(), { engine: 'text' }).provider, 'text');
  // It is a mode, not a link in the fallback chain.
  assert.deepEqual(chain('deepgram'), ['deepgram', 'say', 'espeak-ng', 'none']);
  assert.deepEqual(validate(N(base(TEXT))).errors, []);
});

test('the timeline paces lines at the reading time with a 0.5 s beat between them, and no line has audio', () => {
  const c = base(TEXT);
  c.scenes[0].say = ['Staging passed.', 'Production did not.'];
  const tl = buildTimeline(c);
  assert.equal(tl.text, true);
  const [a, b] = tl.lines;
  assert.equal(a.frames, Math.ceil(estimateReadSeconds('Staging passed.') * FPS));
  assert.equal(b.local - (a.local + a.frames), READING.gap);
  assert.ok(tl.lines.every((l) => l.src === null));
  // Measured media from a voice never sneaks an audio file into a text render.
  const withSrc = buildTimeline(c, { lines: [{ src: 'vo/x.wav', seconds: 2, words: null }] });
  assert.equal(withSrc.lines[0].src, null);
  // Longer than the same script narrated.
  const spoken = buildTimeline(base(), { lines: [] });
  const read = buildTimeline(base(TEXT), { lines: [] });
  assert.ok(read.lines[0].frames > spoken.lines[0].frames);
});

test('reading words: every word of a phrase appears with its phrase, phrases share the line by their words', () => {
  const ws = readingWords('Staging passed, production did not, and nobody knew why.', 6, { maxWords: 3 });
  assert.equal(ws.length, 9);
  for (let i = 1; i < ws.length; i += 1) assert.ok(ws[i].start >= ws[i - 1].start && ws[i].start >= ws[i - 1].end - 0.05);
  assert.equal(ws[0].start, 0);
  assert.equal(ws[1].start, 0); // "passed," shows with "Staging"
  assert.ok(Math.abs(ws.at(-1).end - 6) < 0.01);
  // A word cue fires when its phrase comes on screen.
  const c = base(TEXT);
  c.scenes[0].say = 'Staging passed, production did not.';
  const tl = buildTimeline(c);
  const scene = tl.scenes[0];
  const at = cueFrame(scene, 'production');
  const did = cueFrame(scene, 'did');
  assert.equal(at, did);
  assert.ok(at > scene.lines[0].local);
});

test('text captions: one phrase at a time, held until the next, the line end leaves a blank beat', () => {
  const c = base(TEXT);
  c.scenes[0].say = ['Staging passed, production did not.', 'Nobody knew why.'];
  const tl = buildTimeline(c);
  const cap = resolveCaptions(N(c));
  assert.equal(cap.reading, true);
  const chunks = captionChunks(tl, { maxWords: cap.maxWords, reading: true });
  const [l1, l2] = tl.lines;
  const first = chunks.filter((k) => k.line === l1.index);
  assert.ok(first.length >= 2);
  for (let i = 1; i < first.length; i += 1) assert.equal(first[i].from, first[i - 1].to);
  assert.equal(first.at(-1).to, l1.from + l1.frames);
  const second = chunks.find((k) => k.line === l2.index);
  assert.ok(second.from - first.at(-1).to >= READING.gap - 1);
  // Each phrase is on screen long enough to read.
  for (const k of chunks) assert.ok((k.to - k.from) / FPS >= 0.8, k.text);
});

test('text captions are titles: always on, display face, fewer words per phrase in every aspect', () => {
  const off = resolveCaptions(N(base({ ...TEXT, captions: { enabled: false, fontRole: 'ui', maxWords: 8 } })));
  assert.equal(off.enabled, true);
  assert.equal(off.fontRole, 'display');
  assert.equal(off.maxWords, 5);
  assert.equal(resolveCaptions(N(base(TEXT), { aspect: '9:16' })).maxWords, 3);
  assert.equal(resolveCaptions(N(base(TEXT), { aspect: '1:1' })).maxWords, 4);
  assert.equal(resolveCaptions(N(base(TEXT), { aspect: '9:16' })).position, 'center-low');
  assert.equal(resolveCaptions(N(base())).reading, false);
  const w = validate(N(base({ ...TEXT, captions: false }))).warnings;
  assert.ok(w.some((m) => /captions are off/.test(m)));
});

test('a scene with captions off warns in the text mode unless it shows its own words', () => {
  const c = base(TEXT);
  c.scenes[0].captions = 'off';
  c.scenes[0].say = 'Hello there.';
  assert.ok(!validate(N(c)).warnings.some((m) => /captions "off"/.test(m)), 'the kinetic beat already shows "Hello there."');
  c.scenes[0].say = 'Something else entirely.';
  assert.ok(validate(N(c)).warnings.some((m) => /captions "off" hides/.test(m)));
  assert.ok(!validate(N({ ...c, voice: undefined })).warnings.some((m) => /captions "off"/.test(m)));
});

test('the word budget uses the reading pace: about four fifths of a narrated film', () => {
  assert.deepEqual(WORD_RATES.reading, { film: 1.5, short: 1.65 });
  const film = wordBudget(N(base({ ...TEXT, targetSeconds: 60 })));
  assert.deepEqual(film, [Math.round(90 * 0.92), Math.round(90 * 1.08)]);
  const voiced = wordBudget(N(base({ targetSeconds: 60 })));
  assert.ok(film[1] < voiced[0]);
  const short = wordBudget(N(base({ ...TEXT, targetSeconds: 30 })));
  assert.deepEqual(short, [Math.round(49.5 * 0.92), Math.round(49.5 * 1.08)]);
});

test('shorts and loops work in the text mode: settled frame 0, the hook on screen within 1 s', () => {
  const c = base({ ...TEXT, aspect: '9:16', targetSeconds: 20 });
  c.scenes.at(-1).loop = true;
  c.scenes[0].lead = 3;
  const n = N(c);
  assert.equal(settledStart(n), true);
  const tl = buildTimeline(n);
  const w = lintFormat(n, { tl, captionChunks: captionChunks(tl, { maxWords: 3, reading: true }) });
  assert.ok(!w.some((m) => /first word/.test(m)), w.join('\n'));
  assert.ok(!w.some((m) => /loop/.test(m)), w.join('\n'));
});

test('voice() in the text mode: no API call, no speech engine, no warning, not a fallback', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'trailer-text-'));
  const p = { ...projectPaths(dir), config: N(base(TEXT)) };
  const saved = { fetch: globalThis.fetch, key: process.env.DEEPGRAM_API_KEY };
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error('no network in the text mode');
  };
  process.env.DEEPGRAM_API_KEY = 'fake-key-never-used';
  const warnings = [];
  try {
    const out = await voice(p, { dir, settings: resolveVoice(p.config), log: () => {}, warn: (m) => warnings.push(m) });
    assert.equal(calls, 0);
    assert.deepEqual(warnings, []);
    assert.equal(out.provider, 'text');
    assert.equal(out.mode, 'text');
    assert.equal(out.fallback, false);
    assert.equal(out.lines.length, p.config.lines.length);
    assert.ok(out.lines.every((l) => l.src === null));
    assert.equal(out.lines[0].seconds, estimateReadSeconds(p.config.lines[0].text));
  } finally {
    globalThis.fetch = saved.fetch;
    if (saved.key === undefined) delete process.env.DEEPGRAM_API_KEY;
    else process.env.DEEPGRAM_API_KEY = saved.key;
  }
});

test('the silent-draft warning points at the text mode', () => {
  assert.match(TEXT_HINT, /"provider": "text"/);
  assert.match(TEXT_HINT, /--voice-engine text/);
  assert.match(TEXT_HINT, /no API key/);
});

test('a phrase the scene already shows is not burned in twice (text mode)', async () => {
  const { sceneScreenText, shownOnScreen } = await import('../src/copy.mjs');
  const cfg = { projectName: 'Driftcheck', tagline: 'Catch config drift before your users do.' };
  const outro = sceneScreenText({ type: 'outro' }, cfg);
  assert.ok(shownOnScreen('Driftcheck.', outro));
  assert.ok(shownOnScreen('Catch config drift before', outro));
  assert.ok(!shownOnScreen('Try it today.', outro));
  const kinetic = sceneScreenText({ type: 'kinetic', beats: [{ text: 'Enter Driftcheck.', at: 'drift' }] }, cfg);
  assert.ok(shownOnScreen('Enter Driftcheck.', kinetic));
  // Cue values are not copy, and words scattered across strings do not count.
  assert.ok(!shownOnScreen('drift', sceneScreenText({ type: 'ui', elements: [{ type: 'text', text: 'Config', at: 'drift' }] }, cfg)));
  assert.ok(!shownOnScreen('Enter config', kinetic));
});

test('the text mode lifts the bed and the effects, since no voice carries the film', async () => {
  const { TEXT_MIX } = await import('../src/options.mjs');
  assert.ok(TEXT_MIX.music > 0.42 && TEXT_MIX.music <= 0.8);
  assert.ok(TEXT_MIX.sfx > 1 && TEXT_MIX.sfx <= 1.5);
});

test('phrases split evenly and never end on a word that leans on the next', async () => {
  const { phraseGroups } = await import('../src/phrases.mjs');
  const words = 'One missing key: production gives the payment provider two seconds, not eight.'.split(' ');
  const parts = phraseGroups(words, { maxWords: 3 }).map((g) => g.map((i) => words[i]).join(' '));
  assert.deepEqual(parts, ['One missing key:', 'production gives', 'the payment provider', 'two seconds,', 'not eight.']);
  const seven = 'aa bb cc dd ee ff gg'.split(' ');
  assert.deepEqual(phraseGroups(seven, { maxWords: 3 }).map((g) => g.length), [3, 2, 2]);
});

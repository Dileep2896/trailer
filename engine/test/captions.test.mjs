import test from 'node:test';
import assert from 'node:assert/strict';
import { captionChunks, toSrt, toVtt } from '../src/captions.mjs';

const tlOf = (text, seconds = 4) => ({ lines: [{ index: 0, from: 0, frames: seconds * 30, text, words: null }] });

test('chunks hold at most maxWords and break after punctuation', () => {
  const chunks = captionChunks(tlOf('Same code, same build. Something else is different, and nobody can see it.'), { maxWords: 4 });
  for (const c of chunks) assert.ok(c.text.split(' ').length <= 4, c.text);
  assert.ok(chunks.some((c) => c.text.endsWith('code,')));
});

test('no chunk strands a single word when it can join a neighbour', () => {
  const chunks = captionChunks(tlOf('Enter Driftcheck. It reads every config before each deploy.'), { maxWords: 6 });
  assert.ok(chunks.every((c) => c.text.split(' ').length > 1), chunks.map((c) => c.text).join(' | '));
});

test('script words are kept as written', () => {
  const chunks = captionChunks(tlOf('It checked 100 keys in 2.5 s.'), { maxWords: 6 });
  assert.match(chunks.map((c) => c.text).join(' '), /100 keys in 2\.5 s\./);
});

test('SRT and VTT formatting', () => {
  const chunks = [{ from: 0, to: 45, text: 'Hello there.' }, { from: 3600 * 30, to: 3600 * 30 + 15, text: 'Later.' }];
  const srt = toSrt(chunks);
  assert.match(srt, /^1\n00:00:00,000 --> 00:00:01,500\nHello there\.\n/);
  assert.match(srt, /2\n01:00:00,000 --> 01:00:00,500\nLater\./);
  const vtt = toVtt(chunks);
  assert.ok(vtt.startsWith('WEBVTT\n\n1\n00:00:00.000 --> 00:00:01.500'));
});

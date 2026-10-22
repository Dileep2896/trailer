import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { align, chain, proportional } from '../scripts/voice.mjs';
import { envKey, projectPaths, resolveVoice } from '../scripts/lib.mjs';
import { VOICE_MODEL } from '../src/options.mjs';

test('align pairs recognised words with the script, through drops and substitutions', () => {
  const heard = [
    { word: 'Driftcheck', start: 0.1, end: 0.6 },
    { word: 'checks', start: 0.7, end: 1.0 },
    { word: 'a', start: 1.05, end: 1.1 },
    { word: 'hundred', start: 1.1, end: 1.4 },
    { word: 'keys.', start: 1.5, end: 1.9 },
  ];
  const out = align('Driftcheck checks 100 config keys.', heard, 2.2);
  assert.deepEqual(out.map((w) => w.w), ['Driftcheck', 'checks', '100', 'config', 'keys.']);
  assert.equal(out[0].start, 0.1);
  assert.equal(out[4].start, 1.5);
  for (let i = 1; i < out.length; i += 1) assert.ok(out[i].start >= out[i - 1].start);
});

test('proportional spreads words by length across the line', () => {
  const out = proportional('a longer word', 2);
  assert.equal(out.length, 3);
  assert.ok(out[1].end - out[1].start > out[0].end - out[0].start);
  assert.ok(out.at(-1).end <= 2);
});

test('the voice model pattern and the fallback chain', () => {
  assert.ok(VOICE_MODEL.test('aura-2-hermes-en'));
  assert.ok(!VOICE_MODEL.test('aura-hermes-en'));
  assert.ok(!VOICE_MODEL.test('aura-2-hermes'));
  assert.deepEqual(chain('deepgram'), ['deepgram', 'say', 'espeak-ng', 'none']);
  assert.deepEqual(chain('say'), ['say', 'espeak-ng', 'none']);
  assert.equal(resolveVoice({}).model, 'aura-2-hermes-en');
  assert.equal(resolveVoice({}).speed, 1);
  assert.equal(resolveVoice({ voice: 'aura-2-thalia-en' }, { engine: 'none' }).provider, 'none');
  assert.throws(() => resolveVoice({ voice: 'nope' }), /Aura-2/);
});

test('the key comes from the environment, then .trailer/.env, then .env, and is never written', () => {
  const dir = mkdtempSync(join(tmpdir(), 'trailer-key-'));
  const p = projectPaths(dir);
  const saved = process.env.DEEPGRAM_API_KEY;
  delete process.env.DEEPGRAM_API_KEY;
  try {
    assert.equal(envKey('DEEPGRAM_API_KEY', p), null);
    writeFileSync(join(dir, '.env'), 'DEEPGRAM_API_KEY=fake-from-project\n');
    assert.equal(envKey('DEEPGRAM_API_KEY', p), 'fake-from-project');
    mkdirSync(join(dir, '.trailer'), { recursive: true });
    writeFileSync(join(dir, '.trailer', '.env'), 'export DEEPGRAM_API_KEY="fake-from-trailer"\n');
    assert.equal(envKey('DEEPGRAM_API_KEY', p), 'fake-from-trailer');
    process.env.DEEPGRAM_API_KEY = 'fake-from-env';
    assert.equal(envKey('DEEPGRAM_API_KEY', p), 'fake-from-env');
    // Only the two .env files we wrote hold a key.
    const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
    const holders = walk(dir).filter((f) => readFileSync(f, 'utf8').includes('fake-from-env'));
    assert.deepEqual(holders, []);
  } finally {
    if (saved === undefined) delete process.env.DEEPGRAM_API_KEY;
    else process.env.DEEPGRAM_API_KEY = saved;
  }
});

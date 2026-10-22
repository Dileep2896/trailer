// Voices every line of a config, trims the silence, sets the pace (voice.speed, pitch kept),
// matches loudness (EBU R128, -16 LUFS) and measures each line. The timeline is built from
// these lengths, so the cut always fits the voice.
//
// Providers: deepgram (Aura-2 text to speech; default model aura-2-hermes-en at 1.0), say
// (macOS), espeak-ng (Linux) and none (silent: lengths estimated from the text, calibrated to
// aura-2 at 1.0, for layout work and CI). When the chosen provider cannot run (no key, a 401/403, no network,
// the binary missing) the next one in deepgram -> say -> espeak-ng -> none takes over, with a
// loud warning and `fallback: true` in the result.
//
// text is not a voice and not in that chain: it is the no-voice mode a user chooses for a
// finished film without narration (music, sound effects and on-screen text). It makes no
// network call and runs no speech engine; each line lasts its reading time (READING in
// src/timeline.mjs) and the timeline shows it as on-screen text.
//
// With Deepgram, each finished line goes to speech-to-text (nova-3) for word timestamps,
// aligned to the script's own words; they drive the karaoke captions. Otherwise words are
// timed in proportion to their length.
//
// Files are named by a hash of provider, model, speed and text (.trailer/voice/<hash>.wav),
// so a cut reuses the film's lines and only changed lines are re-voiced. --keep-voice uses
// your own recordings at .trailer/voice/line-N.wav (N counts the render's lines from 1).
//
// The API key comes from DEEPGRAM_API_KEY in the environment, else .trailer/.env, else the
// project's .env. It is never printed or written anywhere.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { platform } from 'node:os';
import { resolve } from 'node:path';
import { durationOf, ffmpeg } from './runtime.mjs';
import { envKey } from './lib.mjs';
import { READING, estimateLineSeconds, estimateReadSeconds } from '../src/timeline.mjs';

const TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse';
const NORM = 'loudnorm=I=-16:TP=-1.5:LRA=7';
const sha = (x) => createHash('sha1').update(x).digest('hex').slice(0, 16);

/**
 * macOS `say` at 185 words a minute runs about 11% faster than aura-2 at 1.0 (measured on the
 * example's lines), so its drafts are slowed to match and the layout pass sees Deepgram's lengths.
 */
export const SAY_TEMPO = 0.89;

export class VoiceUnavailable extends Error {}

const deepgram = async (key, model, text, out) => {
  const url = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}&encoding=linear16&sample_rate=48000&container=wav`;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Token ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(60000),
    }).catch((e) => ({ ok: false, status: 0, text: async () => String(e?.message ?? e) }));
    if (r.ok) {
      writeFileSync(out, Buffer.from(await r.arrayBuffer()));
      return;
    }
    const body = (await r.text()).slice(0, 200);
    if (r.status === 401 || r.status === 403) throw new VoiceUnavailable(`Deepgram refused the key (${r.status}); check DEEPGRAM_API_KEY`);
    if (r.status === 400) throw new VoiceUnavailable(`Deepgram rejected model "${model}" (400): ${body}`);
    if (r.status && r.status < 500 && r.status !== 429) throw new VoiceUnavailable(`Deepgram ${r.status}: ${body}`);
    if (attempt === 4) throw new VoiceUnavailable(`Deepgram could not be reached (${r.status || 'network'}): ${body}`);
    await new Promise((res) => setTimeout(res, 1500 * attempt));
  }
};

/** Word timestamps of a finished line from Deepgram nova-3, or null. */
const listen = async (key, file) => {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const r = await fetch('https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true', {
        method: 'POST',
        headers: { Authorization: `Token ${key}`, 'Content-Type': 'audio/wav' },
        body: readFileSync(file),
        signal: AbortSignal.timeout(60000),
      });
      if (r.ok) {
        const j = await r.json();
        const words = j.results?.channels?.[0]?.alternatives?.[0]?.words;
        return words?.length ? words.map((w) => ({ word: w.punctuated_word ?? w.word, start: w.start, end: w.end })) : null;
      }
      if (r.status < 500 && r.status !== 429) return null;
    } catch {}
    await new Promise((res) => setTimeout(res, 1200 * attempt));
  }
  return null;
};

const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Script words timed in proportion to their length across the line. */
export const proportional = (text, length) => {
  const words = text.split(/\s+/).filter(Boolean);
  const weights = words.map((w) => w.length + 2);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const span = Math.max(0.2, length - 0.08);
  let t = 0.04;
  return words.map((w, i) => {
    const d = (span * weights[i]) / total;
    const out = { w, start: +t.toFixed(3), end: +(t + d).toFixed(3) };
    t += d;
    return out;
  });
};

/**
 * The script's words, timed from the recognised words: an edit-distance alignment pairs them
 * (so "100" vs "a hundred" or a dropped word does not shift the rest), and unpaired script
 * words are spread between their neighbours.
 */
export const align = (text, heard, length) => {
  const words = text.split(/\s+/).filter(Boolean);
  const a = words.map(norm);
  const b = heard.map((h) => norm(h.word));
  const n = a.length;
  const m = b.length;
  const D = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i += 1)
    for (let j = 1; j <= m; j += 1) D[i][j] = Math.min(D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1), D[i - 1][j] + 1, D[i][j - 1] + 1);
  const pair = new Array(n).fill(null);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (D[i][j] === D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      pair[i - 1] = j - 1;
      i -= 1;
      j -= 1;
    } else if (D[i][j] === D[i - 1][j] + 1) i -= 1;
    else j -= 1;
  }
  const out = words.map((w, k) => (pair[k] === null ? { w, start: null, end: null } : { w, start: heard[pair[k]].start, end: heard[pair[k]].end }));
  for (let k = 0; k < n; k += 1) {
    if (out[k].start !== null) continue;
    let e = k;
    while (e < n && out[e].start === null) e += 1;
    const lo = k > 0 ? out[k - 1].end : 0.04;
    const hi = e < n ? out[e].start : Math.max(lo + 0.2, length - 0.05);
    const step = (hi - lo) / (e - k);
    for (let q = k; q < e; q += 1) {
      out[q].start = +(lo + step * (q - k)).toFixed(3);
      out[q].end = +(lo + step * (q - k + 1)).toFixed(3);
    }
    k = e;
  }
  return out;
};

const which = (bin) => spawnSync(platform() === 'win32' ? 'where' : 'which', [bin], { stdio: 'ignore' }).status === 0;

/** The local engines on this machine, in fallback order. */
export const localEngines = () => [platform() === 'darwin' && which('say') ? 'say' : null, which('espeak-ng') ? 'espeak-ng' : null, 'none'].filter(Boolean);

/** The fallback chain starting at `provider`. */
export const chain = (provider) => {
  const order = ['deepgram', 'say', 'espeak-ng', 'none'];
  return order.slice(Math.max(0, order.indexOf(provider)));
};

const speak = {
  say: (dir, text, out, v) => {
    const aiff = `${out}.aiff`;
    const r = spawnSync('say', ['-v', v.sayVoice ?? 'Samantha', '-r', '185', '-o', aiff, text], { stdio: ['ignore', 'ignore', 'pipe'] });
    if (r.status !== 0) throw new VoiceUnavailable(`macOS say failed: ${String(r.stderr).slice(0, 200)}`);
    ffmpeg(dir, ['-i', aiff, out]);
    rmSync(aiff, { force: true });
  },
  'espeak-ng': (dir, text, out) => {
    const r = spawnSync('espeak-ng', ['-s', '165', '-w', out, text], { stdio: ['ignore', 'ignore', 'pipe'] });
    if (r.status !== 0) throw new VoiceUnavailable(`espeak-ng failed: ${String(r.stderr).slice(0, 200)}`);
  },
};

/** Said when a render falls all the way to a silent draft: the finished, voiceless option. */
export const TEXT_HINT = 'For a finished film without a voice (music, sound effects and on-screen text; free, no API key) set "voice": { "provider": "text" } or pass --voice-engine text.';

/** The no-voice mode: no audio, no API; each line lasts its reading time. */
const textLines = (lines, log) => {
  log(`voice: none (text mode): lines shown as on-screen text at ${READING.wordsPerSecond} words/s, at least ${READING.min} s each`);
  const out = lines.map((l) => ({ src: null, seconds: estimateReadSeconds(l.text), words: null }));
  for (const [i, l] of out.entries()) log(`  line ${String(i + 1).padStart(2)}  ${l.seconds.toFixed(2)} s  ${lines[i].scene.padEnd(12)} "${lines[i].text}"`);
  const total = out.reduce((s, l) => s + l.seconds, 0);
  log(`reading total ${total.toFixed(1)} s`);
  return { engine: 'text', provider: 'text', model: null, speed: 1, fallback: false, mode: 'text', captions: { stt: 0, proportional: 0, reading: out.length }, seconds: +total.toFixed(2), lines: out };
};

/**
 * Voice the render's lines. Returns { engine, provider, model, speed, fallback, captions, lines }
 * where lines[i] = { src: 'vo/<file>.wav' | null, seconds, words }.
 */
export const voice = async (p, { dir, keep = false, settings, log = (m) => console.error(m), warn = (m) => console.error(`warning: ${m}`) }) => {
  const { lines } = p.config;
  if (settings.provider === 'text') return textLines(lines, log);
  mkdirSync(p.voice, { recursive: true });
  const key = envKey('DEEPGRAM_API_KEY', p);
  const local = localEngines();
  const steps = chain(settings.provider).filter((e) => e === 'deepgram' || local.includes(e));
  let at = 0;
  let provider = steps[0];
  let fallback = false;
  const fall = (why) => {
    at += 1;
    provider = steps[at] ?? 'none';
    fallback = true;
    warn(`!!! VOICE FALLBACK: ${why}; voicing with "${provider}" instead${provider === 'none' ? ' (a silent draft: lengths estimated from the words)' : ''}. Not for publishing.${provider === 'none' ? ` ${TEXT_HINT}` : ''}`);
  };
  if (provider !== settings.provider) {
    fallback = true;
    warn(`!!! VOICE FALLBACK: "${settings.provider}" is not available on this machine; voicing with "${provider}" instead. Not for publishing.${provider === 'none' ? ` ${TEXT_HINT}` : ''}`);
  }
  if (provider === 'deepgram' && !key) fall('DEEPGRAM_API_KEY is not set (environment, .trailer/.env or .env)');
  const tempoFor = () => {
    const k = settings.speed * (provider === 'say' ? SAY_TEMPO : 1);
    return Math.abs(k - 1) > 0.001 ? `,atempo=${+k.toFixed(4)}` : '';
  };
  const ident = () => (provider === 'deepgram' ? `deepgram:${settings.model}` : provider === 'say' ? `say:${settings.sayVoice}:${SAY_TEMPO}` : provider);
  log(`voice: ${settings.provider === provider ? '' : `${settings.provider} -> `}${ident()} at ${settings.speed}x`);

  const files = [];
  for (const [i, line] of lines.entries()) {
    const own = resolve(p.voice, `line-${i + 1}.wav`);
    if (keep && existsSync(own)) {
      const name = `own-${sha(`${sha(readFileSync(own))}|${line.text}`)}.wav`;
      const file = resolve(p.voice, name);
      if (!existsSync(file)) ffmpeg(dir, ['-i', own, '-af', NORM, '-ar', '48000', '-ac', '2', file]);
      files.push({ file, name, own: true });
      continue;
    }
    for (;;) {
      if (provider === 'none') {
        files.push(null);
        break;
      }
      const name = `${sha(`${ident()}|${settings.speed}|${line.text}`)}.wav`;
      const file = resolve(p.voice, name);
      if (existsSync(file)) {
        files.push({ file, name });
        break;
      }
      const raw = `${file}.raw.wav`;
      try {
        if (provider === 'deepgram') await deepgram(key, settings.model, line.text, raw);
        else speak[provider](dir, line.text, raw, settings);
      } catch (e) {
        rmSync(raw, { force: true });
        if (!(e instanceof VoiceUnavailable)) throw e;
        fall(e.message);
        continue;
      }
      ffmpeg(dir, ['-i', raw, '-af', `${TRIM}${tempoFor()},${NORM}`, '-ar', '48000', '-ac', '2', `${file}.tmp.wav`]);
      renameSync(`${file}.tmp.wav`, file);
      rmSync(raw, { force: true });
      log(`  voiced line ${i + 1} (${ident()})`);
      files.push({ file, name });
      break;
    }
  }

  // Word timings for the captions, cached against the audio and the text.
  const timedBy = { stt: 0, proportional: 0 };
  const out = [];
  for (const [i, line] of lines.entries()) {
    const f = files[i];
    if (!f) {
      const seconds = estimateLineSeconds(line.text, settings.speed);
      timedBy.proportional += 1;
      out.push({ src: null, seconds, words: proportional(line.text, seconds) });
      continue;
    }
    const length = durationOf(dir, f.file);
    const wordsFile = f.file.replace(/\.wav$/, '.words.json');
    let words = null;
    if (existsSync(wordsFile)) {
      const c = JSON.parse(readFileSync(wordsFile, 'utf8'));
      if (c.text === line.text && c.source === 'stt') words = c.words;
    }
    if (!words && key && (provider === 'deepgram' || f.own) && !fallback) {
      const heard = await listen(key, f.file);
      if (heard) {
        words = align(line.text, heard, length);
        writeFileSync(wordsFile, JSON.stringify({ text: line.text, source: 'stt', heard, words }, null, 2));
      }
    }
    if (words) timedBy.stt += 1;
    else {
      words = proportional(line.text, length);
      timedBy.proportional += 1;
    }
    out.push({ src: `vo/${f.name}`, seconds: length, words });
  }
  for (const [i, l] of out.entries()) log(`  line ${String(i + 1).padStart(2)}  ${l.seconds.toFixed(2)} s  ${lines[i].scene.padEnd(12)} "${lines[i].text}"`);
  const total = out.reduce((s, l) => s + l.seconds, 0);
  log(`voice total ${total.toFixed(1)} s; caption words timed by speech-to-text on ${timedBy.stt} line(s), by length on ${timedBy.proportional}`);
  return { engine: ident(), provider, model: settings.model, speed: settings.speed, fallback, mode: provider === 'none' ? 'silent-draft' : 'narration', captions: timedBy, seconds: +total.toFixed(2), lines: out };
};

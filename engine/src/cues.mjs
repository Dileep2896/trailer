// Cues: when something happens inside a scene, in the scene's local frames. Every v3 element
// that animates takes an `at` cue (and some an `until`), so the picture is timed to the voice:
//
//   1              the start of the scene's line 1 (0-based; 1.5 = halfway through line 1)
//   "stale"        the moment the word "stale" is spoken in this scene (first time)
//   "stale#2"      the second time it is spoken
//   "1:stale"      the word in line 1 only
//   "2.5s"         2.5 s after the scene starts;  "-1s" 1 s before it ends
//   "end"          the scene's last frame
//   { line, word, s, offset }   the object form; `offset` (seconds) shifts any cue
//
// Words come from Deepgram's word timestamps (aligned to the script), else they are spread
// in proportion to their length. Shared by the scenes, the captions and the sound effects.
import { FPS } from './timeline.mjs';

const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9%$.]/g, '').replace(/\.$/, '');

const wordsOf = (line) => {
  // STT can merge words ("Three. Two. One." heard as "321."), leaving aligned times that run
  // backwards; such a line falls back to the proportional spread below
  const ok = line.words?.length && line.words.every((w, i) => w.end >= w.start && (!i || w.start >= line.words[i - 1].end - 0.05));
  if (ok) return line.words;
  const ws = line.text.split(/\s+/).filter(Boolean);
  const weights = ws.map((w) => w.length + 2);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const len = line.frames / FPS;
  let t = 0;
  return ws.map((w, i) => {
    const d = (len * weights[i]) / total;
    const o = { w, start: t, end: t + d };
    t += d;
    return o;
  });
};

const wordFrame = (t, word, nth = 1, only = null, edge = 'start') => {
  const target = String(word).trim().split(/\s+/).map(norm).filter(Boolean);
  if (!target.length) return null;
  let seen = 0;
  for (const [li, line] of t.lines.entries()) {
    if (only !== null && li !== only) continue;
    const ws = wordsOf(line);
    for (let i = 0; i < ws.length; i += 1) {
      const ok = target.every((tw, k) => {
        const w = ws[i + k];
        if (!w) return false;
        const n = norm(w.w);
        return n === tw || (tw.length >= 4 && n.startsWith(tw));
      });
      if (!ok) continue;
      seen += 1;
      if (seen < nth) continue;
      const w = edge === 'end' ? ws[i + target.length - 1] : ws[i];
      return Math.round(line.local + (edge === 'end' ? w.end : w.start) * FPS);
    }
  }
  return null;
};

/** A cue in local frames, or `fallback` when it cannot be resolved. */
export const cueFrame = (t, cue, fallback = 0) => {
  if (cue === undefined || cue === null || cue === '') return fallback;
  if (typeof cue === 'number') {
    const i = Math.floor(cue);
    const l = t.lines[i];
    if (!l) return fallback;
    return Math.round(l.local + (cue - i) * l.frames);
  }
  if (typeof cue === 'string') {
    const s = cue.trim();
    if (s === 'end') return t.duration;
    if (s === 'start') return 0;
    const sec = s.match(/^([+-]?\d+(?:\.\d+)?)s$/);
    if (sec) {
      const v = Number(sec[1]);
      return Math.round(v < 0 || s.startsWith('-') ? t.duration + v * FPS : v * FPS);
    }
    const m = s.match(/^(?:(\d+):)?(.+?)(?:#(\d+))?$/);
    const f = wordFrame(t, m[2], m[3] ? Number(m[3]) : 1, m[1] !== undefined ? Number(m[1]) : null);
    return f ?? fallback;
  }
  if (typeof cue === 'object') {
    let f = fallback;
    if (cue.word !== undefined) f = wordFrame(t, cue.word, cue.nth ?? 1, cue.line ?? null, cue.edge ?? 'start') ?? fallback;
    else if (cue.line !== undefined) f = cueFrame(t, cue.line, fallback);
    else if (cue.s !== undefined) f = cueFrame(t, `${cue.s}s`, fallback);
    return Math.round(f + (cue.offset ?? 0) * FPS);
  }
  return fallback;
};

/** The frame a line ends (local), for "until" defaults. */
export const lineEndFrame = (t, i, fallback = t.duration) => {
  const l = t.lines[i];
  return l ? l.local + l.frames : fallback;
};

/**
 * Default arrival times for n items: on their own lines when the scene has enough, else
 * spread across the scene's voice.
 */
export const spreadCues = (t, n, start = 8) => {
  if (!n) return [];
  if (t.lines.length >= n && n > 1) return t.lines.slice(0, n).map((l) => l.local);
  const a = t.lines[0]?.local ?? start;
  const last = t.lines[t.lines.length - 1];
  const b = last ? last.local + last.frames * 0.75 : t.duration * 0.6;
  return Array.from({ length: n }, (_, i) => Math.round(a + ((b - a) * i) / Math.max(1, n)));
};

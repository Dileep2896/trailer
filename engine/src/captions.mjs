// Caption chunks from the timeline: each voice line's timed words are grouped into short
// chunks (at most `maxWords`, about two lines, breaking after punctuation), placed on the
// film's frames. Shared by the video (karaoke captions) and trailer.mjs (the .srt and .vtt).
import { FPS } from './timeline.mjs';

const proportional = (text, length) => {
  const words = text.split(/\s+/).filter(Boolean);
  const weights = words.map((w) => w.length + 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let t = 0;
  return words.map((w, i) => {
    const d = (length * weights[i]) / total;
    const o = { w, start: t, end: t + d };
    t += d;
    return o;
  });
};

/** [{ from, to, text, words: [{ text, from, to }] }] in film frames. */
export const captionChunks = (tl, { maxWords = 6, maxChars = 44 } = {}) => {
  const chunks = [];
  for (const line of tl.lines) {
    const words = line.words?.length ? line.words : proportional(line.text, line.frames / FPS);
    const timed = words.map((w) => {
      const from = line.from + Math.round(w.start * FPS);
      return { text: w.w, from, to: Math.max(from + 2, line.from + Math.round(w.end * FPS)) };
    });
    // Phrases end at punctuation; a phrase longer than maxWords (or two lines of text) is split
    // into even parts, so no chunk strands a single word.
    const phrases = [];
    let cur = [];
    timed.forEach((w, i) => {
      cur.push(w);
      if (/[.,;:!?…—–]$/.test(w.text) || i === timed.length - 1) {
        phrases.push(cur);
        cur = [];
      }
    });
    // Fold a one-word phrase into its neighbour when they fit together.
    for (let i = 0; i < phrases.length; i += 1) {
      if (phrases[i].length === 1 && phrases.length > 1) {
        const j = i + 1 < phrases.length && (i === 0 || phrases[i + 1].length <= phrases[i - 1].length) ? i + 1 : i - 1;
        if (phrases[i].length + phrases[j].length <= maxWords) {
          phrases[Math.min(i, j)] = j > i ? [...phrases[i], ...phrases[j]] : [...phrases[j], ...phrases[i]];
          phrases.splice(Math.max(i, j), 1);
          i -= 1;
        }
      }
    }
    for (const ph of phrases) {
      const chars = ph.reduce((a, w) => a + w.text.length + 1, 0);
      const parts = Math.max(Math.ceil(ph.length / maxWords), Math.ceil(chars / (maxChars * 2)));
      const per = Math.ceil(ph.length / parts);
      for (let k = 0; k < ph.length; k += per) {
        const ws = ph.slice(k, k + per);
        chunks.push({ line: line.index, words: ws, from: ws[0].from, to: ws[ws.length - 1].to, text: ws.map((w) => w.text).join(' ') });
      }
    }
  }
  // Hold each chunk a little past its last word, up to the next chunk; never under 10 frames.
  chunks.forEach((c, i) => {
    const next = chunks[i + 1];
    const hold = c.to + 10;
    c.to = Math.max(c.from + 10, next ? Math.min(hold, next.from) : hold);
  });
  return chunks;
};

const stamp = (frames, sep) => {
  const ms = Math.round((frames / FPS) * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${sep}${String(r).padStart(3, '0')}`;
};

export const toSrt = (chunks) => chunks.map((c, i) => `${i + 1}\n${stamp(c.from, ',')} --> ${stamp(c.to, ',')}\n${c.text}\n`).join('\n');
export const toVtt = (chunks) => `WEBVTT\n\n${chunks.map((c, i) => `${i + 1}\n${stamp(c.from, '.')} --> ${stamp(c.to, '.')}\n${c.text}\n`).join('\n')}`;

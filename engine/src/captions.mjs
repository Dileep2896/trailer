// Caption chunks from the timeline: each voice line's timed words are grouped into short
// chunks (at most `maxWords`, about two lines, breaking after punctuation; src/phrases.mjs),
// placed on the film's frames. Shared by the video (karaoke captions) and trailer.mjs (the .srt and .vtt).
import { FPS } from './timeline.mjs';
import { phraseGroups } from './phrases.mjs';

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

/**
 * [{ from, to, text, words: [{ text, from, to }] }] in film frames. With `reading` (the text
 * mode) a chunk stays up until the next chunk of its line and the line's last chunk until the
 * line ends, so the beat between lines is blank; narration captions hold 10 frames past their
 * last word instead.
 */
export const captionChunks = (tl, { maxWords = 6, maxChars = 44, reading = false } = {}) => {
  const chunks = [];
  for (const line of tl.lines) {
    const words = line.words?.length ? line.words : proportional(line.text, line.frames / FPS);
    const timed = words.map((w) => {
      const from = line.from + Math.round(w.start * FPS);
      return { text: w.w, from, to: Math.max(from + 2, line.from + Math.round(w.end * FPS)) };
    });
    const end = line.from + line.frames;
    for (const g of phraseGroups(timed.map((w) => w.text), { maxWords, maxChars })) {
      const ws = g.map((k) => timed[k]);
      chunks.push({ line: line.index, words: ws, from: ws[0].from, to: ws[ws.length - 1].to, text: ws.map((w) => w.text).join(' '), end });
    }
  }
  chunks.forEach((c, i) => {
    const next = chunks[i + 1];
    if (reading) {
      const until = next && next.line === c.line ? next.from : c.end;
      c.to = Math.max(c.from + 10, next ? Math.min(until, next.from) : until);
    } else {
      // Hold each chunk a little past its last word, up to the next chunk; never under 10 frames.
      const hold = c.to + 10;
      c.to = Math.max(c.from + 10, next ? Math.min(hold, next.from) : hold);
    }
    delete c.end;
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

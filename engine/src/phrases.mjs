// How a line's words are grouped into caption chunks: phrases end at punctuation, a phrase
// longer than maxWords (or two lines of text) is split into even parts that do not end on a
// word like "the", and a one-word phrase folds into a neighbour when they fit together. Shared by the captions (captions.mjs) and the
// text mode's reading timer (timeline.mjs), so a chunk on screen is the unit the timer paces.

/** Groups of word indexes: [[0, 1, 2], [3, 4], ...] for the words (strings) of one line. */
export const phraseGroups = (words, { maxWords = 6, maxChars = 44 } = {}) => {
  const phrases = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push(i);
    if (/[.,;:!?…—–]$/.test(w) || i === words.length - 1) {
      phrases.push(cur);
      cur = [];
    }
  });
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
  const out = [];
  for (const ph of phrases) {
    const chars = ph.reduce((a, k) => a + words[k].length + 1, 0);
    const parts = Math.min(ph.length, Math.max(Math.ceil(ph.length / maxWords), Math.ceil(chars / (maxChars * 2))));
    // Even parts (7 words in 3 parts: 3, 2, 2, never 3, 3, 1) whose breaks avoid ending a part
    // on a word that leans on the next one ("the", "of", "to"), allowing one extra part.
    const sizes = splitSizes(ph.map((k) => words[k]), parts, maxWords);
    let k = 0;
    for (const n of sizes) {
      out.push(ph.slice(k, k + n));
      k += n;
    }
  }
  return out;
};

/**
 * Part sizes for `ws` in `parts` (or parts + 1) parts of at most `max` words: the split with the
 * least cost, where a part's cost is its squared distance from an even share, plus 3 for ending
 * on a weak word, plus 1.5 for the extra part. Phrases are short, so a full search is cheap.
 */
const splitSizes = (ws, parts, max) => {
  const n = ws.length;
  if (parts <= 1) return [n];
  let best = null;
  for (const p of [parts, parts + 1]) {
    if (p > n) continue;
    const even = n / p;
    const go = (start, left, acc, cost) => {
      if (best && cost >= best.cost - 1e-9) return;
      if (left === 1) {
        const size = n - start;
        if (size < 1 || size > max) return;
        const c = cost + (size - even) ** 2 + (p > parts ? 1.5 : 0);
        if (!best || c < best.cost - 1e-9) best = { cost: c, sizes: [...acc, size] };
        return;
      }
      // Longer parts first, so a tie goes to the split that front-loads the words.
      for (let size = Math.min(max, n - start - (left - 1)); size >= 1; size -= 1) {
        const weak = WEAK.has(norm(ws[start + size - 1])) ? 3 : 0;
        go(start + size, left - 1, [...acc, size], cost + (size - even) ** 2 + weak);
      }
    };
    go(0, p, [], 0);
  }
  return best ? best.sizes : [n];
};

/** Words that lean on the next one; a caption chunk should not end on them. */
const WEAK = new Set(['a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'from', 'with', 'and', 'or', 'but', 'its', 'their', 'your', 'every', 'each', 'is', 'are', 'was']);
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, '');

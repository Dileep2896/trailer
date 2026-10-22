// The timeline, shared by the video and the node scripts (voice, audio, make).
//
// Scenes are cut on the music's grid: a beat is 60/bpm seconds (15 frames at 120 BPM, 30 fps)
// and cuts land on half beats. A scene lasts its lead, its voice lines with their gaps and its
// tail, never less than its minimum, rounded up to the grid. Lines start `lead` frames in.
//
// config.fitSeconds trims leads, tails, gaps and minimums (never the voice) until the cut is
// at or under that length.
import { isTextMode, resolveCaptions, resolveMusic } from './options.mjs';
import { phraseGroups } from './phrases.mjs';
import { V3_TYPES, normalizeConfig } from './config.mjs';

export const FPS = 30;

/** Per-type defaults: lead and tail in frames, minimum scene length in frames. */
export const SCENE_DEFAULTS = {
  hook: { lead: 3, tail: 6, min: 45 },
  problem: { lead: 3, tail: 7, min: 54 },
  reveal: { lead: 8, tail: 8, min: 45 },
  features: { lead: 3, tail: 7, min: 54 },
  walkthrough: { lead: 4, tail: 10, min: 54 },
  metric: { lead: 4, tail: 10, min: 54 },
  payoff: { lead: 2, tail: 6, min: 33 },
  end: { lead: 6, tail: 18, min: 54 },
};
export const DEFAULT_GAP = 3;

/**
 * v3 (about 60 s films at the voice's natural speed): every scene gets a lead-in, a breath
 * after its last line (tail) and a minimum hold. A scene's `breath` (seconds) sets its tail,
 * `hold` (seconds) its minimum, `lead` (frames) its lead-in.
 */
export const V3_DEFAULTS = {
  hook: { lead: 8, tail: 10, min: 75 },
  problem: { lead: 8, tail: 12, min: 90 },
  reveal: { lead: 8, tail: 10, min: 75 },
  features: { lead: 8, tail: 12, min: 90 },
  walkthrough: { lead: 8, tail: 14, min: 90 },
  metric: { lead: 8, tail: 20, min: 105 },
  payoff: { lead: 6, tail: 10, min: 60 },
  end: { lead: 8, tail: 45, min: 105 },
  kinetic: { lead: 6, tail: 10, min: 60 },
  title: { lead: 8, tail: 10, min: 75 },
  outro: { lead: 8, tail: 45, min: 105 },
  cast: { lead: 8, tail: 12, min: 90 },
  ui: { lead: 8, tail: 14, min: 105 },
  screenshot: { lead: 8, tail: 14, min: 105 },
  split: { lead: 8, tail: 14, min: 105 },
  evidence: { lead: 8, tail: 14, min: 105 },
  casefile: { lead: 8, tail: 14, min: 105 },
  scoreboard: { lead: 8, tail: 16, min: 90 },
  chalkboard: { lead: 8, tail: 14, min: 105 },
  chat: { lead: 8, tail: 14, min: 90 },
  countdown: { lead: 6, tail: 10, min: 75 },
  rewind: { lead: 4, tail: 10, min: 60 },
  calendar: { lead: 8, tail: 10, min: 90 },
  lanes: { lead: 8, tail: 14, min: 120 },
};
export const V3_GAP = 8;

export const SCENE_TYPES = [...Object.keys(SCENE_DEFAULTS), ...V3_TYPES];

/**
 * Seconds Deepgram aura-2 takes to say a line at voice.speed 1.0, estimated from the text, for
 * renders with no voice yet (--lint, --voice-engine none). Fitted on measured aura-2-hermes-en
 * lines (trimmed, as voice.mjs keeps them): about 3 words a second while speaking, plus 0.5 s
 * per line, 0.65 s per sentence break inside the line and 0.15 s per comma, colon or semicolon.
 * Across a whole film, with leads, gaps and tails, that comes to about 2 spoken words per
 * second of film (the word budget in scripts/lib.mjs).
 */
export const SPEECH = { wordsPerSecond: 3, perLine: 0.5, perSentence: 0.65, perClause: 0.15, min: 0.8 };
export const estimateLineSeconds = (text, speed = 1) => {
  const t = String(text ?? '').trim();
  const words = t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const breaks = Math.max(0, (t.match(/[.?!]+(?=\s|$)/g) ?? []).length - 1);
  const clauses = (t.match(/[,;:]/g) ?? []).length;
  const k = Number(speed) > 0 ? Number(speed) : 1;
  const sec = words / SPEECH.wordsPerSecond + SPEECH.perLine + SPEECH.perSentence * breaks + SPEECH.perClause * clauses;
  return +(Math.max(SPEECH.min, sec) / k).toFixed(3);
};

/**
 * The no-voice (text) mode: every line is on-screen text, so a line lasts as long as it takes
 * to read, not to say. Subtitle guidelines put comfortable adult reading at 160 to 180 words a
 * minute (BBC) or 17 characters a second (Netflix, about 3 words a second); children's and
 * "watching something else at the same time" rates sit near 13 characters a second (about 2.4
 * words). Trailer text competes with a moving picture, so the engine reads at 2.5 words a
 * second (150 wpm), adds 0.6 s per line to notice the new phrase, 0.25 s per sentence break
 * and 0.1 s per comma, colon or semicolon, holds any line at least 1.5 s (a two-word title still
 * registers) and leaves a 0.5 s beat (`gap`, frames) between lines so the next phrase reads as
 * new. Across a film that comes to about 1.5 words a second of film (the word budget in
 * scripts/lib.mjs), against 1.9 for a narrator.
 */
export const READING = { wordsPerSecond: 2.2, perLine: 0.7, perSentence: 0.3, perClause: 0.1, min: 1.5, gap: 15 };
const textOf = (text) => String(text ?? '').trim();
const wordCount = (t) => t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
export const estimateReadSeconds = (text) => {
  const t = textOf(text);
  const breaks = Math.max(0, (t.match(/[.?!]+(?=\s|$)/g) ?? []).length - 1);
  const clauses = (t.match(/[,;:]/g) ?? []).length;
  const sec = wordCount(t) / READING.wordsPerSecond + READING.perLine + READING.perSentence * breaks + READING.perClause * clauses;
  return +Math.max(READING.min, sec).toFixed(3);
};

/**
 * Word times (seconds into the line) for a line shown as text: the line is split into the
 * phrases the captions show (src/phrases.mjs) and each phrase is on screen for its share of the
 * line (its words plus one, the time to notice it). Every word of a phrase starts when the
 * phrase appears, so a word cue fires when its word comes on screen; the phrase's last word
 * ends when the phrase leaves.
 */
export const readingWords = (text, seconds, { maxWords = 5, maxChars = 44 } = {}) => {
  const words = textOf(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const groups = phraseGroups(words, { maxWords, maxChars });
  const weight = groups.map((g) => g.length + 1);
  const total = weight.reduce((a, b) => a + b, 0);
  const out = [];
  let t = 0;
  for (const [i, g] of groups.entries()) {
    const d = (seconds * weight[i]) / total;
    g.forEach((k, j) => {
      out[k] = { w: words[k], start: +t.toFixed(3), end: +(j === g.length - 1 ? t + d : t).toFixed(3) };
    });
    t += d;
  }
  return out;
};

const voiceSpeed = (config) => (config.voice && typeof config.voice === 'object' && Number(config.voice.speed) > 0 ? Number(config.voice.speed) : 1);

/** A scene's id: its `id`, else its type. */
export const sceneId = (s) => s.id ?? s.type;

/** Frames per beat at the config's tempo. */
export const beatFrames = (config) => (FPS * 60) / resolveMusic(config).bpm;

const layout = (config, media, k, grid) => {
  const scenes = [];
  const lines = [];
  let units = 0;
  const v3 = config.kit >= 3;
  const text = isTextMode(config);
  const gapDefault = text ? READING.gap : v3 ? V3_GAP : DEFAULT_GAP;
  const cap = text ? resolveCaptions(config) : null;
  for (const s of config.scenes) {
    const id = sceneId(s);
    const d = (v3 ? V3_DEFAULTS[s.type] : SCENE_DEFAULTS[s.type]) ?? { lead: 8, tail: 16, min: 75 };
    const lead = Math.max(2, Math.round((s.lead ?? d.lead) * k));
    const tail = Math.max(2, Math.round((s.breath !== undefined ? s.breath * FPS : (s.tail ?? d.tail)) * k));
    const min = Math.round((s.hold !== undefined ? s.hold * FPS : (s.min ?? d.min)) * k);
    const from = Math.round(units * grid);
    let t = lead;
    const own = [];
    config.lines.forEach((l, i) => {
      if (l.scene !== id) return;
      const m = media.lines?.[i];
      const seconds = m?.seconds ?? (text ? estimateReadSeconds(l.text) : v3 ? estimateLineSeconds(l.text, voiceSpeed(config)) : Math.max(1, l.text.split(/\s+/).length / 2.6));
      const frames = Math.ceil(seconds * FPS);
      const words = m?.words ?? (text ? readingWords(l.text, frames / FPS, { maxWords: cap.maxWords }) : null);
      const line = { index: i, src: text ? null : (m?.src ?? null), from: from + t, frames, local: t, scene: id, text: l.text, words };
      own.push(line);
      lines.push(line);
      t += frames + Math.max(1, Math.round((l.gap ?? gapDefault) * Math.min(1, k + 0.3)));
    });
    // v3: the gap belongs between lines, not after the scene's last one (its tail covers that).
    if (v3 && own.length) {
      const last = config.lines[own[own.length - 1].index];
      t -= Math.max(1, Math.round((last.gap ?? gapDefault) * Math.min(1, k + 0.3)));
    }
    const need = Math.max(min, t + tail);
    units += Math.ceil(need / grid - 1e-6);
    const to = Math.round(units * grid);
    scenes.push({ id, type: s.type, from, duration: to - from, lines: own });
  }
  return { scenes, lines, total: Math.round(units * grid), fps: FPS };
};

/**
 * Build the timeline from the config and the measured voice lines (in the text mode, the
 * reading times).
 * media.lines[i] = { src, seconds, words? } for config.lines[i]. Missing lines fall back to an
 * estimate from the text (estimateLineSeconds; classic films: 2.6 words a second), so the
 * video previews unvoiced.
 */
export const buildTimeline = (raw, media = { lines: [] }) => {
  const config = normalizeConfig(raw);
  const beat = beatFrames(config);
  const grid = beat / 2;
  let tl = layout(config, media, 1, grid);
  const target = config.fitSeconds ? Math.round(config.fitSeconds * FPS) : null;
  let k = 1;
  let used = grid;
  if (target && tl.total > target) {
    // The most slack that fits: on the half-beat grid first, then quarter beats, then frames.
    search: for (const g of [grid, beat / 4, 1]) {
      for (let step = 0; step <= 20; step += 1) {
        k = 1 - step * 0.05;
        tl = layout(config, media, k, g);
        used = g;
        if (tl.total <= target) break search;
      }
    }
  }
  return { ...tl, beat, grid: used, text: isTextMode(config), fit: target ? { target, scale: Math.max(0, Number(k.toFixed(2))), met: tl.total <= target } : null };
};

/**
 * Frames inside a walkthrough scene, shared by the scene and the sound effects so clicks,
 * pops and chimes land on what the picture does. Shot i starts near line i when the scene has
 * a line per shot (balanced against an even split), else the scene is split evenly.
 */
export const walkPlan = (scene, shots) => {
  const n = Math.max(1, shots.length);
  const starts = [];
  for (let i = 0; i < n; i += 1) {
    const line = scene.lines[i];
    const even = Math.round((scene.duration * i) / n);
    // Halfway between the shot's line and an even split, so a short first line still gets its shot.
    starts.push(i === 0 ? 0 : scene.lines.length >= n && line ? Math.round((Math.max(0, line.local - 6) + even) / 2) : even);
  }
  return shots.map((shot, i) => {
    const from = starts[i];
    const to = i + 1 < n ? starts[i + 1] : scene.duration;
    const dur = to - from;
    const click = from + Math.round(dur * (shot.clickAt ?? 0.45));
    return { from, dur, click, ring: click + 4, toast: click + 12 };
  });
};

/** When each item of a list scene (features, metrics) arrives: on its own line when there are enough lines. */
export const itemTimes = (scene, count, startPad = 6) => {
  if (!count) return [];
  const a = scene.lines[0]?.local ?? startPad;
  const last = scene.lines[scene.lines.length - 1];
  const b = last ? last.local + last.frames * 0.7 : scene.duration * 0.6;
  if (scene.lines.length >= count) return scene.lines.slice(0, count).map((l) => l.local);
  return Array.from({ length: count }, (_, i) => Math.round(a + ((b - a) * i) / Math.max(1, count)));
};

/**
 * The frame (into the scene) where a scene's first cue has settled: about 0.7 s after its first
 * line starts, before its second line and clear of its outgoing transition. A short shows scene 1
 * at this frame from frame 0 until the live scene catches up (settledFrameAt), and a looping
 * last scene fades to it.
 */
export const settleFrame = (scene) => {
  const l0 = scene.lines[0];
  const l1 = scene.lines[1];
  const start = l0?.local ?? 0;
  let f = start + 20;
  if (l0) f = Math.max(start + 12, Math.min(f, l0.local + l0.frames - 1));
  if (l1) f = Math.min(f, l1.local - 1);
  return Math.max(0, Math.min(f, scene.duration - 14));
};

/**
 * The frame of scene 1 shown at local frame f when the render starts settled: the settled frame
 * until the live scene reaches it, then the live frame. So frame 0 is the thumbnail, scene 1
 * never goes empty after it, and a loop that fades into frame 0 wraps without a flash.
 */
export const settledFrameAt = (f, settle) => (f < settle ? settle : f);

/** Frames the last scene of a loop: true film fades into scene 1's settled frame. */
export const LOOP_FADE = 12;

/**
 * Whether frame 0 shows scene 1 already settled: 9:16 and 1:1 renders (shorts start playing
 * muted and the platforms show frame 0 as the thumbnail), and any render whose last scene has
 * loop: true. A scene-1 `firstFrame: "live"` turns it off; "settled" turns it on for 16:9.
 */
export const settledStart = (config) => {
  const first = config.scenes?.[0];
  if (first?.firstFrame === 'live') return false;
  if (first?.firstFrame === 'settled') return true;
  return config.aspect === '9:16' || config.aspect === '1:1' || config.scenes?.at(-1)?.loop === true;
};

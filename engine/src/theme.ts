import { createContext, useContext } from 'react';
import { Easing, interpolate, spring } from 'remotion';
import { loadNamed } from './fonts';
import { MOTION, contrast, mixHex, readable, resolveCaptions, resolveSfx, resolveTheme } from './options.mjs';
import type { Box, TrailerConfig, Shot, Timeline, TimelineScene } from './types';
import { contentInsets, useFrame, type CaptionPos } from './frame';

export type { Box, Shot } from './types';
export { itemTimes as itemsAt, walkPlan } from './timeline.mjs';
export { mixHex } from './options.mjs';

/* ------------------------------------------------------------------ colour */

/** Colour with alpha 0..1, as #rrggbbaa. */
export const alpha = (c: string, a: number) => `${c.slice(0, 7)}${Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0')}`;

/**
 * A surface's colours. Every scene sits on the main surface or the alt one (the main mode
 * inverted, or the theme's alt colours), and everything on it reads its colours from here.
 */
export type Pal = {
  kind: 'main' | 'alt';
  dark: boolean;
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  /** Accent for text and strokes, nudged until it reads on this bg. */
  accent: string;
  /** The raw accent, for fills. */
  fill: string;
  /** Text on an accent fill. */
  onFill: string;
  accent2: string;
  warn: string;
  line: string;
  card: string;
  cardBorder: string;
  background: string;
};

const pal = (kind: Pal['kind'], bg: string, surface: string, ink: string, muted: string, accent: string, accent2: string, warn: string, background: string): Pal => {
  const dark = contrast(bg, '#000000') < contrast(bg, '#ffffff');
  return {
    kind,
    dark,
    bg,
    surface,
    ink,
    muted,
    accent: readable(accent, bg, ink, 2.6),
    fill: accent,
    onFill: contrast(accent, '#ffffff') >= contrast(accent, '#111111') ? '#ffffff' : '#111111',
    accent2: readable(accent2, bg, ink, 2.2),
    warn: readable(warn, bg, ink, 2.6),
    line: mixHex(bg, ink, 0.14),
    card: surface,
    cardBorder: mixHex(surface, ink, dark ? 0.14 : 0.1),
    background,
  };
};

/* ------------------------------------------------------------------ motion */

type MotionSpec = (typeof MOTION)['smooth'];
// The motion energy is set once per render by makeTheme; `at` and `pop` read it so every
// arrival in the film shares one feel.
let M: MotionSpec = MOTION.smooth;
let EASE = Easing.bezier(...(M.ease as [number, number, number, number]));

/** Expo out: fast start, long settle. */
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
/** Strong in-out for camera moves and exits. */
export const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
/** Accelerating, for things leaving fast. */
export const IN = Easing.bezier(0.7, 0, 0.84, 0);

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/**
 * 0 to 1 over [from, from + dur]. Without an explicit easing it uses the theme's motion
 * energy: its curve, and its speed (calm stretches durations, aggressive shortens them).
 */
export const at = (frame: number, from: number, dur: number, easing?: (t: number) => number) =>
  easing ? interpolate(frame, [from, from + dur], [0, 1], { ...clamp, easing }) : interpolate(frame, [from, from + Math.max(1, dur * M.speed)], [0, 1], { ...clamp, easing: EASE });
export const keys = (frame: number, input: number[], output: number[], easing = INOUT) => interpolate(frame, input, output, { ...clamp, easing });
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** A spring in the theme's motion energy; `soft` > 1 damps it more. */
export const pop = (frame: number, fps: number, soft = 1) => spring({ frame, fps, config: { damping: M.spring.damping * soft, stiffness: M.spring.stiffness } });
/** The current motion energy (stagger multiplier, shake amount, speed). */
export const motion = () => M;

/* ------------------------------------------------------------------ theme */

export type Theme = ReturnType<typeof makeTheme>;

export const makeTheme = (config: TrailerConfig) => {
  const r = resolveTheme(config) as ReturnType<typeof resolveTheme> & Record<string, any>;
  M = (MOTION as Record<string, MotionSpec>)[r.motion] ?? MOTION.smooth;
  EASE = Easing.bezier(...(M.ease as [number, number, number, number]));
  const main = pal('main', r.bg, r.surface, r.ink, r.muted, r.accent, r.accent2, r.warn, r.background);
  // The alt surface: the main one inverted unless the theme names its colours.
  const altBg = r.altBg ?? (main.dark ? mixHex(r.ink, '#ffffff', 0.4) : mixHex(r.ink, r.bg, 0.04));
  const altInk = r.altInk ?? (main.dark ? mixHex(r.bg, '#000000', 0.15) : mixHex(r.bg, '#ffffff', 0.5));
  const altDark = contrast(altBg, '#000000') < contrast(altBg, '#ffffff');
  const altSurface = r.altSurface ?? (altDark ? mixHex(altBg, '#ffffff', 0.07) : '#ffffff');
  const altMuted = r.altMuted ?? mixHex(altInk, altBg, 0.38);
  const alt = pal('alt', altBg, altSurface, altInk, altMuted, r.accent, r.accent2, r.warn, r.altBackground ?? r.background);
  const captions = resolveCaptions(config);
  return {
    ...r,
    main,
    alt,
    M,
    display: loadNamed(r.fonts.display, 'Sora', 300, 900),
    ui: loadNamed(r.fonts.ui, 'Inter', 300, 800),
    mono: loadNamed(r.fonts.mono, 'JetBrains Mono', 300, 700),
    /** Tints of the accent, light to full, for mosaics and tiles. */
    palette: [0.88, 0.74, 0.55, 0.3, 0].map((t) => mixHex(r.accent, '#ffffff', t)),
    upper: r.displayCase === 'upper',
    captions,
    sfx: resolveSfx(config),
    kit: config.kit ?? 2,
  };
};

/* ------------------------------------------------------------------ context */

export type Trailer = { config: TrailerConfig; shots: Record<string, Shot>; timeline: Timeline; theme: Theme };
export const TrailerContext = createContext<Trailer | null>(null);
export const useTrailer = () => {
  const b = useContext(TrailerContext);
  if (!b) throw new Error('useTrailer outside <TrailerContext>');
  return b;
};
export const useTheme = () => useTrailer().theme;

/** The surface the current scene sits on. */
export const PalContext = createContext<Pal | null>(null);
export const usePal = () => {
  const p = useContext(PalContext);
  const T = useTheme();
  return p ?? T.main;
};

/** Where captions sit in the current scene (scenes can move them: top, bottom, lower-third, center-low, off). */
export const CaptionPosContext = createContext<string | null>(null);

/** A scene's caption position: its own `captions`, else the theme's. */
export const captionPosOf = (s: { captions?: string } | undefined, T: Theme) => {
  const c = s?.captions;
  if (!T.captions.enabled) return 'off';
  return c && c !== 'auto' ? c : T.captions.position;
};

/**
 * Space the captions and the platform safe area keep free at the top and bottom of the frame,
 * for scene layouts. In 16:9 this is the caption reserve only (the original film geometry);
 * in 9:16 and 1:1 it is never less than the platform inset.
 */
export const useSafe = () => {
  const T = useTheme();
  const fr = useFrame();
  const scenePos = useContext(CaptionPosContext);
  const c = T.captions;
  const pos = (c.enabled ? (scenePos ?? c.position) : 'off') as CaptionPos;
  const ins = contentInsets(fr, pos, c.size);
  const { reserveTop, reserveBottom } = ins.band;
  if (fr.wide) return { top: reserveTop, bottom: reserveBottom, left: 0, right: 0, pos, frame: fr, content: ins };
  return { top: Math.max(fr.safe.top, reserveTop), bottom: Math.max(fr.safe.bottom, reserveBottom), left: fr.safe.left, right: fr.safe.right, pos, frame: fr, content: ins };
};

/** The scene's own timing: when its voice lines start and end, in local frames. */
export const lineAt = (s: TimelineScene, i: number, fallback = 0) => s.lines[i]?.local ?? fallback;
export const lineEnd = (s: TimelineScene, i: number, fallback = 0) => {
  const l = s.lines[i];
  return l ? l.local + l.frames : fallback;
};

/* ------------------------------------------------------------------ boxes */

export const useShot = (name: string): Shot => {
  const s = useTrailer().shots[name];
  if (!s) throw new Error(`shot "${name}" missing; run the capture`);
  return s;
};
export const centre = (b: Box) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
export const padBox = (b: Box, p: number, py = p): Box => ({ x: b.x - p, y: b.y - py, width: b.width + p * 2, height: b.height + py * 2 });

/** Deterministic 0..1 noise from integers. */
export const hash = (...n: number[]) => {
  let h = 2166136261;
  for (const v of n) {
    h ^= Math.floor(v * 997) + 0x9e3779b9;
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
};

/** Smooth 1D value noise in -1..1, for handheld camera and jitter. */
export const noise = (t: number, seed = 0) => {
  const i = Math.floor(t);
  const f = t - i;
  const a = hash(i, seed) * 2 - 1;
  const b = hash(i + 1, seed) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};

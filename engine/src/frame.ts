import { useVideoConfig } from 'remotion';

// The frame contract: every layout reads the frame size, the platform safe area and the
// caption band from here instead of assuming 1920x1080.
//
// Config pixel coordinates (cast x/y, chalkboard items, telestrator marks, shapes) are
// authored in 16:9 space (AUTHOR). place() maps them into the current frame's content box;
// a scene can override that per aspect with `variants`.

export type Aspect = '16:9' | '9:16' | '1:1';

export const FRAMES: Record<Aspect, { W: number; H: number }> = {
  '16:9': { W: 1920, H: 1080 },
  '9:16': { W: 1080, H: 1920 },
  '1:1': { W: 1080, H: 1080 },
};

/** Insets in px: platform UI plus title-safe. 9:16 keeps the Shorts/Reels/TikTok top bar, caption + buttons zone and action rail clear. */
export const SAFE: Record<Aspect, { top: number; bottom: number; left: number; right: number }> = {
  '16:9': { top: 64, bottom: 48, left: 96, right: 96 },
  '9:16': { top: 220, bottom: 420, left: 64, right: 136 },
  '1:1': { top: 56, bottom: 56, left: 64, right: 64 },
};

/** Config coordinates are authored in this space. */
export const AUTHOR = { W: 1920, H: 1080 };

export type Frame = {
  W: number;
  H: number;
  aspect: Aspect;
  wide: boolean;
  portrait: boolean;
  square: boolean;
  /** Text scale relative to a 1080 px short side (1 for every supported aspect). */
  s: number;
  safe: { top: number; bottom: number; left: number; right: number };
  cx: number;
  cy: number;
};

export const aspectOf = (W: number, H: number): Aspect => (W > H ? '16:9' : W < H ? '9:16' : '1:1');

export const frameOf = (W: number, H: number): Frame => {
  const aspect = aspectOf(W, H);
  return { W, H, aspect, wide: aspect === '16:9', portrait: aspect === '9:16', square: aspect === '1:1', s: Math.min(W, H) / 1080, safe: SAFE[aspect], cx: W / 2, cy: H / 2 };
};

export const useFrame = (): Frame => {
  const { width, height } = useVideoConfig();
  return frameOf(width, height);
};

/* ------------------------------------------------------------------ captions band */

export type CaptionPos = 'bottom' | 'top' | 'lower-third' | 'center-low' | 'off';

/**
 * Where the caption chunk sits and how much room it takes, in frame px. `body` is the room
 * for two lines of captions plus breathing space. reserveTop / reserveBottom are measured
 * from the frame edge, so a layout keeps clear of them.
 */
export const captionBand = (fr: Frame, pos: CaptionPos, size: number) => {
  const body = Math.round(size * 2.3 + 18);
  if (pos === 'off') return { pos, body, edge: 0, cy: 0, reserveTop: 0, reserveBottom: 0 };
  if (pos === 'top') {
    const edge = fr.wide ? 46 : fr.safe.top;
    return { pos, body, edge, cy: edge + body / 2, reserveTop: edge + body, reserveBottom: 0 };
  }
  if (pos === 'center-low') {
    const cy = Math.round(fr.H * (fr.portrait ? 0.72 : 0.8));
    return { pos, body, edge: 0, cy, reserveTop: 0, reserveBottom: Math.round(fr.H - (cy - body / 2)) };
  }
  const edge = fr.wide ? 46 : fr.safe.bottom;
  return { pos, body, edge, cy: fr.H - edge - body / 2, reserveTop: 0, reserveBottom: edge + body };
};

/**
 * The content insets for a frame and caption position: platform safe area and the caption
 * band, whichever is larger. 16:9 keeps the original film geometry exactly (64 px top, 48 px
 * bottom, captions 46 px from the edge).
 */
export const contentInsets = (fr: Frame, pos: CaptionPos, size: number) => {
  const band = captionBand(fr, pos, size);
  if (fr.wide) {
    return { band, top: 64 + band.reserveTop, bottom: Math.max(48, band.reserveBottom ? band.reserveBottom + 18 : 0) };
  }
  return { band, top: Math.max(fr.safe.top, band.reserveTop ? band.reserveTop + 18 : 0), bottom: Math.max(fr.safe.bottom, band.reserveBottom ? band.reserveBottom + 18 : 0) };
};

/* ------------------------------------------------------------------ author space */

export type Area = { left: number; right: number; top: number; bottom: number; width: number; height: number; cx: number; cy: number };

/**
 * Map an author-space point (1920x1080) into the frame's content area. x maps linearly across
 * the content width. `floor` keeps a floor-standing thing's distance from the content bottom
 * (scaled), `free` maps y linearly. Identity in 16:9.
 */
export const place = (x: number, y: number, fr: Frame, A: Area, mode: 'floor' | 'free' = 'free') => {
  if (fr.wide) return { x, y };
  const nx = A.left + (Math.max(0, Math.min(AUTHOR.W, x)) / AUTHOR.W) * A.width;
  if (mode === 'floor') {
    const fromFloor = Math.max(0, AUTHOR.H - 48 - y);
    return { x: nx, y: A.bottom - fromFloor * (A.height / (AUTHOR.H - 112)) };
  }
  return { x: nx, y: A.top + (Math.max(0, Math.min(AUTHOR.H, y)) / AUTHOR.H) * A.height };
};

/** Scale for something authored at `w` x `h` px so it fits `maxW` x `maxH` (never above `cap`). */
export const fitScale = (w: number, h: number, maxW: number, maxH: number, cap = 1) => Math.max(0.05, Math.min(cap, maxW / Math.max(1, w), maxH / Math.max(1, h)));

/** The content area a scene authored at 16:9 had (gutter, caption position and size as given). */
export const authorArea = (gutter: number, pos: CaptionPos, size: number): Area => {
  const fr = frameOf(AUTHOR.W, AUTHOR.H);
  const ins = contentInsets(fr, pos, size);
  const top = ins.top;
  const bottom = AUTHOR.H - ins.bottom;
  return { left: gutter, right: AUTHOR.W - gutter, top, bottom, width: AUTHOR.W - gutter * 2, height: bottom - top, cx: AUTHOR.W / 2, cy: (top + bottom) / 2 };
};

/** A point mapped linearly from one area to another (author 16:9 area -> this frame's area). */
export const mapArea = (x: number, y: number, from: Area, to: Area) => ({
  x: to.left + ((x - from.left) * to.width) / Math.max(1, from.width),
  y: to.top + ((y - from.top) * to.height) / Math.max(1, from.height),
});

import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { cueFrame } from '../cues.mjs';
import { alpha, hash, mixHex, noise, useTrailer, usePal, useSafe, useTheme } from '../theme';
import { glyphWidth } from '../kit';
import type { Cue, TimelineScene } from '../types';
import { useFrame } from '../frame';

// Shared v3 building blocks: cue timing, entrances and exits, the safe area, labels, stamps,
// emoji, the project-name lockup and the repo pill. Every colour comes from the scene's
// surface (usePal) or the theme, so one theme restyles all of it.

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
export const BACK = Easing.bezier(0.34, 1.56, 0.64, 1);
export const ease = (f: number, a: number, d: number, e: (t: number) => number = EXPO) => interpolate(f, [a, a + Math.max(1, d)], [0, 1], { ...clamp, easing: e });

/** Cue resolver for a scene: `cue(c, fallback)` gives local frames. */
export const useCues = (t: TimelineScene) => (c: Cue | undefined, fallback = 0) => cueFrame(t, c as any, fallback);

/**
 * The usable frame for content: inside the gutters (16:9) or the platform safe area (9:16,
 * 1:1), and clear of the caption band. `gutter` 0 asks for a full-bleed width.
 */
export const useArea = (gutter = 96) => {
  const safe = useSafe();
  const fr = safe.frame;
  const top = safe.content.top;
  const bottom = fr.H - safe.content.bottom;
  const left = fr.wide ? gutter : gutter === 0 ? 0 : fr.safe.left;
  const right = fr.wide ? fr.W - gutter : gutter === 0 ? fr.W : fr.W - fr.safe.right;
  return { left, right, top, bottom, width: right - left, height: bottom - top, cx: (left + right) / 2, cy: (top + bottom) / 2, safe, fr, W: fr.W, H: fr.H, portrait: fr.portrait, wide: fr.wide, square: fr.square };
};

export type EnterKind = 'pop' | 'rise' | 'drop' | 'left' | 'right' | 'fade' | 'blur' | 'scale' | 'none' | 'slam' | 'flip';

/** Entrance (8-14 frames, expo or spring) and a faster exit (7 frames) for anything. */
export const motionStyle = (f: number, fps: number, at: number, kind: EnterKind = 'rise', until?: number, exitKind: 'fade' | 'up' | 'down' | 'shrink' | 'left' | 'right' = 'up'): CSSProperties & { _hidden?: boolean } => {
  if (f < at - 1) return { opacity: 0, _hidden: true };
  if (until !== undefined && f > until + 8) return { opacity: 0, _hidden: true };
  const sp = spring({ frame: f - at, fps, config: { damping: kind === 'drop' || kind === 'slam' ? 11 : 15, stiffness: kind === 'slam' ? 320 : 170 } });
  const e = ease(f, at, 12);
  const o = until === undefined ? 0 : ease(f, until, 7, Easing.in(Easing.quad));
  let tx = 0;
  let ty = 0;
  let sc = 1;
  let op = 1;
  const st: CSSProperties = {};
  switch (kind) {
    case 'pop':
      sc = 0.55 + 0.45 * sp;
      op = Math.min(1, sp * 1.6);
      break;
    case 'drop':
      ty = (1 - sp) * -120;
      op = Math.min(1, e * 2);
      break;
    case 'left':
      tx = (1 - e) * -110;
      op = e;
      break;
    case 'right':
      tx = (1 - e) * 110;
      op = e;
      break;
    case 'fade':
      op = e;
      break;
    case 'blur':
      if (e < 0.99) st.filter = `blur(${(1 - e) * 16}px)`;
      sc = 1.06 - 0.06 * e;
      op = e;
      break;
    case 'scale':
      sc = 0.85 + 0.15 * e;
      op = e;
      break;
    case 'slam':
      sc = 1 + (1 - ease(f, at, 6, Easing.in(Easing.quad))) * 1.4;
      op = Math.min(1, ease(f, at, 4) * 3);
      break;
    case 'flip':
      st.transform = `perspective(1400px) rotateX(${(1 - e) * -80}deg)`;
      st.transformOrigin = '50% 0%';
      op = Math.min(1, e * 2);
      break;
    case 'none':
      break;
    default:
      ty = (1 - e) * 44;
      op = e;
  }
  if (o > 0) {
    op *= 1 - o;
    if (exitKind === 'up') ty -= o * 30;
    if (exitKind === 'down') ty += o * 30;
    if (exitKind === 'left') tx -= o * 80;
    if (exitKind === 'right') tx += o * 80;
    if (exitKind === 'shrink') sc *= 1 - o * 0.12;
  }
  if (tx || ty) st.translate = `${tx}px ${ty}px`;
  if (sc !== 1) st.scale = `${sc}`;
  st.opacity = op;
  return st;
};

export const Appear: React.FC<{ at: number; until?: number; kind?: EnterKind; exit?: 'fade' | 'up' | 'down' | 'shrink' | 'left' | 'right'; style?: CSSProperties; children: ReactNode }> = ({ at, until, kind = 'rise', exit, style, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = motionStyle(f, fps, at, kind, until, exit);
  if (m._hidden) return null;
  const { _hidden, ...ms } = m;
  return <div style={{ ...style, ...ms }}>{children}</div>;
};

/** Font size so `text` fits `width` px on one line in the display face, capped at `max`. */
export const fitText = (text: string, width: number, max: number, T: ReturnType<typeof useTheme>, min = 28) => Math.max(min, Math.min(max, Math.floor(width / (Math.max(1, text.length) * glyphWidth(T)))));

/** The largest size at which no single word of `text` is wider than `width` (wrapping text can never break inside a word). */
export const wordCap = (text: string, width: number, T: ReturnType<typeof useTheme>) => {
  const longest = String(text ?? '').split(/\s+/).reduce((n, w) => Math.max(n, w.length), 1);
  return Math.floor(width / (longest * glyphWidth(T) * 1.06));
};

/** fitText, then never so big that one word overflows `width`, and never under `min` unless a word forces it. */
export const fitWrap = (text: string, width: number, max: number, T: ReturnType<typeof useTheme>, min = 28, probe?: string) => Math.min(fitText(probe ?? text, width, max, T, min), wordCap(text, width, T));

/** The longer line of `text` split into two balanced lines: a probe for sizing text that may wrap once. */
export const halfProbe = (text: string) => {
  const w = String(text).split(/\s+/).filter(Boolean);
  if (w.length < 2) return String(text);
  let best = String(text);
  for (let i = 1; i < w.length; i += 1) {
    const a = w.slice(0, i).join(' ');
    const b = w.slice(i).join(' ');
    const longer = a.length >= b.length ? a : b;
    if (longer.length < best.length) best = longer;
  }
  return best;
};

/** Small spaced label. */
export const Label: React.FC<{ text: string; at?: number; color?: string; size?: number; style?: CSSProperties; rule?: boolean }> = ({ text, at = 0, color, size = 22, style, rule = true }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const t = ease(f, at, 16);
  const c = color ?? P.accent;
  return (
    <div style={{ fontFamily: T.mono, fontWeight: 600, fontSize: size, letterSpacing: size * 0.18, textTransform: 'uppercase', color: c, opacity: t, translate: `${(1 - t) * -16}px 0`, display: 'flex', alignItems: 'center', gap: 14, ...style }}>
      {rule && <span style={{ width: 34 * t, height: 2, background: c, display: 'inline-block' }} />}
      {text}
    </div>
  );
};

/** A word-by-word headline with one accent word (or words). */
export const Line: React.FC<{ text: string; at: number; size: number; accent?: string; until?: number; font?: 'display' | 'ui' | 'mono'; color?: string; align?: 'left' | 'center'; weight?: number; style?: CSSProperties; maxWidth?: number }> = ({ text, at, size, accent, until, font = 'display', color, align = 'left', weight, style, maxWidth }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const words = text.split(/\s+/).filter(Boolean);
  const acc = (accent ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  const o = until === undefined ? 0 : ease(f, until, 7, Easing.in(Easing.quad));
  if (f < at - 1 || (until !== undefined && f > until + 8)) return null;
  return (
    <div
      style={{
        fontFamily: font === 'display' ? T.display : font === 'mono' ? T.mono : T.ui,
        fontWeight: weight ?? (font === 'display' ? T.displayWeight : 600),
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: font === 'display' ? size * T.tracking : 0,
        textTransform: font === 'display' && T.upper ? 'uppercase' : 'none',
        color: color ?? P.ink,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        columnGap: size * 0.26,
        maxWidth,
        opacity: 1 - o,
        translate: `0 ${-o * 24}px`,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const k = ease(f, at + i * 2.5 * T.M.stagger, 14);
        const isAcc = acc.some((a) => w.toLowerCase().replace(/[^a-z0-9%$]/g, '').startsWith(a.replace(/[^a-z0-9%$]/g, '')) && a.length > 0);
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.12, marginBottom: -size * 0.12 }}>
            <span style={{ display: 'inline-block', translate: `0 ${(1 - k) * 110}%`, color: isAcc ? P.accent : undefined }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

/** A rubber stamp that slams down rotated, with an inky edge and a little shake. */
export const Stamp: React.FC<{ text: string; at: number; color?: string; size?: number; rotate?: number; style?: CSSProperties; sub?: string }> = ({ text, at, color, size = 96, rotate = -8, style, sub }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  if (f < at) return null;
  const t = ease(f, at, 6, Easing.in(Easing.quad));
  const c = color ?? P.warn;
  const settle = Math.max(0, 1 - (f - at - 6) / 10);
  return (
    <div style={{ display: 'inline-block', rotate: `${rotate + (1 - t) * 8}deg`, scale: `${1 + (1 - t) * 1.6}`, opacity: Math.min(1, t * 3), translate: `${noise(f, 4) * 6 * settle}px ${noise(f, 8) * 6 * settle}px`, ...style }}>
      <div
        style={{
          border: `${Math.max(5, size * 0.07)}px solid ${c}`,
          borderRadius: size * 0.12,
          padding: `${size * 0.06}px ${size * 0.28}px ${size * 0.1}px`,
          color: c,
          fontFamily: T.display,
          fontWeight: Math.max(700, T.displayWeight),
          fontSize: size,
          letterSpacing: size * 0.04,
          textTransform: 'uppercase',
          lineHeight: 1,
          textAlign: 'center',
          mixBlendMode: P.dark ? 'screen' : 'multiply',
          maskImage: 'radial-gradient(circle at 30% 40%, black 60%, rgba(0,0,0,0.75) 100%)',
          boxShadow: `inset 0 0 0 ${Math.max(2, size * 0.02)}px ${alpha(c, 0.35)}`,
        }}
      >
        {text}
        {sub && <div style={{ fontFamily: T.mono, fontSize: size * 0.22, letterSpacing: size * 0.03, marginTop: size * 0.08 }}>{sub}</div>}
      </div>
    </div>
  );
};

/** A Fluent emoji (MIT): the 3D PNG when small, the flat SVG when large or `flat`. */
export const Emoji: React.FC<{ name: string; size: number; flat?: boolean; style?: CSSProperties }> = ({ name, size, flat, style }) => {
  const useFlat = flat || size > 300;
  const src = useFlat ? `characters/fluent-emoji/flat/${name}.svg` : `characters/fluent-emoji/3d/${name}.png`;
  return <Img src={staticFile(src)} style={{ width: size, height: size, objectFit: 'contain', display: 'block', ...style }} />;
};

/** A pill of text (status, label, chip). */
export const Pill: React.FC<{ text: string; color?: string; fill?: boolean; size?: number; style?: CSSProperties; icon?: ReactNode }> = ({ text, color, fill, size = 24, style, icon }) => {
  const T = useTheme();
  const P = usePal();
  const c = color ?? P.accent;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.4, padding: `${size * 0.28}px ${size * 0.7}px`, borderRadius: 999, background: fill ? c : alpha(c, 0.14), color: fill ? (P.dark ? '#0b0b0b' : '#ffffff') : c, border: `1.5px solid ${alpha(c, fill ? 1 : 0.45)}`, fontFamily: T.ui, fontWeight: 700, fontSize: size, whiteSpace: 'nowrap', ...style }}>
      {icon}
      {text}
    </span>
  );
};

/** The outro pill's text: config.link.text, else the repo URL without https://. */
export const linkText = (config: { link?: { text?: string; url?: string }; repoUrl?: string }) =>
  config.link?.text ?? (config.repoUrl ?? config.link?.url ?? '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

/** The link (config.link, else the repository) as a pill (no https://). */
export const RepoPill: React.FC<{ at: number; size?: number; style?: CSSProperties }> = ({ at, size = 32, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { config, theme: T } = useTrailer();
  const P = usePal();
  const sp = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 160 } });
  if (f < at) return null;
  const url = linkText(config);
  if (!url) return null;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.5, padding: `${size * 0.5}px ${size * 1.1}px ${size * 0.5}px ${size * 0.6}px`, borderRadius: T.radius >= 12 ? 999 : T.radius, background: P.surface, border: `1px solid ${P.cardBorder}`, color: P.ink, fontFamily: T.mono, fontWeight: 500, fontSize: size, scale: `${0.7 + 0.3 * sp}`, opacity: Math.min(1, sp * 1.5), boxShadow: `0 24px 60px -24px ${alpha(P.fill, 0.8)}`, ...style }}>
      <span style={{ width: size * 1.35, height: size * 1.35, borderRadius: Math.min(12, T.radius), background: P.fill, color: P.onFill, display: 'grid', placeItems: 'center', fontSize: size * 0.7, fontWeight: 700 }}>{'</>'}</span>
      {url}
    </div>
  );
};

/** The project name, letter by letter, with the accent full stop. */
export const NameLockup: React.FC<{ at: number; size: number; color?: string; dot?: boolean; style?: CSSProperties; align?: 'left' | 'center' }> = ({ at, size, color, dot = true, style, align = 'center' }) => {
  const f = useCurrentFrame();
  const { config, theme: T } = useTrailer();
  const P = usePal();
  const name = config.projectName;
  return (
    <div style={{ fontFamily: T.display, fontWeight: T.displayWeight, fontSize: size, letterSpacing: size * T.tracking, lineHeight: 1.02, color: color ?? P.ink, textAlign: align, textTransform: T.upper ? 'uppercase' : 'none', ...style }}>
      {[...name].map((ch, i) => {
        const k = ease(f, at + i * 1.2, 14);
        return (
          <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre', translate: `0 ${(1 - k) * 36}px`, opacity: k, filter: k < 0.95 ? `blur(${(1 - k) * 8}px)` : undefined }}>
            {ch}
          </span>
        );
      })}
      {dot && <span style={{ display: 'inline-block', color: P.accent, scale: `${ease(f, at + name.length * 1.2 + 3, 10, BACK)}` }}>.</span>}
    </div>
  );
};

/** Name size that fits `width`. */
export const useNameSize = (width: number, max: number) => {
  const { config, theme: T } = useTrailer();
  return fitText(`${config.projectName}.`, width, max, T, 60);
};

/** A soft accent glow on the floor behind a subject. */
export const StageGlow: React.FC<{ x?: number; y?: number; size?: number; color?: string; a?: number }> = ({ x: x0, y: y0, size = 1300, color, a = 0.22 }) => {
  const P = usePal();
  const fr = useFrame();
  const x = x0 ?? fr.cx;
  const y = y0 ?? fr.cy;
  const c = color ?? P.fill;
  return <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(c, a)} 0%, ${alpha(c, a * 0.3)} 38%, transparent 68%)`, pointerEvents: 'none' }} />;
};

/** A slow camera on a scene's content: push or drift, a few percent. */
export const SlowCam: React.FC<{ dur: number; kind?: 'push' | 'drift' | 'pull' | 'static'; amount?: number; origin?: string; children: ReactNode }> = ({ dur, kind = 'push', amount = 0.04, origin = '50% 50%', children }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, dur], [0, 1], clamp);
  const style: CSSProperties =
    kind === 'push' ? { scale: `${1 + amount * p}`, transformOrigin: origin } : kind === 'pull' ? { scale: `${1 + amount * (1 - p)}`, transformOrigin: origin } : kind === 'drift' ? { translate: `${Math.sin(f / 70) * 14}px ${Math.cos(f / 90) * 8}px` } : {};
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

/** Rough-edged (hand drawn) SVG filter id for chalk and marker strokes. */
export const RoughFilter: React.FC<{ id: string; scale?: number; seed?: number }> = ({ id, scale = 3, seed = 2 }) => (
  <svg width={0} height={0} style={{ position: 'absolute' }}>
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

/** Tone names to colours on the current surface. */
export const toneColor = (tone: string | undefined, P: ReturnType<typeof usePal>) => {
  switch (tone) {
    case 'bad':
    case 'danger':
    case 'warn-red':
      return P.warn;
    case 'good':
    case 'ok':
      return mixHex(P.dark ? '#4ade80' : '#15803d', P.ink, 0.05);
    case 'warn':
      return P.dark ? '#fbbf24' : '#b45309';
    case 'muted':
      return P.muted;
    case 'ink':
      return P.ink;
    case 'accent2':
      return P.accent2;
    default:
      return P.accent;
  }
};

export { hash, alpha, mixHex, noise };

/**
 * A block authored at a fixed `w` x `h` (px), scaled down to fit `maxW` x `maxH` and laid out
 * at its scaled size, so a 16:9 card (a ticket, a slate, a certificate) still fits a 9:16 or
 * 1:1 frame without overflowing. In 16:9 the scale is usually 1 (a no-op).
 */
export const Fit: React.FC<{ w: number; h: number; maxW: number; maxH?: number; style?: CSSProperties; children: ReactNode }> = ({ w, h, maxW, maxH, style, children }) => {
  const k = Math.max(0.05, Math.min(1, maxW / Math.max(1, w), (maxH ?? Infinity) / Math.max(1, h)));
  if (k >= 0.999) return <div style={{ position: 'relative', width: w, height: h, ...style }}>{children}</div>;
  return (
    <div style={{ position: 'relative', width: w * k, height: h * k, flex: 'none', ...style }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, scale: `${k}`, transformOrigin: '0 0' }}>{children}</div>
    </div>
  );
};

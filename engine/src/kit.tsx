import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT_GROUPS } from './options.mjs';
import { alpha, at, hash, motion, noise, pop, usePal, useTheme, type Theme } from './theme';
import type { GiantLine } from './types';
import { useFrame } from './frame';

// The film's graphic language: headline type in five treatments, pixel mosaics, tile sweeps,
// pixel glitches, product toasts and the problem diagram's tangles.

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Average glyph width (em) of the display face, for fitting headlines. */
export const glyphWidth = (T: Theme) => {
  const n = T.fonts.display;
  const base = FONT_GROUPS.condensed.includes(n) ? 0.43 : FONT_GROUPS.mono.includes(n) ? 0.62 : FONT_GROUPS.serif.includes(n) || FONT_GROUPS.slab.includes(n) ? 0.58 : FONT_GROUPS.rounded.includes(n) ? 0.56 : n === 'Archivo Black' || n === 'Unbounded' || n === 'Syne' ? 0.68 : 0.58;
  return base * (T.upper ? 1.08 : 1) * (1 + (T.tracking + 0.045));
};

/** Largest headline size that fits the longest line in `width` px. */
export const fitSize = (lines: { text: string }[], width: number, max: number, T?: Theme) => {
  const longest = Math.max(...lines.map((l) => l.text.length), 1);
  const g = T ? glyphWidth(T) : 0.6;
  return Math.min(max, Math.floor(width / (longest * g)));
};

export type HeadLine = GiantLine & { at: number };

/** A marker swipe or a chalk underline under an accent line, from the theme's motif. */
const TextMotif: React.FC<{ kind: string; at: number; size: number; color: string }> = ({ kind, at: start, size, color }) => {
  const f = useCurrentFrame();
  const t = at(f, start, 16, Easing.bezier(0.3, 0, 0.2, 1));
  if (t <= 0) return null;
  if (kind === 'highlighter')
    return <span style={{ position: 'absolute', left: -size * 0.08, right: 'auto', width: `calc(${t * 100}% + ${size * 0.16}px)`, top: '18%', height: '72%', background: alpha(color, 0.32), transform: 'skewX(-8deg) rotate(-1deg)', borderRadius: size * 0.06, zIndex: -1 }} />;
  if (kind === 'chalk-underline') {
    const d = 'M 2 14 C 120 4, 260 22, 400 10 S 700 2, 998 12';
    return (
      <svg viewBox="0 0 1000 26" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, width: '100%', bottom: -size * 0.12, height: size * 0.22, overflow: 'visible' }}>
        <path d={d} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" pathLength={1000} strokeDasharray={1000} strokeDashoffset={1000 * (1 - t)} opacity={0.9} />
        <path d="M 30 20 C 300 14, 600 24, 960 18" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" pathLength={1000} strokeDasharray={1000} strokeDashoffset={1000 * (1 - Math.max(0, t * 1.3 - 0.3))} opacity={0.6} />
      </svg>
    );
  }
  return null;
};

/**
 * Headline type for the hook and payoff in the theme's treatment:
 * giant-kinetic (lines rise out of a mask), stacked (lines on solid slabs), typewriter
 * (characters typed with a caret), stamp (lines slam down and shake) or split-reveal (each
 * line's halves slide in from opposite sides).
 */
export const Headline: React.FC<{
  lines: HeadLine[];
  size: number;
  kind?: string;
  out?: number;
  align?: 'left' | 'center';
  style?: CSSProperties;
}> = ({ lines, size, kind, out, align = 'left', style }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const mode = kind ?? T.type;
  const textMotif = T.motif === 'highlighter' || T.motif === 'chalk-underline' ? T.motif : null;
  const shake = mode === 'stamp' ? lines.reduce((s, l) => s + Math.max(0, 1 - (f - l.at - 5) / 8) * (f >= l.at + 5 ? 1 : 0), 0) * (6 + 10 * motion().shake) : 0;
  return (
    <div
      style={{
        fontFamily: T.display,
        fontWeight: T.displayWeight,
        fontSize: size,
        lineHeight: mode === 'stacked' ? 1.04 : 0.98,
        letterSpacing: size * T.tracking,
        textTransform: T.upper ? 'uppercase' : 'none',
        color: P.ink,
        textAlign: align,
        translate: shake ? `${noise(f * 1.7, 3) * shake}px ${noise(f * 1.7, 9) * shake}px` : undefined,
        ...style,
      }}
    >
      {lines.map((l, i) => {
        const o = out === undefined ? 0 : at(f, out + i * 2, 12, Easing.bezier(0.7, 0, 0.84, 0));
        const color = l.accent ? P.accent : undefined;
        const motif = l.accent && textMotif ? <TextMotif kind={textMotif} at={l.at + 12} size={size} color={P.fill} /> : null;
        const body = (content: ReactNode) => (
          <span style={{ position: 'relative', display: 'inline-block', zIndex: 0 }}>
            {motif}
            {content}
          </span>
        );
        if (mode === 'stacked') {
          const slab = at(f, l.at, 10);
          const txt = at(f, l.at + 4, 12);
          return (
            <div key={i} style={{ display: 'flex', justifyContent: align === 'center' ? 'center' : 'flex-start', marginLeft: align === 'center' ? 0 : i * size * 0.32, marginBottom: size * 0.1, opacity: 1 - o, translate: `${-o * 120}px 0` }}>
              <span style={{ position: 'relative', display: 'inline-block', padding: `${size * 0.02}px ${size * 0.18}px ${size * 0.08}px`, overflow: 'hidden' }}>
                <span style={{ position: 'absolute', inset: 0, background: l.accent ? P.fill : P.ink, transformOrigin: i % 2 ? '100% 50%' : '0% 50%', scale: `${Math.max(0, slab)} 1` }} />
                <span style={{ position: 'relative', display: 'inline-block', color: l.accent ? P.onFill : P.bg, translate: `0 ${(1 - txt) * 105}%` }}>{l.text}</span>
              </span>
            </div>
          );
        }
        if (mode === 'typewriter') {
          const rate = 1.5 * motion().speed;
          const n = Math.max(0, Math.min(l.text.length, Math.floor((f - l.at) / rate)));
          const typing = f >= l.at && n < l.text.length;
          const lastLine = i === lines.length - 1;
          const nextStarted = lines[i + 1] && f >= lines[i + 1]!.at;
          const showCaret = f >= l.at && (typing || (lastLine && !nextStarted) || (!nextStarted && n === l.text.length));
          const blink = typing || Math.floor(f / 8) % 2 === 0;
          return (
            <div key={i} style={{ whiteSpace: 'pre', opacity: 1 - o, color }}>
              {body(
                <>
                  <span>{l.text.slice(0, n)}</span>
                  <span style={{ position: 'relative', display: 'inline-block', width: 0, height: '1em' }}>
                    {showCaret && <span style={{ position: 'absolute', left: size * 0.04, top: size * 0.06, width: size * 0.48, height: size * 0.84, background: P.fill, opacity: blink ? 1 : 0 }} />}
                  </span>
                  <span style={{ visibility: 'hidden' }}>{l.text.slice(n)}</span>
                </>,
              )}
            </div>
          );
        }
        if (mode === 'stamp') {
          const t = interpolate(f, [l.at, l.at + 6 * motion().speed + 1], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
          const rot = (i % 2 ? 2.2 : -2.6) + (1 - t) * (i % 2 ? 6 : -6);
          const boxed = l.accent;
          return (
            <div key={i} style={{ display: 'flex', justifyContent: align === 'center' ? 'center' : 'flex-start', marginBottom: size * 0.08, opacity: (f >= l.at ? 1 : 0) * (1 - o) }}>
              <span style={{ display: 'inline-block', scale: `${1 + (1 - t) * 1.3}`, rotate: `${rot}deg`, opacity: Math.min(1, t * 3), color, border: boxed ? `${Math.max(4, size * 0.05)}px solid ${P.accent}` : undefined, padding: boxed ? `${size * 0.02}px ${size * 0.14}px ${size * 0.06}px` : undefined, borderRadius: boxed ? size * 0.06 : undefined }}>
                {body(l.text)}
              </span>
            </div>
          );
        }
        if (mode === 'split-reveal') {
          const t = at(f, l.at, 18);
          const half = (top: boolean) => (
            <span aria-hidden={!top} style={{ position: top ? 'relative' : 'absolute', left: 0, top: 0, display: 'inline-block', clipPath: top ? 'inset(0 0 50% 0)' : 'inset(50% 0 0 0)', translate: `${(1 - t) * (top ? -1 : 1) * size * 1.6}px 0`, opacity: Math.min(1, t * 1.6), whiteSpace: 'pre' }}>
              {l.text}
            </span>
          );
          const rule = at(f, l.at + 6, 14);
          return (
            <div key={i} style={{ position: 'relative', opacity: 1 - o, color, marginBottom: size * 0.04 }}>
              {body(
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  {half(true)}
                  {half(false)}
                  <span style={{ position: 'absolute', left: 0, top: '50%', height: Math.max(2, size * 0.018), width: `${Math.max(0, 1 - rule) * 100}%`, background: P.fill, opacity: t > 0 ? 1 : 0 }} />
                </span>,
              )}
            </div>
          );
        }
        // giant-kinetic
        const t = at(f, l.at, 14);
        return (
          <div key={i} style={{ overflow: 'hidden', paddingBottom: size * 0.08, marginBottom: -size * 0.02 }}>
            <div style={{ translate: `0 ${(1 - t) * 110 - o * 110}%`, scale: `${1 + (1 - Math.min(1, t)) * 0.08}`, transformOrigin: align === 'center' ? '50% 100%' : '0% 100%', color }}>{body(l.text)}</div>
          </div>
        );
      })}
    </div>
  );
};

/** v1 name, kept for any custom scene. */
export const Giant = Headline;

/**
 * Pixel mosaic in tints of the accent: big square cells, a few dithered, that build in as a
 * wave from `origin` at `inAt` and leave from `outAt`.
 */
export const Mosaic: React.FC<{ inAt?: number; outAt?: number; cell?: number; origin?: [number, number]; seed?: number }> = ({ inAt = 0, outAt, cell = 96, origin = [0.5, 0.5], seed = 1 }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const { W, H } = useFrame();
  const cols = Math.ceil(W / cell) + 1;
  const rows = Math.ceil(H / cell) + 1;
  const tones = T.palette;
  const drift = (f * 0.25) % cell;
  const cells: ReactNode[] = [];
  const r0 = Math.min(cell * 0.2, T.radius * 0.4);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const h = hash(c, r, seed);
      const d = Math.hypot(c / cols - origin[0], (r / rows - origin[1]) * 0.6);
      const delay = d * 26 + h * 6;
      const s = at(f, inAt + delay, 8, Easing.out(Easing.cubic)) * (1 - (outAt === undefined ? 0 : at(f, outAt + delay * 0.6, 8, Easing.out(Easing.cubic))));
      if (s <= 0.01) continue;
      const phase = Math.floor((f + h * 200) / 40);
      const level = Math.min(tones.length - 1, Math.floor(hash(c, r, phase, seed) * 4.2));
      const dither = h < 0.16;
      cells.push(
        <div
          key={`${c}-${r}`}
          style={{
            position: 'absolute',
            left: c * cell - drift,
            top: r * cell,
            width: cell,
            height: cell,
            borderRadius: r0,
            background: tones[level],
            backgroundImage: dither ? `radial-gradient(${tones[Math.min(4, level + 2)]} 2.2px, transparent 2.6px)` : undefined,
            backgroundSize: dither ? '9px 9px' : undefined,
            scale: `${s}`,
          }}
        />,
      );
    }
  }
  return <AbsoluteFill style={{ overflow: 'hidden' }}>{cells}</AbsoluteFill>;
};

/**
 * Tile sweep: a field of squares that floods the frame and drains again, spreading from
 * `origin`. A few tiles take the accent.
 */
export const Tiles: React.FC<{ at: number; mode?: 'cover' | 'reveal' | 'through'; origin?: [number, number]; dur?: number; color?: string; cols?: number }> = ({ at: start, mode = 'through', origin = [0.5, 0.5], dur = 24, color, cols = 24 }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const { W, H } = useFrame();
  // `cols` is given for the long side; the short side gets square-ish tiles.
  const nx = W >= H ? cols : Math.max(6, Math.round((cols * W) / H));
  const rows = Math.max(1, Math.round((nx * H) / W));
  const cw = W / nx;
  const ch = H / rows;
  const half = dur / 2;
  const gap = Math.max(2, cw * 0.05);
  const cells: ReactNode[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < nx; c += 1) {
      const h = hash(c, r, 9);
      const d = Math.hypot((c + 0.5) / nx - origin[0], ((r + 0.5) / rows - origin[1]) * (H / W));
      const delay = d * half * 0.9 + h * 4;
      const cover = mode === 'reveal' ? 1 : at(f, start + delay, 6, Easing.out(Easing.cubic));
      const reveal = mode === 'cover' ? 0 : at(f, start + (mode === 'through' ? half : 0) + delay, 6, Easing.out(Easing.cubic));
      const s = Math.max(0, cover - reveal);
      if (s <= 0.01) continue;
      cells.push(<div key={`${c}-${r}`} style={{ position: 'absolute', left: c * cw + gap, top: r * ch + gap, width: cw - gap * 2, height: ch - gap * 2, borderRadius: Math.min((cw - gap * 2) * 0.25, T.radius * 0.5), background: h > 0.93 ? T.accent : (color ?? T.main.ink), scale: `${s}` }} />);
    }
  }
  return <AbsoluteFill style={{ pointerEvents: 'none' }}>{cells}</AbsoluteFill>;
};

/** Pixel glitch over a region for a few frames: small cells blinking bg and ink. */
export const Glitch: React.FC<{ rect: { x: number; y: number; w: number; h: number }; at: number; dur?: number; cell?: number }> = ({ rect, at: start, dur = 12, cell = 28 }) => {
  const f = useCurrentFrame();
  const P = usePal();
  if (f < start || f > start + dur) return null;
  const a = P.bg;
  const b = P.ink;
  const cols = Math.ceil(rect.w / cell);
  const rows = Math.ceil(rect.h / cell);
  const step = Math.floor((f - start) / 2);
  const cells: ReactNode[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const v = hash(c, r, step);
      if (v > 0.32) continue;
      cells.push(
        <div
          key={`${c}-${r}`}
          style={{
            position: 'absolute',
            left: rect.x + c * cell,
            top: rect.y + r * cell,
            width: cell,
            height: cell,
            background: v < 0.12 ? a : v < 0.22 ? b : v < 0.26 ? P.fill : undefined,
            backgroundImage: v >= 0.26 ? `radial-gradient(${b} 2px, transparent 2.4px)` : undefined,
            backgroundSize: '7px 7px',
          }}
        />,
      );
    }
  }
  return <AbsoluteFill style={{ pointerEvents: 'none' }}>{cells}</AbsoluteFill>;
};

/** A product-style toast: check mark, title and line, springing in. */
export const Toast: React.FC<{ at: number; title: string; sub?: string; style?: CSSProperties; out?: number }> = ({ at: start, title, sub, style, out }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useTheme();
  const P = usePal();
  if (f < start) return null;
  const s = pop(f - start, fps);
  const o = out === undefined ? 0 : at(f, out, 10);
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '18px 28px 18px 18px',
        background: P.surface,
        color: P.ink,
        borderRadius: Math.min(T.radius, 20),
        boxShadow: `0 24px 60px -18px rgba(0,0,0,0.5), 0 0 0 1px ${P.cardBorder}`,
        fontFamily: T.ui,
        whiteSpace: 'nowrap',
        opacity: Math.min(1, s * 1.4) * (1 - o),
        scale: `${0.8 + 0.2 * s}`,
        translate: `0 ${(1 - s) * 30 - o * 20}px`,
        ...style,
      }}
    >
      <div style={{ width: 52, height: 52, borderRadius: Math.min(T.radius * 0.55, 14), background: P.fill, display: 'grid', placeItems: 'center', color: P.onFill, fontSize: 28, fontWeight: 700 }}>✓</div>
      <div>
        <div style={{ fontSize: 25, fontWeight: 600 }}>{title}</div>
        {sub && <div style={{ fontSize: 19, color: P.muted, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
};

/** A tangled curve drawn on between two points, for the problem diagram. */
export const Tangle: React.FC<{ from: { x: number; y: number }; to: { x: number; y: number }; at: number; dur?: number; bend?: number; color: string; dash?: boolean }> = ({ from, to, at: start, dur = 18, bend = 0.4, color, dash }) => {
  const f = useCurrentFrame();
  const t = Math.min(1, at(f, start, dur));
  if (t <= 0) return null;
  const mx = (from.x + to.x) / 2 + (to.y - from.y) * bend;
  const my = (from.y + to.y) / 2 - (to.x - from.x) * bend;
  const d = `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
  const len = 1000;
  const { W, H } = useFrame();
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
      <path d={d} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" pathLength={len} strokeDasharray={dash ? '14 12' : len} strokeDashoffset={dash ? -f * 1.2 : len * (1 - t)} opacity={dash ? t * 0.85 : 0.85} />
    </svg>
  );
};

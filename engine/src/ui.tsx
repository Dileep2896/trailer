import { useId, type CSSProperties, type ReactNode } from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { alpha, at, mixHex, pop, useShot, usePal, useTheme, type Box, type Pal } from './theme';
import { useFrame } from './frame';
import type { Shot } from './types';
import { useVideoConfig } from 'remotion';

// Shared pieces: the backgrounds, captured screens in their window chrome, the cursor and
// its marks, kinetic type, counters, motion blur and grain. Every colour comes from the
// scene's surface (usePal), so one theme restyles all of it.

const useSafeId = (prefix: string) => `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/* ------------------------------------------------------------------ backgrounds */

const Noise: React.FC<{ freq: number; octaves?: number; seed?: number; opacity: number; blend?: CSSProperties['mixBlendMode']; tint?: string }> = ({ freq, octaves = 2, seed = 3, opacity, blend = 'multiply', tint }) => {
  const id = useSafeId('noise');
  return (
    <AbsoluteFill style={{ mixBlendMode: blend, opacity, pointerEvents: 'none' }}>
      <svg width="100%" height="100%">
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={octaves} seed={seed} stitchTiles="stitch" />
          {tint ? <feColorMatrix type="saturate" values="0" /> : null}
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};

const Glow: React.FC<{ x: number; y: number; size: number; color: string; a: number }> = ({ x, y, size, color, a }) => (
  <div style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: size, height: size, translate: '-50% -50%', borderRadius: '50%', background: `radial-gradient(circle, ${alpha(color, a)} 0%, ${alpha(color, a * 0.3)} 35%, transparent 70%)` }} />
);

/** The scene background in the theme's style, on the given surface. */
export const Backdrop: React.FC<{ P: Pal; style?: string; seed?: number }> = ({ P, style, seed = 0 }) => {
  const f = useCurrentFrame();
  const fr = useFrame();
  const kind = style ?? P.background;
  const ink = P.ink;
  const vignette = <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, transparent 55%, ${alpha(P.dark ? '#000000' : mixHex(P.bg, '#000000', 0.25), P.dark ? 0.55 : 0.18)} 100%)` }} />;
  const glowX = seed % 2 ? 70 : 30;
  let layer: ReactNode = null;
  switch (kind) {
    case 'plain':
      layer = null;
      break;
    case 'grid':
      layer = (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${alpha(ink, 0.07)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(ink, 0.07)} 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
            backgroundPosition: `${-f * 0.3}px ${-f * 0.15}px`,
            maskImage: 'radial-gradient(ellipse 80% 75% at 50% 45%, black 35%, transparent 100%)',
          }}
        />
      );
      break;
    case 'blueprint':
      layer = (
        <>
          <AbsoluteFill
            style={{
              backgroundImage: [
                `linear-gradient(${alpha(ink, 0.2)} 1.5px, transparent 1.5px)`,
                `linear-gradient(90deg, ${alpha(ink, 0.2)} 1.5px, transparent 1.5px)`,
                `linear-gradient(${alpha(ink, 0.07)} 1px, transparent 1px)`,
                `linear-gradient(90deg, ${alpha(ink, 0.07)} 1px, transparent 1px)`,
              ].join(','),
              backgroundSize: '160px 160px, 160px 160px, 32px 32px, 32px 32px',
              backgroundPosition: `${-f * 0.2}px 0`,
            }}
          />
          <div style={{ position: 'absolute', right: fr.wide ? 40 : fr.safe.right, bottom: fr.wide ? 40 : fr.safe.bottom, width: 330, height: 96, border: `2px solid ${alpha(ink, 0.35)}`, display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: 'monospace', fontSize: 14, color: alpha(ink, 0.5), letterSpacing: 2 }}>
            <div style={{ borderRight: `1px solid ${alpha(ink, 0.3)}`, padding: 10 }}>SHEET {String(seed + 1).padStart(2, '0')}</div>
            <div style={{ padding: 10 }}>REV {String.fromCharCode(65 + (seed % 6))}</div>
          </div>
        </>
      );
      break;
    case 'paper-grain':
      layer = (
        <>
          <Noise freq={0.9} octaves={3} seed={7} opacity={P.dark ? 0.18 : 0.32} blend={P.dark ? 'overlay' : 'multiply'} />
          <Noise freq={0.012} octaves={2} seed={11} opacity={P.dark ? 0.12 : 0.14} blend={P.dark ? 'overlay' : 'multiply'} />
          <AbsoluteFill style={{ boxShadow: `inset 0 0 220px ${alpha(mixHex(P.bg, '#5a3d1a', 0.6), P.dark ? 0.2 : 0.22)}` }} />
        </>
      );
      break;
    case 'scanlines':
      layer = (
        <>
          <Glow x={glowX} y={35} size={1300} color={P.fill} a={0.1} />
          <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(0deg, ${alpha('#000000', P.dark ? 0.35 : 0.08)} 0px, ${alpha('#000000', P.dark ? 0.35 : 0.08)} 2px, transparent 2px, transparent 5px)` }} />
          <div style={{ position: 'absolute', left: 0, right: 0, height: 260, top: ((f * 9) % (fr.H + 420)) - 260, background: `linear-gradient(transparent, ${alpha(P.fill, 0.06)}, transparent)` }} />
        </>
      );
      break;
    case 'dots':
      layer = (
        <>
          <AbsoluteFill
            style={{
              backgroundImage: `radial-gradient(${alpha(ink, P.dark ? 0.09 : 0.08)} 1.3px, transparent 1.6px)`,
              backgroundSize: '36px 36px',
              backgroundPosition: `${-f * 0.35}px ${-f * 0.18}px`,
              maskImage: 'radial-gradient(ellipse 75% 70% at 50% 45%, black 30%, transparent 100%)',
            }}
          />
          {P.dark && <Glow x={glowX + Math.sin(f / 70) * 6} y={20 + Math.cos(f / 90) * 5} size={1100} color={P.fill} a={0.2} />}
          {P.dark && <Glow x={78 + Math.cos(f / 80) * 5} y={82 + Math.sin(f / 60) * 4} size={1000} color={P.accent2} a={0.16} />}
        </>
      );
      break;
    case 'gradient-mesh':
      layer = (
        <AbsoluteFill style={{ filter: 'blur(60px)' }}>
          <Glow x={20 + Math.sin(f / 60) * 8} y={25 + Math.cos(f / 75) * 8} size={1500} color={P.fill} a={P.dark ? 0.45 : 0.38} />
          <Glow x={80 + Math.cos(f / 70) * 8} y={30 + Math.sin(f / 55) * 10} size={1400} color={P.accent2} a={P.dark ? 0.4 : 0.32} />
          <Glow x={55 + Math.sin(f / 90) * 10} y={95} size={1500} color={mixHex(P.fill, P.accent2, 0.5)} a={P.dark ? 0.35 : 0.28} />
        </AbsoluteFill>
      );
      break;
    case 'noise-glow':
      layer = (
        <>
          <Glow x={50} y={110} size={2000} color={P.fill} a={0.32 + Math.sin(f / 25) * 0.05} />
          <Glow x={glowX} y={-10} size={1200} color={P.accent2} a={0.12} />
          <Noise freq={0.75} octaves={2} seed={f % 8} opacity={0.22} blend="overlay" />
        </>
      );
      break;
    case 'newsprint':
      layer = (
        <>
          <AbsoluteFill style={{ backgroundImage: `radial-gradient(${alpha(ink, 0.1)} 1.1px, transparent 1.5px)`, backgroundSize: '7px 7px', rotate: '0deg' }} />
          <AbsoluteFill style={{ backgroundImage: `linear-gradient(90deg, ${alpha(ink, 0.12)} 1px, transparent 1px)`, backgroundSize: '320px 100%', backgroundPosition: '80px 0' }} />
          <div style={{ position: 'absolute', left: 60, right: 60, top: fr.wide ? 34 : fr.safe.top - 40, borderTop: `3px solid ${alpha(ink, 0.6)}`, borderBottom: `1px solid ${alpha(ink, 0.6)}`, height: 8 }} />
          <Noise freq={0.6} octaves={2} seed={5} opacity={0.16} blend="multiply" />
        </>
      );
      break;
    case 'concrete':
      layer = (
        <>
          <Noise freq={0.018} octaves={4} seed={13} opacity={P.dark ? 0.35 : 0.3} blend={P.dark ? 'overlay' : 'multiply'} />
          <Noise freq={1.2} octaves={1} seed={9} opacity={0.2} blend="overlay" />
          <AbsoluteFill style={{ backgroundImage: `radial-gradient(${alpha(ink, 0.12)} 1px, transparent 2px)`, backgroundSize: '97px 89px', backgroundPosition: '13px 29px' }} />
        </>
      );
      break;
    default:
      layer = null;
  }
  return (
    <AbsoluteFill style={{ background: P.bg, overflow: 'hidden' }}>
      {layer}
      {vignette}
    </AbsoluteFill>
  );
};

/** Film grain over everything: a turbulence field reseeded every frame. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => {
  const f = useCurrentFrame();
  const id = useSafeId('grain');
  if (opacity <= 0) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'overlay', opacity }}>
      <svg width="100%" height="100%">
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 12} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Horizontal (or vertical) motion blur for fast moves; `amount` in px, 0 for none. */
export const MotionBlur: React.FC<{ amount: number; vertical?: boolean; children: ReactNode; style?: CSSProperties }> = ({ amount, vertical, children, style }) => {
  const id = useSafeId('mb');
  const a = Math.max(0, amount);
  return (
    <>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={vertical ? `0 ${a}` : `${a} 0`} />
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: a > 0.2 ? `url(#${id})` : undefined, ...style }}>{children}</AbsoluteFill>
    </>
  );
};

/* ------------------------------------------------------------------ screens */

/** Chrome sizes for a window `w` px wide: the title bar and the bezel around the screen. */
export const chromeSize = (chrome: string, w: number) => {
  const k = w / 1400;
  switch (chrome) {
    case 'mac':
      return { bar: 40 * k, bezel: 0 };
    case 'terminal':
      return { bar: 44 * k, bezel: 0 };
    case 'device-frame':
      return { bar: 0, bezel: 30 * k };
    default:
      return { bar: 0, bezel: 0 };
  }
};

/** The window's screen size for width w: the visible part of the capture plus its chrome. */
export const windowSize = (s: Shot, chrome: string, w: number) => {
  const { bar, bezel } = chromeSize(chrome, w);
  const inner = w - bezel * 2;
  const viewH = (s.view ?? s.height) * (inner / s.width);
  return { inner, viewH, bar, bezel, h: viewH + bar + bezel * 2 };
};

/** The largest window that fits a box, centred in it. */
export const fitWindow = (s: Shot, chrome: string, box: { x0: number; y0: number; x1: number; y1: number }, maxW = 1240) => {
  let w = Math.min(maxW, box.x1 - box.x0);
  for (let i = 0; i < 40 && windowSize(s, chrome, w).h > box.y1 - box.y0; i += 1) w *= 0.97;
  const { h } = windowSize(s, chrome, w);
  return { w, h, x: (box.x0 + box.x1) / 2, y: (box.y0 + box.y1) / 2 };
};

/** The capture's transform inside the screen for a camera (zoom s on fx, fy), clamped to its edges. */
export const camTransform = (s: Shot, inner: number, viewH: number, cam?: { s: number; fx: number; fy: number }) => {
  const k = inner / s.width;
  const scale = k * Math.max(1, cam?.s ?? 1);
  const fx = cam?.fx ?? s.width / 2;
  const fy = cam?.fy ?? (s.view ?? s.height) / 2;
  const tx = Math.min(0, Math.max(inner - s.width * scale, inner / 2 - fx * scale));
  const ty = Math.min(0, Math.max(viewH - s.height * scale, viewH / 2 - fy * scale));
  return { scale, tx, ty };
};

/**
 * A captured screen in the theme's window chrome (mac, minimal, terminal, none,
 * device-frame). `w` is its width on stage; children sit in the screen's own CSS pixels and
 * move with the camera (`cam`: zoom s centred on fx, fy). The camera never moves the window
 * itself, so a push stays inside the frame.
 */
export const Win: React.FC<{
  name: string;
  w: number;
  x: number;
  y: number;
  path?: string;
  cam?: { s: number; fx: number; fy: number };
  dim?: number;
  style?: CSSProperties;
  children?: ReactNode;
}> = ({ name, w, x, y, path, cam, dim = 0, style, children }) => {
  const s = useShot(name);
  const T = useTheme();
  const P = usePal();
  const chrome = T.chrome;
  const { inner, viewH, bar, bezel, h } = windowSize(s, chrome, w);
  const { scale, tx, ty } = camTransform(s, inner, viewH, cam);
  const k = w / 1400;
  const R = chrome === 'terminal' ? 8 * k + 2 : chrome === 'minimal' ? Math.min(T.radius, 14) * k + 4 : chrome === 'device-frame' ? 46 * k : chrome === 'none' ? Math.min(T.radius, 18) * k + 4 : 16 * k + 6;
  const shadow = ['0 60px 120px -30px rgba(0,0,0,0.55)', `0 30px 160px -40px ${alpha(P.fill, 0.35)}`];
  const frameStyle: CSSProperties =
    chrome === 'device-frame'
      ? { background: mixHex(P.dark ? '#000000' : P.ink, '#222222', 0.3), padding: bezel, boxShadow: [`inset 0 0 0 ${2 * k}px ${alpha('#ffffff', 0.12)}`, ...shadow].join(', ') }
      : chrome === 'terminal'
        ? { background: '#0a0d0b', boxShadow: [`0 0 0 1px ${alpha(P.fill, 0.45)}`, `0 0 60px -10px ${alpha(P.fill, 0.35)}`, ...shadow].join(', ') }
        : chrome === 'minimal'
          ? { background: P.surface, boxShadow: [`0 0 0 1px ${P.cardBorder}`, ...shadow].join(', ') }
          : chrome === 'none'
            ? { boxShadow: shadow.join(', ') }
            : { background: '#fff', boxShadow: ['0 0 0 1px rgba(255,255,255,0.10)', ...shadow].join(', ') };
  return (
    <div style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: R, overflow: 'hidden', boxSizing: 'border-box', ...frameStyle, ...style }}>
      {chrome === 'mac' && (
        <div style={{ height: bar, background: '#eef1f4', borderBottom: '1px solid #e2e7ed', display: 'flex', alignItems: 'center', gap: bar * 0.22, paddingLeft: bar * 0.45 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <span key={c} style={{ width: bar * 0.3, height: bar * 0.3, borderRadius: '50%', background: c }} />
          ))}
          {path && (
            <span style={{ marginLeft: 'auto', marginRight: 'auto', translate: `${-bar * 1.2}px 0`, padding: `${bar * 0.1}px ${bar * 0.8}px`, borderRadius: bar, background: '#fff', border: '1px solid #e2e7ed', fontFamily: T.ui, fontSize: bar * 0.36, color: '#5b6675' }}>{path}</span>
          )}
        </div>
      )}
      {chrome === 'terminal' && (
        <div style={{ height: bar, background: '#0a0d0b', borderBottom: `1px solid ${alpha(P.fill, 0.35)}`, display: 'flex', alignItems: 'center', gap: bar * 0.25, padding: `0 ${bar * 0.4}px`, fontFamily: T.mono, fontSize: bar * 0.38, color: alpha(P.fill, 0.9) }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: bar * 0.22, height: bar * 0.22, background: alpha(P.fill, 0.35 + i * 0.2) }} />
          ))}
          <span style={{ marginLeft: bar * 0.3 }}>{`~/${(path ?? name).replace(/\s·\s/, ' — ')}`}</span>
          <span style={{ marginLeft: 'auto', opacity: 0.6 }}>[live]</span>
        </div>
      )}
      <div style={{ position: 'relative', width: inner, height: viewH, overflow: 'hidden', borderRadius: chrome === 'device-frame' ? 18 * k : 0 }}>
        <div style={{ position: 'absolute', width: s.width, height: s.height, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}>
          <Img src={staticFile(s.src)} style={{ width: s.width, height: s.height, display: 'block' }} />
          {children}
        </div>
        {dim > 0 && <AbsoluteFill style={{ background: `rgba(11,17,28,${dim})` }} />}
        {chrome === 'terminal' && <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 1px, transparent 1px 3px)', pointerEvents: 'none' }} />}
      </div>
      {chrome === 'device-frame' && <div style={{ position: 'absolute', left: '50%', top: bezel * 0.35, width: bezel * 0.3, height: bezel * 0.3, translate: '-50% 0', borderRadius: '50%', background: '#3a3a3a' }} />}
    </div>
  );
};

/* ------------------------------------------------------------------ marks */

/**
 * A pointer gliding through points (container px). It eases out of each move along a slight
 * arc, a soft halo shows it is about to click, it dips on the press and a pulse and a ring
 * spread from the tip.
 */
export const Cursor: React.FC<{ path: { f: number; x: number; y: number }[]; click?: number; size?: number }> = ({ path, click, size = 22 }) => {
  const f = useCurrentFrame();
  const P = usePal();
  const first = path[0]!;
  if (f < first.f) return null;
  let x = path[path.length - 1]!.x;
  let y = path[path.length - 1]!.y;
  for (let i = 0; i < path.length - 1; i += 1) {
    const a = path[i]!;
    const b = path[i + 1]!;
    if (f <= b.f) {
      const t = interpolate(f, [a.f, b.f], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.15, 1) });
      const bow = Math.sin(t * Math.PI) * Math.min(60, Math.hypot(b.x - a.x, b.y - a.y) * 0.12);
      x = a.x + (b.x - a.x) * t + bow * 0.35;
      y = a.y + (b.y - a.y) * t - bow;
      break;
    }
  }
  const press = click === undefined ? 1 : interpolate(f, [click - 3, click, click + 2, click + 8], [1, 0.84, 0.84, 1], clamp);
  const hover = click === undefined ? 0 : interpolate(f, [click - 14, click - 4, click, click + 4], [0, 1, 1, 0], clamp);
  const pulse = click === undefined ? 0 : interpolate(f, [click, click + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ring = click === undefined ? 0 : interpolate(f, [click + 2, click + 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const c = P.fill;
  return (
    <>
      {hover > 0 && <div style={{ position: 'absolute', left: x - size * 0.9, top: y - size * 0.9, width: size * 1.8, height: size * 1.8, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(c, 0.32 * hover)} 0%, transparent 70%)` }} />}
      {pulse > 0 && pulse < 1 && <div style={{ position: 'absolute', left: x - size * 1.5 * pulse, top: y - size * 1.5 * pulse, width: size * 3 * pulse, height: size * 3 * pulse, borderRadius: '50%', background: alpha(c, 0.35 * (1 - pulse)) }} />}
      {ring > 0 && ring < 1 && (
        <div style={{ position: 'absolute', left: x - size * 2.2 * ring, top: y - size * 2.2 * ring, width: size * 4.4 * ring, height: size * 4.4 * ring, borderRadius: '50%', border: `${Math.max(1, size * 0.08)}px solid ${alpha(c, 0.8 * (1 - ring))}` }} />
      )}
      <svg
        width={size * 1.15}
        height={size * 1.15}
        viewBox="0 0 24 24"
        style={{ position: 'absolute', left: x - size * 0.19, top: y - size * 0.1, opacity: at(f, first.f, 6), scale: `${press}`, transformOrigin: '17% 9%', filter: `drop-shadow(0 ${size * 0.12}px ${size * 0.18}px rgba(14,23,38,0.35))`, overflow: 'visible' }}
      >
        <path d="M4 2 L4 19.6 L8.5 15.6 L11.5 22.4 L14.6 21 L11.7 14.4 L17.8 14.4 Z" fill="#0e1726" stroke="#fff" strokeWidth={1.7} strokeLinejoin="round" />
      </svg>
    </>
  );
};

/** The real element under a click, cut from the same capture: it presses down and springs back. */
export const PressButton: React.FC<{ name: string; b: Box; click: number; radius?: number }> = ({ name, b, click, radius = 8 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useShot(name);
  const P = usePal();
  if (f < click - 4) return null;
  const down = interpolate(f, [click - 3, click], [0, 1], clamp);
  const up = pop(f - (click + 3), fps, 0.6);
  const depth = f < click + 3 ? down : 1 - up;
  return (
    <div style={{ position: 'absolute', left: b.x, top: b.y, width: b.width, height: b.height, borderRadius: radius, overflow: 'hidden', scale: `${1 - 0.06 * depth}`, boxShadow: `0 0 0 ${2 + 4 * depth}px ${alpha(P.fill, 0.35 * depth)}` }}>
      <Img src={staticFile(s.src)} style={{ position: 'absolute', left: -b.x, top: -b.y, width: s.width, height: s.height, maxWidth: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: `rgba(14,23,38,${0.14 * depth})` }} />
    </div>
  );
};

/** A ring that snaps on around a box and breathes after. */
export const Ring: React.FC<{ b: Box; at: number; color?: string; pad?: number; radius?: number; width?: number }> = ({ b, at: start, color, pad = 8, radius = 12, width = 3 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const P = usePal();
  if (f < start) return null;
  const c = color ?? P.fill;
  const on = pop(f - start, fps);
  const breathe = (Math.sin(((f - start) / fps) * Math.PI * 2) + 1) / 2;
  return (
    <div
      style={{
        position: 'absolute',
        left: b.x - pad,
        top: b.y - pad,
        width: b.width + pad * 2,
        height: b.height + pad * 2,
        borderRadius: radius,
        border: `${width}px solid ${c}`,
        background: alpha(c, 0.08),
        boxShadow: `0 0 0 ${4 + breathe * 7}px ${alpha(c, 0.26 - breathe * 0.14)}`,
        opacity: Math.min(1, on),
        scale: `${0.9 + on * 0.1}`,
      }}
    />
  );
};

/** A row highlight that wipes in from the left with an accent edge. Page CSS pixels. */
export const Highlight: React.FC<{ b: Box; at: number; padX?: number; padY?: number; radius?: number }> = ({ b, at: start, padX = 14, padY = 4, radius = 8 }) => {
  const f = useCurrentFrame();
  const P = usePal();
  if (f < start) return null;
  const wipe = at(f, start, 12);
  const glow = interpolate(f, [start + 8, start + 22, start + 40], [0, 1, 0.55], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: b.x - padX,
        top: b.y - padY,
        width: (b.width + padX * 2) * Math.max(0, wipe),
        height: b.height + padY * 2,
        borderRadius: radius,
        background: alpha(P.fill, 0.14 + 0.06 * glow),
        boxShadow: `inset 3px 0 0 ${P.fill}, 0 0 ${18 * glow}px ${alpha(P.fill, 0.25 * glow)}`,
        mixBlendMode: 'multiply',
      }}
    />
  );
};

/* ------------------------------------------------------------------ type */

/** Kinetic headline: each word rises out of a mask, staggered; words from `accentFrom` take the accent. */
export const Words: React.FC<{
  text: string;
  at: number;
  size: number;
  color?: string;
  accent?: string;
  accentFrom?: number;
  weight?: number;
  stagger?: number;
  out?: number;
  font?: 'display' | 'ui' | 'mono';
  style?: CSSProperties;
  align?: 'left' | 'center';
}> = ({ text, at: start, size, color, accent, accentFrom, weight, stagger = 3, out, font = 'display', style, align = 'left' }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const words = text.split(' ');
  const st = stagger * T.M.stagger;
  return (
    <div
      style={{
        fontFamily: font === 'display' ? T.display : font === 'mono' ? T.mono : T.ui,
        fontWeight: weight ?? (font === 'display' ? Math.min(T.displayWeight, 700) : 500),
        fontSize: size,
        lineHeight: 1.12,
        letterSpacing: `${size * (font === 'display' ? T.tracking * 0.6 : -0.01)}px`,
        color: color ?? P.ink,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        columnGap: size * 0.26,
        ...style,
      }}
    >
      {words.map((word, i) => {
        const inT = at(f, start + i * st, 22);
        const outT = out === undefined ? 0 : at(f, out + i * 1.5, 14, EXPO_OUT);
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.14, marginBottom: -size * 0.14 }}>
            <span style={{ display: 'inline-block', translate: `0 ${(1 - inT) * 135 - outT * 135}%`, rotate: `${(1 - inT) * 5}deg`, color: accentFrom !== undefined && i >= accentFrom ? (accent ?? P.accent) : undefined }}>{word}</span>
          </span>
        );
      })}
    </div>
  );
};
const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** Small spaced label above a headline. */
export const Eyebrow: React.FC<{ text: string; at: number; style?: CSSProperties; color?: string }> = ({ text, at: start, style, color }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const t = at(f, start, 18);
  const c = color ?? P.accent;
  return (
    <div style={{ fontFamily: T.mono, fontWeight: 500, fontSize: 21, letterSpacing: 4, textTransform: 'uppercase', color: c, opacity: Math.min(1, t), translate: `${(1 - t) * -20}px 0`, display: 'flex', alignItems: 'center', gap: 14, ...style }}>
      <span style={{ width: 36 * Math.max(0, t), height: 2, background: c, display: 'inline-block' }} />
      {text}
    </div>
  );
};

/** A number that counts from `from` to `to`, formatted by `format`. */
export const Counter: React.FC<{ to: number; from?: number; at: number; dur?: number; format: (v: number) => string; style?: CSSProperties }> = ({ to, from = 0, at: start, dur = 30, format, style }) => {
  const f = useCurrentFrame();
  const v = from + (to - from) * Math.min(1, at(f, start, dur, EXPO_OUT));
  return <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{format(v)}</span>;
};

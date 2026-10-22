import type { ReactNode } from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { alpha, at, hash, noise, usePal, useTheme } from './theme';
import { Glitch, Tiles } from './kit';
import { MotionBlur } from './ui';
import { useFrame } from './frame';

// Cuts between scenes, in the theme's (or the incoming scene's) transition style:
//   whip          the content whips out and in with motion blur; a tile sweep where the surface changes
//   cut           a hard cut on the beat
//   mosaic        a field of tiles floods the frame and drains into the next scene
//   wipe          an accent panel wipes across, then a second wipes off
//   page-turn     the outgoing scene turns away like a page over the next one
//   glitch        chromatic split, sliced jitter and pixel noise either side of the cut
//   iris          the scene closes to a circle and the next opens from one
//   slide-stack   the next scene slides up over the last, which sinks back
//   redaction-bar black bars strike across the frame, then pull away
//   push          the next scene pushes the last out sideways (both move together)
//   zoom          the last scene zooms past the camera as the next settles in from small
//   dissolve      a soft cross-dissolve
//   flash         a hard cut under a bright flash frame
//
// A scene's in uses its own cut; its out uses the next scene's. page-turn, slide-stack, push,
// zoom and dissolve overlap the two scenes by OVERLAP frames: the outgoing sequence runs on under (or over)
// the incoming one.

export const OVERLAP = 16;
export const overlaps = (kind: string) => ['page-turn', 'slide-stack', 'push', 'zoom', 'dissolve'].includes(kind);

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
type Dir = 'left' | 'right' | 'top' | 'bottom' | 'none';
const vec = (d: Dir): [number, number] => (d === 'left' ? [-1, 0] : d === 'right' ? [1, 0] : d === 'top' ? [0, -1] : d === 'bottom' ? [0, 1] : [0, 0]);
const WHIPS: [Dir, Dir][] = [
  ['right', 'left'],
  ['bottom', 'top'],
  ['left', 'right'],
  ['right', 'bottom'],
];

/** The slow camera on a scene's content: static, drift, push or handheld-subtle. */
export const Camera: React.FC<{ dur: number; kind: string; children: ReactNode; strength?: number }> = ({ dur, kind, children, strength = 1 }) => {
  const f = useCurrentFrame();
  let style: React.CSSProperties = {};
  if (kind === 'drift') style = { translate: `${Math.sin(f / 70) * 12 * strength}px ${Math.cos(f / 85) * 7 * strength}px`, rotate: `${Math.sin(f / 110) * 0.35 * strength}deg` };
  else if (kind === 'push') style = { scale: `${1 + 0.03 * strength * interpolate(f, [0, dur], [0, 1], clamp)}` };
  else if (kind === 'handheld-subtle') style = { translate: `${noise(f / 9, 1) * 5 * strength}px ${noise(f / 11, 2) * 4 * strength}px`, rotate: `${noise(f / 14, 3) * 0.22 * strength}deg` };
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

/**
 * One scene inside its transitions. `backdrop` and `body` are separate because some cuts move
 * only the content (whip, glitch) and others the whole frame (iris, page-turn, slide-stack).
 */
export const SceneFrame: React.FC<{
  index: number;
  dur: number;
  inKind: string;
  outKind: string;
  first: boolean;
  last: boolean;
  backdrop: ReactNode;
  body: ReactNode;
}> = ({ index, dur, inKind, outKind, first, last, backdrop, body }) => {
  const f = useCurrentFrame();
  const { W, H } = useFrame();
  const R = Math.hypot(W, H) / 2 + 10;
  const inK = first ? 'none' : inKind;
  const outK = last ? 'none' : outKind;
  const [wFrom, wTo] = WHIPS[index % WHIPS.length]!;

  // Content-level motion.
  let dx = 0;
  let dy = 0;
  let blur = 0;
  let vertical = false;
  let opacity = 1;
  let filter: string | undefined;
  if (inK === 'whip') {
    const t = at(f, 0, 14, Easing.bezier(0.16, 1, 0.3, 1));
    const [ix, iy] = vec(wFrom);
    dx += ix * (1 - t) * 560;
    dy += iy * (1 - t) * 560;
    if (f < dur / 2) {
      blur = (1 - t) * 46;
      vertical = iy !== 0;
    }
    opacity = Math.min(opacity, at(f, 0, 5, Easing.linear));
  }
  if (outK === 'whip') {
    const t = interpolate(f, [dur - 12, dur], [0, 1], { ...clamp, easing: (x) => x * x * x });
    const [ox, oy] = vec(wTo);
    dx += ox * t * 900;
    dy += oy * t * 900;
    if (f >= dur / 2) {
      blur = t * 70;
      vertical = oy !== 0;
    }
    opacity = Math.min(opacity, 1 - at(f, dur - 4, 4, Easing.linear));
  }
  if (inK === 'wipe' || inK === 'redaction-bar' || inK === 'mosaic') {
    const t = at(f, 2, 16, Easing.bezier(0.16, 1, 0.3, 1));
    dx += (1 - t) * 50;
  }
  const glitchIn = inK === 'glitch' && f < 7;
  const glitchOut = outK === 'glitch' && f >= dur - 6;
  if (glitchIn || glitchOut) {
    const k = glitchIn ? 1 - f / 7 : (f - (dur - 6)) / 6;
    const sh = 4 + 14 * k;
    dx += (hash(f, 3) - 0.5) * 60 * k;
    filter = `drop-shadow(${sh}px 0 0 rgba(255,0,80,0.75)) drop-shadow(${-sh}px 0 0 rgba(0,240,255,0.75))`;
  }

  // Frame-level motion.
  const frame: React.CSSProperties = {};
  let shade = 0;
  if (inK === 'iris' || outK === 'iris') {
    const open = inK === 'iris' ? at(f, 0, 14, Easing.bezier(0.33, 0, 0.1, 1)) : 1;
    const close = outK === 'iris' ? 1 - at(f, dur - 10, 10, Easing.bezier(0.7, 0, 0.84, 0)) : 1;
    const r = Math.min(open, close);
    if (r < 1) frame.clipPath = `circle(${r * R}px at 50% 50%)`;
  }
  if (inK === 'slide-stack') {
    const t = at(f, 0, OVERLAP, Easing.bezier(0.2, 0.9, 0.2, 1));
    if (t < 1) {
      frame.translate = `0 ${(1 - t) * H}px`;
      frame.borderRadius = (1 - t) * 48;
      frame.overflow = 'hidden';
      frame.boxShadow = '0 -40px 120px rgba(0,0,0,0.45)';
    }
  }
  if (outK === 'slide-stack' && f >= dur) {
    const t = interpolate(f, [dur, dur + OVERLAP], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    frame.scale = `${1 - 0.08 * t}`;
    frame.borderRadius = 40 * t;
    frame.overflow = 'hidden';
    shade = 0.55 * t;
  }
  if (outK === 'page-turn' && f >= dur) {
    const t = interpolate(f, [dur, dur + OVERLAP], [0, 1], { ...clamp, easing: Easing.bezier(0.5, 0, 0.6, 1) });
    frame.transformOrigin = '0% 50%';
    frame.transform = `perspective(2600px) rotateY(${-t * 105}deg)`;
    frame.backfaceVisibility = 'hidden';
    shade = 0.5 * t;
  }
  if (inK === 'push') {
    const t = at(f, 0, OVERLAP, Easing.bezier(0.65, 0, 0.35, 1));
    if (t < 1) frame.translate = `${(1 - t) * W}px 0`;
  }
  if (outK === 'push' && f >= dur) {
    const t = interpolate(f, [dur, dur + OVERLAP], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
    frame.translate = `${-t * W}px 0`;
  }
  if (inK === 'zoom') {
    const t = at(f, 0, OVERLAP, Easing.bezier(0.16, 1, 0.3, 1));
    if (t < 1) {
      frame.scale = `${0.82 + 0.18 * t}`;
      frame.opacity = Math.min(1, t * 1.6);
    }
  }
  if (outK === 'zoom' && f >= dur) {
    const t = interpolate(f, [dur, dur + OVERLAP], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
    frame.scale = `${1 + 0.6 * t}`;
    frame.filter = `blur(${t * 14}px)`;
  }
  if (inK === 'dissolve') {
    const t = at(f, 0, OVERLAP, Easing.inOut(Easing.quad));
    if (t < 1) frame.opacity = t;
  }
  if (inK === 'page-turn') {
    const t = at(f, 0, OVERLAP, Easing.out(Easing.cubic));
    if (t < 1) {
      frame.scale = `${0.97 + 0.03 * t}`;
      shade = Math.max(shade, 0.35 * (1 - t));
    }
  }

  return (
    <AbsoluteFill style={frame}>
      {backdrop}
      <MotionBlur amount={blur} vertical={vertical}>
        <AbsoluteFill style={{ translate: `${dx}px ${dy}px`, opacity, filter }}>{body}</AbsoluteFill>
      </MotionBlur>
      {glitchIn || glitchOut ? <Slices /> : null}
      {shade > 0 && <AbsoluteFill style={{ background: outK === 'page-turn' && f >= dur ? `linear-gradient(90deg, rgba(0,0,0,${shade * 0.2}), rgba(0,0,0,${shade}))` : `rgba(0,0,0,${shade})` }} />}
    </AbsoluteFill>
  );
};

/** Horizontal glitch slices over the frame. */
const Slices: React.FC = () => {
  const f = useCurrentFrame();
  const P = usePal();
  const { W, H } = useFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: 7 }, (_, i) => {
        const h = hash(i, f);
        if (h < 0.4) return null;
        const y = hash(i, f, 2) * H;
        const hh = 6 + hash(i, f, 3) * 60;
        return <div key={i} style={{ position: 'absolute', left: (hash(i, f, 4) - 0.5) * 400, top: y, width: W, height: hh, background: i % 3 === 0 ? alpha(P.fill, 0.7) : alpha(P.ink, 0.25), mixBlendMode: P.dark ? 'screen' : 'multiply' }} />;
      })}
    </AbsoluteFill>
  );
};

/**
 * The overlay drawn across a cut (local frame 0 = 12 frames before the cut), for the
 * transitions that cover the frame: mosaic, wipe, glitch, redaction-bar, and whip where the
 * surface changes.
 */
export const CutOverlay: React.FC<{ kind: string; index: number; surfaceChange: boolean }> = ({ kind, index, surfaceChange }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const { W, H } = useFrame();
  const C = 12;
  if (kind === 'whip') return surfaceChange ? <Tiles at={0} mode="through" dur={24} origin={index % 2 ? [0.2, 0.3] : [0.8, 0.7]} /> : null;
  if (kind === 'mosaic') return <Tiles at={0} mode="through" dur={24} cols={index % 2 ? 16 : 24} origin={index % 3 === 0 ? [0.5, 0.5] : index % 3 === 1 ? [0, 0] : [1, 1]} color={P.ink} />;
  if (kind === 'wipe') {
    const a = interpolate(f, [0, C, C + 2, C + 14], [0, 1, 1, 2], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
    const b = interpolate(f, [3, C + 1, C + 3, C + 16], [0, 1, 1, 2], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
    const dir = index % 2 ? -1 : 1;
    const panel = (v: number, color: string, z: number) => <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: W + 180, translate: `${dir * (v - 1) * (W + 180) - 90}px 0`, background: color, zIndex: z, transform: 'skewX(-8deg)' }} />;
    return (
      <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
        {panel(a, T.accent, 1)}
        {panel(b, P.ink, 2)}
      </AbsoluteFill>
    );
  }
  if (kind === 'glitch') {
    if (f < C - 5 || f > C + 6) return null;
    return (
      <>
        <Glitch rect={{ x: 0, y: 0, w: W, h: H }} at={C - 5} dur={11} cell={index % 2 ? 48 : 36} />
        {f >= C - 1 && f <= C + 1 && <AbsoluteFill style={{ background: alpha(T.accent, 0.35), mixBlendMode: 'screen' }} />}
      </>
    );
  }
  if (kind === 'flash') {
    const a = interpolate(f, [C - 2, C, C + 1, C + 9], [0, 1, 1, 0], clamp);
    return <AbsoluteFill style={{ pointerEvents: 'none', background: P.dark ? '#ffffff' : T.accent, opacity: a * (P.dark ? 0.9 : 0.7) }} />;
  }
  if (kind === 'redaction-bar') {
    const rows = 7;
    const h = H / rows;
    return (
      <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
        {Array.from({ length: rows }, (_, i) => {
          const d = hash(i, index, 5) * 5;
          const inT = interpolate(f, [d, d + C - 4], [0, 1], { ...clamp, easing: Easing.bezier(0.7, 0, 0.3, 1) });
          const outT = interpolate(f, [C + 2 + d * 0.6, C + 12 + d * 0.6], [0, 1], { ...clamp, easing: Easing.bezier(0.7, 0, 0.3, 1) });
          const left = outT * (W + 80);
          const width = inT * (W + 80) - outT * (W + 80);
          return <div key={i} style={{ position: 'absolute', top: i * h - 1, height: h + 2, left: left - 40, width: Math.max(0, width + 80), background: i === 3 ? T.accent : '#0c0c0c' }} />;
        })}
      </AbsoluteFill>
    );
  }
  return null;
};

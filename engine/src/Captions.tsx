import { useMemo } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { captionChunks, type CaptionChunk } from './captions.mjs';
import { alpha, captionPosOf, useTrailer, walkPlan, type Pal } from './theme';
import { shotBoxOnFrame } from './scenes/Walkthrough';
import type { Box, WalkthroughScene } from './types';
import { contrast, readable as readableHex } from './options.mjs';
import { captionBand, useFrame, type CaptionPos } from './frame';

// Burned-in captions, timed to the voice word by word (Deepgram speech-to-text timestamps,
// else proportional). Short chunks, the spoken word lit in the accent (karaoke), styled by
// config.captions: position bottom | top | lower-third | center-low (the 9:16 default: the
// chunk's centre at 72% of the height, above the platform's caption and button zone),
// style box | outline | plain | pill,
// size, case, fontRole display | ui | mono, activeWordColor. On a walkthrough, a caption that
// would cover the ring or target box moves to the other edge.

const overlap = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

export const Captions: React.FC<{ palAt: (frame: number) => Pal }> = ({ palAt }) => {
  const f = useCurrentFrame();
  const fr = useFrame();
  const { timeline: tl, theme: T, config, shots } = useTrailer();
  const C = T.captions;
  // The scene under this frame sets the position (its `captions`, else the theme's).
  const si = tl.scenes.findIndex((s) => f >= s.from && f < s.from + s.duration);
  const scenePos = captionPosOf(config.scenes[si], T) as CaptionPos;
  const band0 = captionBand(fr, scenePos, C.size);
  const safe = { bottom: band0.reserveBottom, top: band0.reserveTop };
  const chunks = useMemo(() => captionChunks(tl, { maxWords: C.maxWords }), [tl, C.maxWords]);
  const chunk: CaptionChunk | undefined = chunks.find((c) => f >= c.from && f < c.to);
  if (!C.enabled || !chunk || scenePos === 'off') return null;
  const P = palAt(f);
  const size = C.size;
  const reserve = safe.bottom || safe.top;
  const sideL = fr.wide ? 0 : fr.safe.left;
  const sideR = fr.wide ? 0 : fr.safe.right;
  const W = Math.min(C.position === 'lower-third' ? 1180 : 1500, fr.W - (fr.wide ? 120 : sideL + sideR));

  // Where it goes, moving off the ring or target on a walkthrough.
  let position = scenePos as typeof C.position;
  if (C.avoid) {
    const i = si;
    const sc = config.scenes[i];
    const ts = tl.scenes[i];
    if (sc?.type === 'walkthrough' && ts) {
      const ws = sc as WalkthroughScene;
      const plan = walkPlan(ts, ws.shots);
      const k = plan.findIndex((p) => f - ts.from >= p.from && f - ts.from < p.from + p.dur);
      const shot = ws.shots[k];
      const s = shot ? shots[shot.page] : undefined;
      if (shot && s) {
        const capBox: Box = position === 'top' ? { x: 0, y: 0, width: fr.W, height: reserve + 10 } : position === 'lower-third' ? { x: 90, y: fr.H - reserve - 10, width: W + 60, height: reserve + 10 } : { x: (fr.W - W) / 2, y: fr.H - reserve - 10, width: W, height: reserve + 10 };
        const names = [shot.ring, shot.target].filter(Boolean) as string[];
        const hit = names.some((n) => s.boxes[n] && overlap(capBox, shotBoxOnFrame(shot, s, T, safe, s.boxes[n]!)));
        if (hit) position = position === 'top' ? 'bottom' : 'top';
      }
    }
  }

  const font = C.fontRole === 'display' ? T.display : C.fontRole === 'mono' ? T.mono : T.ui;
  const darkest = contrast(P.ink, '#000000') < contrast(P.bg, '#000000') ? P.ink : P.bg;
  const lightest = darkest === P.ink ? P.bg : P.ink;
  const boxBg = C.style === 'box' ? alpha(darkest, 0.84) : C.style === 'pill' ? P.surface : 'transparent';
  const base = C.style === 'box' ? lightest : P.ink;
  const onBg = C.style === 'box' ? darkest : C.style === 'pill' ? P.surface : P.bg;
  const active = readableHex(C.activeWordColor ?? T.accent, onBg, base, 2.4);
  const inT = interpolate(f, [chunk.from, chunk.from + 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outT = interpolate(f, [chunk.to - 3, chunk.to], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const textCase = C.case === 'upper' ? 'uppercase' : C.case === 'lower' ? 'lowercase' : 'none';
  const outline = C.style === 'outline' ? { WebkitTextStroke: `${Math.max(3, size * 0.12)}px ${P.bg}`, paintOrder: 'stroke fill' as const } : {};
  const shadow = C.style === 'plain' ? `0 2px 14px ${alpha(P.bg, 0.9)}, 0 0 2px ${alpha(P.bg, 0.9)}` : C.style === 'outline' ? `0 4px 18px ${alpha(P.bg, 0.6)}` : undefined;
  const pad = C.style === 'box' ? `${size * 0.22}px ${size * 0.5}px ${size * 0.26}px` : C.style === 'pill' ? `${size * 0.24}px ${size * 0.7}px ${size * 0.28}px` : '0';
  const radius = C.style === 'pill' ? 999 : Math.min(T.radius, 14);
  const lower = position === 'lower-third';
  const band = captionBand(fr, position as CaptionPos, size);
  const place: React.CSSProperties =
    position === 'top'
      ? { top: band.edge, left: sideL, right: sideR, justifyContent: 'center' }
      : position === 'center-low'
        ? { top: band.cy, left: sideL, right: sideR, justifyContent: 'center', translate: '0 -50%' }
        : lower
          ? { bottom: band.edge, left: fr.wide ? 110 : sideL, justifyContent: 'flex-start' }
          : { bottom: band.edge, left: sideL, right: sideR, justifyContent: 'center' };
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', display: 'flex', ...place }}>
        <div
          style={{
            maxWidth: W,
            display: 'flex',
            alignItems: 'stretch',
            gap: lower ? size * 0.35 : 0,
            padding: pad,
            background: boxBg,
            borderRadius: radius,
            border: C.style === 'pill' ? `1px solid ${P.cardBorder}` : undefined,
            boxShadow: C.style === 'pill' || C.style === 'box' ? '0 18px 50px -18px rgba(0,0,0,0.5)' : undefined,
            opacity: inT * (1 - outT),
            translate: `0 ${(1 - inT) * 10}px`,
          }}
        >
          {lower && <div style={{ width: Math.max(5, size * 0.12), background: T.accent, borderRadius: 2 }} />}
          <div
            style={{
              fontFamily: font,
              fontWeight: C.weight,
              fontSize: size,
              lineHeight: 1.22,
              letterSpacing: C.fontRole === 'display' ? size * T.tracking * 0.4 : 0,
              textTransform: textCase,
              textAlign: lower ? 'left' : 'center',
              color: base,
              textShadow: shadow,
              ...outline,
            }}
          >
            {chunk.words.map((w, i) => {
              const now = f >= w.from && f < w.to;
              const said = f >= w.to;
              return (
                <span key={i} style={{ display: 'inline-block', marginRight: i < chunk.words.length - 1 ? '0.3em' : 0, color: now ? active : undefined, opacity: now || said ? 1 : 0.5, scale: now ? '1.035' : '1', transformOrigin: '50% 70%' }}>
                  {w.text}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

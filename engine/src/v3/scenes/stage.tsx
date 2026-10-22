import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { cueFrame, spreadCues } from '../../cues.mjs';
import { splitPanelsWide } from '../../split.mjs';
import { alpha, hash, mixHex, useTrailer, usePal, useTheme } from '../../theme';
import { CastLayer, Character, type CastMember } from '../Character';
import { AppWindow, type UISpec } from '../appui';
import { BACK, Emoji, Fit, Label, Line, Pill, StageGlow, Stamp, clamp, ease, fitText, fitWrap, linkText, toneColor, useArea, useCues } from '../prims';
import { place } from '../../frame';
import type { Box, Shot, TimelineScene } from '../../types';

type S = { s: any; t: TimelineScene };

/* ================================================================== cast */

// cast: characters on a stage.
//   { type: "cast", stage?: floor | spotlight | none, headline?: { text, accent?, at?, until?, position?: top | bottom },
//     cast: [CastMember (see Character.tsx), plus podium?: "WITNESS A"], props?: [{ emoji, x, y, size?, at?, float? }] }

export const Podium: React.FC<{ x: number; y: number; w: number; label: string; at: number }> = ({ x, y, w, label, at }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const k = ease(f, at, 16);
  const wood = '#6b4226';
  return (
    <div style={{ position: 'absolute', left: x - w / 2, top: y - 150, width: w, height: 170, translate: `0 ${(1 - k) * 220}px`, opacity: k, zIndex: 3 }}>
      <div style={{ position: 'absolute', left: -14, right: -14, top: 0, height: 26, background: mixHex(wood, '#000', 0.15), borderRadius: 6 }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 22, bottom: 0, background: `linear-gradient(90deg, ${wood}, ${mixHex(wood, '#fff', 0.12)} 50%, ${wood})`, borderRadius: '0 0 8px 8px' }} />
      <div style={{ position: 'absolute', left: '50%', top: 58, translate: '-50% 0', padding: '8px 22px', background: '#e9d9a6', color: '#3a2a12', fontFamily: T.mono, fontWeight: 700, fontSize: 24, letterSpacing: 3, borderRadius: 4, whiteSpace: 'nowrap', boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.2)' }}>{label}</div>
    </div>
  );
};

export const Cast: React.FC<S> = ({ s, t }) => {
  const f = useCurrentFrame();
  const P = usePal();
  const T = useTheme();
  const A = useArea(120);
  const cue = useCues(t);
  const floor = s.floor !== undefined ? place(960, s.floor, A.fr, A, 'floor').y : A.bottom - 30;
  const cast: (CastMember & { podium?: string })[] = s.cast ?? [];
  const n = cast.length;
  // Default spots (authored in 16:9 space, mapped into the frame below).
  const ax = cast.map((c, i) => c.x ?? (n === 1 ? 960 : 420 + (1080 * i) / Math.max(1, n - 1)));
  const xs = ax.map((x) => place(x, 0, A.fr, A).x);
  const k = A.wide ? 1 : A.portrait ? 0.8 : 0.85;
  const h = s.headline;
  return (
    <>
      {s.stage === 'spotlight' &&
        xs.map((x, i) => (
          <div key={i} style={{ position: 'absolute', left: x - 380 * k, top: -40, width: 760 * k, height: floor + 80, background: `linear-gradient(${alpha('#fff8d6', 0.16)}, ${alpha('#fff8d6', 0.04)})`, clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)', opacity: ease(f, cue(cast[i]!.at, 4) - 6, 14) }} />
        ))}
      {s.stage !== 'none' && <div style={{ position: 'absolute', left: 0, right: 0, top: floor, height: 3, background: alpha(P.ink, 0.12) }} />}
      {(s.props ?? []).map((p: any, i: number) => {
        const a = cue(p.at, 10 + i * 4);
        const sp = spring({ frame: f - a, fps: 30, config: { damping: 11, stiffness: 160 } });
        if (f < a) return null;
        const pp = place(p.x, p.y, A.fr, A);
        const ps = (p.size ?? 120) * k;
        return (
          <div key={i} style={{ position: 'absolute', left: pp.x - ps / 2, top: pp.y - ps / 2 + (p.float ? Math.sin(f / 14 + i) * 12 : 0), scale: `${sp}`, rotate: `${(p.rot ?? 0) + (p.float ? Math.sin(f / 20 + i) * 5 : 0)}deg` }}>
            <Emoji name={p.emoji} size={ps} />
          </div>
        );
      })}
      {cast.map((c, i) => (
        <Character key={i} c={{ ...c, x: undefined }} defaultX={xs[i]} t={t} index={i} floor={c.podium ? floor - 110 * k : floor} />
      ))}
      {cast.map((c, i) => (c.podium ? <Podium key={`p${i}`} x={xs[i]!} y={floor} w={Math.max(300 * k, (c.size ?? 300) * 1.05 * k)} label={c.podium} at={cue(c.at, 4 + i * 5) - 4} /> : null))}
      {h && (
        <div style={{ position: 'absolute', left: A.left, right: A.W - A.right, top: h.position === 'bottom' ? undefined : A.top + 10, bottom: h.position === 'bottom' ? A.H - A.bottom + 20 : undefined, display: 'flex', justifyContent: 'center' }}>
          <Line text={h.text} accent={h.accent} at={cue(h.at, 6)} until={h.until !== undefined ? cue(h.until, t.duration) : undefined} size={h.size ?? fitWrap(h.text, A.width, 110, T, 44)} align="center" maxWidth={A.width} />
        </div>
      )}
    </>
  );
};

/* ================================================================== side text */

// A text column beside a window: eyebrow, title (accent word), body and timed points.
const SideText: React.FC<{ side: any; t: TimelineScene; x: number; w: number; top: number; bottom: number }> = ({ side, t, x, w, top, bottom }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const cue = useCues(t);
  const at = cue(side.at, 6);
  const points: any[] = side.points ?? [];
  const pts = spreadCues(t, points.length, 30);
  const size = side.size ?? Math.min(fitText(side.title ?? '', w * 1.7, 76, T, 44), fitWrap(side.title ?? '', w, 76, T, 36));
  return (
    <div style={{ position: 'absolute', left: x, width: w, top, height: bottom - top, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'visible' }}>
      {side.eyebrow && <Label text={side.eyebrow} at={at} size={22} />}
      {side.title && <Line text={side.title} accent={side.accent} at={at + 4} size={size} maxWidth={w} style={{ marginTop: 22 }} />}
      {side.body && <div style={{ fontFamily: T.ui, fontSize: 32, lineHeight: 1.4, color: P.muted, marginTop: 24, opacity: ease(f, at + 14, 14), translate: `0 ${(1 - ease(f, at + 14, 14)) * 12}px` }}>{side.body}</div>}
      {points.map((p, i) => {
        const pa = cue(p.at, pts[i] ?? 30);
        const k = ease(f, pa, 12);
        const lit = f >= pa;
        return (
          <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginTop: 22, opacity: k, translate: `${(1 - k) * -20}px 0` }}>
            <div style={{ width: 36, height: 36, flex: 'none', borderRadius: 10, background: lit ? P.fill : P.surface, color: P.onFill, display: 'grid', placeItems: 'center', fontFamily: T.mono, fontWeight: 700, fontSize: 20 }}>{p.icon ?? i + 1}</div>
            <div style={{ fontFamily: T.ui, fontWeight: 600, fontSize: 31, lineHeight: 1.3, color: P.ink }}>{p.text}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ================================================================== ui */

// ui: recreated app UI in a framed window (see appui.tsx for elements, cursor, camera,
// spotlight, highlight and notes), optionally beside a text column.
//   { type: "ui", frame?, url?, title?, sidebar?, elements: [...], cursor?, camera?, spotlight?, highlight?, notes?,
//     side?: { eyebrow?, title?, accent?, body?, points?: [{ text, at? }], at? }, sideAlign?: left | right, tilt?, perspective? }

/** In 9:16 and 1:1 a side column moves below the window (above it when captions sit at the top). */
const stackedSide = (A: ReturnType<typeof useArea>, hasSide: boolean, k = 0.36) => {
  const sideH = hasSide ? Math.round(A.height * (A.portrait ? k : k * 0.8)) : 0;
  const above = A.safe.pos === 'top';
  const box = { x: A.left, y: A.top + 10 + (above ? sideH : 0), w: A.width, h: A.height - 20 - sideH };
  const sideTop = above ? A.top : box.y + box.h + 16;
  return { box, sideTop, sideBottom: above ? A.top + sideH - 10 : A.bottom };
};

export const UIScene: React.FC<S> = ({ s, t }) => {
  const A = useArea(100);
  const f = useCurrentFrame();
  const side = s.side;
  const right = s.sideAlign === 'right';
  const stacked = !A.wide;
  const st = stackedSide(A, !!side);
  // 9:16 and 1:1: the window fills the content width, so keep a margin for the slow push-in
  // (drift, up to 1.5%) and the window's edge, or it crosses the platform safe area.
  const DRIFT = 0.015;
  const inset = (b: { x: number; y: number; w: number; h: number }) => {
    const dx = Math.ceil((b.w * DRIFT) / 2) + 14;
    const dy = Math.ceil((b.h * DRIFT) / 2) + 4;
    return { x: b.x + dx, y: b.y + dy, w: b.w - dx * 2, h: b.h - dy * 2 };
  };
  const box = stacked ? inset(st.box) : side ? { x: right ? A.left : 760, y: A.top + 10, w: A.W - 760 - A.left, h: A.height - 20 } : { x: A.left, y: A.top + 10, w: A.width, h: A.height - 20 };
  // 9:16 and 1:1 drop the sidebar; 9:16 defaults to a phone frame when the config sets none.
  const spec: UISpec = stacked ? { ...(s as UISpec), sidebar: undefined, frame: s.frame ?? (A.portrait ? 'phone' : 'app') } : (s as UISpec);
  const drift = 1 + DRIFT * interpolate(f, [0, t.duration], [0, 1], clamp);
  return (
    <>
      <StageGlow x={box.x + box.w / 2} y={box.y + box.h / 2} size={1500} a={0.18} />
      {side && (stacked ? <SideText side={side} t={t} x={A.left + 10} w={A.width - 20} top={st.sideTop} bottom={st.sideBottom} /> : <SideText side={side} t={t} x={right ? A.W - A.left - 560 : A.left + 10} w={560} top={A.top} bottom={A.bottom} />)}
      <AbsoluteFill style={{ scale: `${drift}`, transformOrigin: `${box.x + box.w / 2}px ${box.y + box.h / 2}px` }}>
        <AppWindow spec={spec} t={t} box={box} />
      </AbsoluteFill>
      {s.cast && <CastLayer cast={s.cast} t={t} floor={A.bottom - 10} />}
    </>
  );
};

/* ================================================================== screenshot */

// screenshot: a real capture, always framed (browser chrome, device bezel or a plain rounded
// card) with padding, a soft shadow and a backdrop; it fits by aspect ratio (never squashed,
// never edge to edge). The camera pushes in toward a box (focus zoom), the rest blurs and
// dims (spotlight), and a callout names what is shown.
//   { type: "screenshot", page (capture.pages name), frame?: browser | device | plain, url?,
//     side?: {...as ui}, tilt?: true,
//     moves?: [{ at, focus: "boxName" | { x, y, width, height }, zoom?: 1.7, spotlight?: true, label?, scroll? (page px) } | { at, reset: true }] }

const shotGeom = (shot: Shot, frame: string, box: { x: number; y: number; w: number; h: number }) => {
  const view = shot.view ?? shot.height;
  const aspect = shot.width / view;
  const barK = frame === 'browser' ? 50 / 1400 : 0;
  const bezK = frame === 'device' ? 26 / 1400 : 0;
  // w = inner + 2 bezel; h = inner / aspect + bar + 2 bezel
  const wByH = box.h / (1 / aspect + barK + 2 * bezK * (1 + 1 / aspect));
  const w = Math.min(box.w, wByH, 1560);
  const bezel = w * bezK;
  const inner = w - 2 * bezel;
  const bar = w * barK;
  const viewH = inner / aspect;
  const h = viewH + bar + 2 * bezel;
  return { w, h, inner, viewH, bar, bezel, x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2 };
};

export const Screenshot: React.FC<S> = ({ s, t }) => {
  const f = useCurrentFrame();
  const { shots, theme: T, config } = useTrailer();
  const P = usePal();
  const A = useArea(110);
  const cue = useCues(t);
  const shot = shots[s.page];
  if (!shot) return <AbsoluteFill style={{ display: 'grid', placeItems: 'center', color: P.warn, fontFamily: T.mono, fontSize: 30 }}>{`missing capture "${s.page}"`}</AbsoluteFill>;
  const frame = s.frame ?? (T.chrome === 'device-frame' ? 'device' : T.chrome === 'none' ? 'plain' : 'browser');
  const side = s.side;
  const right = s.sideAlign === 'right';
  const pad = A.wide ? 56 : 20;
  const stacked = !A.wide;
  const st = stackedSide(A, !!side, 0.3);
  const box = stacked ? { ...st.box, x: st.box.x + pad / 2, w: st.box.w - pad } : side ? { x: right ? A.left : 740, y: A.top + pad / 2, w: A.W - 740 - A.left, h: A.height - pad } : { x: A.left + pad, y: A.top + pad / 2, w: A.width - pad * 2, h: A.height - pad };
  const view = shot.view ?? shot.height;
  // 9:16 and 1:1 show a taller crop of a wide capture (up to 4:5), panned by the moves, so
  // the window fills the frame instead of a thin strip.
  const cropW = stacked ? Math.min(shot.width, view / Math.min(1.25, Math.max(view / shot.width, (box.h * 0.92) / box.w))) : shot.width;
  const g = shotGeom({ ...shot, width: cropW }, frame, box);
  const k0 = g.inner / cropW;

  // Camera state from the moves.
  let z = 1;
  let fx = shot.width / 2;
  let fy = view / 2;
  let spot = 0;
  let spotBox: Box | null = null;
  let label: { text: string; at: number; box: Box } | null = null;
  for (const m of s.moves ?? []) {
    const ma = cue(m.at, 20);
    const k = ease(f, ma, 28, Easing.bezier(0.65, 0, 0.35, 1));
    if (k <= 0) continue;
    if (m.reset) {
      z += (1 - z) * k;
      fx += (shot.width / 2 - fx) * k;
      fy += (view / 2 - fy) * k;
      spot *= 1 - k;
      if (k >= 1) label = null;
      continue;
    }
    const b: Box | undefined = typeof m.focus === 'string' ? shot.boxes[m.focus] : m.focus;
    if (m.scroll !== undefined) fy += (m.scroll + view / 2 - fy) * k;
    if (b) {
      // The crop already magnifies a wide capture in 9:16 and 1:1, so the zoom is gentler there.
      const zt = stacked ? Math.max(1.15, Math.min(1.6, (m.zoom ?? 1.7) * (cropW / shot.width) * 1.6)) : (m.zoom ?? 1.7);
      z += (zt - z) * k;
      // A focus box wider than the visible crop is read from its left edge (row labels first).
      const visW = cropW / zt;
      const tfx = stacked && b.width > visW ? b.x + visW / 2 - 8 : b.x + b.width / 2;
      fx += (tfx - fx) * k;
      fy += (b.y + b.height / 2 - fy) * k;
      if (m.spotlight !== false) {
        spot = Math.max(spot * (1 - k), k);
        spotBox = b;
      } else spot *= 1 - k;
      if (m.label) label = { text: m.label, at: ma + 18, box: b };
    }
  }
  const drift = 1 + 0.03 * interpolate(f, [0, t.duration], [0, 1], clamp);
  const scale = k0 * z * drift;
  const tx = Math.min(0, Math.max(g.inner - shot.width * scale, g.inner / 2 - fx * scale));
  const ty = Math.min(0, Math.max(g.viewH - shot.height * scale, g.viewH / 2 - fy * scale));
  const enter = ease(f, 0, 26);
  const tilt = s.tilt !== false ? (1 - enter) * 18 : 0;
  const R = frame === 'device' ? 44 : Math.max(12, Math.min(T.radius, 22));
  const padB = 14;
  const clip = spotBox ? `inset(${spotBox.y - padB}px ${shot.width - spotBox.x - spotBox.width - padB}px ${shot.height - spotBox.y - spotBox.height - padB}px ${spotBox.x - padB}px round ${12}px)` : undefined;
  const host = ((config.repoUrl ?? config.link?.url ?? config.projectName).replace(/^https?:\/\/(www\.)?/, '').split('/').pop() || 'app').replace(/\.git$/, '').toLowerCase().replace(/[^a-z0-9.-]/g, '');
  const pages = (config.capture as any)?.pages ?? [];
  const url = s.url ?? `${host}.local${pages.find((p: any) => p.name === s.page)?.path ?? '/'}`;

  // Label in frame px.
  let callout: ReactNode = null;
  if (label && f >= label.at) {
    const b = label.box;
    const x1 = g.x + g.bezel + tx + (b.x + b.width) * scale;
    const y1 = g.y + g.bezel + g.bar + ty + (b.y + b.height / 2) * scale;
    const x0 = g.x + g.bezel + tx + b.x * scale;
    const k = ease(f, label.at, 14, BACK);
    const maxW = A.wide ? 440 : Math.min(560, A.width - 40);
    if (stacked) {
      // Below (or above) the focus box, centred on it, kept inside the content area.
      const yb = g.y + g.bezel + g.bar + ty + (b.y + b.height) * scale + 18;
      const below = yb + 120 < A.bottom;
      const yt = g.y + g.bezel + g.bar + ty + b.y * scale - 18;
      const cxm = Math.max(A.left + maxW / 2, Math.min(A.right - maxW / 2, (x0 + x1) / 2));
      callout = (
        <div style={{ position: 'absolute', left: cxm, top: below ? Math.min(yb, A.bottom - 100) : Math.max(A.top, yt), translate: below ? '-50% 0' : '-50% -100%', scale: `${k}`, opacity: Math.min(1, k * 2), maxWidth: maxW, padding: '16px 22px', borderRadius: Math.min(T.radius, 16), background: P.fill, color: P.onFill, fontFamily: T.ui, fontWeight: 700, fontSize: 32, lineHeight: 1.2, boxShadow: '0 20px 50px -16px rgba(0,0,0,0.55)', zIndex: 10, textAlign: 'center' }}>
          {label.text}
        </div>
      );
    }
    const toRight = x1 + 460 < A.W - 40;
    const ax = toRight ? Math.min(x1, g.x + g.w - 10) : Math.max(x0, g.x + 10);
    const cx = toRight ? Math.min(A.W - 40 - 440, ax + 60) : Math.max(40 + 440, ax - 60);
    if (!stacked) callout = (
      <div style={{ position: 'absolute', left: cx, top: y1, translate: toRight ? '0 -50%' : '-100% -50%', scale: `${k}`, opacity: Math.min(1, k * 2), maxWidth: 440, padding: '16px 22px', borderRadius: Math.min(T.radius, 16), background: P.fill, color: P.onFill, fontFamily: T.ui, fontWeight: 700, fontSize: 30, lineHeight: 1.2, boxShadow: '0 20px 50px -16px rgba(0,0,0,0.55)', zIndex: 10 }}>
        {label.text}
      </div>
    );
  }

  const img = (style: CSSProperties) => <Img src={staticFile(shot.src)} style={{ position: 'absolute', left: 0, top: 0, width: shot.width, height: shot.height, ...style }} />;
  return (
    <>
      <StageGlow x={g.x + g.w / 2} y={g.y + g.h / 2} size={Math.max(g.w, g.h) * 1.4} a={0.25} />
      {side && (stacked ? <SideText side={side} t={t} x={A.left + 10} w={A.width - 20} top={st.sideTop} bottom={st.sideBottom} /> : <SideText side={side} t={t} x={right ? A.W - A.left - 560 : A.left + 10} w={560} top={A.top} bottom={A.bottom} />)}
      <div style={{ position: 'absolute', left: g.x, top: g.y, width: g.w, height: g.h, perspective: 2400 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: R,
            overflow: 'hidden',
            background: frame === 'device' ? '#141418' : '#ffffff',
            padding: g.bezel,
            boxSizing: 'border-box',
            boxShadow: `0 30px 80px -10px rgba(0,0,0,0.35), 0 60px 140px -40px ${alpha(P.fill, 0.35)}, 0 0 0 1px ${alpha(P.dark ? '#ffffff' : '#000000', 0.1)}`,
            transform: `translateY(${(1 - enter) * 70}px) rotateX(${tilt}deg) scale(${0.95 + 0.05 * enter})`,
            transformOrigin: '50% 70%',
            opacity: enter,
          }}
        >
          {frame === 'browser' && (
            <div style={{ height: g.bar, background: '#eef0f3', borderBottom: '1px solid #e1e4e8', display: 'flex', alignItems: 'center', gap: g.bar * 0.2, padding: `0 ${g.bar * 0.4}px` }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: g.bar * 0.26, height: g.bar * 0.26, borderRadius: '50%', background: ['#c9ced6', '#d3d7de', '#dde0e5'][i] }} />
              ))}
              <span style={{ marginLeft: g.bar * 0.6, padding: `${g.bar * 0.1}px ${g.bar * 0.5}px`, borderRadius: g.bar * 0.2, background: '#ffffff', border: '1px solid #e1e4e8', fontFamily: T.ui, fontSize: g.bar * 0.34, color: '#5b6675', minWidth: g.w * 0.3 }}>{url}</span>
            </div>
          )}
          <div style={{ position: 'relative', width: g.inner, height: g.viewH, overflow: 'hidden', borderRadius: frame === 'device' ? 22 : 0, background: '#ffffff' }}>
            <div style={{ position: 'absolute', width: shot.width, height: shot.height, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}>
              {img({ filter: spot > 0.01 ? `blur(${(7 * spot) / Math.max(1, scale)}px) brightness(${1 - 0.42 * spot})` : undefined })}
              {spot > 0.01 && spotBox && (
                <>
                  <div style={{ position: 'absolute', inset: 0, clipPath: clip, opacity: Math.min(1, spot * 1.5) }}>{img({})}</div>
                  <div style={{ position: 'absolute', left: spotBox.x - padB, top: spotBox.y - padB, width: spotBox.width + padB * 2, height: spotBox.height + padB * 2, borderRadius: 12, border: `${3 / scale}px solid ${P.fill}`, opacity: spot, boxShadow: `0 0 ${30 / scale}px ${alpha(P.fill, 0.5)}` }} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {callout}
      {s.cast && <CastLayer cast={s.cast} t={t} floor={A.bottom - 10} />}
    </>
  );
};

/* ================================================================== split */

// split: two halves side by side, same input, different outcome.
//   { type: "split", mode?: versus | before-after, divider?: vs | line, at?,
//     left: Panel, right: Panel }
//   Panel: { label?, tone?: bad | good | neutral, at?, title?, sub?, elements?: [ui elements], frame?, app?,
//            cast?: [CastMember with x in panel px 0..960], stat?: { value, from?, label?, prefix?, suffix?, decimals?, tone? },
//            emoji?, verdict?: { text, at?, tone? }, titleAt? (cue for the title, default the panel's at),
//            dimUntil? (cue: the panel sits dimmed until then, to point the eye at the other side) }
//   enter?: "none" makes panels that start at the top of the scene appear at once (no slide or fade),
//            for a split that continues straight from another split.

type Rect = { x: number; y: number; w: number; h: number };

/**
 * One side of a split. `r` is the panel's content rect (frame px); `bg` the rect its tint
 * fills. Panel cast `x` is authored in panel px 0..960 and scaled to the panel's width.
 */
const Panel: React.FC<{ p: any; t: TimelineScene; r: Rect; bg: Rect; at: number; second: boolean; compact: boolean }> = ({ p, t, r, bg, at, second, compact }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const cue = useCues(t);
  const tone = p.tone ?? 'neutral';
  const c = tone === 'neutral' ? P.accent : toneColor(tone, P);
  const padX = compact ? 40 : 60;
  const inner = { x: r.x + padX, w: r.w - padX * 2 };
  const top = r.y;
  const bottom = r.y + r.h;
  let y = top + 10;
  const label = p.label ? (
    <div style={{ position: 'absolute', left: inner.x, top: y, opacity: ease(f, at, 10) }}>
      <Pill text={p.label} color={c} size={26} />
    </div>
  ) : null;
  if (p.label) y += compact ? 62 : 70;
  const titleSize = p.titleSize ?? Math.min(fitText(p.title ?? '', inner.w * 1.3, compact ? 56 : 64, T, 34), fitWrap(p.title ?? '', inner.w, 64, T, 30));
  const title = p.title ? <Line text={p.title} accent={p.accent} at={p.titleAt !== undefined ? cue(p.titleAt, at + 6) : at + 6} size={titleSize} maxWidth={inner.w} style={{ position: 'absolute', left: inner.x, top: y }} /> : null;
  if (p.title) y += titleSize * 1.25 * (compact && p.title.length * titleSize * 0.55 > inner.w ? 2 : 1) + 10;
  const contentTop = y + 10;
  const contentBox = { x: inner.x, y: contentTop, w: inner.w, h: bottom - contentTop - 10 };
  const castK = compact ? 0.62 : 1;
  const castMembers: CastMember[] = (p.cast ?? []).map((m: CastMember) => ({ ...m, size: Math.round((m.size ?? 300) * castK), x: r.x + ((m.x ?? 480) / 960) * r.w }));
  let content: ReactNode = null;
  if (p.elements) content = <AppWindow spec={{ frame: p.frame ?? 'panel', elements: p.elements, app: p.app, enterAt: at + 8, tilt: false, cursor: p.cursor, highlight: p.highlight, spotlight: p.spotlight, camera: p.camera, notes: p.notes }} t={t} box={contentBox} />;
  else if (p.stat) {
    const st = p.stat;
    const v = (st.from ?? st.value) + (st.value - (st.from ?? st.value)) * ease(f, cue(st.at, at + 12), 30);
    const d = st.decimals ?? 0;
    const text = `${st.prefix ?? ''}${st.value.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}${st.suffix ?? ''}`;
    // With characters beside or below, the number keeps to the space left.
    const castH = castMembers.length ? Math.max(...castMembers.map((m) => m.size ?? 300)) : 0;
    const h = Math.max(120, contentBox.h - (castH && !compact ? castH + 10 : 0));
    const w = compact && castH ? inner.w * 0.6 : inner.w;
    content = (
      <div style={{ position: 'absolute', left: inner.x, width: w, top: contentTop, height: h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: T.display, fontWeight: T.displayWeight, fontSize: st.size ?? Math.min(fitText(text, w * 0.92, 200, T, 64), h * 0.62), color: st.tone ? toneColor(st.tone, P) : c, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{`${st.prefix ?? ''}${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}${st.suffix ?? ''}`}</div>
        {st.label && <div style={{ fontFamily: T.ui, fontSize: compact ? 32 : 36, fontWeight: 600, color: P.muted, marginTop: 14, textAlign: 'center', maxWidth: w }}>{st.label}</div>}
      </div>
    );
  }
  const verdict = p.verdict ? (
    <div style={{ position: 'absolute', left: r.x, width: r.w, top: p.cast && !compact ? top - 6 : top + r.h / 2 - 60, display: 'flex', justifyContent: p.cast ? 'flex-end' : 'center', paddingRight: p.cast ? padX : 0, boxSizing: 'border-box', zIndex: 20 }}>
      <Stamp text={p.verdict.text} at={cue(p.verdict.at, t.duration - 40)} size={p.verdict.size ?? (p.cast || compact ? 64 : 96)} color={toneColor(p.verdict.tone ?? tone, P)} rotate={second ? 7 : -7} />
    </div>
  ) : null;
  const castFloor = compact ? bottom - 6 : undefined;
  return (
    <>
      <div style={{ position: 'absolute', left: bg.x, top: bg.y, width: bg.w, height: bg.h, background: tone === 'neutral' ? undefined : alpha(c, P.dark ? 0.08 : 0.06) }} />
      {label}
      {title}
      {content}
      {castMembers.map((m, i) => (
        <Character key={i} c={{ ...m, x: compact && p.stat ? r.x + r.w * 0.8 : m.x, y: undefined }} frameSpace t={t} index={i + (second ? 10 : 0)} floor={castFloor ?? (p.cast[i].y ?? bottom - 10)} />
      ))}
      {p.emoji && <div style={{ position: 'absolute', left: r.x + r.w / 2 - 90 * castK, top: top + r.h / 2 - 90 * castK }}><Emoji name={p.emoji} size={180 * castK} /></div>}
      {verdict}
    </>
  );
};

export const Split: React.FC<S> = ({ s, t }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const A = useArea(0);
  const cue = useCues(t);
  const at = cue(s.at, 4);
  const lAt = cue(s.left?.at, at);
  const rAt = cue(s.right?.at, s.mode === 'before-after' ? Math.round(t.duration * 0.5) : at + 6);
  const ba = s.mode === 'before-after';
  const instant = s.enter === 'none';
  const lIn = instant && lAt <= 1 ? 1 : ease(f, lAt, 18);
  const rIn = instant && rAt <= 1 ? 1 : ease(f, rAt, 22, Easing.bezier(0.65, 0, 0.35, 1));
  const rFade = instant && rAt <= 1 ? 1 : ease(f, rAt, 18);
  const lineK = instant ? 1 : ease(f, at, 20, Easing.bezier(0.65, 0, 0.35, 1));
  const dim = (p: any) => (p?.dimUntil !== undefined ? 0.4 + 0.6 * ease(f, cue(p.dimUntil, 0), 10) : 1);
  const vs = (s.divider ?? 'vs') === 'vs' && !ba;
  if (A.wide) {
    const div = ba ? A.W - (A.W / 2) * rIn : A.W / 2;
    const panes = splitPanelsWide(A.fr, A.top, A.bottom);
    return (
      <>
        <AbsoluteFill style={{ clipPath: ba ? `inset(0 ${A.W - div}px 0 0)` : undefined, translate: ba ? undefined : `${(1 - lIn) * -200}px 0`, opacity: (ba ? 1 : lIn) * dim(s.left) }}>
          <Panel p={s.left ?? {}} t={t} r={panes.left.r} bg={panes.left.bg} at={lAt} second={false} compact={false} />
        </AbsoluteFill>
        <AbsoluteFill style={{ clipPath: ba ? `inset(0 0 0 ${div}px)` : undefined, translate: ba ? undefined : `${(1 - rFade) * 200}px 0`, opacity: (ba ? (rIn > 0 ? 1 : 0) : rFade) * dim(s.right) }}>
          <Panel p={s.right ?? {}} t={t} r={panes.right.r} bg={panes.right.bg} at={rAt} second compact={false} />
        </AbsoluteFill>
        <div style={{ position: 'absolute', left: div - 3, top: 0, width: 6, height: A.H * (ba ? 1 : lineK), background: P.ink, opacity: 0.85, zIndex: 30 }} />
        {vs && (
          <div style={{ position: 'absolute', left: A.W / 2 - 62, top: A.cy - 62, width: 124, height: 124, borderRadius: '50%', background: P.fill, color: P.onFill, display: 'grid', placeItems: 'center', fontFamily: T.display, fontWeight: 800, fontSize: 52, zIndex: 31, scale: `${ease(f, at + 10, 14, BACK)}`, boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}>{s.vsText ?? 'VS'}</div>
        )}
      </>
    );
  }
  // 9:16 and 1:1: the panels stack, first on top, with a horizontal divider.
  const gap = vs ? 70 : 24;
  const top = A.top;
  const bottom = A.bottom;
  const mid = (top + bottom) / 2;
  const h = (bottom - top - gap) / 2;
  const div = ba ? bottom - (bottom - mid) * rIn : mid;
  const sideL = A.fr.safe.left;
  const sideR = A.fr.safe.right;
  const w = A.W - sideL - sideR;
  return (
    <>
      <AbsoluteFill style={{ clipPath: ba ? `inset(0 0 ${A.H - div}px 0)` : undefined, translate: ba ? undefined : `0 ${(1 - lIn) * -120}px`, opacity: (ba ? 1 : lIn) * dim(s.left) }}>
        <Panel p={s.left ?? {}} t={t} r={{ x: sideL, y: top, w, h }} bg={{ x: 0, y: 0, w: A.W, h: mid }} at={lAt} second={false} compact />
      </AbsoluteFill>
      <AbsoluteFill style={{ clipPath: ba ? `inset(${div}px 0 0 0)` : undefined, translate: ba ? undefined : `0 ${(1 - rFade) * 120}px`, opacity: (ba ? (rIn > 0 ? 1 : 0) : rFade) * dim(s.right) }}>
        <Panel p={s.right ?? {}} t={t} r={{ x: sideL, y: top + h + gap, w, h }} bg={{ x: 0, y: mid, w: A.W, h: A.H - mid }} at={rAt} second compact />
      </AbsoluteFill>
      <div style={{ position: 'absolute', top: div - 3, left: 0, height: 6, width: A.W * (ba ? 1 : lineK), background: P.ink, opacity: 0.85, zIndex: 30 }} />
      {vs && (
        <div style={{ position: 'absolute', left: sideL + w / 2 - 54, top: mid - 54, width: 108, height: 108, borderRadius: '50%', background: P.fill, color: P.onFill, display: 'grid', placeItems: 'center', fontFamily: T.display, fontWeight: 800, fontSize: 46, zIndex: 31, scale: `${ease(f, at + 10, 14, BACK)}`, boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}>{s.vsText ?? 'VS'}</div>
      )}
    </>
  );
};

/* ================================================================== evidence */

// evidence: public evidence as neutral cards (no logos, no company names), attributed
// generically ("a user on a developer forum").
//   { type: "evidence", layout?: wall | stack | grid | row, eyebrow?, title?, accent?,
//     cards: [{ kind: quote | thread | post | stat | headline, text, source?, title?, meta?, value?, labels?: [..], count?, at?, tone? }],
//     stamp?: { text, at?, size?, x?, y?, rotate? } }

const EvCard: React.FC<{ c: any; w: number }> = ({ c, w }) => {
  const T = useTheme();
  const P = usePal();
  const kind = c.kind ?? 'quote';
  const paper = P.dark ? mixHex(P.surface, '#ffffff', 0.04) : '#ffffff';
  const ink = P.ink;
  const base: CSSProperties = { width: w, boxSizing: 'border-box', background: paper, color: ink, borderRadius: Math.min(T.radius, 18), border: `1px solid ${P.cardBorder}`, boxShadow: '0 30px 60px -24px rgba(0,0,0,0.5)', fontFamily: T.ui, padding: '30px 34px' };
  const src = c.source ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22, fontSize: 24, color: P.muted }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: mixHex(P.fill, P.surface, 0.5), display: 'grid', placeItems: 'center', fontWeight: 800, color: P.ink, fontSize: 20 }}>{String(c.source).replace(/^(a|an|the)\s+/i, '').charAt(0).toUpperCase()}</div>
      <span>{c.source}</span>
      {c.meta && <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 20 }}>{c.meta}</span>}
    </div>
  ) : null;
  switch (kind) {
    case 'thread':
      return (
        <div style={base}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 22, color: P.muted }}>
            <span style={{ padding: '5px 14px', borderRadius: 999, background: c.closed ? alpha(P.muted, 0.2) : alpha('#22a447', 0.18), color: c.closed ? P.muted : P.dark ? '#5ee08a' : '#14772f', fontWeight: 700 }}>{c.closed ? 'Closed' : 'Open'}</span>
            <span style={{ fontFamily: T.mono }}>{c.meta ?? 'issue'}</span>
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, marginTop: 14, lineHeight: 1.25 }}>{c.title ?? c.text}</div>
          {c.title && <div style={{ fontSize: 26, color: P.muted, marginTop: 10, lineHeight: 1.35 }}>{c.text}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
            {(c.labels ?? []).map((l: string, i: number) => (
              <span key={i} style={{ padding: '4px 12px', borderRadius: 999, fontSize: 20, fontWeight: 700, background: alpha(i ? P.accent2 : P.warn, 0.18), color: i ? P.accent2 : P.warn }}>{l}</span>
            ))}
            {c.count && <span style={{ marginLeft: 'auto', fontSize: 22, color: P.muted, fontFamily: T.mono }}>{`💬 ${c.count}`}</span>}
          </div>
          {c.source && <div style={{ fontSize: 22, color: P.muted, marginTop: 14 }}>{c.source}</div>}
        </div>
      );
    case 'post':
      return (
        <div style={{ ...base, display: 'flex', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: P.accent, fontFamily: T.mono, fontWeight: 700, fontSize: 26 }}>
            <span>▲</span>
            {c.count != null && <span style={{ color: P.ink }}>{c.count}</span>}
            <span style={{ color: P.muted }}>▼</span>
          </div>
          <div style={{ flex: 1 }}>
            {c.title && <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.25 }}>{c.title}</div>}
            <div style={{ fontSize: 28, lineHeight: 1.4, marginTop: c.title ? 10 : 0 }}>{c.text}</div>
            {src}
          </div>
        </div>
      );
    case 'stat':
      return (
        <div style={{ ...base, textAlign: 'left' }}>
          <div style={{ fontFamily: T.display, fontWeight: T.displayWeight, fontSize: 110, lineHeight: 1, color: c.tone === 'good' ? toneColor('good', P) : P.warn }}>{c.value}</div>
          <div style={{ fontSize: 30, lineHeight: 1.35, marginTop: 14, fontWeight: 600 }}>{c.text}</div>
          {c.source && <div style={{ fontSize: 22, color: P.muted, marginTop: 12 }}>{c.source}</div>}
        </div>
      );
    case 'headline':
      return (
        <div style={{ ...base, background: '#f3efe4', color: '#1c1a17', borderRadius: 4, rotate: '0deg' }}>
          <div style={{ fontFamily: T.mono, fontSize: 18, letterSpacing: 4, color: '#6a645a', borderBottom: '2px solid #1c1a17', paddingBottom: 8 }}>{c.meta ?? 'REPORT'}</div>
          <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 40, lineHeight: 1.15, marginTop: 14 }}>{c.text}</div>
          {c.source && <div style={{ fontSize: 22, color: '#6a645a', marginTop: 12, fontStyle: 'italic' }}>{c.source}</div>}
        </div>
      );
    default:
      return (
        <div style={base}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 110, lineHeight: 0.6, color: P.accent, height: 46 }}>“</div>
          <div style={{ fontSize: c.text.length > 90 ? 30 : 36, lineHeight: 1.35, fontWeight: 600 }}>{c.text}</div>
          {src}
        </div>
      );
  }
};

/** Largest stamp size whose text fits `width` (a stamp never wraps). */
const wrapStamp = (text: string, width: number) => Math.floor((width * 0.9) / (Math.max(1, String(text).length) * 0.72 + 0.56));

const SLOTS = [
  { x: 330, y: 330, r: -4 },
  { x: 1000, y: 300, r: 3 },
  { x: 640, y: 560, r: 2 },
  { x: 1320, y: 560, r: -3 },
  { x: 260, y: 640, r: 5 },
  { x: 1180, y: 400, r: -2 },
];

export const Evidence: React.FC<S> = ({ s, t }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useTheme();
  const A = useArea(110);
  const cue = useCues(t);
  const cards: any[] = s.cards ?? [];
  const def = spreadCues(t, cards.length, 10);
  const ats = cards.map((c, i) => cue(c.at, def[i] ?? 10));
  // 9:16 and 1:1: wall, grid and row become a column of at most 3 cards (the newest ones).
  const layout = !A.wide && s.layout !== 'stack' ? 'column' : (s.layout ?? 'wall');
  const hasHead = !!(s.title || s.eyebrow);
  const titleSize = s.titleSize ?? fitWrap(s.title ?? '', A.width, 76, T, 40);
  const headH = hasHead ? (s.eyebrow ? 40 : 0) + (s.title ? titleSize * 1.15 * Math.ceil((String(s.title).length * titleSize * 0.56) / A.width) + 20 : 0) : 0;
  const top = A.top + (hasHead ? (A.wide ? 150 : headH + 20) : 10);
  const head = hasHead ? (
    <div style={{ position: 'absolute', left: A.left, top: A.top, width: A.width }}>
      {s.eyebrow && <Label text={s.eyebrow} at={2} size={22} />}
      {s.title && <Line text={s.title} accent={s.accent} at={4} size={titleSize} maxWidth={A.width} style={{ marginTop: 14 }} />}
    </div>
  ) : null;
  const avail = A.bottom - top;
  let body: ReactNode = null;
  if (layout === 'column') {
    const w = A.width;
    const gap = 26;
    const shown = cards.map((c, i) => ({ c, i })).filter(({ i }) => f >= ats[i]!).slice(-3);
    const est = (c: any) => {
      const fs = (c.kind ?? 'quote') === 'stat' ? 30 : c.text?.length > 90 ? 30 : 36;
      const lines = Math.ceil((String(c.text ?? '').length * fs * 0.55) / (w - 68));
      const extra = c.kind === 'stat' ? 130 : c.kind === 'thread' ? 120 : c.kind === 'headline' ? 60 : 46;
      return 60 + extra + lines * fs * 1.35 + (c.source ? 62 : 0) + (c.title ? 50 : 0);
    };
    const total = shown.reduce((n, x) => n + est(x.c), 0) + gap * Math.max(0, shown.length - 1);
    body = (
      <div style={{ position: 'absolute', left: A.left, top, width: w, height: avail, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Fit w={w} h={Math.max(1, total)} maxW={w} maxH={avail}>
          <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            {shown.map(({ c, i }) => {
              const sp = spring({ frame: f - ats[i]!, fps, config: { damping: 14, stiffness: 150 } });
              return (
                <div key={i} style={{ opacity: Math.min(1, sp * 2), translate: `0 ${(1 - sp) * 60}px`, rotate: `${(i % 2 ? 1 : -1) * (1 - sp) * 6}deg` }}>
                  <EvCard c={c} w={w} />
                </div>
              );
            })}
          </div>
        </Fit>
      </div>
    );
  } else if (layout === 'stack') {
    const w = Math.min(980, A.width);
    body = cards.map((c, i) => {
      const a = ats[i]!;
      if (f < a) return null;
      const sp = spring({ frame: f - a, fps, config: { damping: 15, stiffness: 140 } });
      const later = ats.filter((x, j) => j > i && f >= x).length;
      const back = Math.min(3, later);
      return (
        <div key={i} style={{ position: 'absolute', left: A.cx - w / 2, top: top + avail * 0.08 - back * 34, width: w, translate: `${(1 - sp) * 900}px ${(1 - sp) * 60}px`, rotate: `${(i % 2 ? 2 : -2) + (1 - sp) * 10}deg`, scale: `${1 - back * 0.05}`, opacity: Math.min(1, sp * 2) * (1 - back * 0.22), zIndex: i, filter: back ? `blur(${back * 1.2}px)` : undefined }}>
          <EvCard c={c} w={w} />
        </div>
      );
    });
  } else if (layout === 'grid' || layout === 'row') {
    const cols = layout === 'row' ? cards.length : 2;
    const gap = 36;
    const w = (A.width - gap * (cols - 1)) / cols;
    body = (
      <div style={{ position: 'absolute', left: A.left, top, width: A.width, display: 'flex', flexWrap: 'wrap', gap, alignItems: 'flex-start' }}>
        {cards.map((c, i) => {
          const sp = spring({ frame: f - ats[i]!, fps, config: { damping: 14, stiffness: 150 } });
          return (
            <div key={i} style={{ opacity: f >= ats[i]! ? Math.min(1, sp * 2) : 0, translate: `0 ${(1 - sp) * 50}px` }}>
              <EvCard c={c} w={w} />
            </div>
          );
        })}
      </div>
    );
  } else {
    const w = 700;
    // Centre the slots this wall actually uses, so a wall of 2 or 3 cards is not left-heavy.
    const used = SLOTS.slice(0, Math.max(1, Math.min(cards.length, SLOTS.length)));
    const yOf = (sy: number) => ((sy - 300) / 400) * Math.max(0, avail - 300);
    const xs = used.map((u) => u.x);
    const ys = used.map((u) => yOf(u.y));
    const dx = A.cx - ((Math.min(...xs) + Math.max(...xs)) / 2 + 120);
    const span = Math.max(...ys) - Math.min(...ys) + 300;
    const dy = Math.max(0, (avail - span) / 2) - Math.min(...ys);
    body = cards.map((c, i) => {
      const a = ats[i]!;
      if (f < a) return null;
      const sl = SLOTS[i % SLOTS.length]!;
      const sp = spring({ frame: f - a, fps, config: { damping: 13, stiffness: 150 } });
      const y = top + yOf(sl.y) + dy;
      return (
        <div key={i} style={{ position: 'absolute', left: sl.x - w / 2 + 120 + dx, top: y, width: w, rotate: `${sl.r + (1 - sp) * 14}deg`, scale: `${1.25 - 0.25 * sp}`, opacity: Math.min(1, sp * 2), zIndex: i }}>
          <EvCard c={c} w={w} />
        </div>
      );
    });
  }
  return (
    <>
      {head}
      {body}
      {s.stamp && (
        // Optional stamp.x / stamp.y (frame px) centre the stamp on a point; default: centred.
        <div style={s.stamp.x !== undefined || s.stamp.y !== undefined
            ? { position: 'absolute', left: s.stamp.x !== undefined ? place(s.stamp.x, s.stamp.y ?? 540, A.fr, A).x : A.cx, top: s.stamp.y !== undefined ? place(s.stamp.x ?? 960, s.stamp.y, A.fr, A).y : top + avail * 0.35, translate: '-50% -50%', zIndex: 50 }
            : { position: 'absolute', left: 0, right: 0, top: top + avail * 0.35, display: 'flex', justifyContent: 'center', zIndex: 50 }}>
          <Stamp text={s.stamp.text} at={cue(s.stamp.at, t.duration - 40)} size={Math.min(s.stamp.size ?? 110, wrapStamp(s.stamp.text, A.width))} rotate={s.stamp.rotate ?? -8} />
        </div>
      )}
    </>
  );
};

/* ================================================================== metric (v3 styles) */

// metric with style: ring | bars | flip | gauge (cards is the v2 look).
//   { type: "metric", style, eyebrow?, title?, metrics: [{ label, from, to, prefix?, suffix?, decimals?, note?, max?, at?,
//       fromLabel? (ring: the word before the start value, default "was"), strike? (ring: false keeps the start value unstruck,
//       for a comparison rather than a before/after) }],
//     verdict?: { text, at? } }

/** How full a ring is: value over max, or (for a drop with no max) the share removed, so a fall from 72 to 1 fills the ring. */
const ringFrac = (m: any, v: number) => (m.max === undefined && m.to < m.from ? Math.max(0, (m.from - v) / m.from) : Math.min(m.max ?? 100, v) / (m.max ?? 100));

const fmt = (m: any, v: number) => `${m.prefix ?? ''}${v.toLocaleString('en-US', { minimumFractionDigits: m.decimals ?? 0, maximumFractionDigits: m.decimals ?? 0 })}${m.suffix ?? ''}`;

export const MetricV3: React.FC<S> = ({ s, t }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const A = useArea(120);
  const cue = useCues(t);
  const ms: any[] = (s.metrics ?? []).slice(0, 3);
  const def = spreadCues(t, ms.length, 10);
  const ats = ms.map((m, i) => cue(m.at, def[i] ?? 10));
  const style = s.style;
  const hasHead = !!(s.title || s.eyebrow);
  const top = A.top + (hasHead ? (A.wide ? 150 : 40 + fitWrap(s.title ?? '', A.width, 76, T, 40) * 1.2 * Math.ceil((String(s.title ?? '').length * 0.56 * fitWrap(s.title ?? '', A.width, 76, T, 40)) / A.width) + 30) : 20);
  const bottom = A.bottom - (s.verdict ? (A.wide ? 110 : 150) : 10);
  const COUNT = 40;
  const val = (m: any, i: number) => m.from + (m.to - m.from) * ease(f, ats[i]! + 10, COUNT, Easing.bezier(0.16, 1, 0.3, 1));
  const n = ms.length;
  // 9:16 stacks the metrics vertically (rows instead of columns); 1:1 keeps them side by side.
  const vertical = !A.wide && n > 1 && bottom - top > A.width * 1.15;
  const colW = vertical ? A.width : A.width / n;
  const rowH = vertical ? (bottom - top) / n : bottom - top;
  let body: ReactNode = null;
  if (style === 'ring' || style === 'gauge') {
    const r = vertical ? Math.max(40, Math.min((rowH - 150) / 2, A.width * 0.3)) : Math.min((bottom - top) * 0.36, colW * 0.32);
    body = ms.map((m, i) => {
      const v = val(m, i);
      const max = m.max ?? 100;
      const cx = vertical ? A.cx : A.left + colW * (i + 0.5);
      const cy = vertical ? top + rowH * i + (rowH - 110) / 2 + 10 : top + (bottom - top) * 0.46;
      const k = ease(f, ats[i]!, 14);
      if (style === 'gauge') {
        const ang = -90 + (Math.min(max, v) / max) * 180;
        const C = Math.PI * r;
        return (
          <div key={i} style={{ position: 'absolute', left: cx - r - 20, top: cy - r - 10, width: r * 2 + 40, height: r * 1.7, opacity: k }}>
            <svg width={r * 2 + 40} height={r + 30} style={{ overflow: 'visible' }}>
              <path d={`M20 ${r + 10} A${r} ${r} 0 0 1 ${r * 2 + 20} ${r + 10}`} fill="none" stroke={P.line} strokeWidth={28} strokeLinecap="round" />
              <path d={`M20 ${r + 10} A${r} ${r} 0 0 1 ${r * 2 + 20} ${r + 10}`} fill="none" stroke={P.fill} strokeWidth={28} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(max, v) / max)} />
              <line x1={r + 20} y1={r + 10} x2={r + 20 + Math.cos(((ang - 90) * Math.PI) / 180) * r * 0.82} y2={r + 10 + Math.sin(((ang - 90) * Math.PI) / 180) * r * 0.82} stroke={P.ink} strokeWidth={10} strokeLinecap="round" />
              <circle cx={r + 20} cy={r + 10} r={18} fill={P.ink} />
            </svg>
            <div style={{ textAlign: 'center', fontFamily: T.display, fontWeight: T.displayWeight, fontSize: r * 0.5, color: P.ink, marginTop: 10, fontVariantNumeric: 'tabular-nums' }}>{fmt(m, v)}</div>
            <div style={{ textAlign: 'center', fontFamily: T.ui, fontSize: 32, color: P.muted, marginTop: 4 }}>{m.label}</div>
          </div>
        );
      }
      const C = 2 * Math.PI * r;
      return (
        <div key={i} style={{ position: 'absolute', left: cx - r - 30, top: cy - r - 30, width: r * 2 + 60, opacity: k, scale: `${0.9 + 0.1 * k}` }}>
          <svg width={r * 2 + 60} height={r * 2 + 60} style={{ rotate: '-90deg' }}>
            <circle cx={r + 30} cy={r + 30} r={r} fill="none" stroke={P.line} strokeWidth={34} />
            <circle cx={r + 30} cy={r + 30} r={r} fill="none" stroke={P.fill} strokeWidth={34} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - ringFrac(m, v))} />
          </svg>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 30, height: r * 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: T.display, fontWeight: T.displayWeight, fontSize: r * 0.46, color: P.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: -2 }}>{fmt(m, v)}</div>
            {/* A count up from 0 has no "before" worth showing, unless fromLabel asks for it. */}
            {(m.from !== 0 || m.fromLabel !== undefined) && (
              <div style={{ fontFamily: T.ui, fontSize: 28, color: P.muted, marginTop: 6, position: 'relative' }}>
                {`${m.fromLabel ?? 'was'} ${fmt(m, m.from)}`}
                {m.strike !== false && <span style={{ position: 'absolute', left: 50, right: -4, top: '52%', height: 3, background: P.warn, scale: `${ease(f, ats[i]! + 14, 12)} 1`, transformOrigin: '0 50%' }} />}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', fontFamily: T.ui, fontWeight: 600, fontSize: 34, color: P.ink, marginTop: 14 }}>{m.label}</div>
          {m.note && <div style={{ textAlign: 'center', fontFamily: T.ui, fontSize: 26, color: P.muted, marginTop: 6, opacity: ease(f, ats[i]! + COUNT, 12) }}>{m.note}</div>}
        </div>
      );
    });
  } else if (style === 'bars') {
    const rowH = Math.min(220, (bottom - top) / n);
    body = ms.map((m, i) => {
      const max = m.max ?? Math.max(m.from, m.to) * 1.1;
      const y = top + i * rowH + 10;
      const W = A.width - 360;
      const kf = ease(f, ats[i]!, 20);
      const v = val(m, i);
      return (
        <div key={i} style={{ position: 'absolute', left: A.left, top: y, width: A.width, height: rowH - 20, opacity: ease(f, ats[i]!, 10) }}>
          <div style={{ fontFamily: T.ui, fontWeight: 650, fontSize: 34, color: P.ink }}>{m.label}</div>
          {[{ lab: 'before', v: m.from, c: alpha(P.warn, 0.8), k: kf }, { lab: 'after', v, c: P.fill, k: 1 }].map((b, j) => (
            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 12 }}>
              <div style={{ width: 120, fontFamily: T.mono, fontSize: 22, color: P.muted, textTransform: 'uppercase', letterSpacing: 2 }}>{b.lab}</div>
              <div style={{ width: W * (b.v / max) * b.k, height: 44, background: b.c, borderRadius: Math.min(T.radius, 10) }} />
              <div style={{ fontFamily: T.display, fontWeight: T.displayWeight, fontSize: 44, color: j ? P.accent : P.muted, fontVariantNumeric: 'tabular-nums' }}>{fmt(m, b.v)}</div>
            </div>
          ))}
        </div>
      );
    });
  } else {
    // flip: split-flap digits
    body = ms.map((m, i) => {
      const v = val(m, i);
      const text = fmt(m, v);
      const cw = Math.min(vertical ? Math.max(50, (rowH - 130) / 1.45) : 150, (colW - 80) / Math.max(4, text.length));
      const cx = vertical ? A.cx : A.left + colW * (i + 0.5);
      const k = ease(f, ats[i]!, 10);
      return (
        <div key={i} style={{ position: 'absolute', left: cx - colW / 2, width: colW, top: vertical ? top + rowH * i + 10 : top + (bottom - top) * 0.2, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: k }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[...text].map((ch, j) => (
              <div key={j} style={{ position: 'relative', width: cw, height: cw * 1.45, background: '#15181d', borderRadius: 10, display: 'grid', placeItems: 'center', fontFamily: T.display, fontWeight: 800, fontSize: cw * 1.05, color: '#f4f4f0', overflow: 'hidden', boxShadow: '0 10px 24px -10px rgba(0,0,0,0.6)' }}>
                {ch}
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 3, background: '#000' }} />
              </div>
            ))}
          </div>
          <div style={{ fontFamily: T.ui, fontWeight: 650, fontSize: 34, color: P.ink, marginTop: 24 }}>{m.label}</div>
          <div style={{ fontFamily: T.mono, fontSize: 26, color: P.muted, marginTop: 8 }}>{`from ${fmt(m, m.from)}`}</div>
        </div>
      );
    });
  }
  return (
    <>
      {hasHead && (
        <div style={{ position: 'absolute', left: A.left, top: A.top, width: A.width }}>
          {s.eyebrow && <Label text={s.eyebrow} at={2} size={22} />}
          {s.title && <Line text={s.title} accent={s.accent} at={4} size={fitWrap(s.title, A.width, 76, T, 40)} maxWidth={A.width} style={{ marginTop: 14 }} />}
        </div>
      )}
      {body}
      {s.verdict && (
        <div style={{ position: 'absolute', left: A.left, width: A.width, top: bottom + 10, display: 'flex', justifyContent: 'center' }}>
          <Line text={s.verdict.text} accent={s.verdict.accent} at={cue(s.verdict.at, (ats[n - 1] ?? 10) + COUNT)} size={Math.min(60, fitWrap(s.verdict.text, A.width, 60, T, 36))} align="center" maxWidth={A.width} />
        </div>
      )}
    </>
  );
};

export { hash, cueFrame };

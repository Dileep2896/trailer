import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { cueFrame, spreadCues } from '../../cues.mjs';
import { loadNamed } from '../../fonts';
import { alpha, hash, mixHex, noise, usePal, useTheme } from '../../theme';
import { Blob, CastLayer, Character } from '../Character';
import { BACK, Emoji, Label, Line, RoughFilter, Stamp, clamp, ease, fitText, fitWrap, toneColor, useArea, useCues } from '../prims';
import type { TimelineScene } from '../../types';
import { authorArea, mapArea, type CaptionPos } from '../../frame';

type S = { s: any; t: TimelineScene };

/* ================================================================== casefile */

// casefile: a cork board of pinned evidence joined by red string.
//   { type: "casefile", title?, caseNo?, pins: [{ kind: note | photo | exhibit | poster | card, title?, body?, label?,
//       emoji?, who? (blob shape for a photo), mood?, at?, x?, y?, rot?, w? }],
//     strings?: [{ from, to, at? }] (pin indices), stamp?: { text, at? } }

/** Largest stamp size whose text fits `width` (a stamp never wraps). */
const stampFit = (text: string, width: number) => Math.floor((width * 0.9) / (Math.max(1, String(text).length) * 0.72 + 0.56));

const PIN_SLOTS = [
  { x: 420, y: 330 },
  { x: 960, y: 290 },
  { x: 1500, y: 340 },
  { x: 640, y: 640 },
  { x: 1260, y: 650 },
  { x: 960, y: 520 },
];

export const CaseFile: React.FC<S> = ({ s, t }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useTheme();
  const P = usePal();
  const A = useArea(70);
  const cue = useCues(t);
  const hand = loadNamed('Kalam', 'Inter', 300, 700);
  const pins: any[] = s.pins ?? [];
  const def = spreadCues(t, pins.length, 10);
  const ats = pins.map((p, i) => cue(p.at, def[i] ?? 10));
  const board = { x: A.left, y: A.top, w: A.width, h: A.height };
  const sy = (y: number) => board.y + ((y - 200) / 640) * (board.h - 260) + 60;
  // Up to three pins zig-zag across the whole board; more fill the slot grid. 9:16 and 1:1 use a 2-column grid.
  const slots = pins.length <= 3 ? [{ x: 470, y: 300 }, { x: 960, y: 560 }, { x: 1450, y: 330 }] : PIN_SLOTS;
  const rows = Math.max(1, Math.ceil(pins.length / 2));
  const from = authorArea(70, A.safe.pos as CaptionPos, T.captions.size);
  const pos = pins.map((p, i) => {
    if (A.wide) return { x: p.x ?? slots[i % slots.length]!.x, y: p.y ?? sy(slots[i % slots.length]!.y) };
    if (p.x !== undefined && p.y !== undefined) return mapArea(p.x, p.y, from, A);
    const col = pins.length === 1 ? 0.5 : i % 2 ? 0.73 : 0.27;
    return { x: board.x + board.w * col, y: board.y + 110 + ((board.h - 170) * Math.floor(i / 2)) / rows + (i % 2 ? 40 : 0) };
  });
  const pinW = (p: any) => {
    const w = p.w ?? (p.kind === 'note' ? 330 : 400);
    return A.wide ? w : Math.min(w, board.w * (pins.length === 1 ? 0.8 : 0.44));
  };
  const card = (p: any, i: number): ReactNode => {
    const w = pinW(p);
    const kind = p.kind ?? 'card';
    if (kind === 'note')
      return (
        <div style={{ width: w, minHeight: w * 0.8, background: '#ffe680', padding: '30px 26px', boxSizing: 'border-box', fontFamily: hand, fontSize: 34, lineHeight: 1.2, color: '#3a2f12', boxShadow: '0 16px 30px -12px rgba(0,0,0,0.5)' }}>
          {p.title && <div style={{ fontWeight: 700, fontSize: 38 }}>{p.title}</div>}
          {p.body}
        </div>
      );
    if (kind === 'photo')
      return (
        <div style={{ width: w, background: '#fbfbf8', padding: '18px 18px 60px', boxSizing: 'border-box', boxShadow: '0 16px 30px -12px rgba(0,0,0,0.5)', position: 'relative' }}>
          <div style={{ height: w * 0.72, background: mixHex('#d9e6f2', P.fill, 0.15), display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
            {p.emoji ? <Emoji name={p.emoji} size={w * 0.5} /> : <Blob shape={p.who ?? 'blob'} color={p.color} mood={p.mood ?? 'neutral'} size={w * 0.6} blink={0} look={{ x: 0, y: 0 }} />}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 14, textAlign: 'center', fontFamily: hand, fontSize: 30, color: '#222' }}>{p.title}</div>
        </div>
      );
    if (kind === 'poster')
      return (
        <div style={{ width: w, background: '#f4efe2', padding: 24, boxSizing: 'border-box', textAlign: 'center', fontFamily: T.display, color: '#1b1813', boxShadow: '0 16px 30px -12px rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize: 58, fontWeight: 900, letterSpacing: 4 }}>{p.label ?? 'MISSING'}</div>
          <div style={{ height: 150, margin: '12px 0', background: '#ddd6c4', display: 'grid', placeItems: 'center' }}>{p.emoji ? <Emoji name={p.emoji} size={120} /> : <span style={{ fontSize: 90, opacity: 0.4 }}>?</span>}</div>
          <div style={{ fontFamily: T.ui, fontWeight: 700, fontSize: 28 }}>{p.title}</div>
          {p.body && <div style={{ fontFamily: T.ui, fontSize: 22, marginTop: 6, color: '#5a5446' }}>{p.body}</div>}
        </div>
      );
    // exhibit / card
    return (
      <div style={{ width: w, background: '#ffffff', borderRadius: 6, boxShadow: '0 16px 30px -12px rgba(0,0,0,0.5)', overflow: 'hidden', fontFamily: T.ui, color: '#1c1c1e' }}>
        {(p.label || kind === 'exhibit') && <div style={{ padding: '10px 20px', background: kind === 'exhibit' ? '#1c1c1e' : P.fill, color: kind === 'exhibit' ? '#f4f4f0' : P.onFill, fontFamily: T.mono, fontWeight: 700, fontSize: 22, letterSpacing: 4 }}>{p.label ?? `EXHIBIT ${String.fromCharCode(65 + i)}`}</div>}
        <div style={{ padding: '20px 22px' }}>
          {p.title && <div style={{ fontWeight: 750, fontSize: 32, lineHeight: 1.2 }}>{p.title}</div>}
          {p.body && <div style={{ fontSize: 25, lineHeight: 1.35, color: '#55555c', marginTop: 8 }}>{p.body}</div>}
        </div>
      </div>
    );
  };
  return (
    <>
      <div style={{ position: 'absolute', left: board.x, top: board.y, width: board.w, height: board.h, borderRadius: 14, background: '#b0804f', border: '18px solid #5d3b1e', boxSizing: 'border-box', boxShadow: 'inset 0 0 80px rgba(0,0,0,0.45), 0 30px 60px -20px rgba(0,0,0,0.6)', backgroundImage: 'radial-gradient(rgba(60,30,10,0.35) 1.5px, transparent 2px), radial-gradient(rgba(255,230,190,0.18) 1px, transparent 1.5px)', backgroundSize: '13px 11px, 17px 19px' }} />
      {(s.title || s.caseNo) && (
        <div style={{ position: 'absolute', left: board.x + 50, top: board.y + 34, padding: '10px 22px', background: '#e9d9a6', fontFamily: T.mono, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: '#3a2a12', rotate: '-1.5deg', boxShadow: '0 8px 16px -8px rgba(0,0,0,0.5)', opacity: ease(f, 2, 10) }}>
          {s.caseNo ? `${s.caseNo} · ` : ''}
          {s.title}
        </div>
      )}
      {pins.map((p, i) => {
        const a = ats[i]!;
        if (f < a) return null;
        const sp = spring({ frame: f - a, fps, config: { damping: 13, stiffness: 150 } });
        const r = p.rot ?? (hash(i, 5) - 0.5) * 8;
        const w = pinW(p);
        return (
          <div key={i} style={{ position: 'absolute', left: pos[i]!.x - w / 2, top: pos[i]!.y - 40, rotate: `${r + (1 - sp) * 12}deg`, scale: `${1.3 - 0.3 * sp}`, opacity: Math.min(1, sp * 2), zIndex: 2 + i, transformOrigin: '50% 0%' }}>
            {card(p, i)}
            <div style={{ position: 'absolute', left: w / 2 - 15, top: -12, width: 30, height: 30, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #ff6b6b, #b3141b)', boxShadow: '0 4px 6px rgba(0,0,0,0.5)' }} />
          </div>
        );
      })}
      <svg width={A.W} height={A.H} style={{ position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none' }}>
        {(s.strings ?? []).map((st: any, i: number) => {
          const a = pos[st.from];
          const b = pos[st.to];
          if (!a || !b) return null;
          const k = ease(f, cue(st.at, Math.max(ats[st.from] ?? 0, ats[st.to] ?? 0) + 10), 18);
          if (k <= 0) return null;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2 + 40;
          return <path key={i} d={`M${a.x} ${a.y - 26} Q${mx} ${my} ${b.x} ${b.y - 26}`} fill="none" stroke="#d61f26" strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} style={{ filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.4))' }} />;
        })}
      </svg>
      {s.stamp && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: A.cy - 70, display: 'flex', justifyContent: 'center', zIndex: 60 }}>
          <Stamp text={s.stamp.text} at={cue(s.stamp.at, t.duration - 40)} size={Math.min(s.stamp.size ?? 120, stampFit(s.stamp.text, A.width))} color={s.stamp.tone ? toneColor(s.stamp.tone, P) : '#d61f26'} rotate={-9} />
        </div>
      )}
      {s.cast && <CastLayer cast={s.cast} t={t} floor={A.bottom - 20} />}
    </>
  );
};

/* ================================================================== scoreboard */

// scoreboard: a broadcast scoreboard with flipping scores, a stat lower third (slammed in),
// a ticker crawl and telestrator marks.
//   { type: "scoreboard", bug?: LIVE | REPLAY | FINAL, title?, clock?, teams: [{ label, value, from?, at?, tone?, decimals?, suffix? }],
//     lowerThird?: { title, sub?, at? }, ticker?: text, telestrator?: [{ at, x, y, r?, text? }] }

export const Scoreboard: React.FC<S> = ({ s, t }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const A = useArea(110);
  const cue = useCues(t);
  const teams: any[] = s.teams ?? [];
  const W = 1180;
  const rowH = 128;
  const top = A.top + (s.ticker ? 70 : 20);
  const pulse = (Math.sin(f / 5) + 1) / 2;
  const enter = ease(f, 0, 18, BACK);
  // The board is authored 1180 px wide; 9:16 and 1:1 scale it to the content width.
  const kb = Math.min(1, A.width / W, (A.height - (s.ticker ? 70 : 20) - (s.lowerThird ? 220 : 0)) / (80 + teams.length * rowH));
  const from = authorArea(110, A.safe.pos as CaptionPos, T.captions.size);
  return (
    <>
      {s.ticker && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: A.top - 20, height: 54, background: '#0d0f12', borderTop: `3px solid ${P.fill}`, borderBottom: `3px solid ${P.fill}`, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          <div style={{ whiteSpace: 'nowrap', fontFamily: T.mono, fontSize: 28, color: '#f4f4f0', translate: `${A.W - f * 7}px 0` }}>{`${s.ticker}   •   ${s.ticker}   •   ${s.ticker}`}</div>
        </div>
      )}
      <div style={{ position: 'absolute', left: A.cx - W / 2, top, width: W, scale: `${enter * kb}`, transformOrigin: '50% 0%', background: '#0d0f12', borderRadius: 22, border: '6px solid #2a2f37', boxShadow: '0 40px 100px -30px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 30px', background: '#171a20', fontFamily: T.mono, fontSize: 28, color: '#f4f4f0', letterSpacing: 3 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px', background: s.bug === 'FINAL' ? P.fill : '#d11a2a', color: s.bug === 'FINAL' ? P.onFill : '#fff', borderRadius: 6, fontWeight: 800 }}>
            {s.bug !== 'FINAL' && <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', opacity: 0.4 + 0.6 * pulse }} />}
            {s.bug ?? 'LIVE'}
          </span>
          <span>{s.title}</span>
          {s.clock && <span style={{ marginLeft: 'auto', color: '#ffcf33' }}>{s.clock}</span>}
        </div>
        {teams.map((tm, i) => {
          const a = cue(tm.at, 20 + i * 8);
          const from = tm.from ?? tm.value;
          const k = ease(f, a, 22);
          const v = from + (tm.value - from) * k;
          const d = tm.decimals ?? 0;
          const flipping = f >= a && f < a + 22;
          const c = tm.tone ? toneColor(tm.tone, { ...P, dark: true, ink: '#f4f4f0', muted: '#9aa0a8', accent: P.fill, accent2: P.accent2, warn: '#ff5d5d' } as any) : '#f4f4f0';
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', height: rowH, padding: '0 36px', borderTop: '2px solid #22262d', opacity: ease(f, 6 + i * 4, 10) }}>
              <div style={{ width: 16, height: 70, background: i ? P.accent2 : P.fill, borderRadius: 4, marginRight: 26 }} />
              <div style={{ fontFamily: T.display, fontWeight: T.displayWeight, fontSize: 58, color: '#f4f4f0', textTransform: 'uppercase', letterSpacing: 1 }}>{tm.label}</div>
              <div style={{ marginLeft: 'auto', minWidth: 260, height: 96, background: '#1b1f26', borderRadius: 10, display: 'grid', placeItems: 'center', fontFamily: T.display, fontWeight: 800, fontSize: 80, color: c, fontVariantNumeric: 'tabular-nums', position: 'relative', overflow: 'hidden', scale: flipping ? `1 ${0.85 + 0.15 * Math.abs(Math.cos((f - a) / 2))}` : '1' }}>
                {`${v.toFixed(d)}${tm.suffix ?? ''}`}
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 3, background: '#000' }} />
              </div>
            </div>
          );
        })}
      </div>
      {s.lowerThird && (() => {
        const a = cue(s.lowerThird.at, Math.round(t.duration * 0.5));
        const slam = ease(f, a, 6, Easing.in(Easing.quad));
        if (f < a) return null;
        const shake = Math.max(0, 1 - (f - a - 6) / 8) * 10;
        return (
          <div style={{ position: 'absolute', left: A.left, bottom: A.H - A.bottom + 10, maxWidth: A.width, display: 'flex', alignItems: 'stretch', translate: `${(1 - slam) * -1400 + noise(f, 3) * shake}px 0`, boxShadow: '0 20px 40px -14px rgba(0,0,0,0.6)' }}>
            <div style={{ width: 22, background: P.fill }} />
            <div style={{ background: '#f4f4f0', padding: '18px 34px' }}>
              <div style={{ fontFamily: T.display, fontWeight: 800, fontSize: A.wide ? 56 : Math.min(56, fitWrap(s.lowerThird.title, A.width - 90, 56, T, 34)), color: '#111', textTransform: 'uppercase' }}>{s.lowerThird.title}</div>
              {s.lowerThird.sub && <div style={{ fontFamily: T.ui, fontWeight: 600, fontSize: 30, color: '#444', marginTop: 4 }}>{s.lowerThird.sub}</div>}
            </div>
          </div>
        );
      })()}
      <svg width={A.W} height={A.H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}>
        {(s.telestrator ?? []).map((m0: any, i: number) => {
          const k = ease(f, cue(m0.at, 30), 16);
          if (k <= 0) return null;
          const m = A.wide ? m0 : { ...m0, ...mapArea(m0.x, m0.y, from, A), r: (m0.r ?? 90) * kb };
          const r = m.r ?? 90;
          return (
            <g key={i} style={{ filter: 'drop-shadow(0 0 6px rgba(255,220,0,0.8))' }}>
              <ellipse cx={m.x} cy={m.y} rx={r * 1.2} ry={r * 0.8} fill="none" stroke="#ffe500" strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} transform={`rotate(-8 ${m.x} ${m.y})`} />
              {m.text && k > 0.9 && <text x={m.x + r * 1.3} y={m.y - r} fill="#ffe500" fontFamily="sans-serif" fontWeight={800} fontSize={40}>{m.text}</text>}
            </g>
          );
        })}
      </svg>
      {s.cast && <CastLayer cast={s.cast} t={t} floor={A.bottom - 20} />}
    </>
  );
};

/* ================================================================== chalkboard */

// chalkboard: a lesson drawn in chalk, stroke by stroke, then (optionally) wiped.
//   { type: "chalkboard", font?: Caveat | Kalam | Permanent Marker | Architects Daughter,
//     items: [{ kind: text | circle | rect | line | arrow | poly | cross | tick | underline | dot,
//               text?, x, y, w?, h?, r?, points?: [[x,y]..], size?, color?: white | yellow | pink | blue | green | accent,
//               at?, dur? (frames), erase? }],
//     wipe?: { at }, cast? }

const CHALK: Record<string, string> = { white: '#f2efe6', yellow: '#ffe58a', pink: '#ff9fbf', blue: '#9fd6ff', green: '#b8f2a6', red: '#ff8a7a' };

export const Chalkboard: React.FC<S> = ({ s, t }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const A = useArea(60);
  const cue = useCues(t);
  const hand = loadNamed(s.font ?? 'Caveat', 'Inter', 400, 700);
  const items0: any[] = s.items ?? [];
  const def = spreadCues(t, items0.length, 8);
  const wipeAt = s.wipe ? cue(s.wipe.at, t.duration - 24) : null;
  const wipe = wipeAt !== null ? ease(f, wipeAt, 20, Easing.bezier(0.5, 0, 0.5, 1)) : 0;
  const B = { x: A.left, y: A.top, w: A.width, h: A.height };
  const col = (c?: string) => (c === 'accent' ? P.fill : (CHALK[c ?? 'white'] ?? c ?? CHALK.white!));
  // Items are authored in 16:9 frame px. Other aspects map their positions into this board
  // (write variants for the best result); extents scale with the board, text by kt.
  const from = authorArea(60, A.safe.pos as CaptionPos, T.captions.size);
  const kx = A.width / from.width;
  const ky = A.height / from.height;
  const kt = A.wide ? 1 : Math.max(0.55, Math.min(1, kx * 1.35));
  const items: any[] = A.wide
    ? items0
    : items0.map((it) => {
        const p0 = it.x !== undefined && it.y !== undefined ? mapArea(it.x, it.y, from, A) : { x: it.x, y: it.y };
        return {
          ...it,
          x: p0.x,
          y: p0.y,
          w: it.w !== undefined ? it.w * kx : it.kind === 'line' || it.kind === 'underline' || it.kind === 'arrow' ? 200 * kx : undefined,
          h: it.h !== undefined ? it.h * ky : it.h,
          r: it.r !== undefined ? it.r * Math.min(kx, ky) * 1.3 : it.r,
          size: (it.size ?? 64) * kt,
          points: it.points?.map((p: number[]) => {
            const q = mapArea(p[0]!, p[1]!, from, A);
            return [q.x, q.y];
          }),
        };
      });
  return (
    <>
      <RoughFilter id="chalk-rough" scale={4} seed={3} />
      <div style={{ position: 'absolute', left: B.x - 22, top: B.y - 22, width: B.w + 44, height: B.h + 44, borderRadius: 12, background: 'linear-gradient(135deg, #8a5a33, #5e3a1f)', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)' }} />
      <div style={{ position: 'absolute', left: B.x, top: B.y, width: B.w, height: B.h, background: 'radial-gradient(ellipse at 40% 35%, #2f4a3c, #1f3329 70%)', overflow: 'hidden', borderRadius: 4 }}>
        <AbsoluteFill style={{ opacity: 0.18, backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1.5px)', backgroundSize: '9px 13px' }} />
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 60% 70%, rgba(255,255,255,0.07), transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, clipPath: wipe > 0 ? `inset(0 0 0 ${wipe * 100}%)` : undefined }}>
          <svg width={B.w} height={B.h} style={{ position: 'absolute', inset: 0, overflow: 'visible', filter: 'url(#chalk-rough)' }}>
            {items.map((it, i) => {
              if (it.kind === 'text' || !it.kind) return null;
              const a = cue(it.at, def[i] ?? 8);
              const k = ease(f, a, it.dur ?? 18, Easing.bezier(0.4, 0, 0.3, 1));
              const er = it.erase !== undefined ? 1 - ease(f, cue(it.erase, t.duration), 10) : 1;
              if (k <= 0 || er <= 0) return null;
              const c = col(it.color);
              const common = { fill: 'none', stroke: c, strokeWidth: it.width ?? 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - k, opacity: 0.92 * er };
              const x = it.x - B.x;
              const y = it.y - B.y;
              switch (it.kind) {
                case 'circle':
                  return <path key={i} d={`M ${x + it.r} ${y} A ${it.r} ${it.r} 0 1 1 ${x + it.r - 0.1} ${y - 2}`} {...common} />;
                case 'rect':
                  return <rect key={i} x={x} y={y} width={it.w} height={it.h} {...common} />;
                case 'line':
                case 'underline':
                  return <path key={i} d={`M ${x} ${y} Q ${x + (it.w ?? 200) / 2} ${y + 6} ${x + (it.w ?? 200)} ${y + (it.h ?? 0)}`} {...common} />;
                case 'arrow': {
                  const x2 = x + (it.w ?? 200);
                  const y2 = y + (it.h ?? 0);
                  const ang = Math.atan2(y2 - y, x2 - x);
                  const hx = (d: number) => x2 - Math.cos(ang + d) * 30;
                  const hy = (d: number) => y2 - Math.sin(ang + d) * 30;
                  return <path key={i} d={`M ${x} ${y} L ${x2} ${y2} M ${hx(0.5)} ${hy(0.5)} L ${x2} ${y2} L ${hx(-0.5)} ${hy(-0.5)}`} {...common} />;
                }
                case 'poly':
                  return <path key={i} d={`M ${(it.points as number[][]).map((p) => `${p[0]! - B.x} ${p[1]! - B.y}`).join(' L ')} Z`} {...common} />;
                case 'cross':
                  return <path key={i} d={`M ${x - 30} ${y - 30} L ${x + 30} ${y + 30} M ${x + 30} ${y - 30} L ${x - 30} ${y + 30}`} {...common} />;
                case 'tick':
                  return <path key={i} d={`M ${x - 30} ${y} L ${x - 8} ${y + 26} L ${x + 36} ${y - 30}`} {...common} />;
                case 'dot':
                  return <circle key={i} cx={x} cy={y} r={(it.r ?? 10) * k} fill={c} opacity={er} />;
                case 'fill':
                  return <path key={i} d={`M ${(it.points as number[][]).map((p) => `${p[0]! - B.x} ${p[1]! - B.y}`).join(' L ')} Z`} fill={alpha(c, 0.22 * k * er)} stroke="none" />;
                default:
                  return null;
              }
            })}
          </svg>
          {items.map((it, i) => {
            if (it.kind && it.kind !== 'text') return null;
            const a = cue(it.at, def[i] ?? 8);
            const text: string = it.text ?? '';
            const dur = it.dur ?? Math.max(10, text.length * 1.3);
            const k = ease(f, a, dur, Easing.linear);
            const er = it.erase !== undefined ? 1 - ease(f, cue(it.erase, t.duration), 10) : 1;
            if (k <= 0 || er <= 0) return null;
            const size = it.size ?? 64;
            return (
              <div key={i} style={{ position: 'absolute', left: it.x - B.x, top: it.y - B.y, maxWidth: A.wide ? undefined : B.w - Math.max(0, it.x - B.x) - 10, fontFamily: hand, fontSize: size, lineHeight: 1.1, color: col(it.color), whiteSpace: A.wide ? 'pre' : 'pre-wrap', clipPath: `inset(-20% ${(1 - k) * 100}% -20% -2%)`, filter: 'url(#chalk-rough)', opacity: 0.95 * er, textShadow: `0 0 2px ${alpha(col(it.color), 0.6)}`, translate: it.align === 'center' ? '-50% 0' : undefined }}>
                {text}
              </div>
            );
          })}
        </div>
        {wipe > 0 && wipe < 1 && <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${wipe * 100}%`, width: 260, translate: '-50% 0', background: `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.12)} 40%, transparent)` }} />}
        {wipe > 0 && wipe < 1 && <div style={{ position: 'absolute', top: B.h * 0.4, left: `${wipe * 100}%`, width: 200, height: 90, translate: '-50% 0', background: 'linear-gradient(#6b5644, #3b2f25)', borderRadius: 10, boxShadow: '0 10px 24px rgba(0,0,0,0.5)', rotate: `${Math.sin(f / 2) * 6}deg` }} />}
      </div>
      {s.cast && <CastLayer cast={s.cast} t={t} floor={A.bottom - 10} />}
    </>
  );
};

/* ================================================================== chat */

// chat: a conversation, message by message with a typing indicator first.
//   { type: "chat", style?: messenger | thread, title?, people: { <id>: { name, color?, side?: left | right, avatar? (emoji) } },
//     messages: [{ from, text, at?, reaction? (emoji), tone? }] }

export const Chat: React.FC<S> = ({ s, t }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useTheme();
  const P = usePal();
  const A = useArea(110);
  const cue = useCues(t);
  const msgs: any[] = s.messages ?? [];
  const people: Record<string, any> = s.people ?? {};
  const def = spreadCues(t, msgs.length, 14);
  const ats = msgs.map((m, i) => cue(m.at, def[i] ?? 14));
  const style = s.style ?? 'messenger';
  const shown = msgs.map((m, i) => ({ m, i, a: ats[i]! })).filter((x) => f >= x.a - 16);
  if (style === 'thread') {
    const W = Math.min(1360, A.width);
    const rowH = A.wide ? 150 : 200;
    const visible = shown.slice(-5);
    // Sized to the whole conversation (so it does not sit half empty), centred in the area.
    const H = Math.min(A.height - 20, 86 + 40 + Math.min(5, msgs.length) * rowH);
    const top = A.top + (A.height - H) / 2;
    return (
      <div style={{ position: 'absolute', left: A.cx - W / 2, top, width: W, height: H, background: P.surface, borderRadius: Math.min(T.radius, 20), border: `1px solid ${P.cardBorder}`, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)', overflow: 'hidden', opacity: ease(f, 0, 12) }}>
        <div style={{ height: 86, display: 'flex', alignItems: 'center', padding: '0 36px', borderBottom: `1px solid ${P.cardBorder}`, fontFamily: T.ui, fontWeight: 700, fontSize: 36, color: P.ink }}>{`# ${s.title ?? 'general'}`}</div>
        <div style={{ position: 'relative', padding: '24px 36px' }}>
          {visible.map(({ m, i, a }, j) => {
            const p = people[m.from] ?? { name: m.from };
            const typing = f < a;
            const k = ease(f, a, 12);
            return (
              <div key={i} style={{ display: 'flex', gap: 20, height: rowH, alignItems: 'flex-start', opacity: typing ? 0.7 : 1, translate: `0 ${(1 - ease(f, a - 16, 10)) * 30}px` }}>
                <div style={{ width: 78, height: 78, borderRadius: 16, background: p.color ?? mixHex(P.fill, P.surface, (j % 3) * 0.25), display: 'grid', placeItems: 'center', flex: 'none' }}>{p.avatar ? <Emoji name={p.avatar} size={56} /> : <span style={{ fontFamily: T.ui, fontWeight: 800, fontSize: 28, color: '#fff' }}>{String(p.name).charAt(0)}</span>}</div>
                <div>
                  <div style={{ fontFamily: T.ui, fontWeight: 750, fontSize: 32, color: P.ink }}>
                    {p.name}
                    <span style={{ fontWeight: 400, fontSize: 25, color: P.muted, marginLeft: 12 }}>{m.time ?? ''}</span>
                  </div>
                  {typing ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>{[0, 1, 2].map((d) => <span key={d} style={{ width: 12, height: 12, borderRadius: '50%', background: P.muted, opacity: 0.4 + 0.6 * ((Math.sin((f + d * 5) / 3) + 1) / 2) }} />)}</div>
                  ) : (
                    <div style={{ fontFamily: T.ui, fontSize: 38, color: m.tone ? toneColor(m.tone, P) : P.ink, marginTop: 6, opacity: k }}>{m.text}</div>
                  )}
                  {m.reaction && !typing && <div style={{ display: 'inline-flex', marginTop: 8, padding: '4px 12px', borderRadius: 999, background: alpha(P.fill, 0.15), scale: `${ease(f, a + 14, 10, BACK)}` }}><Emoji name={m.reaction} size={30} /></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  // messenger: a phone with bubbles
  const PW = A.wide ? 640 : Math.min(720, A.width);
  const PH = Math.min(A.height - 10, A.wide ? 860 : 1100);
  const px = A.cx - PW / 2;
  const py = A.top + (A.height - PH) / 2;
  let y = 0;
  const laid = shown.map((x) => {
    const lines = Math.ceil((x.m.text.length * 30 * 0.52) / 400);
    const h = 40 + lines * 40 + 20;
    const o = { ...x, y, h };
    y += h + 14;
    return o;
  });
  const overflow = Math.max(0, y - (PH - 230));
  return (
    <div style={{ position: 'absolute', left: px, top: py, width: PW, height: PH, borderRadius: 64, background: '#0b0b0f', padding: 16, boxSizing: 'border-box', boxShadow: '0 40px 100px -30px rgba(0,0,0,0.65)', translate: `0 ${(1 - ease(f, 0, 18)) * 80}px` }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 50, background: P.dark ? '#14161b' : '#f4f5f7', overflow: 'hidden' }}>
        <div style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 14, borderBottom: `1px solid ${alpha(P.ink, 0.08)}`, background: P.dark ? '#1b1e24' : '#ffffff' }}>
          <div style={{ fontFamily: T.ui, fontWeight: 700, fontSize: 26, color: P.ink }}>{s.title ?? ''}</div>
        </div>
        <div style={{ position: 'absolute', left: 22, right: 22, top: 140, translate: `0 ${-overflow}px` }}>
          {laid.map(({ m, i, a, y: yy, h }) => {
            const p = people[m.from] ?? {};
            const right = (p.side ?? 'left') === 'right';
            const typing = f < a;
            const sp = spring({ frame: f - (typing ? a - 16 : a), fps, config: { damping: 14, stiffness: 200 } });
            const bg = right ? P.fill : P.dark ? '#2a2e36' : '#ffffff';
            const fg = right ? P.onFill : P.ink;
            return (
              <div key={i} style={{ position: 'absolute', top: yy, left: right ? undefined : 0, right: right ? 0 : undefined, maxWidth: 460, display: 'flex', flexDirection: 'column', alignItems: right ? 'flex-end' : 'flex-start' }}>
                {p.name && !right && <div style={{ fontFamily: T.ui, fontSize: 18, color: P.muted, margin: '0 0 4px 16px' }}>{p.name}</div>}
                <div style={{ padding: typing ? '18px 22px' : '16px 24px', borderRadius: 28, background: bg, color: fg, fontFamily: T.ui, fontSize: 30, lineHeight: 1.3, fontWeight: 500, scale: `${0.6 + 0.4 * sp}`, transformOrigin: right ? '100% 100%' : '0% 100%', boxShadow: '0 4px 10px -4px rgba(0,0,0,0.2)' }}>
                  {typing ? <div style={{ display: 'flex', gap: 7 }}>{[0, 1, 2].map((d) => <span key={d} style={{ width: 11, height: 11, borderRadius: '50%', background: fg, opacity: 0.35 + 0.65 * ((Math.sin((f + d * 5) / 3) + 1) / 2) }} />)}</div> : m.text}
                </div>
                {m.reaction && !typing && <div style={{ marginTop: -10, scale: `${ease(f, a + 12, 10, BACK)}` }}><Emoji name={m.reaction} size={44} /></div>}
                <div style={{ height: Math.max(0, h - 80) }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ================================================================== countdown */

// countdown: 3, 2, 1 with a draining ring (or slammed digits), then an optional "then" word.
//   { type: "countdown", from?: 3, label?, style?: ring | bold | crash, at?, step? (seconds, default 0.75), then?: { text } }

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/** When each number shows: `ticks` cues, else the spoken number words ("three", "two"...), else every `step` s from `at`. */
export const countdownTicks = (s: any, t: TimelineScene) => {
  const from = s.from ?? 3;
  const step = Math.round((s.step ?? 0.75) * 30);
  const start = cueFrame(t, s.at, 6);
  const ticks: number[] = [];
  for (let k = 0; k < from; k += 1) {
    const n = from - k;
    const fb = (ticks[k - 1] ?? start - step) + step;
    const c = s.ticks?.[k] ?? (s.at === undefined || k > 0 ? NUMBER_WORDS[n] : undefined);
    ticks.push(Math.max(k ? ticks[k - 1]! + 4 : 0, c !== undefined ? cueFrame(t, c, fb) : k === 0 ? start : fb));
  }
  const last = ticks[ticks.length - 1] ?? start;
  const thenAt = cueFrame(t, s.then?.at, last + step);
  return { ticks, thenAt };
};

export const Countdown: React.FC<S> = ({ s, t }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const A = useArea(120);
  const cue = useCues(t);
  const from = s.from ?? 3;
  const { ticks, thenAt } = countdownTicks(s, t);
  const at = ticks[0]!;
  let idx = -1;
  ticks.forEach((x, i) => {
    if (f >= x) idx = i;
  });
  const n = from - Math.max(0, idx);
  const tickAt = ticks[Math.max(0, idx)]!;
  const nextAt = idx + 1 < ticks.length ? ticks[idx + 1]! : thenAt;
  const step = Math.max(6, nextAt - tickAt);
  const local = f - tickAt;
  const done = f >= thenAt;
  const style = s.style ?? 'ring';
  const k = Math.min(1, local / step);
  const R = Math.min(300, A.width / 2 - 40, A.height / 2 - 40);
  const kr = R / 300;
  const C = 2 * Math.PI * R;
  const punch = ease(f, tickAt, 6, BACK);
  return (
    <>
      {style === 'crash' && (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: A.top - 10, height: 40, backgroundImage: `repeating-linear-gradient(-45deg, #ffd23f 0 28px, #111 28px 56px)`, backgroundPosition: `${f * 2}px 0` }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: A.bottom - 30, height: 40, backgroundImage: `repeating-linear-gradient(-45deg, #ffd23f 0 28px, #111 28px 56px)`, backgroundPosition: `${-f * 2}px 0` }} />
        </>
      )}
      {s.label && f >= at - 4 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: A.top + 50, display: 'flex', justifyContent: 'center' }}>
          <Label text={s.label} at={at - 4} size={30} rule={false} />
        </div>
      )}
      {!done && f >= at && (
        <AbsoluteFill style={{ display: 'grid', placeItems: 'center', top: (A.top + A.bottom) / 2 - A.H / 2 }}>
          {style === 'ring' && (
            <svg width={R * 2 + 60} height={R * 2 + 60} style={{ position: 'absolute', rotate: '-90deg' }}>
              <circle cx={R + 30} cy={R + 30} r={R} fill="none" stroke={P.line} strokeWidth={22} />
              <circle cx={R + 30} cy={R + 30} r={R} fill="none" stroke={P.fill} strokeWidth={22} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * k} />
            </svg>
          )}
          <div style={{ fontFamily: T.display, fontWeight: T.displayWeight, fontSize: (style === 'bold' ? Math.min(560, A.height * 0.6) : 380 * kr), lineHeight: 1, color: style === 'crash' ? '#ffd23f' : P.ink, scale: `${1.6 - 0.6 * punch}`, opacity: Math.min(1, punch * 2) * (1 - Math.max(0, (local - step + 5) / 5)), filter: punch < 0.9 ? `blur(${(1 - punch) * 10}px)` : undefined, textShadow: style === 'crash' ? '0 10px 0 #111' : undefined }}>{n}</div>
        </AbsoluteFill>
      )}
      {done && s.then && (
        <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', top: (A.top + A.bottom) / 2 - A.H / 2 }}>
          <Stamp text={s.then.text} at={thenAt} size={Math.min(s.then.size ?? 170, stampFit(s.then.text, A.width))} color={s.then.tone ? toneColor(s.then.tone, P) : P.accent} rotate={-4} />
        </AbsoluteFill>
      )}
      {s.cast && <CastLayer cast={s.cast} t={t} floor={A.bottom - 10} />}
    </>
  );
};

/* ================================================================== rewind */

// rewind: VHS rewind. Tracking noise, a REW display, the clock spinning back, ghost text
// streaking past, then a slate ("3 HOURS EARLIER").
//   { type: "rewind", from?: "FRI 18:02", to?: "FRI 15:02", slate?, ghosts?: [text], at? }

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
/** "FRI 18:02" or "18:02" to minutes (since Sunday 00:00 when a day is given). */
const toMin = (s: string) => {
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const d = DAYS.indexOf((s.match(/[A-Za-z]{3}/)?.[0] ?? '').toUpperCase());
  return { min: Math.max(0, d) * 1440 + Number(m[1]) * 60 + Number(m[2]), day: d >= 0 };
};

export const Rewind: React.FC<S> = ({ s, t }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const A = useArea(110);
  const cue = useCues(t);
  const at = cue(s.at, 0);
  const slateAt = cue(s.slateAt, Math.round(t.duration * 0.55));
  const k = ease(f, at, slateAt - at - 4, Easing.bezier(0.3, 0, 0.7, 1));
  const a = toMin(s.from ?? '18:02');
  const b = toMin(s.to ?? '15:02');
  let clock = s.from ?? '';
  if (a && b) {
    // Always runs backwards: an earlier day of the week (or time) wraps a week (or day) back.
    const span = a.day ? 7 * 1440 : 1440;
    const to = b.min > a.min ? b.min - span : b.min;
    const m = Math.round(a.min + (to - a.min) * k);
    const w = ((m % span) + span) % span;
    const hm = w % 1440;
    clock = `${a.day ? `${DAYS[Math.floor(w / 1440)]} ` : ''}${String(Math.floor(hm / 60)).padStart(2, '0')}:${String(hm % 60).padStart(2, '0')}`;
  }
  const rewinding = f < slateAt;
  const ghosts: string[] = s.ghosts ?? [];
  const slateSize = Math.min(120, Math.floor(A.width / (Math.max(4, String(s.slate ?? '').length + 1) * 0.66 + 0.1)));
  return (
    <>
      <AbsoluteFill style={{ background: rewinding ? `linear-gradient(${alpha(P.fill, 0.06)}, ${alpha(P.accent2, 0.08)})` : undefined }} />
      {rewinding &&
        Array.from({ length: 9 }, (_, i) => {
          const y = (hash(i, Math.floor(f / 2)) * A.H) | 0;
          return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: y, height: 4 + hash(i, f) * 26, background: alpha(i % 3 ? '#ffffff' : P.fill, 0.08 + hash(i, f, 2) * 0.14), translate: `${(hash(i, f, 3) - 0.5) * 80}px 0` }} />;
        })}
      {rewinding &&
        ghosts.map((g, i) => {
          const x = A.W - (((f - at) * 70 + i * 700) % (A.W + 680));
          return <div key={i} style={{ position: 'absolute', left: x, top: A.top + 140 + i * 170, fontFamily: T.display, fontWeight: T.displayWeight, fontSize: 110, color: alpha(P.ink, 0.22), whiteSpace: 'nowrap', filter: 'blur(3px)', textShadow: `-14px 0 0 ${alpha('#ff0050', 0.3)}, 14px 0 0 ${alpha('#00f0ff', 0.3)}` }}>{g}</div>;
        })}
      {rewinding && (
        <>
          <div style={{ position: 'absolute', left: A.left, top: A.top, fontFamily: T.mono, fontSize: 52, fontWeight: 700, color: '#ffffff', textShadow: '3px 3px 0 #000', opacity: Math.floor(f / 8) % 2 ? 1 : 0.55, letterSpacing: 4 }}>◀◀ REW</div>
          <AbsoluteFill style={{ display: 'grid', placeItems: 'center', top: (A.top + A.bottom) / 2 - A.H / 2 }}>
            <div style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 200, color: P.ink, letterSpacing: 6, fontVariantNumeric: 'tabular-nums', textShadow: `-8px 0 0 ${alpha('#ff0050', 0.55)}, 8px 0 0 ${alpha('#00f0ff', 0.55)}`, translate: `${noise(f * 3, 2) * 10}px ${noise(f * 3, 7) * 4}px` }}>{clock}</div>
          </AbsoluteFill>
        </>
      )}
      {!rewinding && (
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', top: (A.top + A.bottom) / 2 - A.H / 2, left: A.left, width: A.width }}>
          <div style={{ fontFamily: T.mono, fontWeight: 700, fontSize: slateSize, letterSpacing: 8, color: P.ink, textAlign: 'center', maxWidth: A.width }}>
            {(s.slate ?? '').slice(0, Math.max(0, Math.floor((f - slateAt) / 1.2)))}
            <span style={{ display: 'inline-block', width: slateSize * 0.5, height: slateSize * 0.83, background: P.fill, marginLeft: 10, verticalAlign: '-0.1em', opacity: Math.floor(f / 8) % 2 ? 1 : 0 }} />
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 44, color: P.muted, marginTop: 24, opacity: ease(f, slateAt + 10, 10) }}>{s.to}</div>
        </AbsoluteFill>
      )}
    </>
  );
};

/* ================================================================== calendar */

// calendar: a tear-off desk calendar flipping (faster and faster), sticky notes piling up.
//   { type: "calendar", pages: [{ day, date?, note?, at? }], pileLabel?, cast? }

const NOTE_SLOTS: [number, number][] = [
  [900, 0.05],
  [1300, 0.12],
  [1080, 0.55],
  [1480, 0.62],
  [880, 0.95],
  [1300, 1.0],
];

export const Calendar: React.FC<S> = ({ s, t }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useTheme();
  const P = usePal();
  const A = useArea(120);
  const cue = useCues(t);
  const hand = loadNamed('Kalam', 'Inter', 300, 700);
  const pages: any[] = s.pages ?? [];
  const def = spreadCues(t, pages.length, 6);
  const ats = pages.map((p, i) => cue(p.at, def[i] ?? 6));
  let cur = -1;
  ats.forEach((a, i) => {
    if (f >= a) cur = i;
  });
  const CW = 520;
  const CH = 520;
  // 9:16 and 1:1: the calendar sits top centre (smaller) and the notes pile up below it.
  const kc = A.wide ? 1 : Math.min(A.portrait ? 0.78 : 0.62, (A.height * (s.notesOff ? 0.9 : 0.46)) / CH);
  const cx = A.wide ? (s.notesOff ? A.cx - CW / 2 : 300) : A.cx - CW / 2;
  const cy = A.wide ? A.top + (A.height - CH) / 2 : s.notesOff ? A.cy - CH / 2 : A.top + 20 - (CH * (1 - kc)) / 2;
  const page = (p: any, style: CSSProperties = {}) => (
    <div style={{ position: 'absolute', inset: 0, background: '#ffffff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 50px -18px rgba(0,0,0,0.45)', ...style }}>
      <div style={{ height: 130, background: p.tone ? toneColor(p.tone, P) : P.warn, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: T.display, fontWeight: 800, fontSize: 70, letterSpacing: 4 }}>{p.day}</div>
      <div style={{ display: 'grid', placeItems: 'center', height: CH - 130, fontFamily: T.display, fontWeight: 800, fontSize: 200, color: '#1d1d1f' }}>{p.date ?? ''}</div>
    </div>
  );
  const notes = pages.map((p, i) => ({ p, i })).filter(({ p, i }) => p.note && f >= ats[i]! + 4);
  return (
    <>
      <div style={{ position: 'absolute', left: cx, top: cy, width: CW, height: CH, perspective: 1800, scale: kc < 1 ? `${kc}` : undefined }}>
        <div style={{ position: 'absolute', left: 60, right: 60, top: -24, height: 40, display: 'flex', justifyContent: 'space-between', zIndex: 5 }}>{[0, 1, 2, 3].map((i) => <div key={i} style={{ width: 18, height: 46, borderRadius: 9, background: '#666b73' }} />)}</div>
        {cur >= 0 && page(pages[cur])}
        {cur >= 1 && (() => {
          const k = ease(f, ats[cur]!, Math.max(5, Math.min(14, (ats[cur]! - ats[cur - 1]!) * 0.6)), Easing.bezier(0.6, 0, 0.3, 1));
          return k < 1 ? page(pages[cur - 1], { transformOrigin: '50% 0%', transform: `rotateX(${k * 120}deg)`, opacity: 1 - Math.max(0, k - 0.7) * 3 }) : null;
        })()}
      </div>
      {!s.notesOff &&
        notes.map(({ p, i }, j) => {
          const a = ats[i]! + 4;
          const sp = spring({ frame: f - a, fps, config: { damping: 12, stiffness: 150 } });
          // Scattered on a loose grid right of the calendar, so they pile up without hiding each other.
          const slot = NOTE_SLOTS[j % NOTE_SLOTS.length]!;
          const below = cy + CH - (CH * (1 - kc)) / 2 + 30;
          const nw = A.wide ? 300 : Math.min(300, A.width / 2 - 30);
          const x = A.wide ? slot[0] + (hash(i, 2) - 0.5) * 50 : A.left + (j % 2) * (A.width / 2) + (A.width / 2 - nw) / 2 + (hash(i, 2) - 0.5) * 30;
          const y = A.wide ? A.top + slot[1] * (A.height - 230) + (hash(i, 3) - 0.5) * 30 : below + (Math.floor(j / 2) % 3) * Math.max(60, (A.bottom - below - 200) / 2) + (hash(i, 3) - 0.5) * 20;
          return (
            <div key={i} style={{ position: 'absolute', left: x, top: y, width: nw, minHeight: A.wide ? 200 : 170, padding: 22, boxSizing: 'border-box', background: ['#ffe680', '#ffd1dc', '#c9f2ff', '#d6f5c9'][i % 4], fontFamily: hand, fontSize: 32, lineHeight: 1.2, color: '#3a2f12', rotate: `${(hash(i, 4) - 0.5) * 22 + (1 - sp) * 20}deg`, scale: `${1.4 - 0.4 * sp}`, opacity: Math.min(1, sp * 2), boxShadow: '0 14px 26px -10px rgba(0,0,0,0.45)', zIndex: 10 + j }}>
              {p.note}
            </div>
          );
        })}
      {s.pileLabel && notes.length > 2 && (
        <div style={{ position: 'absolute', right: A.W - A.right, top: A.top, zIndex: 100 }}>
          <Label text={s.pileLabel.replace('{n}', String(notes.length))} at={ats[notes[2]!.i]!} size={28} rule={false} color={P.warn} />
        </div>
      )}
      {s.cast && <CastLayer cast={s.cast} t={t} floor={A.bottom - 10} />}
    </>
  );
};

/* ================================================================== lanes */

// lanes: items ride a conveyor through a scanner and are sorted into lanes.
//   { type: "lanes", source?, scanner?: { label }, lanes: [{ label, tone? }],
//     items: [{ label, emoji?, lane, score?, at? }], travel? (frames, default 54) }

export const Lanes: React.FC<S> = ({ s, t }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const A = useArea(90);
  const cue = useCues(t);
  const lanes: any[] = s.lanes ?? [];
  const items: any[] = s.items ?? [];
  const def = spreadCues(t, items.length, 12);
  const ats = items.map((it, i) => cue(it.at, def[i] ?? 12));
  // Geometry in (u, v): u runs along the flow, v across it. 16:9 flows left to right; 9:16 and
  // 1:1 flow top to bottom with the lanes as bins along the bottom.
  const W = A.wide;
  const M = (u: number, v: number) => (W ? { x: u, y: v } : { x: v, y: u });
  const head = s.headline ? (W ? 0 : 130) : 0;
  const mid = W ? A.cy : A.cx;
  const scan = W ? 760 : A.top + head + (A.bottom - A.top - head) * 0.3;
  const end = W ? 1560 : A.bottom - 120;
  const start = W ? -170 : -170;
  const BIG = W ? 1.25 : 1.1;
  const END = W ? 1 : 0.8;
  const binW = W ? 300 : Math.min(300, A.width / Math.max(1, lanes.length) - 18);
  const laneV = lanes.map((_, i) =>
    W
      ? lanes.length === 1
        ? mid
        : A.top + 80 + ((A.height - 160) * i) / Math.max(1, lanes.length - 1)
      : A.left + (A.width * (i + 0.5)) / Math.max(1, lanes.length),
  );
  const bend = W ? 300 : Math.min(300, (end - scan) * 0.45);
  const travel = s.travel ?? 54;
  const counts = lanes.map(() => 0);
  const bag = (it: any, u: number, v: number, key: number, scale = 1, glow = 0) => {
    const { x, y } = M(u, v);
    return (
      <div key={key} style={{ position: 'absolute', left: x - 110 * scale, top: y - 60 * scale, width: 220 * scale, height: 120 * scale, zIndex: 20 }}>
        <div style={{ position: 'absolute', left: '35%', right: '35%', top: -18 * scale, height: 26 * scale, border: `${6 * scale}px solid #3a3f47`, borderBottom: 'none', borderRadius: '14px 14px 0 0' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 18 * scale, background: mixHex(P.surface, P.fill, 0.15), border: `3px solid ${mixHex(P.cardBorder, P.ink, 0.2)}`, boxShadow: `0 14px 26px -12px rgba(0,0,0,0.5)${glow ? `, 0 0 0 ${6 * glow}px ${alpha(P.fill, 0.5 * glow)}` : ''}`, display: 'flex', alignItems: 'center', gap: 10 * scale, padding: `0 ${14 * scale}px`, boxSizing: 'border-box' }}>
          {it.emoji && <Emoji name={it.emoji} size={52 * scale} />}
          <div style={{ fontFamily: T.ui, fontWeight: 750, fontSize: 23 * scale, color: P.ink, lineHeight: 1.15 }}>{it.label}</div>
        </div>
      </div>
    );
  };
  const belt = W
    ? { left: 0, width: scan + 60, top: mid + 50, height: 36, backgroundImage: 'repeating-linear-gradient(90deg, #3a3f47 0 30px, #2b2f36 30px 60px)', backgroundPosition: `${f * 4}px 0` }
    : { left: mid - 150, width: 300, top: 0, height: scan + 40, opacity: 0.55, backgroundImage: 'repeating-linear-gradient(180deg, #3a3f47 0 30px, #2b2f36 30px 60px)', backgroundPosition: `0 ${f * 4}px` };
  const curve = (v: number) => {
    const a = M(scan + 80, mid);
    const c1 = M(scan + bend, mid);
    const c2 = M(scan + bend, v);
    const e = M(end - (W ? 130 : 95), v);
    return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${e.x} ${e.y}`;
  };
  const arch = M(scan, mid);
  return (
    <>
      {/* conveyor */}
      <div style={{ position: 'absolute', background: '#2b2f36', borderRadius: 8, ...belt }} />
      {lanes.map((ln, i) => {
        const c = ln.tone ? toneColor(ln.tone, P) : P.accent;
        const bin = M(end + (W ? 20 : 0), laneV[i]!);
        const bh = W ? 170 : 190;
        return (
          <div key={i}>
            <svg width={A.W} height={A.H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <path d={curve(laneV[i]!)} fill="none" stroke={alpha(c, 0.35)} strokeWidth={26} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', left: bin.x - binW / 2, top: bin.y - bh / 2, width: binW, height: bh, borderRadius: 22, border: `4px dashed ${c}`, background: alpha(c, 0.08), boxSizing: 'border-box' }} />
            <div style={{ position: 'absolute', left: bin.x - binW / 2 - 20, top: bin.y + bh / 2 + 9, width: binW + 40, textAlign: 'center', fontFamily: T.mono, fontWeight: 700, fontSize: W ? 26 : 24, letterSpacing: 2, color: c, textTransform: 'uppercase' }}>{ln.label}</div>
          </div>
        );
      })}
      {/* scanner arch */}
      {W ? (
        <div style={{ position: 'absolute', left: arch.x - 70, top: arch.y - 170, width: 180, height: 270, border: `16px solid ${mixHex(P.surface, P.ink, 0.25)}`, borderBottom: 'none', borderRadius: '30px 30px 0 0', boxShadow: `0 0 40px ${alpha(P.fill, 0.35)}`, zIndex: 25 }} />
      ) : (
        <div style={{ position: 'absolute', left: arch.x - 180, top: arch.y - 100, width: 360, height: 200, border: `16px solid ${mixHex(P.surface, P.ink, 0.25)}`, borderTop: 'none', borderBottom: 'none', borderRadius: 30, boxShadow: `0 0 40px ${alpha(P.fill, 0.35)}`, zIndex: 25 }} />
      )}
      <div style={{ position: 'absolute', left: W ? arch.x - 70 : arch.x + 190, top: W ? arch.y - 220 : arch.y - 16, width: 180, textAlign: W ? 'center' : 'left', fontFamily: T.mono, fontSize: 22, fontWeight: 700, letterSpacing: 3, color: P.accent, zIndex: 26 }}>{s.scanner?.label ?? 'SCAN'}</div>
      {s.source && W && <div style={{ position: 'absolute', left: A.left, top: mid + 110, fontFamily: T.mono, fontSize: 24, letterSpacing: 2, color: P.muted, textTransform: 'uppercase' }}>{s.source}</div>}
      {items.map((it, i) => {
        const a = ats[i]!;
        if (f < a) return null;
        const d = f - a;
        const toScan = travel * 0.45;
        const hold = 12;
        const lane = Math.max(0, Math.min(lanes.length - 1, it.lane ?? 0));
        const lv = laneV[lane]!;
        const slot = counts[lane]!;
        counts[lane]! += 1;
        if (d < toScan) {
          const k = interpolate(d, [0, toScan], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.3, 1) });
          return bag(it, start + (scan + 20 - start) * k, mid, i, BIG);
        }
        if (d < toScan + hold) {
          const sk = (d - toScan) / hold;
          const tone = lanes[lane]?.tone;
          const sc = M(scan, mid);
          return (
            <div key={i}>
              {bag(it, scan + 20, mid, i, BIG, 1 - Math.abs(sk - 0.5) * 2)}
              {it.score !== undefined && (
                <div style={{ position: 'absolute', left: W ? sc.x - 20 : sc.x + 150, top: W ? sc.y - 140 : sc.y - 120, zIndex: 30, padding: '6px 16px', borderRadius: 999, background: tone ? toneColor(tone, P) : P.fill, color: '#fff', fontFamily: T.mono, fontWeight: 800, fontSize: 28, scale: `${ease(f, a + toScan, 6, BACK)}` }}>{it.score}</div>
              )}
              {W ? (
                <div style={{ position: 'absolute', left: sc.x - 54, top: sc.y - 154 + sk * 230, width: 148, height: 6, background: P.fill, boxShadow: `0 0 20px ${P.fill}`, zIndex: 27 }} />
              ) : (
                <div style={{ position: 'absolute', left: sc.x - 160 + sk * 320, top: sc.y - 90, width: 6, height: 180, background: P.fill, boxShadow: `0 0 20px ${P.fill}`, zIndex: 27 }} />
              )}
            </div>
          );
        }
        const k = interpolate(d, [toScan + hold, travel + hold], [0, 1], { ...clamp, easing: Easing.bezier(0.4, 0, 0.2, 1) });
        // Along the cubic to the lane, then settle into the bin, a little stacked.
        const u0 = scan + 80;
        const u3 = W ? end + 20 + (slot % 3) * 12 : end - 4 - Math.min(4, slot) * 9;
        const v3 = W ? lv - 4 - Math.min(4, slot) * 9 : lv + ((slot % 3) - 1) * 10;
        const q = 1 - k;
        const u = q * q * q * u0 + 3 * q * q * k * (scan + bend) + 3 * q * k * k * (scan + bend) + k * k * k * u3;
        const v = q * q * q * mid + 3 * q * q * k * mid + 3 * q * k * k * lv + k * k * k * v3;
        return bag(it, u, v, i, BIG - (BIG - END) * k);
      })}
      {lanes.map((ln, i) => {
        const n = items.filter((it, j) => (it.lane ?? 0) === i && f >= ats[j]! + travel + 12).length;
        if (!n) return null;
        const p = W ? { x: end + 190 + 34, y: laneV[i]! } : { x: laneV[i]! + binW / 2 - 20, y: end - 95 - 14 };
        return (
          <div key={`n${i}`} style={{ position: 'absolute', left: p.x - 34, top: p.y - 34, width: 68, height: 68, borderRadius: '50%', background: ln.tone ? toneColor(ln.tone, P) : P.fill, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: T.display, fontWeight: 800, fontSize: 34, zIndex: 40 }}>{ln.counts?.[n - 1] ?? n}</div>
        );
      })}
      {s.cast && <CastLayer cast={s.cast} t={t} floor={A.bottom - 10} />}
      {s.headline && (
        <div style={{ position: 'absolute', left: A.left, top: A.top, width: W ? 640 : A.width, zIndex: 50 }}>
          <Line text={s.headline.text ?? s.headline} accent={s.headline.accent} at={cue(s.headline.at, 4)} size={W ? fitText(s.headline.text ?? s.headline, 900, 64, T, 40) : fitWrap(s.headline.text ?? s.headline, A.width, 60, T, 36)} />
        </div>
      )}
    </>
  );
};

export { Character };

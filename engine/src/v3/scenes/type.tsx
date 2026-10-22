import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { spreadCues } from '../../cues.mjs';
import { alpha, hash, mixHex, noise, useTrailer, usePal, useTheme } from '../../theme';
import { BACK, Emoji, Fit, Label, Line, NameLockup, RepoPill, Stamp, clamp, ease, fitText, fitWrap, halfProbe, linkText, useArea, useCues, useNameSize } from '../prims';
import type { TimelineScene } from '../../types';

type S = { s: any; t: TimelineScene };

/* ================================================================== kinetic */

// kinetic: big type, one idea at a time (at most ~5 words on screen), every entrance has an exit.
//   { type: "kinetic", layout?: center | left | stack, size?, beats: [{
//       text, accent? (word or words), fx?: rise | mask | punch | blur | stamp | type | split | swap | count,
//       at?, until?, sub?, size?, swap?: [words] (fx swap: replaces "{}" in text in turn),
//       count?: { from, to, prefix?, suffix?, decimals? } (fx count: the number, text is its label),
//       color?: accent | warn | ink }] }

const isAcc = (word: string, accent?: string) => {
  if (!accent) return false;
  const w = word.toLowerCase().replace(/[^a-z0-9%$]/g, '');
  return accent
    .toLowerCase()
    .split(/\s+/)
    .some((a) => {
      const x = a.replace(/[^a-z0-9%$]/g, '');
      return x.length > 0 && (w === x || (x.length >= 4 && w.startsWith(x)));
    });
};

const Beat: React.FC<{ b: any; at: number; until?: number; size: number; align: 'left' | 'center'; motif: string }> = ({ b, at, until, size, align, motif }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useTheme();
  const P = usePal();
  if (f < at - 1 || (until !== undefined && f > until + 9)) return null;
  const out = until !== undefined ? ease(f, until, 7, Easing.in(Easing.quad)) : 0;
  const fx = b.fx ?? 'rise';
  const base: CSSProperties = {
    fontFamily: T.display,
    fontWeight: T.displayWeight,
    fontSize: size,
    lineHeight: 1.02,
    letterSpacing: size * T.tracking,
    textTransform: T.upper ? 'uppercase' : 'none',
    color: b.color === 'warn' ? P.warn : b.color === 'accent' ? P.accent : P.ink,
    textAlign: align,
    opacity: 1 - out,
    translate: `0 ${-out * 40}px`,
    filter: out > 0 ? `blur(${out * 8}px)` : undefined,
  };
  const words = String(b.text ?? '').split(/\s+/).filter(Boolean);
  const accColor = P.accent;
  const marker = (k: number): ReactNode =>
    motif === 'highlighter' ? <span style={{ position: 'absolute', left: -size * 0.06, width: `calc(${k * 100}% + ${size * 0.12}px)`, top: '20%', height: '70%', background: alpha(P.fill, 0.3), transform: 'skewX(-8deg)', zIndex: -1, borderRadius: 6 }} /> : null;
  const wordSpan = (w: string, i: number, style: CSSProperties = {}) => {
    const acc = isAcc(w, b.accent);
    return (
      <span key={i} style={{ position: 'relative', display: 'inline-block', whiteSpace: 'pre', color: acc ? accColor : undefined, zIndex: 0, ...style }}>
        {acc && marker(ease(f, at + 10, 14))}
        {w}
      </span>
    );
  };
  let body: ReactNode = null;
  switch (fx) {
    case 'mask': {
      const k = ease(f, at, 16, Easing.bezier(0.65, 0, 0.35, 1));
      body = (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{ clipPath: `inset(-10% ${(1 - k) * 100}% -10% 0)`, display: 'flex', flexWrap: 'wrap', columnGap: size * 0.26, justifyContent: align === 'center' ? 'center' : 'flex-start' }}>{words.map((w, i) => wordSpan(w, i))}</div>
          {k < 1 && <div style={{ position: 'absolute', top: '-6%', bottom: '-6%', left: `${k * 100}%`, width: size * 0.12, background: P.fill }} />}
        </div>
      );
      break;
    }
    case 'punch': {
      const sp = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 260 } });
      const shake = Math.max(0, 1 - (f - at - 4) / 10) * (f >= at + 3 ? 1 : 0) * (8 + 12 * T.M.shake);
      body = (
        <div style={{ scale: `${1.7 - 0.7 * sp}`, filter: sp < 0.9 ? `blur(${(1 - sp) * 14}px)` : undefined, opacity: Math.min(1, sp * 2), translate: `${noise(f * 1.7, 2) * shake}px ${noise(f * 1.7, 5) * shake}px`, display: 'flex', flexWrap: 'wrap', columnGap: size * 0.26, justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
          {words.map((w, i) => wordSpan(w, i))}
        </div>
      );
      break;
    }
    case 'blur':
      body = (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', columnGap: size * 0.26 }}>
          {words.map((w, i) => {
            const k = ease(f, at + i * 3, 18);
            return wordSpan(w, i, { opacity: k, filter: k < 0.98 ? `blur(${(1 - k) * 18}px)` : undefined, letterSpacing: `${(1 - k) * size * 0.2}px`, scale: `${1.08 - 0.08 * k}` });
          })}
        </div>
      );
      break;
    case 'stamp':
      body = <Stamp text={b.text} at={at} size={size * 0.8} color={b.color === 'warn' ? P.warn : b.color === 'ink' ? P.ink : P.accent} rotate={b.rotate ?? -5} />;
      break;
    case 'type': {
      const text = String(b.text);
      const n = Math.max(0, Math.min(text.length, Math.floor((f - at) / 1.5)));
      const typing = n < text.length;
      body = (
        <div style={{ whiteSpace: 'pre-wrap', fontFamily: b.mono ? T.mono : T.display }}>
          {text.slice(0, n)}
          <span style={{ display: 'inline-block', width: size * 0.45, height: size * 0.82, background: P.fill, verticalAlign: '-0.08em', marginLeft: size * 0.05, opacity: typing || Math.floor(f / 8) % 2 === 0 ? 1 : 0 }} />
          <span style={{ visibility: 'hidden' }}>{text.slice(n)}</span>
        </div>
      );
      break;
    }
    case 'split': {
      const k = ease(f, at, 18);
      const half = (top: boolean) => (
        <div style={{ position: top ? 'relative' : 'absolute', inset: top ? undefined : 0, clipPath: top ? 'inset(0 0 50% 0)' : 'inset(50% 0 0 0)', translate: `${(1 - k) * (top ? -1 : 1) * size * 1.8}px 0`, display: 'flex', flexWrap: 'wrap', columnGap: size * 0.26, justifyContent: align === 'center' ? 'center' : 'flex-start' }}>{words.map((w, i) => wordSpan(w, i))}</div>
      );
      body = (
        <div style={{ position: 'relative', opacity: Math.min(1, k * 1.5) }}>
          {half(true)}
          {half(false)}
        </div>
      );
      break;
    }
    case 'swap': {
      const list: string[] = b.swap ?? [];
      const span = Math.max(12, ((until ?? at + 90) - at) / Math.max(1, list.length));
      const idx = Math.min(list.length - 1, Math.max(0, Math.floor((f - at) / span)));
      const local = f - at - idx * span;
      const roll = ease(f, at + idx * span, 8, BACK);
      const [pre, post] = String(b.text).split('{}');
      body = (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', columnGap: size * 0.26, alignItems: 'baseline' }}>
          {(pre ?? '').trim() && <Line text={(pre ?? '').trim()} at={at} size={size} style={{ display: 'inline-flex' }} />}
          <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: size * 0.1 }}>
            <span style={{ display: 'inline-block', color: accColor, translate: `0 ${(1 - roll) * 100}%`, scale: `${1 + Math.max(0, 1 - local / 6) * 0.08 * Math.min(idx, 3)}` }}>{list[idx]}</span>
          </span>
          {(post ?? '').trim() && <span>{post}</span>}
        </div>
      );
      break;
    }
    case 'count': {
      const c = b.count ?? { from: 0, to: 100 };
      const v = (c.from ?? 0) + ((c.to ?? 0) - (c.from ?? 0)) * ease(f, at + 4, c.dur ?? 34, Easing.bezier(0.16, 1, 0.3, 1));
      const d = c.decimals ?? 0;
      const num = `${c.prefix ?? ''}${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}${c.suffix ?? ''}`;
      body = (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start' }}>
          <div style={{ fontSize: size * 1.5, color: c.tone === 'warn' ? P.warn : P.accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{num}</div>
          {b.text && <Line text={b.text} at={at + 8} size={size * 0.42} font="ui" weight={600} align={align} color={P.muted} style={{ marginTop: size * 0.18, textTransform: 'none' }} />}
        </div>
      );
      break;
    }
    default:
      body = (
        <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: size * 0.26, justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
          {words.map((w, i) => {
            const k = ease(f, at + i * 3 * T.M.stagger, 14);
            return (
              <span key={i} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.12, marginBottom: -size * 0.12 }}>
                {wordSpan(w, i, { translate: `0 ${(1 - k) * 110}%`, rotate: `${(1 - k) * 4}deg` })}
              </span>
            );
          })}
        </div>
      );
  }
  return (
    <div style={base}>
      {body}
      {b.sub && <div style={{ fontFamily: T.ui, fontWeight: 500, fontSize: Math.max(32, size * 0.24), letterSpacing: 0, textTransform: 'none', color: P.muted, marginTop: size * 0.22, opacity: ease(f, at + 14, 14) }}>{b.sub}</div>}
    </div>
  );
};

export const Kinetic: React.FC<S> = ({ s, t }) => {
  const T = useTheme();
  const A = useArea(140);
  const cue = useCues(t);
  const beats: any[] = s.beats ?? [];
  const def = spreadCues(t, beats.length, 6);
  const layout = s.layout ?? 'center';
  const align = layout === 'center' ? 'center' : 'left';
  const ats = beats.map((b, i) => cue(b.at, Math.max(2, (def[i] ?? 6) - 3)));
  const stack = layout === 'stack';
  // The probe is the first ~18 characters (16:9) or ~11 (9:16, about 3 words a line); no word may be wider than the area.
  const probeLen = A.portrait ? 11 : A.square ? 14 : 18;
  const sizes = beats.map((b) => {
    if (b.size) return b.size;
    const text = b.fx === 'count' ? '0000' : String(b.text ?? '').replace('{}', (b.swap ?? [''])[0]);
    const probe = text.split(/\s+/).reduce((a: string, w: string) => (a.length > probeLen ? a : `${a} ${w}`), '') || 'X';
    const max = s.size ?? (stack ? 120 : A.portrait ? 150 : 180);
    // 9:16 and 1:1 size the type to about 77% of the safe width, so a line never runs edge to edge.
    const fitW = A.wide ? A.width : A.width * 0.77;
    return b.fx === 'count' || b.fx === 'stamp' ? fitText(probe, A.width * (b.fx === 'stamp' ? 0.8 : 0.66), max, T, 48) : fitWrap(text, fitW, max, T, A.portrait ? 48 : 56, probe);
  });
  if (stack) {
    let y = A.top + 40;
    return (
      <>
        {beats.map((b, i) => {
          const top = y;
          y += sizes[i]! * 1.15 + (b.sub ? 60 : 10);
          return (
            <div key={i} style={{ position: 'absolute', left: A.left, width: A.width, top }}>
              <Beat b={b} at={ats[i]!} until={b.until !== undefined ? cue(b.until, t.duration) : undefined} size={sizes[i]!} align="left" motif={T.motif} />
            </div>
          );
        })}
      </>
    );
  }
  return (
    <>
      {beats.map((b, i) => {
        const until = b.until !== undefined ? cue(b.until, t.duration) : i + 1 < beats.length ? ats[i + 1]! - 6 : undefined;
        return (
          <AbsoluteFill key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start', padding: `${A.top}px ${A.W - A.right}px ${A.H - A.bottom}px ${A.left}px` }}>
            <div style={{ width: A.width }}>
              <Beat b={b} at={ats[i]!} until={until} size={sizes[i]!} align={align} motif={T.motif} />
            </div>
          </AbsoluteFill>
        );
      })}
    </>
  );
};

/* ================================================================== title */

// title: an opening (or chapter) card in one of several layouts.
//   { type: "title", layout: card | slate | broadcast | stamp | marquee | hud,
//     eyebrow?, title, accent?, sub?, at?,
//     fields?: [{ k, v }] (slate), bug?: "LIVE" (broadcast), channel?, stamp?: text (stamp),
//     lines?: [text] (hud boot lines) }

export const Title: React.FC<S> = ({ s, t }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useTheme();
  const P = usePal();
  const A = useArea(140);
  const cue = useCues(t);
  const at = cue(s.at, 6);
  const layout = s.layout ?? 'card';
  const title: string = s.title ?? '';
  const size = s.size ?? fitWrap(title, A.width * (layout === 'broadcast' ? (A.portrait ? 0.9 : 0.62) : 0.9), A.portrait ? 150 : 170, T, A.portrait ? 48 : 60, A.portrait && title.length > 12 ? halfProbe(title) : undefined);

  if (layout === 'slate') {
    const W = 1240;
    const H = 700;
    const clap = ease(f, at + 12, 6, Easing.in(Easing.quad));
    const fields: any[] = s.fields ?? [];
    const k = Math.min(1, A.width / W, (A.height - 20) / (H + 110));
    const top = A.cy - (H * k) / 2 + 30 * k + 55 * k;
    return (
      <div style={{ position: 'absolute', left: A.cx - W / 2, top, width: W, height: H, scale: k < 1 ? `${k}` : undefined, transformOrigin: '50% 0%', translate: `0 ${(1 - ease(f, at - 6, 16)) * 80}px`, rotate: `${-1.5 + noise(f / 30, 2) * 0.4}deg` }}>
        <div style={{ position: 'absolute', left: 0, top: -110, width: W, height: 100, transformOrigin: '0% 100%', rotate: `${-20 * (1 - clap)}deg`, background: `repeating-linear-gradient(-55deg, #111 0 70px, #f4f4f0 70px 140px)`, borderRadius: 12, border: '6px solid #111' }} />
        <div style={{ position: 'absolute', left: 0, top: -6, width: W, height: 100, background: `repeating-linear-gradient(55deg, #111 0 70px, #f4f4f0 70px 140px)`, borderRadius: 12, border: '6px solid #111' }} />
        <div style={{ position: 'absolute', left: 0, top: 104, width: W, height: H - 104, background: '#1a1a1a', borderRadius: 16, border: '6px solid #111', padding: 40, boxSizing: 'border-box', fontFamily: T.mono, color: '#f4f4f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto 1fr', gap: 18 }}>
          <div style={{ gridColumn: '1 / 3', borderBottom: '3px solid #f4f4f0', paddingBottom: 18 }}>
            <div style={{ fontSize: 24, letterSpacing: 6, opacity: 0.7 }}>{s.eyebrow ?? 'PROD.'}</div>
            <div style={{ fontFamily: T.display, fontWeight: T.displayWeight, fontSize: Math.min(110, size), lineHeight: 1.05, marginTop: 8, textTransform: T.upper ? 'uppercase' : 'none' }}>{title}</div>
          </div>
          {fields.map((fl, i) => (
            <div key={i} style={{ borderRight: i % 2 === 0 ? '3px solid #f4f4f0' : undefined, paddingRight: 20, opacity: ease(f, at + 4 + i * 3, 10) }}>
              <div style={{ fontSize: 22, letterSpacing: 5, opacity: 0.6 }}>{fl.k}</div>
              <div style={{ fontSize: 46, fontWeight: 700, marginTop: 6 }}>{fl.v}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layout === 'broadcast') {
    const bar = ease(f, at, 16, Easing.bezier(0.65, 0, 0.35, 1));
    const pulse = (Math.sin(f / 5) + 1) / 2;
    const y = A.bottom - 300;
    return (
      <>
        <div style={{ position: 'absolute', left: A.left, top: A.top, display: 'flex', gap: 12, opacity: ease(f, at - 4, 8) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: '#d11a2a', color: '#fff', fontFamily: T.display, fontWeight: 800, fontSize: 30, letterSpacing: 3, borderRadius: 6 }}>
            <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', opacity: 0.4 + 0.6 * pulse }} />
            {s.bug ?? 'LIVE'}
          </div>
          {s.channel && <div style={{ padding: '10px 18px', background: alpha('#000000', 0.6), color: '#fff', fontFamily: T.mono, fontSize: 26, borderRadius: 6 }}>{s.channel}</div>}
        </div>
        <div style={{ position: 'absolute', left: A.left, top: y, width: A.width * (A.portrait ? 1 : 0.82) }}>
          <div style={{ display: 'inline-block', padding: '10px 26px', background: P.fill, color: P.onFill, fontFamily: T.mono, fontWeight: 700, fontSize: 28, letterSpacing: 4, textTransform: 'uppercase', clipPath: `inset(0 ${(1 - bar) * 100}% 0 0)` }}>{s.eyebrow ?? 'Breaking'}</div>
          <div style={{ background: P.dark ? '#f4f4f0' : '#111111', padding: '18px 34px 22px', clipPath: `inset(0 ${(1 - ease(f, at + 5, 16, Easing.bezier(0.65, 0, 0.35, 1))) * 100}% 0 0)` }}>
            <div style={{ fontFamily: T.display, fontWeight: T.displayWeight, fontSize: size * 0.72, lineHeight: 1.05, letterSpacing: size * T.tracking * 0.7, color: P.dark ? '#111111' : '#f4f4f0', textTransform: T.upper ? 'uppercase' : 'none' }}>{title}</div>
          </div>
          {s.sub && <div style={{ display: 'inline-block', background: alpha(P.dark ? '#000000' : '#ffffff', 0.85), color: P.ink, padding: '10px 26px', fontFamily: T.ui, fontSize: 30, fontWeight: 600, clipPath: `inset(0 ${(1 - ease(f, at + 10, 16)) * 100}% 0 0)` }}>{s.sub}</div>}
        </div>
      </>
    );
  }

  if (layout === 'stamp') {
    return (
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: A.H - A.bottom, paddingTop: A.top, paddingLeft: A.left, paddingRight: A.W - A.right }}>
        {s.eyebrow && <Label text={s.eyebrow} at={at - 2} rule={false} size={26} style={{ marginBottom: 30, color: P.muted }} />}
        <Line text={title} accent={s.accent} at={at + 2} size={size * 0.85} align="center" maxWidth={A.width} />
        {s.sub && <div style={{ fontFamily: T.ui, fontSize: 36, color: P.muted, marginTop: 26, maxWidth: A.width, textAlign: 'center', opacity: ease(f, at + 14, 14) }}>{s.sub}</div>}
        {s.stamp && (
          <div style={{ marginTop: 46 }}>
            <Stamp text={s.stamp} at={cue(s.stampAt, at + 26)} size={72} rotate={-6} />
          </div>
        )}
      </AbsoluteFill>
    );
  }

  if (layout === 'marquee') {
    const W = Math.min(1500, A.width + 40);
    const H = A.portrait ? Math.min(760, A.height - 20) : 560;
    const x0 = A.cx - W / 2;
    const y0 = A.cy - H / 2;
    const n = 44;
    const per = (2 * (W + H)) / n;
    const bulbs: ReactNode[] = [];
    for (let i = 0; i < n; i += 1) {
      let d = i * per;
      let x = 0;
      let y = 0;
      if (d < W) [x, y] = [d, 0];
      else if ((d -= W) < H) [x, y] = [W, d];
      else if ((d -= H) < W) [x, y] = [W - d, H];
      else [x, y] = [0, H - (d - W)];
      const on = (i + Math.floor(f / 3)) % 3 === 0;
      bulbs.push(<div key={i} style={{ position: 'absolute', left: x0 + x - 11, top: y0 + y - 11, width: 22, height: 22, borderRadius: '50%', background: on ? '#fff6c2' : '#7a5a1a', boxShadow: on ? '0 0 18px 6px rgba(255,220,120,0.7)' : undefined, opacity: ease(f, at - 6 + i * 0.3, 6) }} />);
    }
    const sp = spring({ frame: f - at - 6, fps, config: { damping: 10, stiffness: 160 } });
    return (
      <>
        <div style={{ position: 'absolute', left: x0, top: y0, width: W, height: H, borderRadius: 30, background: `radial-gradient(ellipse at 50% 40%, ${alpha(P.fill, 0.35)}, ${alpha(P.fill, 0.05)} 70%)`, border: `6px solid ${alpha(P.fill, 0.8)}` }} />
        {bulbs}
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', top: y0, height: H, left: x0, width: W }}>
          {s.eyebrow && <Label text={s.eyebrow} at={at} rule={false} size={28} style={{ marginBottom: 18 }} />}
          <div style={{ scale: `${sp}`, fontFamily: T.display, fontWeight: T.displayWeight, fontSize: size * 0.8, color: P.ink, textAlign: 'center', lineHeight: 1.02, textTransform: T.upper ? 'uppercase' : 'none', textShadow: `0 6px 0 ${alpha(P.fill, 0.6)}`, maxWidth: W - 120 }}>{title}</div>
          {s.sub && <div style={{ fontFamily: T.ui, fontWeight: 700, fontSize: 38, marginTop: 22, color: P.accent, opacity: ease(f, at + 16, 10) }}>{s.sub}</div>}
        </AbsoluteFill>
      </>
    );
  }

  if (layout === 'hud') {
    const lines: string[] = s.lines ?? [];
    const corner = (x: number, y: number, r: number) => <div key={`${x}${y}`} style={{ position: 'absolute', left: x, top: y, width: 70, height: 70, borderTop: `4px solid ${P.fill}`, borderLeft: `4px solid ${P.fill}`, rotate: `${r}deg`, opacity: ease(f, at - 6, 10) }} />;
    let tAt = at;
    return (
      <>
        <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(0deg, ${alpha(P.fill, 0.06)} 0 2px, transparent 2px 6px)` }} />
        {corner(A.left, A.top, 0)}
        {corner(A.right - 70, A.top, 90)}
        {corner(A.right - 70, A.bottom - 70, 180)}
        {corner(A.left, A.bottom - 70, 270)}
        <div style={{ position: 'absolute', left: A.left + (A.wide ? 80 : 40), top: A.top + (A.wide ? 80 : 50), width: A.width - (A.wide ? 160 : 80), fontFamily: T.mono, fontSize: A.wide ? 32 : 28, lineHeight: 1.6, color: P.accent }}>
          {lines.map((l, i) => {
            const st = tAt;
            tAt += l.length * 0.9 + 6;
            const n = Math.max(0, Math.min(l.length, Math.floor((f - st) / 0.9)));
            if (f < st) return null;
            return (
              <div key={i} style={{ whiteSpace: A.wide ? 'pre' : 'pre-wrap', opacity: i < lines.length - 1 && f > tAt + 30 ? 0.55 : 1 }}>
                {l.slice(0, n)}
                {n < l.length && <span style={{ background: P.fill, color: P.bg }}> </span>}
              </div>
            );
          })}
        </div>
        {title && (
          <div style={{ position: 'absolute', left: A.left + (A.wide ? 80 : 40), bottom: A.H - A.bottom + (A.wide ? 80 : 50), width: A.width - (A.wide ? 160 : 80) }}>
            {s.eyebrow && <Label text={s.eyebrow} at={tAt} size={24} />}
            <Line text={title} accent={s.accent} at={tAt + 4} size={Math.min(size, 120)} font="mono" weight={700} maxWidth={A.width - (A.wide ? 160 : 80)} style={{ marginTop: 14 }} />
          </div>
        )}
      </>
    );
  }

  // card
  const rule = ease(f, at, 22, Easing.bezier(0.65, 0, 0.35, 1));
  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: s.align === 'left' ? 'flex-start' : 'center', justifyContent: 'center', paddingLeft: A.left, paddingRight: A.W - A.right, paddingTop: A.top, paddingBottom: A.H - A.bottom }}>
      {s.eyebrow && <Label text={s.eyebrow} at={at - 2} size={26} />}
      <div style={{ height: 3, width: Math.min(600, A.width * 0.6) * rule, background: P.fill, margin: '28px 0' }} />
      <Line text={title} accent={s.accent} at={at + 2} size={size} align={s.align === 'left' ? 'left' : 'center'} maxWidth={A.width} />
      {s.sub && <div style={{ fontFamily: T.ui, fontWeight: 500, fontSize: 38, color: P.muted, marginTop: 30, maxWidth: Math.min(1300, A.width), textAlign: s.align === 'left' ? 'left' : 'center', opacity: ease(f, at + 14, 14) }}>{s.sub}</div>}
    </AbsoluteFill>
  );
};

/* ================================================================== outro */

// outro: the end card, in one of several layouts. Always the project name and the repo pill.
//   { type: "outro", layout: card | folder | scoreboard | ticket | certificate | cloche | calendar | chalk,
//     headline?: "Court adjourned.", tagline?, stamp?, day? (calendar), fields?: [{ k, v }] (ticket),
//     gate? (ticket: the big code on the stub, e.g. "v2"; none when unset),
//     at? (headline), nameAt?, repoAt? }
//   layout "packet" (optional): a seed packet. headline is its top label, emoji?: [names] fill the
//   illustration window, fields?: [{ k, v }] are the sowing notes, packetColor? (default the accent).

export const Outro: React.FC<S> = ({ s, t }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { config } = useTrailer();
  const T = useTheme();
  const P = usePal();
  const A = useArea(120);
  const cue = useCues(t);
  const layout = s.layout ?? 'card';
  const headAt = cue(s.at, 6);
  // card: the headline holds for at least HEAD_HOLD frames (1.5 s) before the name replaces it.
  // A name cued earlier than that (nameAt on a spoken word), or a scene too short for the
  // hold, keeps the headline on screen above the name instead.
  const HEAD_HOLD = 45;
  const cardHead = layout === 'card' && !!s.headline;
  const nameDefault = headAt + (s.headline ? (layout === 'folder' ? 50 : cardHead ? HEAD_HOLD + 6 : 26) : 4);
  const nameAt = cue(s.nameAt, cardHead && nameDefault > t.duration - 40 ? Math.max(headAt + 26, t.duration - 40) : nameDefault);
  const both = cardHead && nameAt - 6 - headAt < HEAD_HOLD;
  const repoAt = cue(s.repoAt, nameAt + 26);
  const tagline = s.tagline ?? config.tagline;
  const nameSize = useNameSize(Math.min(layout === 'card' || layout === 'chalk' ? 1500 : 1060, A.width), layout === 'card' ? 190 : 130);
  const headSize = s.headline ? fitWrap(s.headline, Math.min(1400, A.width), 110, T, A.portrait ? 44 : 50) : 0;
  const credit = config.credit?.text ? <div style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 28, letterSpacing: 2, color: P.muted, marginTop: 18, opacity: ease(f, repoAt + 8, 12), textAlign: 'center', maxWidth: A.width }}>{config.credit.text}</div> : null;
  const tagEl = tagline || credit ? (
    <>
      {tagline && <div style={{ fontFamily: T.ui, fontWeight: 500, fontSize: 38, color: P.muted, marginTop: 22, opacity: ease(f, nameAt + 14, 14), textAlign: 'center', maxWidth: Math.min(1300, A.width) }}>{tagline}</div>}
      {credit}
    </>
  ) : null;
  const head = s.headline ? <Line text={s.headline} accent={s.accent} at={headAt} size={headSize} align="center" until={layout === 'card' ? nameAt - 6 : undefined} /> : null;
  const headAbove = both ? <Line text={s.headline} accent={s.accent} at={headAt} size={Math.round(headSize * 0.62)} align="center" maxWidth={A.width} style={{ marginBottom: 26 }} /> : null;
  // Centred in the content area (not the frame): in 9:16 the safe area is off-centre (the
  // action rail on the right is wider), so a frame-centred card would cross into it.
  const center: CSSProperties = { position: 'absolute', left: A.left, width: A.width, top: A.top, height: A.height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };

  if (layout === 'folder') {
    const W = 1240;
    const H = 640;
    const close = ease(f, nameAt - 8, 18, Easing.bezier(0.65, 0, 0.35, 1));
    const manila = '#d9b26f';
    return (
      <div style={center}>
        <Fit w={W} h={H + 50} maxW={A.width} maxH={A.height - 160}>
        <div style={{ position: 'relative', top: 50, width: W, height: H, perspective: 2600, translate: `0 ${(1 - ease(f, 0, 18)) * 60}px` }}>
          <div style={{ position: 'absolute', left: 40, top: -50, width: 360, height: 70, background: mixHex(manila, '#000', 0.08), borderRadius: '16px 16px 0 0' }} />
          <div style={{ position: 'absolute', inset: 0, background: mixHex(manila, '#000', 0.12), borderRadius: 18, boxShadow: '0 40px 90px -30px rgba(0,0,0,0.6)' }} />
          {/* papers inside */}
          <div style={{ position: 'absolute', left: 60, top: 40, right: 60, bottom: 40, background: '#f7f3ea', borderRadius: 6, padding: 50, fontFamily: T.mono, color: '#2b2620', fontSize: 30, opacity: 1 - close }}>
            {s.headline && <div style={{ fontFamily: T.display, fontSize: headSize * 0.8, fontWeight: T.displayWeight }}>{s.headline}</div>}
          </div>
          {/* the front cover swings shut */}
          <div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 100%', transform: `rotateX(${(1 - close) * 78}deg)`, background: manila, borderRadius: 18, boxShadow: 'inset 0 0 0 3px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden' }}>
            <div style={{ position: 'absolute', left: 50, top: 40, fontFamily: T.mono, fontSize: 24, letterSpacing: 4, color: alpha('#2b2620', 0.7) }}>{s.caseLabel ?? 'CASE FILE'}</div>
            {close > 0.6 && <NameLockup at={nameAt + 6} size={Math.min(nameSize, 120)} color="#2b2620" />}
            <div style={{ position: 'absolute', right: 70, bottom: 60 }}>{s.stamp && <Stamp text={s.stamp} at={repoAt - 14} size={70} color="#b3261e" rotate={-9} />}</div>
          </div>
        </div>
        </Fit>
        {credit}
        <div style={{ marginTop: 40 }}>
          <RepoPill at={repoAt} size={30} />
        </div>
      </div>
    );
  }

  if (layout === 'scoreboard') {
    const name = config.projectName.toUpperCase();
    const cells = [...name];
    const cw = Math.min(70, (Math.min(1500, A.width) - 80) / Math.max(1, cells.length) - 6);
    return (
      <div style={center}>
        <div style={{ padding: '30px 40px 40px', background: '#0d0f12', borderRadius: 20, border: '6px solid #2a2f37', boxShadow: '0 40px 100px -30px rgba(0,0,0,0.7)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, color: '#ffcf33', fontSize: 30, letterSpacing: 6, marginBottom: 24 }}>
            <span style={{ opacity: ease(f, headAt, 8) }}>{s.bug ?? 'FINAL'}</span>
            <span style={{ opacity: ease(f, headAt + 4, 8) }}>{s.headline ?? ''}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {cells.map((ch, i) => {
              const st = nameAt + i * 1.5;
              const k = ease(f, st, 8);
              const flip = f < st + 8 ? String.fromCharCode(65 + Math.floor(hash(i, f) * 26)) : ch;
              return (
                <div key={i} style={{ width: cw, height: cw * 1.4, background: '#1b1f26', borderRadius: 6, display: 'grid', placeItems: 'center', fontFamily: T.display, fontWeight: 800, fontSize: cw * 0.9, color: ch === ' ' ? 'transparent' : '#f4f4f0', position: 'relative', overflow: 'hidden', opacity: f >= st - 6 ? 1 : 0.3 }}>
                  {f >= st ? flip : ''}
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: '#000' }} />
                  {k < 1 && f >= st && <div style={{ position: 'absolute', inset: 0, background: alpha('#ffffff', 0.08 * (1 - k)) }} />}
                </div>
              );
            })}
          </div>
        </div>
        {tagEl}
        <div style={{ marginTop: 34 }}>
          <RepoPill at={repoAt} size={30} />
        </div>
      </div>
    );
  }

  if (layout === 'ticket') {
    const W = 1400;
    const H = 520;
    const fields: any[] = s.fields ?? [{ k: 'PASSENGER', v: config.projectName }];
    const sp = spring({ frame: f - headAt, fps, config: { damping: 14, stiffness: 120 } });
    const url = linkText(config);
    return (
      <div style={center}>
        <Fit w={W} h={H} maxW={A.wide ? A.width : A.width - 48} maxH={A.height - 200}>
        <div style={{ display: 'flex', width: W, height: H, translate: `${(1 - sp) * 1400}px 0`, rotate: `${(1 - sp) * 6 - 1.5}deg`, filter: 'drop-shadow(0 40px 60px rgba(0,0,0,0.45))' }}>
          <div style={{ flex: 1, background: '#fbfaf6', borderRadius: '28px 0 0 28px', padding: '44px 54px', boxSizing: 'border-box', position: 'relative', color: '#1d1d1f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 24, letterSpacing: 5, color: P.fill }}>
              <span>{s.headline ?? 'BOARDING PASS'}</span>
              <span>✈</span>
            </div>
            <div style={{ marginTop: 26 }}>
              <NameLockup at={nameAt} size={Math.min(nameSize, 110)} color="#1d1d1f" align="left" />
            </div>
            <div style={{ display: 'flex', gap: 60, marginTop: 40 }}>
              {fields.map((fl, i) => (
                <div key={i} style={{ opacity: ease(f, nameAt + 10 + i * 4, 10) }}>
                  <div style={{ fontFamily: T.mono, fontSize: 20, letterSpacing: 4, color: '#8a8a8f' }}>{fl.k}</div>
                  <div style={{ fontFamily: T.ui, fontWeight: 700, fontSize: 34, marginTop: 6 }}>{fl.v}</div>
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', left: 54, bottom: 40, fontFamily: T.mono, fontSize: 28, color: '#1d1d1f', opacity: ease(f, repoAt, 10) }}>{url}</div>
          </div>
          <div style={{ width: 4, backgroundImage: 'repeating-linear-gradient(180deg, #fbfaf6 0 14px, transparent 14px 26px)' }} />
          <div style={{ width: 300, background: P.fill, borderRadius: '0 28px 28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, color: P.onFill }}>
            {s.gate ? (
              <>
                <div style={{ fontFamily: T.mono, fontSize: 22, letterSpacing: 4 }}>GATE</div>
                <div style={{ fontFamily: T.display, fontWeight: 800, fontSize: Math.min(72, 230 / Math.max(1, String(s.gate).length) + 20) }}>{s.gate}</div>
              </>
            ) : null}
            <div style={{ display: 'flex', gap: 3, height: 90 }}>
              {Array.from({ length: 30 }, (_, i) => (
                <div key={i} style={{ width: hash(i, 4) > 0.5 ? 5 : 2, background: P.onFill, opacity: 0.85 }} />
              ))}
            </div>
          </div>
        </div>
        </Fit>
        {tagEl}
      </div>
    );
  }

  if (layout === 'packet') {
    const W = 700;
    const H = 680;
    const pc: string = s.packetColor ?? P.fill;
    const paper = '#fbf6ea';
    const inkC = '#2a2418';
    const sp = spring({ frame: f - headAt, fps, config: { damping: 15, stiffness: 110 } });
    const emoji: string[] = s.emoji ?? ['seedling'];
    const fields: any[] = s.fields ?? [];
    return (
      <div style={center}>
        <Fit w={W} h={H} maxW={A.width} maxH={A.height - 140}>
        <div style={{ position: 'relative', width: W, height: H, translate: `0 ${(1 - sp) * 900}px`, rotate: `${(1 - sp) * -8 - 2}deg`, filter: 'drop-shadow(0 40px 60px rgba(0,0,0,0.35))' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 26, backgroundImage: `linear-gradient(135deg, ${paper} 25%, transparent 25%), linear-gradient(225deg, ${paper} 25%, transparent 25%)`, backgroundSize: '26px 26px', backgroundPosition: '0 0' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 13, bottom: 0, background: paper, borderRadius: '4px 4px 18px 18px', overflow: 'hidden', color: inkC, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', background: pc, color: P.onFill, textAlign: 'center', fontFamily: T.mono, fontSize: 24, letterSpacing: 6, padding: '18px 0 16px' }}>{s.headline ?? 'SEEDS'}</div>
            <div style={{ margin: '26px 0 0', width: W - 110, height: 210, borderRadius: 18, background: `linear-gradient(${mixHex(pc, '#ffffff', 0.82)}, ${mixHex(pc, '#ffffff', 0.62)})`, border: `3px solid ${alpha(inkC, 0.12)}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 24, paddingBottom: 18, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 46, background: '#8a6141' }} />
              {emoji.map((e, i) => {
                const k = spring({ frame: f - headAt - 12 - i * 5, fps, config: { damping: 11, stiffness: 160 } });
                return <div key={i} style={{ position: 'relative', scale: `${k}`, transformOrigin: '50% 100%' }}><Emoji name={e} size={140} /></div>;
              })}
            </div>
            <div style={{ marginTop: 26 }}>
              <NameLockup at={nameAt} size={Math.min(nameSize, 84)} color={inkC} />
            </div>
            {tagline && <div style={{ fontFamily: T.ui, fontSize: 28, lineHeight: 1.3, color: alpha(inkC, 0.72), textAlign: 'center', maxWidth: W - 120, marginTop: 14, opacity: ease(f, nameAt + 14, 12) }}>{tagline}</div>}
            <div style={{ display: 'flex', gap: 48, marginTop: 24 }}>
              {fields.map((fl, i) => (
                <div key={i} style={{ textAlign: 'center', opacity: ease(f, nameAt + 18 + i * 4, 10) }}>
                  <div style={{ fontFamily: T.mono, fontSize: 18, letterSpacing: 4, color: alpha(inkC, 0.55) }}>{fl.k}</div>
                  <div style={{ fontFamily: T.ui, fontWeight: 700, fontSize: 28, marginTop: 4 }}>{fl.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </Fit>
        {credit}
        <div style={{ marginTop: 34 }}>
          <RepoPill at={repoAt} size={30} />
        </div>
      </div>
    );
  }

  if (layout === 'certificate') {
    const W = 1300;
    const H = 660;
    return (
      <div style={center}>
        <Fit w={W} h={H} maxW={A.width} maxH={A.height - 40}>
        <div style={{ position: 'relative', width: W, height: H, background: '#fbf7ec', color: '#2a2418', border: `14px double ${mixHex(P.fill, '#2a2418', 0.3)}`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 40px 90px -30px rgba(0,0,0,0.55)', scale: `${0.92 + 0.08 * ease(f, 0, 18)}`, opacity: ease(f, 0, 12) }}>
          <div style={{ fontFamily: T.mono, fontSize: 24, letterSpacing: 8, color: alpha('#2a2418', 0.6) }}>{s.headline ?? 'CERTIFICATE OF TESTING'}</div>
          <div style={{ margin: '36px 0 20px' }}>
            <NameLockup at={nameAt} size={Math.min(nameSize, 116)} color="#2a2418" />
          </div>
          {tagline && <div style={{ fontFamily: T.ui, fontSize: 32, color: alpha('#2a2418', 0.7), opacity: ease(f, nameAt + 14, 12) }}>{tagline}</div>}
          <div style={{ marginTop: 40 }}>
            <RepoPill at={repoAt} size={28} />
          </div>
          <div style={{ position: 'absolute', right: 60, top: 60 }}>{s.stamp && <Stamp text={s.stamp} at={cue(s.stampAt, nameAt + 18)} size={92} color={mixHex('#16a34a', '#000', 0.1)} rotate={12} />}</div>
        </div>
        </Fit>
        {credit}
      </div>
    );
  }

  if (layout === 'cloche') {
    const lift = ease(f, nameAt - 10, 22, Easing.bezier(0.5, 0, 0.2, 1));
    return (
      <div style={center}>
        {head && <div style={{ marginBottom: 20 }}>{head}</div>}
        <Fit w={1300} h={460} maxW={A.width} maxH={A.height - 260}>
        <div style={{ position: 'relative', width: 1300, height: 460 }}>
          <div style={{ position: 'absolute', left: 150, right: 150, bottom: 30, height: 70, borderRadius: '50%', background: 'linear-gradient(#e9edf2, #aab3be)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 90, display: 'flex', justifyContent: 'center', opacity: lift }}>
            <NameLockup at={nameAt} size={Math.min(nameSize, 120)} />
          </div>
          {Array.from({ length: 5 }, (_, i) => {
            const d = f - nameAt - i * 4;
            if (d < 0 || lift < 0.5) return null;
            return <div key={i} style={{ position: 'absolute', left: 520 + i * 60, bottom: 220 + (d % 50) * 4, width: 26, height: 70, borderRadius: 20, background: alpha('#ffffff', 0.35 * (1 - (d % 50) / 50)), filter: 'blur(8px)' }} />;
          })}
          <div style={{ position: 'absolute', left: 230, right: 230, bottom: 60, height: 340, translate: `${lift * 120}px ${-lift * 520}px`, rotate: `${lift * 18}deg`, opacity: 1 - Math.max(0, lift - 0.6) * 2.5 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '420px 420px 20px 20px', background: 'linear-gradient(135deg, #f4f6f9, #9aa5b2 70%, #c8d0da)', boxShadow: 'inset -30px -20px 60px rgba(0,0,0,0.2), 0 30px 50px -20px rgba(0,0,0,0.5)' }} />
            <div style={{ position: 'absolute', left: '50%', top: -36, width: 70, height: 44, translate: '-50% 0', borderRadius: '30px 30px 8px 8px', background: '#c7ced8', border: '3px solid #8e98a6' }} />
          </div>
        </div>
        </Fit>
        {tagEl}
        <div style={{ marginTop: 26 }}>
          <RepoPill at={repoAt} size={30} />
        </div>
      </div>
    );
  }

  if (layout === 'calendar') {
    const flip = ease(f, headAt + 4, 14, Easing.bezier(0.6, 0, 0.3, 1));
    const page = (day: string, sub: string, style: CSSProperties) => (
      <div style={{ position: 'absolute', inset: 0, background: '#ffffff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.45)', ...style }}>
        <div style={{ height: 110, background: P.warn, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: T.display, fontWeight: 800, fontSize: 64, letterSpacing: 4 }}>{day}</div>
        <div style={{ display: 'grid', placeItems: 'center', height: 290, fontFamily: T.display, fontWeight: 800, fontSize: 190, color: '#1d1d1f' }}>{sub}</div>
      </div>
    );
    return (
      <div style={center}>
        <div style={{ display: 'flex', flexDirection: A.wide ? 'row' : 'column', alignItems: 'center', gap: A.wide ? 90 : 40, maxWidth: A.width }}>
          <div style={{ position: 'relative', width: 460, height: 400, perspective: 1600, scale: A.wide ? undefined : '0.8' }}>
            {page(s.day ?? 'TUESDAY', s.date ?? '9', {})}
            {flip < 1 && page(s.prevDay ?? 'MONDAY', s.prevDate ?? '8', { transformOrigin: '50% 0%', transform: `rotateX(${flip * 110}deg)`, opacity: 1 - Math.max(0, flip - 0.7) * 3 })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: A.wide ? 'flex-start' : 'center', textAlign: A.wide ? 'left' : 'center' }}>
            {s.headline && <Line text={s.headline} accent={s.accent} at={headAt + 16} size={Math.min(90, headSize)} align={A.wide ? 'left' : 'center'} maxWidth={A.width} />}
            <div style={{ marginTop: 24 }}>
              <NameLockup at={nameAt} size={Math.min(nameSize, 110)} align={A.wide ? 'left' : 'center'} />
            </div>
            {tagline && <div style={{ fontFamily: T.ui, fontSize: 34, color: P.muted, marginTop: 14, maxWidth: A.width, opacity: ease(f, nameAt + 14, 14) }}>{tagline}</div>}
            {credit}
            <div style={{ marginTop: 32 }}>
              <RepoPill at={repoAt} size={28} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'chalk') {
    const wipe = ease(f, headAt + 30, 22, Easing.bezier(0.5, 0, 0.5, 1));
    return (
      <div style={center}>
        {s.headline && (
          <div style={{ position: 'absolute', top: A.top + 90, left: A.left, width: A.width, clipPath: `inset(0 0 0 ${wipe * 100}%)`, fontFamily: T.fonts.display ? T.display : T.ui, fontSize: headSize, color: '#f4f1e8' }}>
            <Line text={s.headline} accent={s.accent} at={headAt} size={headSize} align="center" color="#f4f1e8" maxWidth={A.width} />
          </div>
        )}
        {wipe > 0 && wipe < 1 && <div style={{ position: 'absolute', top: A.top + 40, left: `${wipe * 100}%`, width: 200, height: 220, translate: '-50% 0', background: 'linear-gradient(#5b4a3a, #3b2f25)', borderRadius: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />}
        <div style={{ marginTop: 120 }}>
          <NameLockup at={nameAt} size={nameSize} color="#f4f1e8" />
        </div>
        {tagEl}
        <div style={{ marginTop: 30 }}>
          <RepoPill at={repoAt} size={30} />
        </div>
      </div>
    );
  }

  // card
  return (
    <div style={center}>
      {both ? headAbove : f < nameAt && head}
      {(both || f >= nameAt - 6) && <NameLockup at={nameAt} size={nameSize} />}
      {f >= nameAt - 6 && tagEl}
      <div style={{ marginTop: 44 }}>
        <RepoPill at={repoAt} size={32} />
      </div>
      {s.stamp && (
        <div style={{ position: 'absolute', right: A.wide ? 60 : 20, top: 40 }}>
          <Stamp text={s.stamp} at={repoAt + 6} size={64} rotate={10} />
        </div>
      )}
    </div>
  );
};

export { interpolate, clamp };

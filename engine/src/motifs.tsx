import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { FPS } from './timeline.mjs';
import { alpha, usePal, useSafe, useTheme } from './theme';
import { useFrame } from './frame';

// The accent motif: a quiet recurring mark that gives each video its own signature. It sits
// between the background and the content, mostly at the frame's edges. highlighter and
// chalk-underline mark the accent line of the hook and payoff instead (see kit.tsx).

export const Motif: React.FC<{ kind: string; index: number; total: number; sceneFrom: number; walk?: boolean }> = ({ kind, index, total, sceneFrom, walk }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const safe = useSafe();
  const { W, H, wide, safe: inset } = useFrame();
  const c = P.fill;
  const g = (a: number) => alpha(c, a);
  // Over a product screen the motif steps back.
  const dim = walk ? 0.45 : 1;
  switch (kind) {
    case 'radar-sweep': {
      const ang = (f * 3) % 360;
      return (
        <AbsoluteFill style={{ pointerEvents: 'none', opacity: dim }}>
          <div style={{ position: 'absolute', right: -260, top: -260 + (wide ? 0 : inset.top), width: 760, height: 760, borderRadius: '50%', border: `1.5px solid ${g(0.25)}`, background: `conic-gradient(from ${ang}deg, ${g(0.22)}, transparent 50deg, transparent 360deg)` }}>
            {[0.33, 0.66].map((r) => (
              <div key={r} style={{ position: 'absolute', inset: `${r * 50}%`, borderRadius: '50%', border: `1px solid ${g(0.18)}` }} />
            ))}
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: g(0.15) }} />
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: g(0.15) }} />
          </div>
          <div style={{ position: 'absolute', right: 150 + Math.sin(index * 2) * 60, top: 210 + (wide ? 0 : inset.top) + Math.cos(index) * 40, width: 12, height: 12, borderRadius: '50%', background: c, opacity: 0.3 + 0.7 * ((Math.sin(f / 6) + 1) / 2), boxShadow: `0 0 18px ${c}` }} />
        </AbsoluteFill>
      );
    }
    case 'ecg-line': {
      const w = W;
      const y = H - safe.bottom - 40;
      const period = 420;
      const pts: string[] = [];
      for (let x = 0; x <= w; x += 6) {
        const u = (x + f * 9) % period;
        const beat = u > 200 && u < 260 ? (u < 215 ? -(u - 200) * 3 : u < 230 ? -45 + (u - 215) * 8 : u < 245 ? 75 - (u - 230) * 6 : -15 + (u - 245)) : 0;
        pts.push(`${x},${y + beat}`);
      }
      const head = (w - ((f * 9) % w)) % w;
      return (
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.55 * dim }}>
          <polyline points={pts.join(' ')} fill="none" stroke={c} strokeWidth={3} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 6px ${g(0.6)})` }} />
          <circle cx={head} cy={y} r={0} fill={c} />
        </svg>
      );
    }
    case 'measurement-ticks': {
      const ticks = [];
      const t0 = wide ? 0 : inset.top;
      for (let x = 0; x <= W; x += 24) {
        const major = x % 240 === 0;
        ticks.push(<div key={`t${x}`} style={{ position: 'absolute', left: x, top: t0, width: 1.5, height: major ? 22 : 10, background: alpha(P.ink, major ? 0.45 : 0.25) }} />);
        if (major && x > 0) ticks.push(<div key={`l${x}`} style={{ position: 'absolute', left: x + 5, top: t0 + 18, fontFamily: T.mono, fontSize: 13, color: alpha(P.ink, 0.5) }}>{x / 24}</div>);
      }
      for (let y = 0; y <= H; y += 24) ticks.push(<div key={`v${y}`} style={{ position: 'absolute', left: 0, top: y, height: 1.5, width: y % 240 === 0 ? 22 : 10, background: alpha(P.ink, y % 240 === 0 ? 0.45 : 0.25) }} />);
      const cx = 200 + ((f * 4 + index * 300) % Math.max(200, W - 400));
      return (
        <AbsoluteFill style={{ pointerEvents: 'none', opacity: dim }}>
          {ticks}
          <div style={{ position: 'absolute', left: cx, top: t0, width: 2, height: 34, background: c }} />
          <div style={{ position: 'absolute', left: cx + 8, top: t0 + 34, fontFamily: T.mono, fontSize: 14, color: c }}>{(cx / 24).toFixed(1)}</div>
        </AbsoluteFill>
      );
    }
    case 'scoreboard': {
      const t = (sceneFrom + f) / FPS;
      const mm = String(Math.floor(t / 60)).padStart(2, '0');
      const ss = (t % 60).toFixed(1).padStart(4, '0');
      const top = wide ? (safe.top ? safe.top + 10 : 40) : safe.top + 10;
      return (
        <div style={{ position: 'absolute', right: wide ? 48 : inset.right, top, display: 'flex', gap: 10, fontFamily: T.mono, fontSize: 22, letterSpacing: 2, pointerEvents: 'none' }}>
          {[`${String(index + 1).padStart(2, '0')}/${String(total).padStart(2, '0')}`, `${mm}:${ss}`].map((v, i) => (
            <div key={i} style={{ padding: '8px 14px', background: alpha(P.dark ? '#000000' : P.ink, P.dark ? 0.55 : 0.88), color: i ? c : P.dark ? P.ink : P.bg, border: `1px solid ${g(0.4)}`, borderRadius: Math.min(T.radius, 6), fontVariantNumeric: 'tabular-nums' }}>
              {v}
            </div>
          ))}
        </div>
      );
    }
    case 'calendar-grid': {
      const cols = W >= H ? 7 : 5;
      const rows = W >= H ? 5 : 9;
      const cw = W / cols;
      const ch = H / rows;
      const done = Math.floor((sceneFrom + f) / 9);
      return (
        <AbsoluteFill style={{ pointerEvents: 'none', opacity: 0.6 * dim }}>
          {Array.from({ length: cols * rows }, (_, i) => {
            const x = (i % cols) * cw;
            const y = Math.floor(i / cols) * ch;
            const crossed = i < done % (cols * rows);
            return (
              <div key={i} style={{ position: 'absolute', left: x, top: y, width: cw, height: ch, borderRight: `1px solid ${alpha(P.ink, 0.07)}`, borderBottom: `1px solid ${alpha(P.ink, 0.07)}`, boxSizing: 'border-box' }}>
                <div style={{ position: 'absolute', right: 14, top: 10, fontFamily: T.mono, fontSize: 16, color: alpha(P.ink, crossed ? 0.15 : 0.3) }}>{i + 1}</div>
                {crossed && <div style={{ position: 'absolute', right: 10, top: 10, width: 28, height: 28, borderRadius: '50%', border: `2px solid ${g(0.35)}` }} />}
              </div>
            );
          })}
        </AbsoluteFill>
      );
    }
    case 'heat-glow': {
      const p = (Math.sin(f / 14) + 1) / 2;
      return (
        <AbsoluteFill style={{ pointerEvents: 'none', opacity: dim, mixBlendMode: P.dark ? 'screen' : 'multiply' }}>
          <div style={{ position: 'absolute', left: '50%', bottom: -700, width: 2400, height: 1200, translate: '-50% 0', borderRadius: '50%', background: `radial-gradient(ellipse, ${g(0.32 + p * 0.12)} 0%, ${alpha(P.accent2, 0.12)} 40%, transparent 70%)` }} />
          <div style={{ position: 'absolute', left: '15%', top: -400, width: 900, height: 900, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(P.warn, 0.12 + (1 - p) * 0.08)} 0%, transparent 65%)` }} />
        </AbsoluteFill>
      );
    }
    case 'hazard-stripes': {
      const band = (top: boolean) => (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            [top ? 'top' : 'bottom']: wide ? 0 : top ? inset.top - 40 : inset.bottom - 40,
            height: 26,
            backgroundImage: `repeating-linear-gradient(-45deg, ${c} 0 22px, ${P.dark ? '#111111' : P.ink} 22px 44px)`,
            backgroundPosition: `${(top ? f : -f) * 2}px 0`,
            opacity: 0.9,
          }}
        />
      );
      return (
        <AbsoluteFill style={{ pointerEvents: 'none', opacity: walk ? 0.7 : 1 }}>
          {band(true)}
          {band(false)}
        </AbsoluteFill>
      );
    }
    default:
      return null;
  }
};

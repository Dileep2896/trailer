import { useCurrentFrame } from 'remotion';
import { alpha, usePal, useTheme } from '../theme';
import { ease, useCues } from './prims';
import type { TimelineScene } from '../types';
import { useFrame } from '../frame';

// cornerBug (optional, any v3 scene, off by default): a small broadcast bug in the top
// corner, outside the content area, e.g. "REPLAY" over a recreated UI scene. One bug or a
// list that hands over on cue.
//   cornerBug?: { text, sub?, at?, until?, tone?: live | accent | warn, side?: right | left }
//             | [ ...same ]

export const CornerBug: React.FC<{ s: any; t: TimelineScene }> = ({ s, t }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const cue = useCues(t);
  const fr = useFrame();
  if (!s.cornerBug) return null;
  const bugs: any[] = Array.isArray(s.cornerBug) ? s.cornerBug : [s.cornerBug];
  const pulse = (Math.sin(f / 5) + 1) / 2;
  return (
    <>
      {bugs.map((b, i) => {
        const a = cue(b.at, 0);
        const u = b.until !== undefined ? cue(b.until, t.duration) : t.duration + 99;
        const k = Math.min(ease(f, a, 10), 1 - ease(f, u, 7));
        if (k <= 0) return null;
        const c = b.tone === 'accent' ? P.fill : b.tone === 'warn' ? P.warn : '#d11a2a';
        const right = b.side !== 'left';
        return (
          <div key={i} style={{ position: 'absolute', top: fr.wide ? 14 : fr.safe.top + 8, [right ? 'right' : 'left']: fr.wide ? 40 : right ? fr.safe.right : fr.safe.left, display: 'flex', alignItems: 'stretch', opacity: k, translate: `${(1 - k) * (right ? 40 : -40)}px 0`, zIndex: 60, fontFamily: T.mono, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px', background: c, color: '#ffffff', fontWeight: 800, fontSize: 24, letterSpacing: 3, borderRadius: b.sub ? '6px 0 0 6px' : 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffffff', opacity: 0.4 + 0.6 * pulse }} />
              {b.text}
            </div>
            {b.sub && <div style={{ display: 'flex', alignItems: 'center', padding: '6px 16px', background: alpha('#000000', 0.72), color: '#f4f4f0', fontSize: 22, letterSpacing: 2, borderRadius: '0 6px 6px 0' }}>{b.sub}</div>}
          </div>
        );
      })}
    </>
  );
};

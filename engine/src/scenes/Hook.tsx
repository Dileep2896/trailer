import { useCurrentFrame } from 'remotion';
import { at, lineAt, lineEnd, motion, usePal, useSafe, useTheme } from '../theme';
import { Glitch, Headline, fitSize, glyphWidth } from '../kit';
import type { GiantLine, HookScene, TimelineScene } from '../types';

/** When each headline line arrives: spread over the voice, or one after another when typed. */
export const headTimes = (lines: GiantLine[], start: number, span: number, kind: string) => {
  if (kind === 'typewriter') {
    const rate = 1.5 * motion().speed;
    let t = start;
    return lines.map((l) => {
      const a = t;
      t += l.text.length * rate + 4;
      return a;
    });
  }
  const n = lines.length;
  return lines.map((_, i) => Math.round(start + (span * 0.8 * i) / Math.max(1, n)));
};

// Hook: the pain in headline type (theme.type, or the scene's typeStyle), no product name.
// The lines land as the first line is read; a pixel glitch hits the accent line.
export const Hook: React.FC<{ s: HookScene; t: TimelineScene }> = ({ s, t }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const P = usePal();
  const safe = useSafe();
  const kind = s.typeStyle ?? T.type;
  const l0 = lineAt(t, 0, 6);
  const span = Math.max(18, lineEnd(t, 0, 60) - l0);
  const n = s.giant.length;
  const size = fitSize(s.giant, 1620, 230, T);
  const times = headTimes(s.giant, l0 - 4, span, kind);
  const lines = s.giant.map((g, i) => ({ ...g, at: times[i]! }));
  const accentIdx = Math.max(0, s.giant.findIndex((g) => g.accent));
  const lh = kind === 'stacked' ? 1.14 : 0.98;
  const top = (1080 - safe.bottom) / 2 - (n * size * lh) / 2;
  return (
    <>
      <Headline kind={kind} lines={lines} size={size} style={{ position: 'absolute', left: 150, top }} />
      {kind === 'giant-kinetic' && (
        <Glitch rect={{ x: 150, y: top + accentIdx * size * lh, w: Math.min(1620, size * glyphWidth(T) * (s.giant[accentIdx]?.text.length ?? 6)), h: size }} at={(lines[accentIdx]?.at ?? 0) + 14} dur={10} />
      )}
      {s.sub && (
        <div style={{ position: 'absolute', left: 150, width: 1500, bottom: 90 + safe.bottom * 0.75, fontFamily: T.ui, fontSize: 30, color: P.muted, opacity: Math.min(1, at(f, (lines[n - 1]?.at ?? 20) + 10, 16)) }}>{s.sub}</div>
      )}
    </>
  );
};

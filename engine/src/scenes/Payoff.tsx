import { useCurrentFrame } from 'remotion';
import { lineAt, lineEnd, useSafe, useTheme } from '../theme';
import { Glitch, Headline, fitSize } from '../kit';
import { headTimes } from './Hook';
import type { PayoffScene, TimelineScene } from '../types';

// Payoff: headline type, centred. With `then`, a second set swaps in halfway through the
// line behind a pixel glitch.
export const Payoff: React.FC<{ s: PayoffScene; t: TimelineScene }> = ({ s, t }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const safe = useSafe();
  const kind = s.typeStyle ?? T.type;
  const l = lineAt(t, 0, 4);
  const lend = lineEnd(t, 0, t.duration - 12);
  const swap = s.then?.length ? Math.round(l + (lend - l) * 0.5) : Infinity;
  const all = [...s.giant, ...(s.then ?? [])];
  const size = fitSize(all, 1640, 250, T);
  const lh = kind === 'stacked' ? 1.14 : 0.98;
  const block = (lines: typeof s.giant) => (1080 - safe.bottom) / 2 - (lines.length * size * lh) / 2;
  const firstAt = headTimes(s.giant, l - 4, Math.max(12, (Number.isFinite(swap) ? swap : lend) - l), kind);
  const thenAt = s.then ? headTimes(s.then, swap, Math.max(12, lend - swap), kind) : [];
  return (
    <>
      {f < swap + 4 && (
        <Headline kind={kind} align="center" size={size} out={Number.isFinite(swap) ? swap - 6 : undefined} style={{ position: 'absolute', left: 0, right: 0, top: block(s.giant) }} lines={s.giant.map((g, i) => ({ ...g, at: kind === 'typewriter' ? firstAt[i]! : l - 4 + i * 6 }))} />
      )}
      {s.then && f >= swap - 4 && (
        <Headline kind={kind} align="center" size={size} style={{ position: 'absolute', left: 0, right: 0, top: block(s.then) }} lines={s.then.map((g, i) => ({ ...g, at: kind === 'typewriter' ? thenAt[i]! : swap + i * 5 }))} />
      )}
      {Number.isFinite(swap) && <Glitch rect={{ x: 160, y: 300, w: 1600, h: 480 }} at={swap - 6} dur={10} cell={40} />}
    </>
  );
};

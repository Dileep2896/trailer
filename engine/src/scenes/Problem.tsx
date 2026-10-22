import { useCurrentFrame, useVideoConfig } from 'remotion';
import { alpha, at, hash, itemsAt, mix, pop, usePal, useSafe, useTheme } from '../theme';
import { Headline, Tangle, fitSize } from '../kit';
import type { ProblemScene, TimelineScene } from '../types';

// Problem: the mess as a diagram. The pieces of the status quo pop in one by one around an
// empty centre, then tangled lines cross between them and a red question mark pulses where
// the answer should be.
export const Problem: React.FC<{ s: ProblemScene; t: TimelineScene }> = ({ s, t }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useTheme();
  const P = usePal();
  const safe = useSafe();
  const hasTitle = !!s.title?.length;
  const cx = hasTitle ? 1400 : 960;
  const cy = (1080 - safe.bottom * 0.8) / 2;
  const rx = hasTitle ? 400 : 620;
  const ry = 330 - safe.bottom * 0.3;
  const n = s.nodes.length;
  const times = itemsAt(t, n);
  const pos = s.nodes.map((_, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2 + (hash(i, 2) - 0.5) * 0.35;
    const x = cx + Math.cos(a) * rx * (0.82 + hash(i, 3) * 0.18);
    // Keep every card clear of the title column on the left and of the frame edge on the right.
    const node = s.nodes[i]!;
    const half = (102 + Math.max(node.label.length * 28 * 0.62, (node.sub ?? '').length * 19 * 0.62)) / 2;
    const minX = (hasTitle ? 110 + 760 + 50 : 60) + half;
    const maxX = 1920 - 90 - half;
    return { x: Math.min(maxX, Math.max(minX, x)), y: cy + Math.sin(a) * ry * (0.82 + hash(i, 4) * 0.18) };
  });
  const lastIn = (times[n - 1] ?? 30) + 10;
  const pairs: [number, number][] = [];
  for (let i = 0; i < n; i += 1) {
    pairs.push([i, (i + 2) % n]);
    if (n > 3) pairs.push([i, (i + Math.floor(n / 2)) % n]);
  }
  const seen = new Set<string>();
  const uniq = pairs.filter(([a, b]) => {
    const k = [Math.min(a, b), Math.max(a, b)].join('-');
    if (a === b || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const q = pop(f - lastIn - 12, fps, 0.7);
  const pulse = (Math.sin((f - lastIn) / 6) + 1) / 2;
  const titleSize = hasTitle ? fitSize(s.title!, 760, 150, T) : 0;
  return (
    <>
      {hasTitle && (
        <Headline
          kind={s.typeStyle ?? (T.type === 'typewriter' ? 'giant-kinetic' : T.type)}
          size={titleSize}
          style={{ position: 'absolute', left: 110, top: cy - (s.title!.length * titleSize * 0.98) / 2 }}
          lines={s.title!.map((g, i) => ({ ...g, at: 2 + i * 7 }))}
        />
      )}
      {uniq.map(([a, b], i) => (
        <Tangle key={i} from={pos[a]!} to={pos[b]!} at={lastIn + i * 3} bend={0.25 + hash(i, 8) * 0.35} color={P.warn} dash={i % 2 === 1} />
      ))}
      <div
        style={{
          position: 'absolute',
          left: cx - 70,
          top: cy - 70,
          width: 140,
          height: 140,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: P.surface,
          border: `4px solid ${P.warn}`,
          boxShadow: `0 0 0 ${8 + pulse * 14}px ${alpha(P.warn, 0.18 - pulse * 0.1)}`,
          fontFamily: T.display,
          fontWeight: 800,
          fontSize: 84,
          color: P.warn,
          scale: `${q}`,
          opacity: Math.min(1, q * 1.5),
        }}
      >
        ?
      </div>
      {s.nodes.map((node, i) => {
        const st = times[i] ?? 0;
        if (f < st) return null;
        const sp = pop(f - st, fps);
        const rot = (hash(i, 5) - 0.5) * 8;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: pos[i]!.x,
              top: pos[i]!.y + Math.sin(f / 24 + i) * 6,
              translate: '-50% -50%',
              rotate: `${rot + (1 - sp) * 10}deg`,
              scale: `${0.6 + 0.4 * sp}`,
              opacity: Math.min(1, sp * 1.5),
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 26px 16px 16px',
              borderRadius: Math.min(T.radius, 18),
              background: P.surface,
              boxShadow: `0 24px 50px -18px rgba(0,0,0,${P.dark ? 0.6 : 0.4}), 0 0 0 1px ${P.cardBorder}`,
              fontFamily: T.ui,
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: Math.min(T.radius * 0.5, 12), background: alpha(P.fill, 0.2 + (i % 3) * 0.12), display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 20, color: P.ink }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 600, color: P.ink }}>{node.label}</div>
              {node.sub && <div style={{ fontSize: 19, color: P.muted, marginTop: 2 }}>{node.sub}</div>}
            </div>
          </div>
        );
      })}
      {s.caption && (
        <div style={{ position: 'absolute', left: 110, width: 1700, bottom: 60 + safe.bottom * 0.75, fontFamily: T.ui, fontSize: 26, color: P.muted, opacity: Math.min(1, at(f, lastIn + 6, 16)), translate: `0 ${mix(12, 0, at(f, lastIn + 6, 16))}px` }}>{s.caption}</div>
      )}
    </>
  );
};

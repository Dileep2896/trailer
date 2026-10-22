import { useCurrentFrame, useVideoConfig } from 'remotion';
import { at, itemsAt, pop, useTrailer, usePal, useSafe } from '../theme';
import { Eyebrow } from '../ui';
import type { FeaturesScene, TimelineScene } from '../types';

// Features: what the project does and why it matters, one card per feature. With one voice
// line per card (recommended; --lint warns otherwise) each card lands on its own line and
// stays lit while that line plays, the others stepping back.
export const Features: React.FC<{ s: FeaturesScene; t: TimelineScene }> = ({ s, t }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { theme: T, config } = useTrailer();
  const P = usePal();
  const safe = useSafe();
  const items = s.items.slice(0, 4);
  const times = itemsAt(t, items.length);
  const perLine = t.lines.length >= items.length;
  const grid = items.length === 4;
  const top = 120 + safe.top;
  const avail = 1080 - safe.bottom - top - 110;
  const gap = 26;
  const cardW = grid ? 790 : 1500;
  const rows = grid ? 2 : items.length;
  const cardH = Math.min(grid ? 300 : 240, (avail - (rows - 1) * gap) / rows);
  const blockH = rows * cardH + (rows - 1) * gap;
  const blockTop = top + 70 + Math.max(0, (avail - blockH) / 2);
  const whyLabel = s.whyLabel ?? 'Why it matters';
  const titleSize = Math.min(grid ? 44 : 52, cardH * 0.24);
  const whySize = Math.min(grid ? 26 : 30, cardH * 0.14);
  return (
    <>
      <Eyebrow text={s.eyebrow ?? `What ${config.projectName} does`} at={2} style={{ position: 'absolute', left: 210, top }} />
      <div style={{ position: 'absolute', left: 210, top: blockTop, width: 1500, display: 'flex', flexWrap: 'wrap', gap }}>
        {items.map((it, i) => {
          const st = times[i] ?? 0;
          const sp = pop(f - st, fps);
          const why = Math.min(1, at(f, st + 8, 18));
          // Lit while its own line plays (when every card has a line).
          const line = t.lines[i];
          const lit = !perLine || !line ? 1 : f < st ? 0 : f < (t.lines[i + 1]?.local ?? t.duration) ? 1 : 0.55;
          return (
            <div
              key={i}
              style={{
                width: cardW - (grid ? 13 : 0),
                height: cardH,
                boxSizing: 'border-box',
                display: 'flex',
                gap: 34,
                alignItems: 'center',
                padding: '0 44px',
                borderRadius: T.radius,
                background: P.card,
                border: `1px solid ${P.cardBorder}`,
                boxShadow: `inset ${5 + 3 * lit}px 0 0 ${P.fill}, 0 30px 70px -30px rgba(0,0,0,${P.dark ? 0.55 : 0.2})`,
                opacity: Math.min(1, sp * 1.4) * (0.45 + 0.55 * lit),
                translate: `${(1 - sp) * 80}px 0`,
                scale: `${0.985 + 0.015 * lit}`,
              }}
            >
              <div style={{ fontFamily: T.display, fontWeight: T.displayWeight, fontSize: Math.min(64, cardH * 0.3), color: P.accent, letterSpacing: -2, minWidth: 92 }}>{String(i + 1).padStart(2, '0')}</div>
              <div>
                <div style={{ fontFamily: T.display, fontWeight: Math.min(T.displayWeight, 700), fontSize: titleSize, letterSpacing: titleSize * T.tracking * 0.5, color: P.ink, lineHeight: 1.1 }}>{it.title}</div>
                <div style={{ fontFamily: T.ui, fontSize: whySize, lineHeight: 1.35, color: P.muted, marginTop: 10, opacity: why, translate: `0 ${(1 - why) * 10}px` }}>
                  {whyLabel && <span style={{ color: P.accent, fontWeight: 600 }}>{whyLabel}: </span>}
                  {it.why}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

import { useCurrentFrame, useVideoConfig } from 'remotion';
import { at, itemsAt, pop, usePal, useSafe, useTheme } from '../theme';
import { Counter, Eyebrow, Words } from '../ui';
import type { Metric as M, MetricScene, TimelineScene } from '../types';

// Metric: one to three before-and-after numbers. The cards are sized to fill the space under
// the heading and centred in it; each lands with its "before" value, which is struck through
// as the big number counts to "after".

export const formatMetric = (m: M, v: number) => {
  const d = m.decimals ?? 0;
  const n = v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return `${m.prefix ?? ''}${n}${m.suffix ?? ''}`;
};

export const COUNT = 34;

export const Metric: React.FC<{ s: MetricScene; t: TimelineScene }> = ({ s, t }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useTheme();
  const P = usePal();
  const safe = useSafe();
  const ms = s.metrics.slice(0, 3);
  const times = itemsAt(t, ms.length);
  const gap = 36;
  const w = (1640 - gap * (ms.length - 1)) / ms.length;
  // The longest value decides the number size, so it fits the card on one line.
  const longest = Math.max(...ms.map((m) => Math.max(formatMetric(m, m.from).length, formatMetric(m, m.to).length)));
  const big = Math.min(ms.length === 1 ? 280 : ms.length === 2 ? 210 : 170, Math.floor((w - 88) / (longest * 0.62)));
  const headTop = 110 + safe.top;
  const headH = (s.eyebrow ? 60 : 0) + (s.title ? 110 : 0);
  const areaTop = headTop + headH + 20;
  const areaBottom = 1080 - safe.bottom - 70;
  const cardH = Math.min(areaBottom - areaTop, big * 1.05 + 30 + 46 + 40 + 60 + 90);
  const cardTop = areaTop + (areaBottom - areaTop - cardH) / 2;
  return (
    <>
      {s.eyebrow && <Eyebrow text={s.eyebrow} at={2} style={{ position: 'absolute', left: 140, top: headTop }} />}
      {s.title && <Words text={s.title} at={6} size={70} style={{ position: 'absolute', left: 140, top: headTop + (s.eyebrow ? 55 : 0), width: 1640 }} />}
      <div style={{ position: 'absolute', left: 140, top: cardTop, width: 1640, height: cardH, display: 'flex', gap }}>
        {ms.map((m, i) => {
          const st = times[i] ?? 0;
          const sp = pop(f - st, fps);
          const count = st + 10;
          const strike = Math.min(1, at(f, count + 4, 14));
          return (
            <div
              key={i}
              style={{
                width: w,
                height: '100%',
                boxSizing: 'border-box',
                padding: '44px 44px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                borderRadius: T.radius,
                background: P.card,
                border: `1px solid ${P.cardBorder}`,
                boxShadow: `0 40px 90px -40px rgba(0,0,0,${P.dark ? 0.6 : 0.22})`,
                opacity: Math.min(1, sp * 1.4),
                translate: `0 ${(1 - sp) * 60}px`,
              }}
            >
              <div style={{ fontFamily: T.ui, fontSize: 30, fontWeight: 500, color: P.muted }}>{m.label}</div>
              <div style={{ fontFamily: T.display, fontWeight: T.displayWeight, fontSize: big, letterSpacing: big * Math.min(-0.01, T.tracking * 0.8), lineHeight: 1.05, color: P.accent, marginTop: 14, whiteSpace: 'nowrap' }}>
                <Counter from={m.from} to={m.to} at={count} dur={COUNT} format={(v) => formatMetric(m, v)} />
              </div>
              <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14, fontFamily: T.ui, fontSize: 28, color: P.muted }}>
                <span>before</span>
                <span style={{ position: 'relative', fontWeight: 600, color: P.ink }}>
                  {formatMetric(m, m.from)}
                  <span style={{ position: 'absolute', left: -4, top: '52%', height: 3, width: `calc(${strike * 100}% + 8px)`, background: P.warn, borderRadius: 2 }} />
                </span>
                {m.note && <span style={{ marginLeft: 'auto', opacity: Math.min(1, at(f, count + COUNT, 14)) }}>{m.note}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

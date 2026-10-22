import { useCurrentFrame, useVideoConfig } from 'remotion';
import { linkText } from '../v3/prims';
import { at, hash, lineAt, pop, useTrailer, usePal, useSafe } from '../theme';
import { fitSize } from '../kit';
import { Words } from '../ui';
import type { EndScene, TimelineScene } from '../types';

// End card: the project name lands (the tile sweep into it is in Trailer.tsx), then the tagline and the
// repository link. No company, no logo: the project stands on its own.
export const End: React.FC<{ s: EndScene; t: TimelineScene }> = ({ s, t }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { config, theme: T } = useTrailer();
  const P = usePal();
  const safe = useSafe();
  const name = config.projectName;
  const size = fitSize([{ text: name }], 1400, 220, T) * 1.1;
  const nameIn = pop(f - 10, fps, 1.1);
  const tagline = s.tagline ?? config.tagline;
  // Fit the tagline on one line where possible (about 0.52 em per character).
  const tagSize = tagline ? Math.max(38, Math.min(54, Math.floor(1500 / (tagline.length * 0.52)))) : 54;
  const pillAt = Math.max(30, lineAt(t, t.lines.length - 1, 40));
  const pill = pop(f - pillAt, fps);
  const url = linkText(config);
  return (
    <>
      {Array.from({ length: 16 }, (_, i) => {
        const sz = 30 + hash(i, 1) * 56;
        const x = 120 + hash(i, 2) * 1680;
        const y = 90 + hash(i, 3) * 900;
        if (Math.abs(x - 960) < 760 && Math.abs(y - 520) < 330) return null;
        if (y > 1080 - safe.bottom - 60) return null;
        return <div key={i} style={{ position: 'absolute', left: x, top: y + Math.sin(f / 20 + i) * 12, width: sz, height: sz, borderRadius: Math.min(sz * 0.25, T.radius), background: hash(i, 4) > 0.5 ? P.fill : P.accent2, opacity: 0.8, scale: `${Math.max(0, at(f, 14 + i * 1.5, 14))}` }} />;
      })}
      {/* One flowing column, so a tagline that wraps pushes the link down instead of under it. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 250 - safe.bottom * 0.5 + safe.top * 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', fontFamily: T.display, fontWeight: T.displayWeight, fontSize: size, letterSpacing: size * T.tracking, lineHeight: 1, color: P.ink, scale: `${0.86 + 0.14 * nameIn}`, opacity: Math.min(1, nameIn * 1.4) }}>
        {name}
        <span style={{ color: P.accent }}>.</span>
      </div>
      {tagline && <Words text={tagline} at={24} size={tagSize} font="ui" weight={500} align="center" color={P.muted} style={{ width: 1500, marginTop: size * 0.32 }} />}
      <div style={{ marginTop: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            padding: '20px 40px 20px 26px',
            borderRadius: T.radius >= 12 ? 999 : T.radius,
            background: P.surface,
            border: `1px solid ${P.cardBorder}`,
            color: P.ink,
            fontFamily: T.mono,
            fontWeight: 500,
            fontSize: 34,
            scale: `${0.7 + 0.3 * pill}`,
            opacity: Math.min(1, pill * 1.5),
            boxShadow: `0 24px 60px -18px ${P.fill}`,
          }}
        >
          <span style={{ width: 46, height: 46, borderRadius: Math.min(12, T.radius), background: P.fill, color: P.onFill, display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 700 }}>{'</>'}</span>
          {url}
        </div>
        {s.cta && <div style={{ fontFamily: T.ui, fontSize: 28, color: P.muted, opacity: Math.min(1, at(f, pillAt + 10, 14)) }}>{s.cta}</div>}
      </div>
      </div>
    </>
  );
};

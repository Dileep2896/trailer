import { useCurrentFrame } from 'remotion';
import { IN, at, lineAt, useTrailer, usePal, useSafe } from '../theme';
import { Glitch, Mosaic, fitSize } from '../kit';
import { Words } from '../ui';
import type { RevealScene, TimelineScene } from '../types';

// Reveal: a pixel mosaic in the accent floods the frame and drains away, and the project
// name assembles letter by letter where it was, with the tagline under it.
export const Reveal: React.FC<{ s: RevealScene; t: TimelineScene }> = ({ s, t }) => {
  const f = useCurrentFrame();
  const { config, theme: T } = useTrailer();
  const P = usePal();
  const safe = useSafe();
  const drain = 10;
  const nameAt = drain + 6;
  const name = config.projectName;
  const size = fitSize([{ text: `${name}.` }], 1500, 270, T) * 1.1;
  const tagline = s.tagline ?? config.tagline;
  const tagAt = Math.max(nameAt + 18, lineAt(t, 0, 30) + 6);
  const leave = at(f, t.duration - 10, 10, IN);
  const top = (tagline ? 300 : 380) - safe.bottom * 0.35;
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top, textAlign: 'center', fontFamily: T.display, fontWeight: T.displayWeight, fontSize: size, letterSpacing: size * T.tracking, lineHeight: 1, color: P.ink, whiteSpace: 'nowrap', scale: `${1 - leave * 0.08}`, opacity: 1 - leave }}>
        {[...name].map((ch, i) => {
          const k = Math.min(1, at(f, nameAt + i * 1.6, 16));
          return (
            <span key={i} style={{ display: 'inline-block', translate: `0 ${(1 - k) * 40}px`, scale: `${0.6 + 0.4 * k}`, opacity: k, filter: k < 0.95 ? `blur(${(1 - k) * 10}px)` : undefined, whiteSpace: 'pre' }}>
              {ch}
            </span>
          );
        })}
        <span style={{ display: 'inline-block', color: P.accent, scale: `${at(f, nameAt + name.length * 1.6 + 4, 12)}` }}>.</span>
      </div>
      {tagline && <Words text={tagline} at={tagAt} size={60} align="center" font="ui" weight={500} accentFrom={tagline.split(' ').length - 2} style={{ position: 'absolute', left: 210, width: 1500, top: top + 30 + size * 1.05, opacity: 1 - leave }} />}
      <Mosaic inAt={-60} outAt={drain} origin={[0.5, 0.5]} />
      <Glitch rect={{ x: 260, y: top, w: 1400, h: size }} at={nameAt + 4} dur={8} cell={40} />
    </>
  );
};

import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { captionPosOf, useTrailer } from './theme';
import { captionBand, contentInsets, useFrame, type CaptionPos } from './frame';

// Safe-area guides for stills and review frames (--safe-overlay). Never drawn on a final
// render. Red: the platform's UI zones (9:16 top bar, caption and button zone, action rail).
// Blue: the caption band of the scene under this frame. Green: the content area layouts use.

export const SafeOverlay: React.FC = () => {
  const f = useCurrentFrame();
  const fr = useFrame();
  const { timeline: tl, theme: T, config } = useTrailer();
  const i = Math.max(0, tl.scenes.findIndex((s) => f >= s.from && f < s.from + s.duration));
  const pos = captionPosOf(config.scenes[i], T) as CaptionPos;
  const size = T.captions.size;
  const ins = contentInsets(fr, pos, size);
  const band = captionBand(fr, pos, size);
  const sideL = fr.wide ? 96 : fr.safe.left;
  const sideR = fr.wide ? 96 : fr.safe.right;
  const red = 'rgba(255, 40, 60, 0.22)';
  const label = (text: string, style: React.CSSProperties) => (
    <div style={{ position: 'absolute', fontFamily: 'monospace', fontSize: 22, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', ...style }}>{text}</div>
  );
  const bandTop = pos === 'top' ? band.edge : pos === 'center-low' ? band.cy - band.body / 2 : fr.H - band.edge - band.body;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: fr.safe.top, background: red }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: fr.safe.bottom, background: red }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: fr.safe.left, background: red }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: fr.safe.right, background: red }} />
      {pos !== 'off' && <div style={{ position: 'absolute', left: sideL, right: sideR, top: bandTop, height: band.body, border: '3px dashed rgba(60, 140, 255, 0.95)', boxSizing: 'border-box' }} />}
      <div style={{ position: 'absolute', left: sideL, right: sideR, top: ins.top, bottom: ins.bottom, border: '3px solid rgba(40, 220, 120, 0.95)', boxSizing: 'border-box' }} />
      {label(`${fr.aspect} ${fr.W}x${fr.H} · scene ${tl.scenes[i]?.id ?? ''} · captions ${pos} · f${f}`, { left: 12, top: 12 })}
    </AbsoluteFill>
  );
};

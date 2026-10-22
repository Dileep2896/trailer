import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { linkText } from '../v3/prims';
import { EXPO, at, centre, useTrailer, usePal, useSafe, useShot, walkPlan, type Theme } from '../theme';
import { Toast } from '../kit';
import { Cursor, Eyebrow, Highlight, PressButton, Ring, Win, Words, camTransform, fitWindow, windowSize } from '../ui';
import { Camera } from '../transitions';
import type { Box, Shot, TimelineScene, WalkShot, WalkthroughScene } from '../types';

// Walkthrough: one to three real screens of the app. Each sits in the theme's window chrome
// beside the feature's name and why it matters. The window is sized to fit the frame (inside
// the captions' safe area), and the camera (theme.camera) moves only inside it, so a push
// never takes the window out of frame. The cursor glides in and clicks only on shots that
// click; on `click: false` shots there is no cursor at all.

const TEXT_X = 110;
const TEXT_W = 520;

/** Where the window sits for a shot, given the captions' safe area. */
export const walkLayout = (s: Shot, chrome: string, safe: { top: number; bottom: number }) => fitWindow(s, chrome, { x0: 690, x1: 1850, y0: 56 + safe.top, y1: 1024 - safe.bottom });

/** The camera at push p (0..1) for a shot and theme camera style. */
const camAt = (shot: WalkShot, s: Shot, p: number, kind: string) => {
  const target = shot.target ? s.boxes[shot.target] : undefined;
  const ringBox = shot.ring ? s.boxes[shot.ring] : target;
  const view = s.view ?? s.height;
  const focus = target ? centre(target) : ringBox ? centre(ringBox) : { x: s.width / 2, y: view / 2 };
  const z = kind === 'static' ? 1 : 1 + ((shot.zoom ?? 1.3) - 1) * (kind === 'drift' ? 0.6 : 1);
  const zoom = 1 + (z - 1) * p;
  return { s: zoom, fx: s.width / 2 + (focus.x - s.width / 2) * p, fy: view / 2 + (focus.y - view / 2) * p };
};

/** A page box in film pixels with the camera fully pushed, for caption avoidance. */
export const shotBoxOnFrame = (shot: WalkShot, s: Shot, T: Theme, safe: { top: number; bottom: number }, box: Box): Box => {
  const L = walkLayout(s, T.chrome, safe);
  const { inner, viewH, bar, bezel } = windowSize(s, T.chrome, L.w);
  const { scale, tx, ty } = camTransform(s, inner, viewH, camAt(shot, s, 1, T.camera));
  const ox = L.x - L.w / 2 + bezel;
  const oy = L.y - L.h / 2 + bar + bezel;
  const x = Math.max(ox, ox + tx + box.x * scale);
  const y = Math.max(oy, oy + ty + box.y * scale);
  const x2 = Math.min(ox + inner, ox + tx + (box.x + box.width) * scale);
  const y2 = Math.min(oy + viewH, oy + ty + (box.y + box.height) * scale);
  return { x, y, width: Math.max(0, x2 - x), height: Math.max(0, y2 - y) };
};

const ShotView: React.FC<{ shot: WalkShot; i: number; dur: number; click: number; ring: number; toast: number; n: number; whyLabel: string }> = ({ shot, i, dur, click, ring, toast, n, whyLabel }) => {
  const f = useCurrentFrame();
  const { theme: T, config } = useTrailer();
  const P = usePal();
  const safe = useSafe();
  const s = useShot(shot.page);
  const target = shot.target ? s.boxes[shot.target] : undefined;
  const ringBox = shot.ring ? s.boxes[shot.ring] : target;
  const hiBox = shot.highlight ? s.boxes[shot.highlight] : undefined;
  const view = s.view ?? s.height;
  const p =
    T.camera === 'drift'
      ? interpolate(f, [0, dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : interpolate(f, [Math.max(0, click - 34), click + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EXPO });
  const cam = camAt(shot, s, p, T.camera);
  const doClick = !!target && shot.click !== false;
  const enter = Math.min(1, at(f, 0, 16));
  const leave = i + 1 < n ? at(f, dur - 8, 8, EXPO) : 0;
  const L = walkLayout(s, T.chrome, safe);
  const start = target ? { x: Math.min(s.width - 40, target.x + target.width / 2 + 420), y: Math.min(view - 30, target.y + target.height / 2 + 260) } : null;
  const path = doClick && target && start ? [{ f: 10, ...start }, { f: click - 5, x: target.x + target.width * 0.5, y: target.y + target.height * 0.55 }] : null;
  const label = shot.eyebrow ?? `Feature ${String(i + 1).padStart(2, '0')}`;
  const host = linkText(config);
  const textTop = Math.max(160 + safe.top, L.y - 220);
  return (
    <AbsoluteFill style={{ opacity: 1 - leave }}>
      <div style={{ position: 'absolute', left: TEXT_X, top: textTop, width: TEXT_W }}>
        <Eyebrow text={label} at={4} />
        <Words text={shot.title} at={8} size={62} style={{ marginTop: 26 }} accentFrom={shot.title.split(' ').length - 1} />
        {shot.why && (
          <div style={{ marginTop: 30, fontFamily: T.ui, fontSize: 30, lineHeight: 1.4, color: P.muted, opacity: Math.min(1, at(f, 18, 18)), translate: `0 ${(1 - at(f, 18, 18)) * 14}px` }}>
            {whyLabel && <span style={{ color: P.accent, fontWeight: 600 }}>{whyLabel}: </span>}
            {shot.why}
          </div>
        )}
      </div>
      <Camera dur={dur} kind={T.camera === 'handheld-subtle' ? 'handheld-subtle' : 'static'}>
        <div style={{ position: 'absolute', inset: 0, translate: `${(1 - enter) * 60}px 0`, scale: `${0.94 + 0.06 * enter}`, transformOrigin: `${L.x}px ${L.y}px`, opacity: enter }}>
          <Win name={shot.page} w={L.w} x={L.x} y={L.y} cam={cam} path={`${host.split('/').pop()} · ${pagePath(shot.page, config.capture)}`}>
            {hiBox && <Highlight b={hiBox} at={click} />}
            {doClick && <PressButton name={shot.page} b={target!} click={click} />}
            {ringBox && <Ring b={ringBox} at={ring} />}
            {path && <Cursor path={path} click={click} size={26} />}
          </Win>
        </div>
      </Camera>
      {shot.toast && <Toast at={toast} title={shot.toast.title} sub={shot.toast.sub} style={{ right: 80, bottom: 70 + safe.bottom }} out={dur - 10} />}
    </AbsoluteFill>
  );
};

const pagePath = (page: string, capture: unknown) => {
  const pages = (capture as { pages?: { name: string; path?: string }[] } | undefined)?.pages ?? [];
  return pages.find((p) => p.name === page)?.path ?? '/';
};

export const Walkthrough: React.FC<{ s: WalkthroughScene; t: TimelineScene }> = ({ s, t }) => {
  const plan = walkPlan(t, s.shots);
  return (
    <>
      {s.shots.map((shot, i) => {
        const p = plan[i]!;
        return (
          <Sequence key={i} from={p.from} durationInFrames={p.dur} name={`Shot ${i + 1}: ${shot.title}`}>
            <ShotView shot={shot} i={i} n={s.shots.length} dur={p.dur} click={p.click - p.from} ring={p.ring - p.from} toast={p.toast - p.from} whyLabel={s.whyLabel ?? 'Why it matters'} />
          </Sequence>
        );
      })}
    </>
  );
};

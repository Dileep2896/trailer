import { useMemo } from 'react';
import { AbsoluteFill, Audio, Freeze, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { TrailerContext, CaptionPosContext, PalContext, captionPosOf, makeTheme, motion, walkPlan, type Pal, type Theme } from './theme';
import { normalizeConfig } from './config.mjs';
import { CastOverlay, SceneBodyV3, isV3Scene, sfxV3 } from './v3/registry';
import { LOOP_FADE, buildTimeline, itemTimes, settleFrame, settledFrameAt, settledStart } from './timeline.mjs';
import { Backdrop, Grain } from './ui';
import { Camera, CutOverlay, OVERLAP, SceneFrame, overlaps } from './transitions';
import { Motif } from './motifs';
import { Captions } from './Captions';
import { SafeOverlay } from './overlay';
import { headTimes } from './scenes/Hook';
import { Hook } from './scenes/Hook';
import { Problem } from './scenes/Problem';
import { Reveal } from './scenes/Reveal';
import { Features } from './scenes/Features';
import { Walkthrough } from './scenes/Walkthrough';
import { Metric, COUNT } from './scenes/Metric';
import { Payoff } from './scenes/Payoff';
import { End } from './scenes/End';
import type { TrailerProps, GiantLine, SceneConfig, Timeline, WalkthroughScene } from './types';

// The whole film (any aspect): scenes in config order, cut on the music's grid, each on its surface (main
// or alt) with the theme's background, motif and camera, joined by the theme's transition.
// Voice lines, captions, sound effects and the ducked music bed are laid on the same timeline.

/** Which surface a scene sits on. With rhythm "alternate", hook, problem and payoff take the alt one. */
export const surfaceOf = (s: SceneConfig, T: Theme): 'main' | 'alt' => {
  if (s.bg === 'main' || s.bg === 'alt') return s.bg;
  // v1 names: stage is the dark surface, paper the light one.
  if (s.bg === 'stage') return T.main.dark ? 'main' : 'alt';
  if (s.bg === 'paper') return T.main.dark ? 'alt' : 'main';
  return T.rhythm === 'alternate' && (s.type === 'hook' || s.type === 'problem' || s.type === 'payoff') ? 'alt' : 'main';
};

/** The transition into scene i (its own, else the theme's). The reveal brings its own mosaic. */
const cutInto = (scenes: SceneConfig[], i: number, T: Theme) => {
  const s = scenes[i];
  if (!s) return 'cut';
  if (s.transition) return s.transition;
  if (s.type === 'reveal') return overlaps(T.transition) || T.transition === 'iris' ? T.transition : 'cut';
  return T.transition;
};

const SceneBody: React.FC<{ s: SceneConfig; t: Timeline['scenes'][number] }> = ({ s, t }) => {
  if (isV3Scene(s)) return <SceneBodyV3 s={s} t={t} />;
  return (
    <>
      <SceneBodyV2 s={s} t={t} />
      <CastOverlay s={s} t={t} />
    </>
  );
};

const SceneBodyV2: React.FC<{ s: SceneConfig; t: Timeline['scenes'][number] }> = ({ s, t }) => {
  switch (s.type) {
    case 'hook':
      return <Hook s={s} t={t} />;
    case 'problem':
      return <Problem s={s} t={t} />;
    case 'reveal':
      return <Reveal s={s} t={t} />;
    case 'features':
      return <Features s={s} t={t} />;
    case 'walkthrough':
      return <Walkthrough s={s} t={t} />;
    case 'metric':
      return <Metric s={s} t={t} />;
    case 'payoff':
      return <Payoff s={s} t={t} />;
    case 'end':
      return <End s={s} t={t} />;
  }
};

type Sfx = { at: number; src: string; volume: number };

const CUT_SFX: Record<string, [string, number] | null> = {
  whip: ['sfx/whoosh.wav', 0.4],
  cut: null,
  mosaic: ['sfx/whoosh.wav', 0.3],
  wipe: ['sfx/whoosh.wav', 0.45],
  'page-turn': ['sfx/swish.wav', 0.6],
  glitch: ['sfx/glitch.wav', 0.45],
  iris: ['sfx/whoosh.wav', 0.3],
  'slide-stack': ['sfx/whoosh.wav', 0.35],
  'redaction-bar': ['sfx/swish.wav', 0.5],
  push: ['sfx/whoosh.wav', 0.4],
  zoom: ['sfx/whoosh.wav', 0.45],
  dissolve: null,
  flash: ['sfx/impact.wav', 0.25],
};

/** Scenes that run their own camera (or must not drift): no theme camera around them. */
const OWN_CAMERA = new Set(['walkthrough', 'reveal', 'ui', 'screenshot', 'chat', 'scoreboard']);

/** Sound effects from the timeline: the cuts, a riser and impact on the reveal, clicks on clicks, type. */
const sfxFor = (scenes: SceneConfig[], tl: Timeline, T: Theme): Sfx[] => {
  if (!T.sfx) return [];
  const out: Sfx[] = [];
  const headline = (lines: GiantLine[], from: number, start: number, span: number, kind: string) => {
    if (kind === 'stamp') for (const a of headTimes(lines, start, span, kind)) out.push({ at: from + a + 5, src: 'sfx/thunk.wav', volume: 0.6 });
    if (kind === 'typewriter') {
      const rate = 1.5 * motion().speed;
      headTimes(lines, start, span, kind).forEach((a, k) => {
        for (let c = 0; c < lines[k]!.text.length; c += 2) out.push({ at: from + Math.round(a + c * rate), src: 'sfx/key.wav', volume: 0.32 });
      });
    }
  };
  tl.scenes.forEach((t, i) => {
    const s = scenes[i]!;
    const cut = CUT_SFX[cutInto(scenes, i, T)];
    if (i > 0 && cut) out.push({ at: t.from - 8, src: cut[0], volume: cut[1] });
    if (isV3Scene(s)) {
      for (const x of sfxV3(s, t)) out.push({ ...x, at: t.from + x.at });
      return;
    }
    if ((s as any).cast) for (const x of sfxV3({ type: '_', cast: (s as any).cast, sfx: (s as any).sfx }, t)) out.push({ ...x, at: t.from + x.at });
    if (s.type === 'reveal') out.push({ at: t.from - 45, src: 'sfx/riser.wav', volume: 0.5 }, { at: t.from + 14, src: 'sfx/impact.wav', volume: 0.85 });
    if (s.type === 'hook') {
      const l0 = t.lines[0]?.local ?? 6;
      headline(s.giant, t.from, l0 - 4, Math.max(18, (t.lines[0] ? t.lines[0].local + t.lines[0].frames : 60) - l0), s.typeStyle ?? T.type);
    }
    if (s.type === 'payoff' && (s.typeStyle ?? T.type) === 'stamp') {
      const l = t.lines[0]?.local ?? 4;
      s.giant.forEach((_, k) => out.push({ at: t.from + l - 4 + k * 6 + 5, src: 'sfx/thunk.wav', volume: 0.55 }));
    }
    if (s.type === 'walkthrough') {
      walkPlan(t, (s as WalkthroughScene).shots).forEach((p, k) => {
        const shot = (s as WalkthroughScene).shots[k]!;
        if (shot.target && shot.click !== false) out.push({ at: t.from + p.click, src: 'sfx/click.wav', volume: 0.9 });
        if (shot.target || shot.ring) out.push({ at: t.from + p.ring, src: 'sfx/pop.wav', volume: 0.35 });
        if (shot.toast) out.push({ at: t.from + p.toast, src: 'sfx/ding.wav', volume: 0.45 });
      });
    }
    if (s.type === 'features' || s.type === 'problem') {
      const n = s.type === 'features' ? Math.min(4, s.items.length) : s.nodes.length;
      for (const a of itemTimes(t, n)) out.push({ at: t.from + a, src: 'sfx/pop.wav', volume: 0.5 });
    }
    if (s.type === 'metric') {
      for (const a of itemTimes(t, Math.min(3, s.metrics.length))) {
        out.push({ at: t.from + a, src: 'sfx/pop.wav', volume: 0.5 });
        for (let k = 0; k < COUNT; k += 4) out.push({ at: t.from + a + 10 + k, src: 'sfx/tick.wav', volume: 0.25 });
        out.push({ at: t.from + a + 10 + COUNT, src: 'sfx/ding.wav', volume: 0.35 });
      }
    }
    if (s.type === 'end') out.push({ at: t.from + 8, src: 'sfx/impact.wav', volume: 0.6 });
  });
  return out.filter((x) => x.at >= 0 && x.at < tl.total).map((x) => ({ ...x, volume: x.volume * T.sfx }));
};

/** Fades its children in over its sequence, reaching full opacity on the sequence's last frame. */
const LoopFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, LOOP_FADE - 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const Trailer: React.FC<TrailerProps> = ({ config: raw, shots, media, music, overlay }) => {
  const { fps } = useVideoConfig();
  const config = useMemo(() => normalizeConfig(raw), [raw]);
  const theme = useMemo(() => makeTheme(config), [config]);
  const tl = useMemo(() => buildTimeline(config, media) as Timeline, [config, media]);
  const T = tl.total;
  const pals: Pal[] = config.scenes.map((s) => theme[surfaceOf(s, theme)]);
  const sfx = useMemo(() => sfxFor(config.scenes, tl, theme), [config, tl, theme]);
  const musicVolume = typeof config.music === 'object' && config.music?.volume !== undefined ? config.music.volume : 1;
  const voiceAt = (frame: number) =>
    Math.max(0, ...tl.lines.map((l) => interpolate(frame, [l.from - 6, l.from, l.from + l.frames, l.from + l.frames + 8], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })));
  const palAt = (frame: number) => {
    const i = tl.scenes.findIndex((s) => frame >= s.from && frame < s.from + s.duration);
    return pals[Math.max(0, i)] ?? theme.main;
  };
  const n = tl.scenes.length;
  const settled = settledStart(config);
  const settle0 = tl.scenes[0] ? settleFrame(tl.scenes[0]) : 0;
  const loop = n > 1 && config.scenes[n - 1]?.loop === true && T > LOOP_FADE * 2;
  /** Scene i on its surface, inside its transitions (shared by the film, frame 0 and the loop fade). */
  const scene = (i: number) => {
    const t = tl.scenes[i]!;
    const s = config.scenes[i]!;
    const P = pals[i]!;
    const inKind = cutInto(config.scenes, i, theme);
    const outKind = i + 1 < n ? cutInto(config.scenes, i + 1, theme) : 'none';
    const last = i === n - 1;
    return (
      <PalContext.Provider value={P}>
        <CaptionPosContext.Provider value={captionPosOf(s, theme)}>
        <SceneFrame
          index={i}
          dur={t.duration}
          inKind={inKind}
          outKind={outKind}
          first={i === 0}
          last={last}
          backdrop={
            <>
              <Backdrop P={P} seed={i} />
              {theme.motif !== 'none' && <Motif kind={theme.motif} index={i} total={n} sceneFrom={t.from} walk={s.type === 'walkthrough'} />}
            </>
          }
          body={
            OWN_CAMERA.has(s.type) ? (
              <SceneBody s={s} t={t} />
            ) : (
              <Camera dur={t.duration} kind={theme.camera}>
                <SceneBody s={s} t={t} />
              </Camera>
            )
          }
        />
        </CaptionPosContext.Provider>
      </PalContext.Provider>
    );
  };
  return (
    <TrailerContext.Provider value={{ config, shots, timeline: tl, theme }}>
      <AbsoluteFill style={{ background: theme.transition === 'iris' ? theme.accent : theme.main.bg }}>
        {tl.scenes.map((t, i) => {
          const outKind = i + 1 < n ? cutInto(config.scenes, i + 1, theme) : 'none';
          const extend = i < n - 1 && overlaps(outKind) ? OVERLAP : 0;
          const z = outKind === 'page-turn' ? 10000 - i : i;
          return (
            <Sequence key={t.id} name={`${t.id} (${config.scenes[i]!.type})`} from={t.from} durationInFrames={t.duration + extend} premountFor={fps} style={{ zIndex: z }}>
              {i === 0 && settled ? (
                // Frame 0 is the thumbnail: scene 1 with its first cue already settled. It holds
                // that picture until the live scene reaches the same frame (settle0), so scene 1
                // never goes empty after frame 0 and a loop wraps without a flash; cues after
                // settle0 animate as usual.
                <Freeze frame={settle0} active={(f) => settledFrameAt(f, settle0) !== f}>
                  {scene(0)}
                </Freeze>
              ) : (
                scene(i)
              )}
            </Sequence>
          );
        })}
        {loop && (
          // loop: true on the last scene: its final frames fade into frame 0's picture.
          <Sequence name="Loop: back to frame 0" from={T - LOOP_FADE} durationInFrames={LOOP_FADE} style={{ zIndex: 19999 }}>
            <LoopFade>
              <Freeze frame={settle0}>{scene(0)}</Freeze>
            </LoopFade>
          </Sequence>
        )}
        {tl.scenes.map((t, i) => {
          if (i === 0) return null;
          const kind = cutInto(config.scenes, i, theme);
          if (!['whip', 'mosaic', 'wipe', 'glitch', 'redaction-bar', 'flash'].includes(kind)) return null;
          const change = surfaceOf(config.scenes[i]!, theme) !== surfaceOf(config.scenes[i - 1]!, theme);
          if (kind === 'whip' && !change) return null;
          return (
            <Sequence key={`cut-${i}`} name={`Cut: ${kind}`} from={t.from - 12} durationInFrames={30} premountFor={fps} style={{ zIndex: 20000 }}>
              <PalContext.Provider value={pals[i - 1]!}>
                <CutOverlay kind={kind} index={i} surfaceChange={change} />
              </PalContext.Provider>
            </Sequence>
          );
        })}
        <AbsoluteFill style={{ zIndex: 20001, pointerEvents: 'none' }}>
          <Grain opacity={theme.grain} />
        </AbsoluteFill>
        <AbsoluteFill style={{ zIndex: 20002, pointerEvents: 'none' }}>
          <Captions palAt={palAt} />
        </AbsoluteFill>
        {overlay && (
          <AbsoluteFill style={{ zIndex: 20003, pointerEvents: 'none' }}>
            <SafeOverlay />
          </AbsoluteFill>
        )}
        {tl.lines.map((l) =>
          l.src ? (
            <Sequence key={l.index} name={`Voice: ${l.text.slice(0, 30)}`} from={l.from} premountFor={fps}>
              <Audio src={staticFile(l.src)} />
            </Sequence>
          ) : null,
        )}
        {sfx.map((s, i) => (
          <Sequence key={`sfx-${i}`} name={`SFX ${s.src}`} from={s.at} durationInFrames={Math.min(75, T - s.at)} premountFor={fps}>
            <Audio src={staticFile(s.src)} volume={s.volume} />
          </Sequence>
        ))}
        {music && (
          <Audio
            src={staticFile(music)}
            volume={(f) => interpolate(f, [0, 8, T - 45, T], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * (0.42 - 0.3 * voiceAt(f)) * musicVolume}
          />
        )}
      </AbsoluteFill>
    </TrailerContext.Provider>
  );
};

import { cueFrame, spreadCues } from '../cues.mjs';
import { V3_TYPES } from '../config.mjs';
import type { TimelineScene } from '../types';
import { Kinetic, Outro, Title } from './scenes/type';
import { Cast, Evidence, MetricV3, Screenshot, Split, UIScene } from './scenes/stage';
import { CastLayer } from './Character';
import { CornerBug } from './bug';
import { useArea } from './prims';
import { Calendar, CaseFile, Chalkboard, Chat, Countdown, Lanes, Rewind, Scoreboard, countdownTicks } from './scenes/format';

// The v3 scene registry: which component draws a v3 scene, and the sound effects its own
// motion implies (on top of the cut sounds Trailer adds for every scene).

/** True for a scene the v3 registry draws. A v2 metric with a non-cards style is drawn here too. */
export const isV3Scene = (s: any) => (V3_TYPES as readonly string[]).includes(s.type) || (s.type === 'metric' && s.style && s.style !== 'cards');

// Scenes that place their own `cast`; on every other scene (v2 ones too) a cast is laid over
// the scene, standing on the caption-safe floor.
const SELF_CAST = new Set(['cast', 'ui', 'screenshot', 'casefile', 'scoreboard', 'chalkboard', 'countdown', 'calendar', 'lanes']);

export const CastOverlay: React.FC<{ s: any; t: TimelineScene }> = ({ s, t }) => {
  const A = useArea(80);
  if (!s.cast?.length || SELF_CAST.has(s.type)) return null;
  return <CastLayer cast={s.cast} t={t} floor={A.bottom - 10} />;
};

export const SceneBodyV3: React.FC<{ s: any; t: TimelineScene }> = ({ s, t }) => (
  <>
    <Body s={s} t={t} />
    <CastOverlay s={s} t={t} />
    <CornerBug s={s} t={t} />
  </>
);

const Body: React.FC<{ s: any; t: TimelineScene }> = ({ s, t }) => {
  switch (s.type) {
    case 'kinetic':
      return <Kinetic s={s} t={t} />;
    case 'title':
      return <Title s={s} t={t} />;
    case 'outro':
      return <Outro s={s} t={t} />;
    case 'cast':
      return <Cast s={s} t={t} />;
    case 'ui':
      return <UIScene s={s} t={t} />;
    case 'screenshot':
      return <Screenshot s={s} t={t} />;
    case 'split':
      return <Split s={s} t={t} />;
    case 'evidence':
      return <Evidence s={s} t={t} />;
    case 'metric':
      return <MetricV3 s={s} t={t} />;
    case 'casefile':
      return <CaseFile s={s} t={t} />;
    case 'scoreboard':
      return <Scoreboard s={s} t={t} />;
    case 'chalkboard':
      return <Chalkboard s={s} t={t} />;
    case 'chat':
      return <Chat s={s} t={t} />;
    case 'countdown':
      return <Countdown s={s} t={t} />;
    case 'rewind':
      return <Rewind s={s} t={t} />;
    case 'calendar':
      return <Calendar s={s} t={t} />;
    case 'lanes':
      return <Lanes s={s} t={t} />;
    default:
      return null;
  }
};

type Sfx = { at: number; src: string; volume: number };

/** The sounds a v3 scene's motion implies, in local frames, plus its explicit `sfx` list. */
export const sfxV3 = (s: any, t: TimelineScene): Sfx[] => {
  const out: Sfx[] = [];
  const cue = (c: any, fb = 0) => cueFrame(t, c, fb);
  const add = (at: number, name: string, volume: number) => out.push({ at, src: `sfx/${name}.wav`, volume });
  const castSfx = (cast: any[] | undefined, base = 4) =>
    (cast ?? []).forEach((c, i) => {
      add(cue(c.at, base + i * 5) + 6, 'boing', 0.32);
      for (const r of c.react ?? []) if (['jump', 'bounce', 'spin', 'grow'].includes(r.kind)) add(cue(r.at, 20), 'boing', 0.28);
      for (const p of c.pops ?? []) add(cue(p.at, 20), 'pop', 0.4);
      for (const b of c.bubble ?? []) add(cue(b.at, 20), 'pop', 0.3);
    });
  switch (s.type) {
    case 'kinetic': {
      const beats: any[] = s.beats ?? [];
      const def = spreadCues(t, beats.length, 6);
      beats.forEach((b, i) => {
        const a = cue(b.at, Math.max(2, (def[i] ?? 6) - 3));
        if (b.fx === 'stamp' || b.fx === 'punch') add(a + 4, 'thunk', 0.55);
        else if (b.fx === 'type') for (let c = 0; c < String(b.text ?? '').length; c += 2) add(a + Math.round(c * 1.5), 'key', 0.28);
        else if (b.fx === 'count') for (let k = 0; k < 36; k += 4) add(a + 6 + k, 'tick', 0.22);
        else if (i > 0) add(a, 'swish', 0.18);
      });
      break;
    }
    case 'title': {
      const at = cue(s.at, 6);
      const L = s.layout ?? 'card';
      if (L === 'stamp') add(cue(s.stampAt, at + 26) + 4, 'gavel', 0.6);
      else if (L === 'broadcast') add(at, 'chime', 0.45);
      else if (L === 'hud') for (let k = 0; k < (s.lines ?? []).length; k += 1) add(at + k * 8, 'beep', 0.25);
      else if (L === 'slate') add(at + 4, 'thunk', 0.5);
      else add(at, 'whoosh', 0.3);
      break;
    }
    case 'outro':
      add(cue(s.nameAt, 14), 'impact', 0.55);
      if (s.stamp) add(cue(s.stampAt, cue(s.nameAt, 14) + 18) + 4, 'thunk', 0.5);
      break;
    case 'cast':
      castSfx(s.cast);
      for (const p of s.props ?? []) add(cue(p.at, 10), 'pop', 0.3);
      break;
    case 'ui':
    case 'screenshot':
      for (const c of s.cursor ?? []) if (c.click !== false) add(cue(c.at, 20), 'click', 0.85);
      for (const m of s.moves ?? []) if (m.focus) add(cue(m.at, 10) - 4, 'whoosh', 0.18);
      for (const n of s.notes ?? []) add(cue(n.at, 30), 'pop', 0.3);
      for (const el of s.elements ?? []) if (el.type === 'toast') add(cue(el.at, 30), 'ding', 0.4);
      break;
    case 'split':
      add(cue(s.verdict?.at, t.duration - 30), 'thunk', 0.45);
      break;
    case 'evidence': {
      const cards: any[] = s.cards ?? [];
      const def = spreadCues(t, cards.length, 10);
      cards.forEach((c, i) => add(cue(c.at, def[i] ?? 10), 'swish', 0.35));
      if (s.stamp) add(cue(s.stamp.at, t.duration - 30) + 4, 'thunk', 0.6);
      break;
    }
    case 'metric': {
      const ms: any[] = (s.metrics ?? []).slice(0, 3);
      const def = spreadCues(t, ms.length, 10);
      ms.forEach((m, i) => {
        const a = cue(m.at, def[i] ?? 10);
        add(a, 'pop', 0.45);
        for (let k = 0; k < 40; k += 4) add(a + 10 + k, 'tick', 0.22);
        add(a + 50, 'ding', 0.3);
      });
      break;
    }
    case 'casefile': {
      const pins: any[] = s.pins ?? [];
      const def = spreadCues(t, pins.length, 10);
      pins.forEach((p, i) => add(cue(p.at, def[i] ?? 10), 'thunk', 0.35));
      if (s.stamp) add(cue(s.stamp.at, t.duration - 40) + 4, 'gavel', 0.6);
      break;
    }
    case 'scoreboard':
      add(4, 'whistle', 0.35);
      (s.teams ?? []).forEach((tm: any, i: number) => add(cue(tm.at, 20 + i * 8), 'tick', 0.35));
      if (s.lowerThird) add(cue(s.lowerThird.at, Math.round(t.duration * 0.5)) + 5, 'impact', 0.4);
      for (const m of s.telestrator ?? []) add(cue(m.at, 30), 'chalk', 0.3);
      if (s.bug === 'FINAL') add(t.duration - 24, 'buzzer', 0.35);
      break;
    case 'chalkboard': {
      const items: any[] = s.items ?? [];
      const def = spreadCues(t, items.length, 8);
      items.forEach((it, i) => add(cue(it.at, def[i] ?? 8), 'chalk', 0.4));
      if (s.wipe) add(cue(s.wipe.at, t.duration - 24), 'swish', 0.4);
      break;
    }
    case 'chat': {
      const msgs: any[] = s.messages ?? [];
      const def = spreadCues(t, msgs.length, 14);
      msgs.forEach((m, i) => add(cue(m.at, def[i] ?? 14), 'pop', 0.4));
      break;
    }
    case 'countdown': {
      const { ticks, thenAt } = countdownTicks(s, t);
      for (const x of ticks) add(x, 'beep', 0.4);
      if (s.then) add(thenAt + 4, 'impact', 0.6);
      break;
    }
    case 'rewind':
      add(cue(s.at, 0), 'rewind', 0.5);
      add(cue(s.slateAt, Math.round(t.duration * 0.55)), 'thunk', 0.4);
      break;
    case 'calendar': {
      const pages: any[] = s.pages ?? [];
      const def = spreadCues(t, pages.length, 6);
      pages.forEach((p, i) => add(cue(p.at, def[i] ?? 6), i ? 'swish' : 'pop', 0.3));
      break;
    }
    case 'lanes': {
      const items: any[] = s.items ?? [];
      const def = spreadCues(t, items.length, 12);
      const travel = s.travel ?? 54;
      items.forEach((it, i) => {
        const a = cue(it.at, def[i] ?? 12);
        add(a + Math.round(travel * 0.45), 'beep', 0.3);
        add(a + travel + 12, 'pop', 0.3);
      });
      break;
    }
  }
  if (s.type !== 'cast') castSfx(s.cast, 10);
  for (const x of s.sfx ?? []) out.push({ at: cue(x.at, 0), src: `sfx/${x.sound ?? x.src}.wav`, volume: x.volume ?? 0.5 });
  return out;
};

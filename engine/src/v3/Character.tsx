import type { CSSProperties, ReactNode } from 'react';
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { alpha, hash, mixHex, noise, usePal, useTheme } from '../theme';
import { cueFrame } from '../cues.mjs';
import { Emoji, clamp, ease } from './prims';
import type { TimelineScene } from '../types';
import { AUTHOR, place, useFrame } from '../frame';
import { useArea } from './prims';

// Characters. Two kinds:
//
//  - "blob" characters drawn in code (original work, no licence question), fully rigged: eyes
//    that blink every 2 to 4 s and look around, brows, mouth, blush, squash and stretch.
//    `shape` picks the body: blob, bot, note (sticky note), cloud, flame (spark), doc,
//    dummy (crash-test), marble, envelope, sprout.
//  - asset characters from public/characters (see LICENSES.md): open-peeps/<maya|leo|sam|ivy>
//    (16 moods), notionists/<nia|theo> (mood + pose), fluent/<emoji-name>. They move as a
//    whole (pop, bob, hop, shake, tilt) and change mood by cross-fading two files.
//
// A cast member in a config:
//   { who: "blob" | "open-peeps/maya" | "notionists/nia" | "fluent/robot",
//     shape?, color?, accessory?: glasses | chef-hat | headset | bowtie | magnifier | cap | crown,
//     mood?, pose? (notionists), x, y (feet), size (height px), flip?, label?,
//     at?, enter?: pop | drop | rise | left | right | fade | none, exit?: { at, kind? },
//     moods?: [{ at, mood }], look?: [{ at, dir: left | right | up | down | center }],
//     react?: [{ at, kind: jump | shake | bounce | spin | nod | tilt | shrink | grow | tremble | faint | squash }],
//     move?: [{ at, x, y?, dur? (s) }],
//     bubble?: [{ at, until?, text, kind?: speech | thought | shout, side?: left | right }],
//     pops?: [{ at, emoji }], sweat?: cue (a sweat drop from then on) }
// Every `at` is a cue (see cues.mjs).

const BLOB_MOODS = ['happy', 'joy', 'calm', 'neutral', 'sad', 'worried', 'angry', 'surprised', 'sleepy', 'smug', 'dizzy', 'love', 'determined'];

/** Mood names shared across sets, mapped to each set's files. */
const PEEP_MAP: Record<string, string> = { neutral: 'calm', joy: 'celebrating', sad: 'tired', worried: 'stressed', surprised: 'awe', sleepy: 'tired', smug: 'cheeky', dizzy: 'confused', love: 'delighted', determined: 'driven' };
const NOTION_MAP: Record<string, string> = { joy: 'happy', calm: 'neutral', sad: 'frustrated', worried: 'confused', angry: 'frustrated', surprised: 'confused', sleepy: 'neutral', smug: 'happy', dizzy: 'confused', love: 'happy', determined: 'neutral', thinking: 'neutral', stressed: 'frustrated', serious: 'neutral' };

const assetSrc = (who: string, mood: string, pose?: string) => {
  const [set, name] = who.split('/');
  if (set === 'open-peeps') {
    const peeps = ['happy', 'celebrating', 'delighted', 'confused', 'suspicious', 'frustrated', 'angry', 'stressed', 'tired', 'thinking', 'calm', 'awe', 'fear', 'cheeky', 'serious', 'driven'];
    const m = peeps.includes(mood) ? mood : (PEEP_MAP[mood] ?? 'happy');
    return `characters/open-peeps/${name}/${m}.svg`;
  }
  if (set === 'notionists') {
    const m = ['happy', 'neutral', 'confused', 'frustrated'].includes(mood) ? mood : (NOTION_MAP[mood] ?? 'neutral');
    return `characters/notionists/${name}/${m}-${pose ?? 'idle'}.svg`;
  }
  return `characters/fluent-emoji/${'flat'}/${name}.svg`;
};

/* ------------------------------------------------------------------ blob rig */

const BODY: Record<string, { d: string; face: number; w: number }> = {
  blob: { d: 'M100 22 C160 22 190 72 190 130 C190 188 152 214 100 214 C48 214 10 188 10 130 C10 72 40 22 100 22 Z', face: 118, w: 200 },
  bot: { d: 'M40 58 H160 Q186 58 186 84 V188 Q186 214 160 214 H40 Q14 214 14 188 V84 Q14 58 40 58 Z', face: 128, w: 200 },
  note: { d: 'M24 34 H176 V168 L142 206 H24 Z', face: 112, w: 200 },
  cloud: { d: 'M52 196 C18 196 6 160 26 140 C10 108 40 76 72 90 C80 52 136 44 152 84 C186 78 204 116 184 140 C204 164 186 196 156 196 Z', face: 140, w: 210 },
  flame: { d: 'M100 14 C118 52 168 80 168 140 C168 186 136 214 100 214 C64 214 32 186 32 140 C32 104 58 92 66 62 C82 84 92 60 100 14 Z', face: 146, w: 200 },
  doc: { d: 'M38 22 H134 L170 58 V206 H38 Z', face: 104, w: 200 },
  dummy: { d: 'M100 26 C152 26 180 64 180 116 C180 168 148 210 100 210 C52 210 20 168 20 116 C20 64 48 26 100 26 Z', face: 128, w: 200 },
  marble: { d: 'M100 30 C152 30 186 70 186 122 C186 174 152 212 100 212 C48 212 14 174 14 122 C14 70 48 30 100 30 Z', face: 124, w: 200 },
  envelope: { d: 'M18 64 H182 V198 H18 Z', face: 146, w: 200 },
  sprout: { d: 'M100 58 C156 58 184 96 184 144 C184 190 150 214 100 214 C50 214 16 190 16 144 C16 96 44 58 100 58 Z', face: 146, w: 200 },
};

const Eyes: React.FC<{ mood: string; blink: number; look: { x: number; y: number }; ink: string; y: number; shape: string }> = ({ mood, blink, look, ink, y, shape }) => {
  const xs = [72, 128];
  const white = shape === 'bot' ? '#e9fffb' : '#ffffff';
  const r = mood === 'surprised' ? 17 : 14;
  const pr = mood === 'surprised' ? 6 : 8.5;
  if (mood === 'joy' || mood === 'love')
    return (
      <g>
        {xs.map((x) =>
          mood === 'love' ? (
            <path key={x} d={`M${x} ${y + 9} l-11 -11 a7 7 0 0 1 11 -8 a7 7 0 0 1 11 8 z`} fill="#ff4d7a" />
          ) : (
            <path key={x} d={`M${x - 12} ${y + 4} Q${x} ${y - 12} ${x + 12} ${y + 4}`} fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round" />
          ),
        )}
      </g>
    );
  if (mood === 'dizzy')
    return (
      <g stroke={ink} strokeWidth={5} strokeLinecap="round">
        {xs.map((x) => (
          <g key={x}>
            <line x1={x - 9} y1={y - 9} x2={x + 9} y2={y + 9} />
            <line x1={x + 9} y1={y - 9} x2={x - 9} y2={y + 9} />
          </g>
        ))}
      </g>
    );
  const lid = mood === 'sleepy' ? 0.55 : mood === 'smug' ? 0.4 : mood === 'angry' || mood === 'determined' ? 0.22 : 0;
  const sy = Math.max(0.08, 1 - blink);
  return (
    <g>
      {xs.map((x) => (
        <g key={x} transform={`translate(${x} ${y}) scale(1 ${sy}) translate(${-x} ${-y})`}>
          <circle cx={x} cy={y} r={r} fill={white} stroke={ink} strokeWidth={3} />
          <circle cx={x + look.x * 5} cy={y + look.y * 4 + 1} r={pr} fill={ink} />
          <circle cx={x + look.x * 5 + 3} cy={y + look.y * 4 - 3} r={2.6} fill="#ffffff" />
          {lid > 0 && <rect x={x - r - 2} y={y - r - 2} width={r * 2 + 4} height={(r * 2 + 4) * lid} fill="currentColor" />}
        </g>
      ))}
    </g>
  );
};

const Brows: React.FC<{ mood: string; ink: string; y: number }> = ({ mood, ink, y }) => {
  const b = y - 26;
  const tilt: Record<string, number> = { angry: 10, determined: 7, worried: -9, sad: -8, surprised: 0, smug: 3 };
  if (!(mood in tilt)) return null;
  const k = tilt[mood]!;
  const up = mood === 'surprised' ? -8 : 0;
  return (
    <g stroke={ink} strokeWidth={5.5} strokeLinecap="round">
      <line x1={58} y1={b + up - k * 0.5} x2={84} y2={b + up + k * 0.5} />
      <line x1={116} y1={b + up + k * 0.5} x2={142} y2={b + up - k * 0.5} />
    </g>
  );
};

const Mouth: React.FC<{ mood: string; ink: string; y: number; open: number }> = ({ mood, ink, y, open }) => {
  const m = y + 34;
  const common = { fill: 'none', stroke: ink, strokeWidth: 5.5, strokeLinecap: 'round' as const };
  switch (mood) {
    case 'joy':
    case 'love':
      return <path d={`M80 ${m - 4} Q100 ${m + 26} 120 ${m - 4} Z`} fill="#5b1f2a" stroke={ink} strokeWidth={4} strokeLinejoin="round" />;
    case 'happy':
      return <path d={`M82 ${m - 2} Q100 ${m + 16} 118 ${m - 2}`} {...common} />;
    case 'calm':
    case 'neutral':
      return <path d={`M88 ${m} Q100 ${m + 7} 112 ${m}`} {...common} />;
    case 'sad':
      return <path d={`M84 ${m + 10} Q100 ${m - 4} 116 ${m + 10}`} {...common} />;
    case 'worried':
      return <path d={`M84 ${m + 4} q5 -5 8 0 q5 5 8 0 q5 -5 8 0 q5 5 8 0`} {...common} />;
    case 'angry':
      return <path d={`M84 ${m + 8} Q100 ${m - 2} 116 ${m + 8}`} {...common} strokeWidth={6.5} />;
    case 'surprised':
      return <ellipse cx={100} cy={m + 4} rx={9} ry={11 + open * 3} fill="#5b1f2a" stroke={ink} strokeWidth={4} />;
    case 'sleepy':
      return <ellipse cx={100} cy={m + 2} rx={6} ry={4} fill="#5b1f2a" stroke={ink} strokeWidth={3} />;
    case 'smug':
      return <path d={`M86 ${m + 2} Q104 ${m + 12} 118 ${m - 6}`} {...common} />;
    case 'dizzy':
      return <path d={`M82 ${m + 4} q6 -8 12 0 q6 8 12 0 q6 -8 12 0`} {...common} />;
    case 'determined':
      return <line x1={86} y1={m + 2} x2={114} y2={m + 2} {...common} />;
    default:
      return <path d={`M82 ${m - 2} Q100 ${m + 16} 118 ${m - 2}`} {...common} />;
  }
};

const Accessory: React.FC<{ kind?: string; ink: string; faceY: number; accent: string }> = ({ kind, ink, faceY, accent }) => {
  if (!kind) return null;
  const y = faceY;
  switch (kind) {
    case 'glasses':
      return (
        <g fill="none" stroke={ink} strokeWidth={4.5}>
          <rect x={52} y={y - 19} width={40} height={36} rx={10} />
          <rect x={108} y={y - 19} width={40} height={36} rx={10} />
          <line x1={92} y1={y - 4} x2={108} y2={y - 4} />
        </g>
      );
    case 'chef-hat':
      return <path d="M58 40 C40 40 36 14 60 12 C66 -6 96 -8 104 6 C116 -6 146 0 144 18 C166 18 164 42 142 42 V58 H58 Z" fill="#ffffff" stroke={ink} strokeWidth={4} strokeLinejoin="round" />;
    case 'cap':
      return <path d="M44 56 C48 18 152 18 156 56 Z M150 56 H190 V64 H150 Z" fill={accent} stroke={ink} strokeWidth={4} strokeLinejoin="round" />;
    case 'crown':
      return <path d="M60 46 L66 14 L84 34 L100 8 L116 34 L134 14 L140 46 Z" fill="#ffd23f" stroke={ink} strokeWidth={4} strokeLinejoin="round" />;
    case 'headset':
      return (
        <g fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round">
          <path d={`M22 ${y} C22 40 178 40 178 ${y}`} />
          <rect x={10} y={y - 12} width={18} height={34} rx={6} fill={accent} />
          <rect x={172} y={y - 12} width={18} height={34} rx={6} fill={accent} />
          <path d={`M24 ${y + 20} Q40 ${y + 56} 80 ${y + 50}`} />
        </g>
      );
    case 'bowtie':
      return <path d={`M100 ${y + 70} L74 ${y + 58} V${y + 84} Z M100 ${y + 70} L126 ${y + 58} V${y + 84} Z`} fill={accent} stroke={ink} strokeWidth={3.5} strokeLinejoin="round" />;
    case 'magnifier':
      return (
        <g>
          <line x1={168} y1={y + 56} x2={196} y2={y + 92} stroke={ink} strokeWidth={9} strokeLinecap="round" />
          <circle cx={156} cy={y + 40} r={24} fill={alpha('#bfe7ff', 0.6)} stroke={ink} strokeWidth={6} />
        </g>
      );
    default:
      return null;
  }
};

/** Shape-specific decoration drawn over the body (antenna, fold, quadrant marks...). */
const Decor: React.FC<{ shape: string; ink: string; color: string; accent: string; f: number }> = ({ shape, ink, color, accent, f }) => {
  const dark = mixHex(color, '#000000', 0.18);
  switch (shape) {
    case 'bot':
      return (
        <g>
          <line x1={100} y1={58} x2={100} y2={28} stroke={ink} strokeWidth={5} />
          <circle cx={100} cy={22} r={10} fill={accent} stroke={ink} strokeWidth={4} opacity={0.6 + 0.4 * ((Math.sin(f / 6) + 1) / 2)} />
          <rect x={34} y={86} width={132} height={86} rx={22} fill={mixHex(color, '#0b1220', 0.55)} stroke={ink} strokeWidth={3.5} />
          <rect x={6} y={110} width={10} height={34} rx={4} fill={dark} stroke={ink} strokeWidth={3} />
          <rect x={184} y={110} width={10} height={34} rx={4} fill={dark} stroke={ink} strokeWidth={3} />
        </g>
      );
    case 'note':
      return <path d="M142 206 V168 H176 Z" fill={dark} stroke={ink} strokeWidth={4} strokeLinejoin="round" />;
    case 'doc':
      return (
        <g>
          <path d="M134 22 V58 H170 Z" fill={dark} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
          {[160, 176, 192].map((y) => (
            <line key={y} x1={60} y1={y} x2={148} y2={y} stroke={alpha(ink, 0.35)} strokeWidth={5} strokeLinecap="round" />
          ))}
        </g>
      );
    case 'dummy':
      return (
        <g>
          <circle cx={100} cy={64} r={20} fill="#ffd23f" stroke={ink} strokeWidth={3.5} />
          <path d="M100 44 A20 20 0 0 1 120 64 H100 Z M100 84 A20 20 0 0 1 80 64 H100 Z" fill="#111111" />
          <line x1={20} y1={150} x2={180} y2={150} stroke={alpha(ink, 0.2)} strokeWidth={3} strokeDasharray="10 8" />
        </g>
      );
    case 'marble':
      return <ellipse cx={70} cy={70} rx={22} ry={14} fill="#ffffff" opacity={0.55} transform="rotate(-30 70 70)" />;
    case 'envelope':
      return <path d="M18 64 L100 132 L182 64" fill="none" stroke={ink} strokeWidth={4.5} strokeLinejoin="round" />;
    case 'sprout':
      return (
        <g stroke={ink} strokeWidth={4} strokeLinejoin="round">
          <line x1={100} y1={58} x2={100} y2={30} />
          <path d="M100 34 C80 6 50 14 48 30 C66 40 88 40 100 34 Z" fill="#7bd36b" />
          <path d="M100 30 C116 2 148 6 152 22 C136 34 114 36 100 30 Z" fill="#9be38a" />
        </g>
      );
    case 'flame':
      return <path d="M100 120 C110 140 128 150 128 172 C128 192 114 204 100 204 C86 204 72 192 72 172 C72 156 86 146 100 120 Z" fill={alpha('#fff3b0', 0.75)} />;
    default:
      return null;
  }
};

const DEFAULT_COLORS: Record<string, string> = { blob: '#8fd3ff', bot: '#b8c7d9', note: '#ffe066', cloud: '#e8eef7', flame: '#ff8a3d', doc: '#ffffff', dummy: '#ffd23f', marble: '#7aa7ff', envelope: '#fff4dc', sprout: '#a9e5a0' };

/** A blob character, `size` px tall. */
export const Blob: React.FC<{ shape?: string; color?: string; mood: string; prevMood?: string; moodT?: number; size: number; blink: number; look: { x: number; y: number }; accessory?: string; sweat?: boolean; blush?: boolean }> = ({ shape = 'blob', color, mood, size, blink, look, accessory, sweat, blush = true }) => {
  const f = useCurrentFrame();
  const P = usePal();
  const body = BODY[shape] ?? BODY.blob!;
  const c = color ?? DEFAULT_COLORS[shape] ?? '#8fd3ff';
  const ink = '#1d1b2c';
  const faceY = body.face;
  const angryTint = mood === 'angry' ? 0.25 : 0;
  const fill = mixHex(c, '#ff4d4d', angryTint);
  return (
    <svg viewBox="-12 -16 224 244" width={(size * 224) / 244} height={size} style={{ overflow: 'visible', display: 'block', color: fill }}>
      <path d={body.d} fill={fill} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
      {/* a soft highlight on the upper body */}
      <ellipse cx={70} cy={faceY - 50} rx={26} ry={12} fill="#ffffff" opacity={shape === 'marble' ? 0 : 0.28} transform={`rotate(-24 70 ${faceY - 50})`} />
      <Decor shape={shape} ink={ink} color={fill} accent={P.fill} f={f} />
      {blush && shape !== 'bot' && (
        <g fill="#ff7a9a" opacity={0.45}>
          <ellipse cx={52} cy={faceY + 26} rx={13} ry={8} />
          <ellipse cx={148} cy={faceY + 26} rx={13} ry={8} />
        </g>
      )}
      <Eyes mood={mood} blink={blink} look={look} ink={ink} y={faceY} shape={shape} />
      <Brows mood={mood} ink={ink} y={faceY} />
      <Mouth mood={mood} ink={shape === 'bot' ? '#e9fffb' : ink} y={faceY} open={(Math.sin(f / 5) + 1) / 2} />
      <Accessory kind={accessory} ink={ink} faceY={faceY} accent={P.fill} />
      {(sweat || mood === 'worried') && <path d={`M168 ${faceY - 40 + ((f * 1.4) % 30)} q8 14 0 20 q-8 -6 0 -20 Z`} fill="#7fd0ff" stroke={ink} strokeWidth={2.5} opacity={0.9} />}
      {mood === 'sleepy' && <text x={176} y={34 - ((f / 2) % 20)} fontSize={34} fontWeight={800} fill={ink} opacity={0.7} fontFamily="sans-serif">z</text>}
    </svg>
  );
};

/* ------------------------------------------------------------------ bubbles */

export const Bubble: React.FC<{ text: string; kind?: string; side: 'left' | 'right'; at: number; until?: number; size?: number }> = ({ text, kind = 'speech', side, at, until, size = 34 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useTheme();
  if (f < at || (until !== undefined && f > until + 8)) return null;
  const sp = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 190 } });
  const o = until === undefined ? 0 : ease(f, until, 7);
  const ink = '#1d1b2c';
  const bg = kind === 'shout' ? '#fff3b0' : '#ffffff';
  const shared: CSSProperties = {
    position: 'relative',
    width: 'max-content',
    maxWidth: 440,
    padding: `${size * 0.5}px ${size * 0.75}px`,
    background: bg,
    color: ink,
    fontFamily: T.ui,
    fontWeight: 800,
    fontSize: size,
    lineHeight: 1.15,
    textAlign: 'center',
    border: `4px solid ${ink}`,
    borderRadius: kind === 'thought' ? 999 : kind === 'shout' ? 10 : 28,
    boxShadow: `0 10px 0 ${alpha(ink, 0.16)}`,
    whiteSpace: text.length < 16 ? 'nowrap' : 'normal',
    rotate: kind === 'shout' ? '-3deg' : undefined,
  };
  const tailX = side === 'right' ? 34 : undefined;
  const tailR = side === 'left' ? 34 : undefined;
  return (
    <div style={{ scale: `${0.4 + 0.6 * sp}`, opacity: Math.min(1, sp * 2) * (1 - o), transformOrigin: side === 'right' ? '10% 100%' : '90% 100%' }}>
      <div style={shared}>
        {text}
        {kind === 'thought' ? (
          <>
            <div style={{ position: 'absolute', bottom: -26, left: tailX, right: tailR, width: 22, height: 22, borderRadius: '50%', background: bg, border: `4px solid ${ink}` }} />
            <div style={{ position: 'absolute', bottom: -46, left: tailX !== undefined ? tailX - 14 : undefined, right: tailR !== undefined ? tailR - 14 : undefined, width: 13, height: 13, borderRadius: '50%', background: bg, border: `3px solid ${ink}` }} />
          </>
        ) : (
          <svg width={44} height={34} style={{ position: 'absolute', bottom: -30, left: tailX, right: tailR, overflow: 'visible' }}>
            <path d={side === 'right' ? 'M4 -4 L8 30 L38 -4' : 'M6 -4 L36 30 L40 -4'} fill={bg} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
            <rect x={side === 'right' ? 8 : 10} y={-9} width={26} height={8} fill={bg} />
          </svg>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ character */

type Timed<T> = ({ at?: any } & T)[];
export type CastMember = {
  who?: string;
  shape?: string;
  color?: string;
  accessory?: string;
  mood?: string;
  pose?: string;
  x?: number;
  y?: number;
  size?: number;
  flip?: boolean;
  label?: string;
  at?: any;
  enter?: string;
  exit?: { at?: any; kind?: string };
  moods?: Timed<{ mood: string; pose?: string }>;
  look?: Timed<{ dir: string }>;
  react?: Timed<{ kind: string }>;
  move?: Timed<{ x: number; y?: number; dur?: number }>;
  bubble?: Timed<{ until?: any; text: string; kind?: string; side?: 'left' | 'right'; size?: number }>;
  pops?: Timed<{ emoji: string }>;
  sweat?: any;
  blush?: boolean;
  z?: number;
};

const LOOK: Record<string, { x: number; y: number }> = { left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, center: { x: 0, y: 0 } };

/**
 * A cast member's author-space (16:9) coordinates mapped into the current frame: x across the
 * content width, feet keeping their distance from the floor, and 80% size in 9:16. Identity in
 * 16:9, and for members whose coordinates are already in frame space (split panels).
 */
export const useMappedCast = (c: CastMember, frameSpace = false): CastMember => {
  const fr = useFrame();
  const A = useArea(80);
  if (fr.wide || frameSpace) return c;
  const k = fr.portrait ? 0.8 : 0.85;
  const out: CastMember = { ...c, size: Math.round((c.size ?? 300) * k) };
  if (c.x !== undefined) out.x = place(c.x, c.y ?? AUTHOR.H - 160, fr, A, 'floor').x;
  if (c.y !== undefined) out.y = place(c.x ?? AUTHOR.W / 2, c.y, fr, A, 'floor').y;
  if (c.move) out.move = c.move.map((m) => ({ ...m, x: place(m.x, m.y ?? c.y ?? AUTHOR.H - 160, fr, A, 'floor').x, ...(m.y !== undefined ? { y: place(m.x, m.y, fr, A, 'floor').y } : {}) }));
  return out;
};

/** One character on stage, its feet at (x, y), timed by cues against scene `t`. */
export const Character: React.FC<{ c: CastMember; t: TimelineScene; index?: number; defaultX?: number; floor?: number; frameSpace?: boolean }> = ({ c: c0, t, index = 0, defaultX, floor: floor0, frameSpace }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const P = usePal();
  const T = useTheme();
  const fr = useFrame();
  const c = useMappedCast(c0, frameSpace);
  const floor = floor0 ?? fr.H - 180;
  const cue = (x: any, fb = 0) => cueFrame(t, x, fb);
  const at = cue(c.at, 4 + index * 5);
  if (f < at - 1) return null;
  const exitAt = c.exit ? cue(c.exit.at, t.duration) : undefined;
  if (exitAt !== undefined && f > exitAt + 14) return null;
  const size = c.size ?? 300;
  const who = c.who ?? 'blob';
  const isBlob = who === 'blob' || who.startsWith('blob');

  // Position: start, then any moves (with a hop while walking).
  let x = c.x ?? defaultX ?? fr.cx;
  let y = c.y ?? floor;
  let walking = 0;
  for (const m of c.move ?? []) {
    const ma = cue(m.at, at + 20);
    const md = Math.max(6, Math.round((m.dur ?? 0.8) * fps));
    const k = interpolate(f, [ma, ma + md], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.2, 1) });
    if (k > 0 && k < 1) walking = Math.abs(Math.sin(k * Math.PI * 4));
    x += (m.x - x) * k;
    if (m.y !== undefined) y += (m.y - y) * k;
  }

  // Mood now (and the one before, for cross-fades).
  let mood = c.mood ?? 'happy';
  let pose = c.pose;
  let prev = mood;
  let since = -999;
  for (const m of [...(c.moods ?? [])].map((m) => ({ ...m, f: cue(m.at, 0) })).sort((a, b) => a.f - b.f)) {
    if (f >= m.f) {
      prev = mood;
      mood = m.mood;
      pose = m.pose ?? pose;
      since = m.f;
    }
  }
  const moodT = ease(f, since, 5);

  // Enter.
  const enter = c.enter ?? 'pop';
  const sp = spring({ frame: f - at, fps, config: { damping: enter === 'drop' ? 9 : 12, stiffness: 180 } });
  let tx = 0;
  let ty = 0;
  let sx = 1;
  let sy = 1;
  let rot = 0;
  let op = 1;
  if (enter === 'pop') {
    sx = sy = 0.3 + 0.7 * sp;
    op = Math.min(1, sp * 2);
  } else if (enter === 'drop') {
    ty = (1 - Math.min(1, ease(f, at, 10, Easing.in(Easing.quad)))) * -700;
    const land = f - (at + 10);
    if (land >= 0) {
      const sq = Math.exp(-land / 5) * Math.cos(land / 2.2);
      sy = 1 - 0.22 * sq;
      sx = 1 + 0.18 * sq;
    }
  } else if (enter === 'rise') {
    ty = (1 - sp) * 260;
    op = Math.min(1, sp * 2);
  } else if (enter === 'left' || enter === 'right') {
    tx = (1 - ease(f, at, 16)) * (enter === 'left' ? -1 : 1) * Math.max(900, fr.W * 0.6);
    walking = Math.max(walking, f < at + 16 ? Math.abs(Math.sin((f - at) / 2.2)) : 0);
  } else if (enter === 'fade') op = ease(f, at, 12);

  // Idle: breathing squash and a slow sway.
  const breathe = Math.sin((f + index * 17) / 13);
  sy *= 1 + 0.018 * breathe;
  sx *= 1 - 0.012 * breathe;
  rot += Math.sin((f + index * 31) / 47) * 1.6;
  ty -= walking * 26;

  // Reactions.
  for (const r of c.react ?? []) {
    const ra = cue(r.at, at + 20);
    const d = f - ra;
    if (d < 0) continue;
    switch (r.kind) {
      case 'jump': {
        if (d < 16) {
          ty -= Math.sin((d / 16) * Math.PI) * 110;
          if (d < 3) sy *= 0.85;
        } else if (d < 26) {
          const sq = Math.exp(-(d - 16) / 4) * Math.cos((d - 16) / 1.8);
          sy *= 1 - 0.18 * sq;
          sx *= 1 + 0.14 * sq;
        }
        break;
      }
      case 'bounce':
        if (d < 24) ty -= Math.abs(Math.sin((d / 12) * Math.PI)) * 46 * (1 - d / 30);
        break;
      case 'shake':
        if (d < 14) tx += Math.sin(d * 2.4) * 16 * (1 - d / 14);
        break;
      case 'tremble':
        tx += noise(f * 2.2, index + 3) * 5;
        break;
      case 'spin':
        if (d < 20) rot += ease(f, ra, 20) * 360;
        break;
      case 'nod':
        if (d < 18) rot += Math.sin((d / 18) * Math.PI * 2) * 7;
        break;
      case 'tilt':
        rot += ease(f, ra, 10) * 9;
        break;
      case 'shrink':
        sx *= 1 - 0.14 * ease(f, ra, 10);
        sy *= 1 - 0.14 * ease(f, ra, 10);
        break;
      case 'grow':
        sx *= 1 + 0.12 * ease(f, ra, 10, Easing.bezier(0.34, 1.56, 0.64, 1));
        sy *= 1 + 0.12 * ease(f, ra, 10, Easing.bezier(0.34, 1.56, 0.64, 1));
        break;
      case 'squash':
        if (d < 18) {
          const sq = Math.exp(-d / 4) * Math.cos(d / 1.8);
          sy *= 1 - 0.25 * sq;
          sx *= 1 + 0.2 * sq;
        }
        break;
      case 'faint':
        rot += ease(f, ra, 14, Easing.in(Easing.quad)) * 80 * (c.flip ? -1 : 1);
        ty += ease(f, ra, 14, Easing.in(Easing.quad)) * size * 0.25;
        break;
    }
  }

  // Exit.
  if (exitAt !== undefined && f >= exitAt) {
    const k = ease(f, exitAt, 12, Easing.in(Easing.quad));
    const kind = c.exit?.kind ?? 'fade';
    if (kind === 'left' || kind === 'right') tx += k * (kind === 'left' ? -1000 : 1000);
    else if (kind === 'drop') ty += k * 600;
    else if (kind === 'shrink') {
      sx *= 1 - k;
      sy *= 1 - k;
    }
    op *= 1 - k;
  }

  // Blink every 2 to 4 s, two frames closing, two opening.
  const period = 66 + Math.floor(hash(index, 7) * 48);
  const ph = (f + Math.floor(hash(index, 3) * period)) % period;
  const blink = ph < 2 ? ph / 2 : ph < 4 ? 1 - (ph - 2) / 2 : 0;
  let look = LOOK.center!;
  for (const l of c.look ?? []) if (f >= cue(l.at, 0)) look = LOOK[l.dir] ?? look;
  const sweat = c.sweat !== undefined && f >= cue(c.sweat, 0);

  const w = isBlob ? (size * 224) / 244 : who.startsWith('fluent') || who.startsWith('emoji') ? size : size;
  const body = (m: string, p?: string): ReactNode =>
    isBlob ? (
      <Blob shape={c.shape ?? (who.includes(':') ? who.split(':')[1] : 'blob')} color={c.color} mood={BLOB_MOODS.includes(m) ? m : 'happy'} size={size} blink={blink} look={look} accessory={c.accessory} sweat={sweat} blush={c.blush} />
    ) : who.startsWith('fluent') || who.startsWith('emoji') ? (
      <Emoji name={who.split('/')[1]!} size={size} flat={size > 256} />
    ) : (
      <Img src={staticFile(assetSrc(who, m, p))} style={{ width: size, height: size, display: 'block' }} />
    );

  const bubbles = (c.bubble ?? []).map((b, i) => {
    const ba = cue(b.at, at + 10);
    const bu = b.until !== undefined ? cue(b.until, t.duration) : undefined;
    const side = b.side ?? (x < fr.W / 2 ? 'right' : 'left');
    return (
      <div key={i} style={{ position: 'absolute', bottom: size * (isBlob ? 0.92 : 0.86), [side === 'right' ? 'left' : 'right']: w * 0.55, zIndex: 5 }}>
        <Bubble text={b.text} kind={b.kind} side={side} at={ba} until={bu} size={b.size} />
      </div>
    );
  });
  const pops = (c.pops ?? []).map((p, i) => {
    const pa = cue(p.at, at + 10);
    const d = f - pa;
    if (d < 0 || d > 40) return null;
    const k = spring({ frame: d, fps, config: { damping: 10, stiffness: 200 } });
    return (
      <div key={i} style={{ position: 'absolute', left: w * (0.62 + (i % 2) * 0.1), bottom: size * 0.9 + d * 2.2, opacity: d > 28 ? 1 - (d - 28) / 12 : 1, scale: `${k}`, rotate: `${(i % 2 ? 1 : -1) * 12}deg` }}>
        <Emoji name={p.emoji} size={Math.max(70, size * 0.32)} />
      </div>
    );
  });

  return (
    <div style={{ position: 'absolute', left: x - w / 2 + tx, top: y - size + ty, width: w, height: size, opacity: op, zIndex: c.z ?? 2 }}>
      {/* contact shadow */}
      <div style={{ position: 'absolute', left: w * 0.12, right: w * 0.12, bottom: -size * 0.03 - ty * 0, height: size * 0.07, borderRadius: '50%', background: alpha('#000000', P.dark ? 0.45 : 0.18), filter: 'blur(6px)', scale: `${1 - Math.min(0.5, Math.max(0, -ty) / 400)}`, translate: `0 ${-ty}px` }} />
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 100%', scale: `${(c.flip ? -1 : 1) * sx} ${sy}`, rotate: `${rot}deg` }}>
        {moodT < 1 && prev !== mood && <div style={{ position: 'absolute', inset: 0, opacity: 1 - moodT }}>{body(prev, c.pose)}</div>}
        <div style={{ position: 'absolute', inset: 0, opacity: prev !== mood ? moodT : 1 }}>{body(mood, pose)}</div>
      </div>
      {c.label && (
        <div style={{ position: 'absolute', top: size + 14, left: '50%', translate: '-50% 0', padding: '8px 18px', borderRadius: 999, background: P.surface, color: P.ink, border: `2px solid ${P.cardBorder}`, fontFamily: T.mono, fontWeight: 700, fontSize: 22, letterSpacing: 2, textTransform: 'uppercase', whiteSpace: 'nowrap', boxShadow: '0 10px 24px -12px rgba(0,0,0,0.5)' }}>{c.label}</div>
      )}
      {bubbles}
      {pops}
    </div>
  );
};

/** A row of characters, spread across a span (frame px) when they have no x. */
export const CastLayer: React.FC<{ cast: CastMember[]; t: TimelineScene; floor?: number; span?: [number, number] }> = ({ cast, t, floor, span: span0 }) => {
  const n = cast.length;
  const fr = useFrame();
  const A = useArea(80);
  const span: [number, number] = span0 ?? (fr.wide ? [380, 1540] : [A.left + 140, A.right - 140]);
  return (
    <>
      {cast.map((c, i) => (
        <Character key={i} c={c} t={t} index={i} floor={floor} defaultX={n === 1 ? (span[0] + span[1]) / 2 : span[0] + ((span[1] - span[0]) * i) / Math.max(1, n - 1)} />
      ))}
    </>
  );
};

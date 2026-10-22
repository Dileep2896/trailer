// The trailer config (.trailer/trailer.config.json) and what the engine generates for the video.

export type Box = { x: number; y: number; width: number; height: number };
export type Shot = { src: string; width: number; height: number; view?: number; boxes: Record<string, Box> };

export type GiantLine = { text: string; accent?: boolean };
/** main: the theme's surface; alt: the inverted one. ('stage' and 'paper' are v1 aliases.) */
export type Bg = 'main' | 'alt' | 'stage' | 'paper';

/** When something happens in a scene: a line index, a spoken word, "2.5s", "end"... (see cues.mjs). */
export type Cue = number | string | { line?: number; word?: string; nth?: number; s?: number; offset?: number; edge?: 'start' | 'end' };
export type Say = string | { text: string; gap?: number } | (string | { text: string; gap?: number })[];

type Base = {
  id?: string;
  lead?: number;
  tail?: number;
  min?: number;
  bg?: Bg;
  transition?: string;
  typeStyle?: string;
  /** v3: this scene's voice lines. */
  say?: Say;
  /** v3: seconds of breathing room after the last line (the tail). */
  breath?: number;
  /** v3: the scene lasts at least this many seconds. */
  hold?: number;
  /** v3: where captions sit in this scene (auto follows the theme). */
  captions?: 'auto' | 'bottom' | 'top' | 'lower-third' | 'center-low' | 'off';
  /** v3: the scene where the project is named (the music's drums come in here). */
  turn?: boolean;
  /** v3: take the poster frame from this scene. */
  poster?: boolean;
  /** Last scene: fade its final frames into frame 0 (scene 1 settled), so the film loops cleanly. */
  loop?: boolean;
  /** Scene 1: "settled" shows its first cue already in place on frame 0; "live" starts empty. */
  firstFrame?: 'settled' | 'live';
  /** v3: characters over any scene. */
  cast?: any[];
  /** v3: extra sound cues. */
  sfx?: { at?: Cue; name: string; volume?: number }[];
  /** Per-aspect partial scene, deep-merged when rendering that aspect (applied by normalizeConfig). */
  variants?: Record<string, Record<string, unknown>>;
};

export type HookScene = Base & { type: 'hook'; giant: GiantLine[]; sub?: string };
export type ProblemScene = Base & {
  type: 'problem';
  title?: GiantLine[];
  nodes: { label: string; sub?: string }[];
  caption?: string;
};
export type RevealScene = Base & { type: 'reveal'; tagline?: string };
export type FeaturesScene = Base & { type: 'features'; eyebrow?: string; whyLabel?: string; items: { title: string; why: string }[] };
export type WalkShot = {
  page: string;
  eyebrow?: string;
  title: string;
  why?: string;
  target?: string;
  ring?: string;
  highlight?: string;
  zoom?: number;
  click?: boolean;
  clickAt?: number;
  toast?: { title: string; sub?: string };
};
export type WalkthroughScene = Base & { type: 'walkthrough'; whyLabel?: string; shots: WalkShot[] };
export type Metric = { label: string; from: number; to: number; prefix?: string; suffix?: string; decimals?: number; note?: string };
export type MetricScene = Base & { type: 'metric'; eyebrow?: string; title?: string; metrics: Metric[]; style?: 'cards' | 'ring' | 'bars' | 'flip' | 'gauge'; verdict?: { text: string; at?: Cue } };
export type PayoffScene = Base & { type: 'payoff'; giant: GiantLine[]; then?: GiantLine[] };
export type EndScene = Base & { type: 'end'; tagline?: string; cta?: string };

export type V3Type =
  | 'kinetic' | 'title' | 'outro' | 'cast' | 'ui' | 'screenshot' | 'split' | 'evidence'
  | 'casefile' | 'scoreboard' | 'chalkboard' | 'chat' | 'countdown' | 'rewind' | 'calendar' | 'lanes';
/** v3 scenes are config-driven; each scene file documents its fields. */
export type V3Scene = Base & { type: V3Type; [k: string]: any };

export type SceneConfig = HookScene | ProblemScene | RevealScene | FeaturesScene | WalkthroughScene | MetricScene | PayoffScene | EndScene | V3Scene;

export type TrailerConfig = {
  $schema?: string;
  /** Trailer schema version (1). The legacy `kit: 3` means the same. */
  version?: number;
  /** Internal: 3 for every current config (set by normalizeConfig). */
  kit?: number;
  _normalized?: boolean;
  /** The aspect this config is rendered at (set by normalizeConfig from --aspect, the cut or the config). */
  aspect?: '16:9' | '9:16' | '1:1';
  /** The cut being rendered, if any (set by normalizeConfig). */
  cut?: string | null;
  targetSeconds?: number;
  projectName: string;
  tagline?: string;
  repoUrl?: string;
  link?: { text: string; url?: string };
  credit?: { text: string; scene?: string };
  narration?: { person?: 'third' | 'first' | 'any' };
  /** Design tokens of the app itself, for recreated UI. */
  app?: Record<string, any>;
  accent?: string;
  secondAccent?: string;
  fonts?: { display?: string; ui?: string; mono?: string };
  theme?: Record<string, unknown>;
  captions?: boolean | Record<string, unknown>;
  sfx?: boolean | number;
  fitSeconds?: number;
  voiceSpeed?: number;
  forbiddenTerms?: string[];
  voice?: string | { provider?: string; model?: string; speed?: number; sayVoice?: string };
  music?: string | { bpm?: number; mood?: string; file?: string; volume?: number };
  scenes: SceneConfig[];
  lines: { scene: string; text: string; gap?: number }[];
  capture?: unknown;
  cuts?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export type Word = { w: string; start: number; end: number };
export type TimelineLine = { index: number; src: string | null; from: number; frames: number; local: number; scene: string; text: string; words: Word[] | null };
export type TimelineScene = { id: string; type: SceneConfig['type']; from: number; duration: number; lines: TimelineLine[] };
export type Timeline = { scenes: TimelineScene[]; lines: TimelineLine[]; total: number; fps: number; beat: number; text?: boolean; fit: { target: number; scale: number; met: boolean } | null };

/** Input props of the Trailer composition (the engine writes them to .trailer/.stage/<render>/props.json). */
export type TrailerProps = {
  config: TrailerConfig;
  shots: Record<string, Shot>;
  media: { lines: { src: string | null; seconds: number; words?: Word[] | null }[] };
  music: string | null;
  /** Draw the safe-area guides (stills and review frames only, never a final render). */
  overlay?: boolean;
};

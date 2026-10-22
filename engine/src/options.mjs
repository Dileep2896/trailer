// Every style option a trailer config can set, its allowed values and defaults, the theme
// presets, and resolveTheme(), which turns a config into one complete set of tokens. Shared
// by the node scripts (validation, lint, audio, the JSON Schema generator) and the video, so
// all of them read the same lists. scripts/gen-schema.mjs builds the schema enums from here.

/* ------------------------------------------------------------------ enumerations */

export const BACKGROUNDS = ['plain', 'grid', 'blueprint', 'paper-grain', 'scanlines', 'dots', 'gradient-mesh', 'noise-glow', 'newsprint', 'concrete'];
export const CHROMES = ['mac', 'minimal', 'terminal', 'none', 'device-frame'];
export const TRANSITIONS = ['whip', 'cut', 'mosaic', 'wipe', 'page-turn', 'glitch', 'iris', 'slide-stack', 'redaction-bar', 'push', 'zoom', 'dissolve', 'flash'];
export const MOTIONS = ['calm', 'smooth', 'snappy', 'bouncy', 'aggressive'];
export const CAMERAS = ['static', 'drift', 'push', 'handheld-subtle'];
export const TYPES = ['giant-kinetic', 'stacked', 'typewriter', 'stamp', 'split-reveal'];
export const MOTIFS = ['none', 'radar-sweep', 'ecg-line', 'measurement-ticks', 'highlighter', 'scoreboard', 'calendar-grid', 'heat-glow', 'chalk-underline', 'hazard-stripes'];
export const MOODS = ['calm', 'warm', 'tense', 'driving', 'playful'];
export const CAPTION_POSITIONS = ['bottom', 'top', 'lower-third', 'center-low'];
/** A scene's own caption setting (auto follows the config). */
export const SCENE_CAPTIONS = ['auto', ...CAPTION_POSITIONS, 'off'];
export const CAPTION_STYLES = ['box', 'outline', 'plain', 'pill'];
export const FONT_ROLES = ['display', 'ui', 'mono'];
export const ASPECTS = ['16:9', '9:16', '1:1'];
export const USE_CASES = ['explainer', 'launch', 'jobhunt', 'hackathon', 'shorts'];
/**
 * deepgram, say (macOS) and none (a silent draft) narrate or stand in for a narrator; text is
 * the no-voice mode: no narration at all, each line shown as on-screen text at a reading pace,
 * music and sound effects only. espeak-ng is reached only as a fallback.
 */
export const VOICE_PROVIDERS = ['deepgram', 'say', 'none', 'text'];
/** Deepgram Aura 2 model names. The list of voices changes, so only the shape is checked. */
export const VOICE_MODEL = /^aura-2-[a-z]+-[a-z]{2}$/;
export const DEFAULT_VOICE = { provider: 'deepgram', model: 'aura-2-hermes-en', speed: 1.0, sayVoice: 'Samantha' };

/**
 * The mix with no voice. A narrated film sits near -17 LUFS because the voice (-16 LUFS) carries
 * it, with the bed at 0.42 between lines and 0.12 under them. With no voice the bed at 0.42
 * leaves the film near -24.5 LUFS, so the text mode lifts the bed to 0.75 (+5 dB) and the sound
 * effects by 1.4x (+3 dB, so they still cut through the louder bed). music.volume and sfx scale
 * on top.
 */
export const TEXT_MIX = { music: 0.75, sfx: 1.4 };

/** The no-voice mode: config.voice is { "provider": "text" } (on the normalized config). */
export const isTextMode = (config = {}) => {
  const v = config?.voice;
  return !!v && typeof v === 'object' && v.provider === 'text';
};

/* ------------------------------------------------------------------ scene vocabularies */

export const UI_ELEMENTS = ['header', 'text', 'card', 'table', 'list', 'diff', 'code', 'chips', 'chart', 'toggle', 'stat', 'progress', 'button', 'input', 'row', 'kv', 'toast', 'spacer', 'shapes', 'col'];
export const UI_FRAMES = ['browser', 'app', 'phone', 'panel', 'none'];
export const KINETIC_LAYOUTS = ['center', 'left', 'stack'];
export const KINETIC_FX = ['rise', 'mask', 'punch', 'blur', 'stamp', 'type', 'split', 'swap', 'count'];
export const TITLE_LAYOUTS = ['card', 'slate', 'broadcast', 'stamp', 'marquee', 'hud'];
export const OUTRO_LAYOUTS = ['card', 'folder', 'scoreboard', 'ticket', 'certificate', 'cloche', 'calendar', 'chalk', 'packet'];
export const EVIDENCE_LAYOUTS = ['wall', 'stack', 'grid', 'row'];
export const EVIDENCE_KINDS = ['quote', 'thread', 'post', 'stat', 'headline'];
export const METRIC_STYLES = ['cards', 'ring', 'bars', 'flip', 'gauge'];
export const SPLIT_MODES = ['versus', 'before-after'];
export const CHAT_STYLES = ['messenger', 'thread'];
export const COUNTDOWN_STYLES = ['ring', 'bold', 'crash'];
export const SCREENSHOT_FRAMES = ['browser', 'device', 'plain'];
export const CASEFILE_PINS = ['note', 'photo', 'exhibit', 'poster', 'card'];
export const CHALK_KINDS = ['text', 'circle', 'rect', 'line', 'arrow', 'poly', 'cross', 'tick', 'underline', 'dot', 'fill'];
export const TONES = ['bad', 'danger', 'good', 'ok', 'warn', 'muted', 'ink', 'accent', 'accent2', 'neutral'];
export const SURFACES = ['main', 'alt', 'stage', 'paper'];

/* ------------------------------------------------------------------ characters */

export const BLOB_SHAPES = ['blob', 'bot', 'note', 'cloud', 'flame', 'doc', 'dummy', 'marble', 'envelope', 'sprout'];
export const BLOB_MOODS = ['happy', 'joy', 'calm', 'neutral', 'sad', 'worried', 'angry', 'surprised', 'sleepy', 'smug', 'dizzy', 'love', 'determined'];
export const ACCESSORIES = ['glasses', 'chef-hat', 'headset', 'bowtie', 'magnifier', 'cap', 'crown'];
export const CAST_ENTERS = ['pop', 'drop', 'rise', 'left', 'right', 'fade', 'none'];
export const CAST_REACTS = ['jump', 'shake', 'bounce', 'spin', 'nod', 'tilt', 'shrink', 'grow', 'tremble', 'faint', 'squash'];
export const BUBBLE_KINDS = ['speech', 'thought', 'shout'];
export const NOTIONIST_POSES = ['idle', 'point', 'wave', 'ok', 'phone', 'hands-up'];
/** SFX the engine synthesizes (scripts/audio.mjs); a scene's sfx[].sound names one. */
export const SFX_NAMES = ['click', 'pop', 'tick', 'ding', 'impact', 'whoosh', 'glitch', 'swish', 'thunk', 'key', 'riser', 'gavel', 'whistle', 'buzzer', 'rewind', 'chalk', 'chime', 'shatter', 'boing', 'beep'];

/** Google fonts a config can name, grouped by feel. Each loads only when a config uses it. */
export const FONT_GROUPS = {
  grotesk: ['Inter', 'Inter Tight', 'Geist', 'Sora', 'Space Grotesk', 'Manrope', 'DM Sans', 'Plus Jakarta Sans', 'Outfit', 'Archivo', 'Archivo Black', 'Syne', 'Unbounded', 'Bricolage Grotesque', 'Schibsted Grotesk', 'Hanken Grotesk', 'Familjen Grotesk', 'Work Sans', 'IBM Plex Sans', 'Lexend', 'Figtree', 'Onest', 'Chivo', 'Epilogue', 'Instrument Sans', 'Public Sans'],
  serif: ['Fraunces', 'Instrument Serif', 'Playfair Display', 'DM Serif Display', 'Newsreader', 'Source Serif 4', 'Libre Baskerville', 'Cormorant Garamond', 'EB Garamond', 'IBM Plex Serif', 'Literata', 'Lora', 'Gloock', 'Young Serif'],
  slab: ['Roboto Slab', 'Zilla Slab', 'Bitter'],
  condensed: ['Bebas Neue', 'Anton', 'Oswald', 'Barlow Condensed', 'Archivo Narrow', 'Roboto Condensed', 'Saira Condensed', 'Teko'],
  mono: ['JetBrains Mono', 'IBM Plex Mono', 'Space Mono', 'DM Mono', 'Fira Code', 'Geist Mono', 'Share Tech Mono', 'VT323'],
  rounded: ['Nunito', 'Quicksand', 'Fredoka', 'Rubik', 'Varela Round', 'M PLUS Rounded 1c', 'Baloo 2'],
  hand: ['Caveat', 'Permanent Marker', 'Kalam', 'Architects Daughter'],
};
export const FONT_NAMES = Object.values(FONT_GROUPS).flat();

/* ------------------------------------------------------------------ motion energy */

/** Arrival easing (cubic bezier), duration scale, spring and impact shake per energy. */
export const MOTION = {
  calm: { ease: [0.33, 0, 0.18, 1], speed: 1.4, spring: { damping: 28, stiffness: 70 }, stagger: 1.35, shake: 0 },
  smooth: { ease: [0.16, 1, 0.3, 1], speed: 1, spring: { damping: 15, stiffness: 150 }, stagger: 1, shake: 0 },
  snappy: { ease: [0.05, 0.9, 0.1, 1], speed: 0.7, spring: { damping: 20, stiffness: 300 }, stagger: 0.75, shake: 0 },
  bouncy: { ease: [0.34, 1.56, 0.64, 1], speed: 0.95, spring: { damping: 8, stiffness: 170 }, stagger: 1, shake: 0.3 },
  aggressive: { ease: [0, 0.95, 0.05, 1], speed: 0.55, spring: { damping: 12, stiffness: 380 }, stagger: 0.6, shake: 1 },
};

/* ------------------------------------------------------------------ colour */

const hexRgb = (h) => {
  const x = /^#[0-9a-f]{3}$/i.test(h) ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
  return [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
};
const rgbHex = (rgb) => `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
export const isHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
/** Mix colour a toward b by t (0..1). */
export const mixHex = (a, b, t) => {
  const x = hexRgb(a);
  const y = hexRgb(b);
  return rgbHex(x.map((v, i) => v + (y[i] - v) * t));
};
export const luminance = (c) => {
  const [r, g, b] = hexRgb(c).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
/** `c` moved toward `toward` until it reads at `min` contrast on `bg`. */
export const readable = (c, bg, toward, min = 3) => {
  for (let t = 0; t <= 1; t += 0.05) {
    const m = mixHex(c, toward, t);
    if (contrast(m, bg) >= min) return m;
  }
  return toward;
};

/* ------------------------------------------------------------------ defaults and presets */

const MODE = {
  dark: { bg: '#0b111c', surface: '#151d2b', ink: '#eef2f6', muted: '#a3aebb' },
  light: { bg: '#f3f5f7', surface: '#ffffff', ink: '#0e1726', muted: '#5b6675' },
};

export const DEFAULT_THEME = {
  preset: null,
  mode: 'dark',
  accent: '#3b82f6',
  accent2: '#4c6ef5',
  warn: '#ff5d5d',
  fonts: { display: 'Sora', ui: 'Inter', mono: 'JetBrains Mono' },
  displayCase: 'upper',
  displayWeight: 800,
  tracking: -0.045,
  radius: 26,
  background: 'dots',
  altBackground: null,
  chrome: 'mac',
  transition: 'whip',
  motion: 'smooth',
  camera: 'push',
  type: 'giant-kinetic',
  motif: 'none',
  grain: 0.05,
  rhythm: 'alternate',
};

/**
 * Starting points. A preset fills in every token; anything the config sets wins. Give each
 * video its own accent and fonts on top, so two videos on one preset still look different.
 */
export const PRESETS = {
  studio: {},
  terminal: {
    mode: 'dark', bg: '#07100b', surface: '#0d1a12', ink: '#d7ffe4', muted: '#7fa38c', accent: '#39ff88', accent2: '#00b3ff', warn: '#ff4d6d',
    fonts: { display: 'JetBrains Mono', ui: 'IBM Plex Mono', mono: 'JetBrains Mono' }, displayCase: 'none', displayWeight: 700, tracking: -0.03, radius: 6,
    background: 'scanlines', chrome: 'terminal', transition: 'glitch', motion: 'snappy', camera: 'handheld-subtle', type: 'typewriter', motif: 'scoreboard', grain: 0.07, rhythm: 'mono',
  },
  editorial: {
    mode: 'light', bg: '#f4eee3', surface: '#fffaf1', ink: '#1d1a16', muted: '#6d655a', accent: '#c2410c', accent2: '#1e3a8a', warn: '#b91c1c',
    fonts: { display: 'Fraunces', ui: 'Newsreader', mono: 'IBM Plex Mono' }, displayCase: 'none', displayWeight: 600, tracking: -0.025, radius: 4,
    background: 'paper-grain', chrome: 'minimal', transition: 'page-turn', motion: 'calm', camera: 'drift', type: 'split-reveal', motif: 'highlighter', grain: 0.06, rhythm: 'mono',
  },
  blueprint: {
    mode: 'dark', bg: '#0b2a4a', surface: '#123760', ink: '#e8f1ff', muted: '#9fb8d8', accent: '#ffd23f', accent2: '#5ad1ff', warn: '#ff6b6b',
    fonts: { display: 'Space Grotesk', ui: 'IBM Plex Sans', mono: 'IBM Plex Mono' }, displayCase: 'upper', displayWeight: 700, tracking: -0.02, radius: 2,
    background: 'blueprint', chrome: 'minimal', transition: 'wipe', motion: 'smooth', camera: 'static', type: 'stacked', motif: 'measurement-ticks', grain: 0.03, rhythm: 'mono',
  },
  playful: {
    mode: 'light', bg: '#fff6e9', surface: '#ffffff', ink: '#2b2146', muted: '#6f6790', accent: '#ff5fa2', accent2: '#5b8cff', warn: '#ff7a45',
    fonts: { display: 'Fredoka', ui: 'Nunito', mono: 'DM Mono' }, displayCase: 'none', displayWeight: 700, tracking: -0.02, radius: 34,
    background: 'dots', chrome: 'device-frame', transition: 'slide-stack', motion: 'bouncy', camera: 'drift', type: 'stamp', motif: 'chalk-underline', grain: 0.02, rhythm: 'mono',
  },
  newsroom: {
    mode: 'light', bg: '#efede6', surface: '#ffffff', ink: '#111111', muted: '#5c5c5c', accent: '#e10600', accent2: '#111111', warn: '#e10600',
    fonts: { display: 'Anton', ui: 'Libre Baskerville', mono: 'Space Mono' }, displayCase: 'upper', displayWeight: 400, tracking: 0, radius: 0,
    background: 'newsprint', chrome: 'none', transition: 'redaction-bar', motion: 'aggressive', camera: 'push', type: 'stamp', motif: 'none', grain: 0.08, rhythm: 'mono',
  },
  brutal: {
    mode: 'dark', bg: '#1a1a1a', surface: '#262626', ink: '#f5f5f0', muted: '#a8a8a0', accent: '#ffcc00', accent2: '#ff3b30', warn: '#ff3b30',
    fonts: { display: 'Archivo Black', ui: 'Work Sans', mono: 'Space Mono' }, displayCase: 'upper', displayWeight: 400, tracking: -0.02, radius: 0,
    background: 'concrete', chrome: 'minimal', transition: 'cut', motion: 'aggressive', camera: 'static', type: 'stacked', motif: 'hazard-stripes', grain: 0.09, rhythm: 'mono',
  },
};

/**
 * One complete theme from a config: preset, then the legacy top-level keys (accent,
 * secondAccent, fonts), then config.theme. Colours not given come from the mode.
 */
export const resolveTheme = (config = {}) => {
  const t = config.theme ?? {};
  const preset = PRESETS[t.preset] ?? {};
  const legacy = {};
  if (config.accent) legacy.accent = config.accent;
  if (config.secondAccent) legacy.accent2 = config.secondAccent;
  const merged = { ...DEFAULT_THEME, ...preset, ...legacy, ...t };
  merged.fonts = { ...DEFAULT_THEME.fonts, ...preset.fonts, ...config.fonts, ...t.fonts };
  const mode = merged.mode === 'light' ? 'light' : 'dark';
  merged.mode = mode;
  // Colours the preset or config did not set follow the mode (a preset's colours belong to its
  // own mode, so flipping a preset's mode resets them unless the config sets them).
  const modeFlipped = preset.mode && t.mode && preset.mode !== t.mode;
  for (const k of ['bg', 'surface', 'ink', 'muted']) merged[k] = t[k] ?? (modeFlipped ? MODE[mode][k] : preset[k]) ?? MODE[mode][k];
  for (const k of ['accent', 'accent2', 'warn']) if (!isHex(merged[k])) merged[k] = DEFAULT_THEME[k];
  return merged;
};

/** The music settings: { bpm, mood, file }. config.music may be a path (a licensed track). */
export const resolveMusic = (config = {}) => {
  const m = config.music;
  if (typeof m === 'string') return { bpm: 120, mood: 'driving', file: m };
  const bpm = Math.max(90, Math.min(132, Number(m?.bpm ?? 120) || 120));
  return { bpm, mood: MOODS.includes(m?.mood) ? m.mood : 'driving', file: m?.file ?? null, volume: m?.volume ?? 1 };
};

/** Sound effects on/off and their level: config.sfx is true, false or a volume (0..2). */
export const resolveSfx = (config = {}) => {
  const s = config.sfx;
  if (s === false) return 0;
  if (typeof s === 'number') return Math.max(0, Math.min(2, s));
  return 1;
};

export const DEFAULT_CAPTIONS = { enabled: true, position: 'bottom', style: 'box', size: 50, case: 'none', fontRole: 'ui', activeWordColor: null, maxWords: 6, weight: 700, avoid: true };

/** Caption defaults per aspect: vertical shorts read best as 3 big words just below the centre. */
export const ASPECT_CAPTIONS = {
  '16:9': {},
  '9:16': { position: 'center-low', size: 64, maxWords: 3 },
  '1:1': { size: 54, maxWords: 4 },
};

/**
 * Caption defaults in the no-voice (text) mode: the captions are the script, so they are set in
 * the display face, at most one short phrase at a time, sized up to fill the caption band on
 * one line (Captions.tsx), and shown whole (no karaoke word lighting).
 */
export const TEXT_CAPTIONS = {
  '16:9': { fontRole: 'display', maxWords: 5 },
  '9:16': { fontRole: 'display', maxWords: 3 },
  '1:1': { fontRole: 'display', maxWords: 4 },
};

/**
 * The caption settings for a (normalized) config at its aspect. In 9:16 and 1:1 the size never
 * drops below the aspect's default and a chunk never holds more words than it, so a 16:9
 * caption style still reads on a phone; a cut's own `captions` set exactly what it wants.
 */
export const resolveCaptions = (config = {}) => {
  const c = config.captions === false ? { enabled: false } : config.captions === true ? {} : (config.captions ?? {});
  const aspect = config.aspect ?? '16:9';
  const per = ASPECT_CAPTIONS[aspect] ?? {};
  const text = isTextMode(config);
  const out = { ...DEFAULT_CAPTIONS, ...(config.kit !== undefined && config.kit < 3 ? { size: 46 } : {}), ...per, ...(text ? TEXT_CAPTIONS[aspect] ?? TEXT_CAPTIONS['16:9'] : {}), ...c };
  // In the text mode the captions carry the whole script: they are always on, set in the
  // display face (a subtitle face chosen for a voiced film yields to it), and a phrase never
  // holds more words than the mode's default.
  if (text) {
    out.enabled = true;
    out.fontRole = 'display';
    out.reading = true;
    out.maxWords = Math.min(out.maxWords, (TEXT_CAPTIONS[aspect] ?? TEXT_CAPTIONS['16:9']).maxWords);
  } else out.reading = false;
  if (aspect !== '16:9') {
    // The film's 16:9 caption settings yield to the aspect's defaults, except where a cut sets
    // its own captions.
    const own = config.cut ? (config._cutCaptions ?? {}) : {};
    if (per.size && own.size === undefined) out.size = Math.max(out.size, per.size);
    if (per.maxWords && own.maxWords === undefined) out.maxWords = Math.min(out.maxWords, per.maxWords);
    if (aspect === '9:16' && own.position === undefined && (out.position === 'lower-third' || out.position === 'bottom')) out.position = 'center-low';
  }
  return out;
};

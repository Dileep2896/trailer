// Shared by every script: a project's .trailer/ paths, loading and validating its config,
// linting its copy, the word budget, and the voice settings.
//
// A project keeps everything under <projectDir>/.trailer/:
//   trailer.config.json  brief.md  script.md  assets/        (committed)
//   out/ voice/ shots/ review/ .stage/ private/ .env           (gitignored)
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { FPS, SCENE_TYPES, sceneId, settledStart } from '../src/timeline.mjs';
import { ASPECTS, V3_TYPES, aspectSlug, normalizeConfig } from '../src/config.mjs';
import {
  isTextMode, resolveCaptions,
  BACKGROUNDS, CAMERAS, CAPTION_POSITIONS, CAPTION_STYLES, CHROMES, DEFAULT_VOICE, FONT_NAMES, FONT_ROLES, MOODS, MOTIFS, MOTIONS, PRESETS,
  SCENE_CAPTIONS, SFX_NAMES, SURFACES, TRANSITIONS, TYPES, UI_ELEMENTS, USE_CASES, VOICE_MODEL, VOICE_PROVIDERS, isHex,
} from '../src/options.mjs';
import { ENGINE } from './runtime.mjs';
import { sceneStrings } from '../src/copy.mjs';

export const PUBLIC = resolve(ENGINE, 'public');
export const CONFIG_NAME = 'trailer.config.json';

/** Keys older configs used; still read, no longer part of the public schema. */
export const LEGACY_KEYS = ['lines', 'ownerVoiceOverride', 'voiceSpeed', 'outDir', 'slug', 'accent', 'secondAccent', 'fonts', 'kit'];

/* ------------------------------------------------------------------ paths */

export const projectPaths = (projectDir, configFile) => {
  const dir = resolve(projectDir);
  const sr = resolve(dir, '.trailer');
  const file = configFile ? resolve(process.cwd(), configFile) : resolve(sr, CONFIG_NAME);
  return {
    projectDir: dir,
    sr,
    file,
    configDir: dirname(file),
    assets: resolve(sr, 'assets'),
    out: resolve(sr, 'out'),
    voice: resolve(sr, 'voice'),
    shots: resolve(sr, 'shots'),
    reviewRoot: resolve(sr, 'review'),
    stageRoot: resolve(sr, '.stage'),
    private: resolve(sr, 'private'),
    env: resolve(sr, '.env'),
  };
};

/** "trailer-16x9" or "trailer-9x16-short". */
export const renderName = (aspect, cut) => `trailer-${aspectSlug(aspect)}${cut ? `-${cut}` : ''}`;

/** A path relative to the project dir, for logs and --json (never an absolute home path). */
export const rel = (p, file) => {
  const r = relative(p.projectDir, file);
  return r.startsWith('..') || isAbsolute(r) ? file : r || '.';
};

/* ------------------------------------------------------------------ load */

export const parseJson = (file) => {
  const text = readFileSync(file, 'utf8');
  try {
    return JSON.parse(text);
  } catch (e) {
    const m = String(e.message).match(/position (\d+)/);
    let where = '';
    if (m) {
      const upto = text.slice(0, Number(m[1]));
      where = ` (line ${upto.split('\n').length}, column ${upto.length - upto.lastIndexOf('\n')})`;
    }
    throw new Error(`${file} is not valid JSON${where}: ${e.message}`);
  }
};

/**
 * Load a project: its raw config, the config normalized for one render (aspect, cut) and the
 * paths. Throws only when the file is missing or unreadable, or the cut is unknown.
 */
export const loadProject = (projectDir, { config: configFile, aspect, cut } = {}) => {
  if (!projectDir) throw new Error('usage: trailer <projectDir> [flags] (run `trailer --help`)');
  const p = projectPaths(projectDir, configFile);
  if (!existsSync(p.file)) throw new Error(`no config at ${p.file}; run \`trailer init ${projectDir}\` to start one`);
  const raw = parseJson(p.file);
  const config = normalizeConfig(raw, { aspect, cut });
  const name = renderName(config.aspect, config.cut);
  return {
    ...p,
    raw,
    config,
    name,
    stage: resolve(p.stageRoot, name),
    review: resolve(p.reviewRoot, `${aspectSlug(config.aspect)}${config.cut ? `-${config.cut}` : ''}`),
    // The app a live capture starts: capture.cwd (relative to the project), else the project.
    appDir: raw.capture?.cwd ? resolve(p.projectDir, raw.capture.cwd) : p.projectDir,
  };
};

/* ------------------------------------------------------------------ validation */

const CHAR_DIR = resolve(PUBLIC, 'characters');
export const characterNames = () => {
  const list = (d) => (existsSync(d) ? readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort() : []);
  return { 'open-peeps': list(resolve(CHAR_DIR, 'open-peeps')), notionists: list(resolve(CHAR_DIR, 'notionists')) };
};

/**
 * Hand-written checks over the normalized config: everything that would break a render is an
 * error, the rest are warnings. The JSON Schema (schema/trailer.schema.json) covers shapes
 * and enums; these cover cross-references (pages, ids, characters on disk, cuts).
 */
export const validate = (c, raw = c) => {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);
  for (const k of LEGACY_KEYS.filter((k) => k !== 'kit')) {
    if (raw[k] !== undefined) warn(`"${k}" is a legacy key (still read, not in the schema); see docs/config-reference.md`);
  }
  if (!c.projectName) err('"projectName" is required');
  if (!c.theme?.accent && !c.accent && !c.theme?.preset) err('"theme.accent" (or a "theme.preset") is required');
  if (c.accent && !isHex(c.accent)) err('"accent" must be a #rrggbb colour');
  if (!Array.isArray(c.scenes) || !c.scenes.length) {
    err('"scenes" must be a non-empty array');
    return { errors, warnings };
  }
  if (!ASPECTS.includes(c.aspect)) err(`"aspect" must be one of ${ASPECTS.join(', ')}`);
  if (c.targetSeconds !== undefined && !(c.targetSeconds >= 10 && c.targetSeconds <= 120)) err('"targetSeconds" must be 10 to 120');
  if (c.fitSeconds !== undefined && !(c.fitSeconds >= 10 && c.fitSeconds <= 120)) err('"fitSeconds" must be 10 to 120');
  if (raw.narration?.person && !['third', 'first', 'any'].includes(raw.narration.person)) err('"narration.person" must be third, first or any');
  if (raw.meta?.useCase && !USE_CASES.includes(raw.meta.useCase)) err(`"meta.useCase" must be one of ${USE_CASES.join(', ')}`);
  if (raw.link !== undefined && (typeof raw.link !== 'object' || typeof raw.link.text !== 'string')) err('"link" must be { text, url? }');
  if (raw.credit !== undefined && (typeof raw.credit !== 'object' || typeof raw.credit.text !== 'string')) err('"credit" must be { text, scene? }');

  // Cuts: every scene id they name must exist.
  const allIds = new Set((raw.scenes ?? []).map(sceneId));
  for (const [name, cut] of Object.entries(raw.cuts ?? {})) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) err(`cut "${name}": names are lowercase letters, digits and dashes (they go into file names)`);
    if (cut.aspect && !ASPECTS.includes(cut.aspect)) err(`cut "${name}": aspect must be one of ${ASPECTS.join(', ')}`);
    for (const id of cut.scenes ?? []) if (!allIds.has(id)) err(`cut "${name}" names scene "${id}", which is not in "scenes"`);
    for (const id of Object.keys(cut.overrides ?? {})) if (!allIds.has(id)) err(`cut "${name}": override for unknown scene "${id}"`);
    if (cut.targetSeconds !== undefined && !(cut.targetSeconds >= 10 && cut.targetSeconds <= 120)) err(`cut "${name}": targetSeconds must be 10 to 120`);
  }

  const ids = new Set();
  for (const s of c.scenes) {
    const id = sceneId(s);
    if (!SCENE_TYPES.includes(s.type)) err(`scene type "${s.type}" is not one of ${SCENE_TYPES.join(', ')}`);
    if (ids.has(id)) err(`two scenes share the id "${id}"; give one an "id"`);
    ids.add(id);
    if (s.bg && !SURFACES.includes(s.bg)) err(`scene "${id}": bg must be one of ${SURFACES.join(', ')}`);
    if (s.transition && !TRANSITIONS.includes(s.transition)) err(`scene "${id}": transition "${s.transition}" is not one of ${TRANSITIONS.join(', ')}`);
    if (s.typeStyle && !TYPES.includes(s.typeStyle)) err(`scene "${id}": typeStyle "${s.typeStyle}" is not one of ${TYPES.join(', ')}`);
    if (s.captions !== undefined && !SCENE_CAPTIONS.includes(s.captions)) err(`scene "${id}": captions must be one of ${SCENE_CAPTIONS.join(', ')}`);
    for (const k of Object.keys(s.variants ?? {})) if (!ASPECTS.includes(k)) err(`scene "${id}": variants key "${k}" must be one of ${ASPECTS.join(', ')}`);
    for (const x of Array.isArray(s.sfx) ? s.sfx : []) if (x?.sound && !SFX_NAMES.includes(x.sound)) err(`scene "${id}": sfx "${x.sound}" is not one of ${SFX_NAMES.join(', ')}`);
  }
  for (const [i, l] of (c.lines ?? []).entries()) {
    if (!ids.has(l.scene)) err(`line ${i + 1} names scene "${l.scene}", which is not in "scenes"`);
    if (!l.text?.trim()) err(`line ${i + 1} has no text`);
  }
  const pages = new Set((c.capture?.pages ?? []).map((p) => p.name));
  for (const s of c.scenes.filter((x) => x.type === 'walkthrough')) {
    if (!s.shots?.length || s.shots.length > 3) err(`walkthrough "${sceneId(s)}" needs 1 to 3 shots`);
    for (const sh of s.shots ?? []) if (!pages.has(sh.page)) err(`walkthrough shot page "${sh.page}" is not in capture.pages`);
  }
  for (const s of c.scenes.filter((x) => x.type === 'metric')) {
    if (!s.metrics?.length || s.metrics.length > 3) err(`metric "${sceneId(s)}" needs 1 to 3 metrics`);
  }
  for (const s of c.scenes.filter((x) => x.type === 'features')) {
    const n = Math.min(4, s.items?.length ?? 0);
    const own = (c.lines ?? []).filter((l) => l.scene === sceneId(s)).length;
    if (own < n) warn(`features "${sceneId(s)}" has ${n} cards but ${own} line(s); give it one line per card so each card lands on its own line`);
  }
  validateScenesV3(c, pages, err, warn);

  const t = c.theme ?? {};
  const oneOf = (key, val, list) => {
    if (val !== undefined && val !== null && !list.includes(val)) err(`theme.${key} "${val}" is not one of ${list.join(', ')}`);
  };
  if (t.preset !== undefined && !PRESETS[t.preset]) err(`theme.preset "${t.preset}" is not one of ${Object.keys(PRESETS).join(', ')}`);
  oneOf('mode', t.mode, ['light', 'dark']);
  for (const k of ['bg', 'surface', 'ink', 'muted', 'accent', 'accent2', 'warn', 'altBg', 'altSurface', 'altInk', 'altMuted']) if (t[k] !== undefined && !isHex(t[k])) err(`theme.${k} must be a #rrggbb colour`);
  oneOf('background', t.background, BACKGROUNDS);
  oneOf('altBackground', t.altBackground, BACKGROUNDS);
  oneOf('chrome', t.chrome, CHROMES);
  oneOf('transition', t.transition, TRANSITIONS);
  oneOf('motion', t.motion, MOTIONS);
  oneOf('camera', t.camera, CAMERAS);
  oneOf('type', t.type, TYPES);
  oneOf('motif', t.motif, MOTIFS);
  oneOf('displayCase', t.displayCase, ['none', 'upper']);
  oneOf('rhythm', t.rhythm, ['mono', 'alternate']);
  for (const [role, name] of Object.entries({ ...c.fonts, ...t.fonts })) {
    if (!FONT_ROLES.includes(role)) err(`fonts.${role}: roles are display, ui and mono`);
    else if (!FONT_NAMES.includes(name)) err(`font "${name}" is not available; choose one of: ${FONT_NAMES.join(', ')}`);
  }
  const v = c.voice;
  if (v !== undefined && typeof v !== 'string' && (typeof v !== 'object' || v === null)) err('"voice" must be a model name or { provider, model, speed, sayVoice }');
  const vo = typeof v === 'object' && v ? v : typeof v === 'string' ? { model: v } : {};
  if (vo.provider && !VOICE_PROVIDERS.includes(vo.provider)) err(`voice.provider must be one of ${VOICE_PROVIDERS.join(', ')}`);
  if (vo.model && !VOICE_MODEL.test(vo.model)) err(`voice.model "${vo.model}" is not a Deepgram Aura-2 model name (aura-2-<name>-<lang>, e.g. ${DEFAULT_VOICE.model})`);
  if (isTextMode(c)) {
    // The text mode: the captions are the script, so nothing may hide them.
    if (c.captions === false || (c.captions && typeof c.captions === 'object' && c.captions.enabled === false)) warn('captions are off, but voice.provider "text" shows the script as captions; they are turned back on (remove captions: false)');
    // A scene with captions "off" must show its own lines (a kinetic beat, a title), or they are never seen.
    const words = (t) => String(t).toLowerCase().split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}%$]/gu, '')).filter(Boolean);
    for (const s of c.scenes) {
      if (s.captions !== 'off') continue;
      const shown = [];
      sceneStrings('', { ...s, say: undefined }, '', (_, t) => shown.push(...words(t)));
      const have = new Set(shown);
      const hidden = (c.lines ?? []).filter((l) => l.scene === sceneId(s) && !words(l.text).every((w) => have.has(w)));
      if (hidden.length) warn(`scene "${sceneId(s)}": captions "off" hides ${hidden.length === 1 ? `"${hidden[0].text}"` : `${hidden.length} lines`}, and with voice.provider "text" nothing else says ${hidden.length === 1 ? 'it' : 'them'}; drop "captions": "off" or show the words in the scene`);
    }
  }
  if (vo.speed !== undefined && !(vo.speed >= 0.9 && vo.speed <= 1.1)) err('voice.speed must be 0.9 to 1.1 (cut words instead of speeding the voice up)');
  else if (vo.speed > 1.05) warn(`voice.speed ${vo.speed} is above 1.05; the voice starts to sound hurried`);
  if (c.music && typeof c.music === 'object') {
    if (c.music.bpm !== undefined && !(c.music.bpm >= 90 && c.music.bpm <= 132)) err('music.bpm must be 90 to 132');
    if (c.music.mood !== undefined && !MOODS.includes(c.music.mood)) err(`music.mood "${c.music.mood}" is not one of ${MOODS.join(', ')}`);
  }
  const cap = c.captions;
  if (cap && typeof cap === 'object') {
    if (cap.position && !CAPTION_POSITIONS.includes(cap.position)) err(`captions.position must be one of ${CAPTION_POSITIONS.join(', ')}`);
    if (cap.style && !CAPTION_STYLES.includes(cap.style)) err(`captions.style must be one of ${CAPTION_STYLES.join(', ')}`);
    if (cap.fontRole && !FONT_ROLES.includes(cap.fontRole)) err(`captions.fontRole must be one of ${FONT_ROLES.join(', ')}`);
    if (cap.case && !['none', 'upper', 'lower'].includes(cap.case)) err('captions.case must be none, upper or lower');
    if (cap.activeWordColor && !isHex(cap.activeWordColor)) err('captions.activeWordColor must be a #rrggbb colour');
  }
  return { errors, warnings };
};

const validateScenesV3 = (c, pages, err, warn) => {
  const chars = characterNames();
  const checkWho = (id, who) => {
    if (!who || who === 'blob' || who.startsWith('blob')) return;
    const [set, name] = who.split('/');
    if (set === 'fluent' || set === 'emoji') {
      if (!existsSync(resolve(CHAR_DIR, 'fluent-emoji', 'flat', `${name}.svg`))) err(`scene "${id}": emoji "${name}" is not in engine/public/characters/fluent-emoji/flat`);
    } else if (!chars[set]?.includes(name)) {
      err(`scene "${id}": character "${who}" is not available (open-peeps/<${chars['open-peeps'].join('|')}>, notionists/<${chars.notionists.join('|')}>, fluent/<emoji>, blob)`);
    }
  };
  const walkEls = (id, els) => {
    for (const e of els ?? []) {
      if (!UI_ELEMENTS.includes(e.type)) err(`scene "${id}": ui element type "${e.type}" is not one of ${UI_ELEMENTS.join(', ')}`);
      if (e.type === 'row' || e.type === 'col') walkEls(id, e.children);
    }
  };
  for (const s of c.scenes) {
    const id = sceneId(s);
    for (const ch of s.cast ?? []) checkWho(id, ch.who);
    for (const side of [s.left, s.right]) for (const ch of side?.cast ?? []) checkWho(id, ch.who);
    for (const side of [s.left, s.right]) walkEls(id, side?.elements);
    if (s.type === 'ui') walkEls(id, s.elements);
    if (s.type === 'screenshot') {
      if (!s.page) err(`screenshot "${id}" needs "page" (a capture.pages name; use capture.pages[].image for a ready-made image)`);
      else if (!pages.has(s.page)) err(`screenshot "${id}": page "${s.page}" is not in capture.pages`);
    }
    if (V3_TYPES.includes(s.type) && !(c.lines ?? []).some((l) => l.scene === id) && s.hold === undefined && !['outro', 'rewind', 'countdown'].includes(s.type))
      warn(`scene "${id}" (${s.type}) has no "say" lines and no "hold"; it will run its minimum length`);
  }
  const app = c.app ?? {};
  for (const k of ['font', 'mono']) if (app[k] && !FONT_NAMES.includes(app[k])) err(`app.${k} "${app[k]}" is not an available font`);
  for (const k of ['bg', 'surface', 'ink', 'muted', 'border', 'accent', 'good', 'bad', 'warn', 'subtle']) if (app[k] !== undefined && !isHex(app[k])) err(`app.${k} must be a #rrggbb colour`);
  for (const pg of c.capture?.pages ?? []) if (!pg.name) err('every capture.pages entry needs a "name"');
};

/* ------------------------------------------------------------------ budgets */

export const countWords = (text) => String(text).split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

export const spokenWords = (c) => (c.lines ?? []).reduce((n, l) => n + countWords(l.text), 0);

/**
 * Words a render of c.targetSeconds wants: 1.9 a second for a film, 2.1 for a cut or a short;
 * +-8%. In the text mode (voice.provider "text") the words are read, not heard, at the reading
 * pace in src/timeline.mjs (READING): 1.5 a second for a film, 1.65 for a cut or a short, about
 * four fifths of a narrated film's words.
 */
export const WORD_RATES = { speech: { film: 1.9, short: 2.1 }, reading: { film: 1.5, short: 1.65 } };
export const wordBudget = (c) => {
  const r = isTextMode(c) ? WORD_RATES.reading : WORD_RATES.speech;
  const rate = c.cut || (c.targetSeconds ?? 60) <= 30 ? r.short : r.film;
  const mid = rate * (c.targetSeconds ?? 60);
  return [Math.round(mid * 0.92), Math.round(mid * 1.08)];
};

/** The allowed duration window around targetSeconds: +-5 s, +-3 s for 30 s and under. */
export const durationWindow = (c) => {
  const t = c.targetSeconds ?? 60;
  const d = t <= 30 ? 3 : 5;
  return [t - d, t + d];
};

/* ------------------------------------------------------------------ copy lint */

export const FIRST_PERSON = /\b(I|I'm|I've|I'll|I'd|we|we're|we've|we'll|our|ours|my|mine|me|us)\b/i;

/** Every string the video shows or says, with where it comes from. */
export const copyStrings = (c) => {
  const out = [];
  const add = (where, text, quoted) => {
    if (typeof text === 'string' && text.trim()) out.push({ where, text, quoted: !!quoted });
  };
  add('tagline', c.tagline);
  add('projectName', c.projectName);
  add('link.text', c.link?.text);
  add('credit.text', c.credit?.text, true);
  (c.lines ?? []).forEach((l, i) => add(`lines[${i}] (voice + captions)`, l.text));
  for (const s of c.scenes ?? []) sceneStrings(sceneId(s), s, '', add);
  return out;
};

/** Terms from .trailer/private/banned-terms.txt (one per line, # comments): lint errors. */
export const bannedTerms = (p) => {
  const f = resolve(p.private, 'banned-terms.txt');
  if (!existsSync(f)) return [];
  return readFileSync(f, 'utf8')
    .split('\n')
    .map((l) => l.replace(/#.*/, '').trim())
    .filter(Boolean);
};

const termRe = (term) => new RegExp(`(^|[^\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}\\p{N}])`, 'iu');

/**
 * Lint the copy. With narration.person "third" (the default) first person anywhere is an
 * error (in an attributed quote or in-world dialogue a warning); "first" and "any" skip the
 * check. Banned terms are errors, config.forbiddenTerms warnings. `extra` adds strings such as
 * the caption chunks.
 */
export const lintCopy = (c, extra = [], { banned = [] } = {}) => {
  const errors = [];
  const warnings = [];
  const person = c.narration?.person ?? 'third';
  const terms = (c.forbiddenTerms ?? []).filter(Boolean);
  for (const { where, text, quoted } of [...copyStrings(c), ...extra]) {
    if (person === 'third') {
      const m = text.match(FIRST_PERSON);
      if (m && quoted) warnings.push(`${where}: first person "${m[0]}" in an attributed quote or in-world dialogue ("${text}"); fine for a user's words, never for the narrator's`);
      else if (m) errors.push(`${where}: first person "${m[0]}" in "${text}"; write it in the third person with the project name (or set narration.person to "first")`);
    }
    for (const term of banned) if (termRe(term).test(text)) errors.push(`${where}: banned term (private/banned-terms.txt) in "${text}"`);
    for (const term of terms) if (termRe(term).test(text)) warnings.push(`${where}: forbidden term "${term}" in "${text}"`);
  }
  return { errors, warnings };
};

/* ------------------------------------------------------------------ format lint */

const castCoords = (s) => (s.cast ?? []).some((m) => m.x !== undefined || m.y !== undefined || m.move?.length);
const otherCoords = (s) =>
  (s.type === 'chalkboard' && (s.items ?? []).length > 0) ||
  (s.telestrator ?? []).length > 0 ||
  (s.props ?? []).some((x) => x.x !== undefined) ||
  JSON.stringify(s.elements ?? []).includes('"shapes"');

// The frame contract of src/frame.ts, for the 1:1 check below (kept in step with SAFE,
// captionBand and contentInsets there).
const SQUARE = { W: 1080, H: 1080, safe: { top: 56, bottom: 56, left: 64, right: 64 } };
const squareArea = (c) => {
  const cap = resolveCaptions(c);
  const pos = cap.enabled === false ? 'off' : cap.position;
  const body = Math.round(cap.size * 2.3 + 18);
  let reserveTop = 0;
  let reserveBottom = 0;
  if (pos === 'top') reserveTop = SQUARE.safe.top + body;
  else if (pos === 'center-low') reserveBottom = Math.round(SQUARE.H - (Math.round(SQUARE.H * 0.8) - body / 2));
  else if (pos !== 'off') reserveBottom = SQUARE.safe.bottom + body;
  const top = Math.max(SQUARE.safe.top, reserveTop ? reserveTop + 18 : 0);
  const bottom = SQUARE.H - Math.max(SQUARE.safe.bottom, reserveBottom ? reserveBottom + 18 : 0);
  return { left: SQUARE.safe.left, right: SQUARE.W - SQUARE.safe.right, top, bottom, width: SQUARE.W - SQUARE.safe.left - SQUARE.safe.right, height: bottom - top };
};

/**
 * Cast members of a scene whose 16:9 position, mapped into 1:1 the way useMappedCast does
 * (x across the content width, feet kept off the floor, 85% size), leaves the safe area.
 */
export const castOutsideSquare = (c, s) => {
  const A = squareArea(c);
  const out = [];
  const px = (x) => A.left + (Math.max(0, Math.min(1920, x)) / 1920) * A.width;
  const py = (y) => A.bottom - Math.max(0, 1080 - 48 - y) * (A.height / (1080 - 112));
  for (const [i, m] of (s.cast ?? []).entries()) {
    const size = Math.round((m.size ?? 300) * 0.85);
    const w = m.who === 'blob' || !m.who || String(m.who).startsWith('blob') ? (size * 224) / 244 : size;
    const spots = [{ x: m.x, y: m.y }, ...(m.move ?? []).map((v) => ({ x: v.x, y: v.y ?? m.y }))].filter((p) => p.x !== undefined || p.y !== undefined);
    for (const p of spots) {
      const x = p.x === undefined ? null : px(p.x);
      const feet = py(p.y ?? 1080 - 160);
      const tol = 2;
      if ((x !== null && (x - w / 2 < A.left - tol || x + w / 2 > A.right + tol)) || (p.y !== undefined && feet - size < A.top - tol)) {
        out.push(i);
        break;
      }
    }
  }
  return out;
};

/**
 * Warnings for the aspect and length being rendered: 9:16 and 1:1 layouts that will be cramped
 * or rely on mapped 16:9 coordinates, and the shape of a short.
 */
export const lintFormat = (c, { captionChunks = [], tl = null } = {}) => {
  const warnings = [];
  const w = (m) => warnings.push(m);
  const aspect = c.aspect;
  if (aspect !== '16:9') {
    for (const s of c.scenes) {
      const id = sceneId(s);
      const mapped = `positions are authored in 16:9 px and get mapped into ${aspect}; check the still or add variants["${aspect}"]`;
      if (!s.variants?.[aspect]) {
        if (otherCoords(s) || (aspect === '9:16' && castCoords(s))) w(`scene "${id}": ${mapped}`);
        else if (castCoords(s)) {
          // 1:1 maps a cast member's x across the content width, so only flag the ones the mapping pushes out of the safe area.
          const off = castOutsideSquare(c, s);
          if (off.length) w(`scene "${id}": cast ${off.map((i) => i + 1).join(', ')} leave${off.length === 1 ? 's' : ''} the 1:1 safe area once their 16:9 position is mapped; move ${off.length === 1 ? 'it' : 'them'} in, shrink ${off.length === 1 ? 'it' : 'them'} or add variants["1:1"]`);
        }
      }
      if (s.type === 'kinetic') for (const [i, b] of (s.beats ?? []).entries()) if (countWords(b.text ?? '') > 5) w(`scene "${id}": kinetic beat ${i + 1} has ${countWords(b.text)} words; keep beats to 5 words or fewer in ${aspect}`);
      if ((s.metrics ?? []).length > 2) w(`scene "${id}": ${s.metrics.length} metrics stack tall in ${aspect}; keep it to 2`);
      if ((s.cast ?? []).length > 2) w(`scene "${id}": ${s.cast.length} characters crowd a ${aspect} frame; keep it to 2`);
      if (!V3_TYPES.includes(s.type) && !(s.type === 'metric' && s.style && s.style !== 'cards')) w(`scene "${id}": classic scene type "${s.type}" is laid out for 16:9 only; use a v3 type in ${aspect}`);
    }
    const chars = aspect === '9:16' ? 26 : 32;
    for (const [i, ch] of captionChunks.entries()) if (ch.text.length > chars * 2) w(`caption ${i + 1} ("${ch.text}") is wider than two lines in ${aspect}; shorten the line or lower captions.maxWords`);
  }
  const t = c.targetSeconds ?? 60;
  const short = aspect === '9:16' || t <= 30;
  if (short) {
    const first = c.scenes[0];
    if (first && !['kinetic', 'title', 'hook', 'ui'].includes(first.type)) w(`a short should open on words or on the product mid-action: make scene 1 a kinetic, title or ui scene (it is "${first.type}")`);
    if (first && (first.lead ?? 0) > 6) w(`scene 1 has a lead of ${first.lead} frames; a short should be moving at frame 0`);
    const firstLine = (c.lines ?? [])[0];
    if (firstLine && countWords(firstLine.text) > 8) w(`the first line has ${countWords(firstLine.text)} words; the hook of a short should land in about 1.5 s (8 words or fewer)`);
    // The hook: the first spoken word should start within 1 s.
    const l0 = tl?.lines?.[0];
    if (l0) {
      const startSec = (l0.from + (l0.words?.[0]?.start ?? 0) * FPS) / FPS;
      if (startSec > 1) w(`the first word is ${isTextMode(c) ? 'on screen' : 'spoken'} at ${startSec.toFixed(1)} s; the hook of a short should start within 1 s (lower scene 1's "lead", or cut what comes before the first line)`);
    }
    // Frame 0 is the thumbnail and what a muted autoplay shows first.
    if (first && !settledStart(c)) w(`frame 0 is blank: scene 1 starts empty${first.firstFrame === 'live' ? ' (firstFrame "live")' : ''}; a short should show its hook on frame 0 (drop firstFrame "live", or set "firstFrame": "settled" or "loop": true on the last scene)`);
    if (aspect === '9:16' && !(t >= 15 && t <= 30)) w(`targetSeconds ${t} for 9:16: shorts work best at 15 to 30 s (add a cut with "aspect": "9:16")`);
    const last = c.scenes.at(-1);
    if (aspect !== '16:9' && c.scenes.length > 1 && last?.loop !== true) w(`the last scene ("${sceneId(last)}") has no "loop": true; a short should end on a frame that matches frame 0 so the replay is seamless`);
  }
  for (const [i, s] of c.scenes.entries()) {
    if (s.loop === true && i !== c.scenes.length - 1) w(`scene "${sceneId(s)}": "loop" only works on the last scene; it is ignored here`);
    if (s.firstFrame !== undefined && i !== 0) w(`scene "${sceneId(s)}": "firstFrame" only works on scene 1; it is ignored here`);
  }
  warnings.push(...lintCues(c));
  return warnings;
};

const cueNorm = (w) => String(w).toLowerCase().replace(/[^a-z0-9%$.]/g, '').replace(/\.$/, '');

/**
 * Cues that cannot resolve: a word cue (`"at": "stale"`) whose word is not in the scene's
 * narration, or a line cue past the scene's last line. Both fall back silently in the video,
 * which is easy to miss after a cut rewrites a scene's `say`.
 */
export const lintCues = (c) => {
  const out = [];
  const byScene = new Map();
  for (const l of c.lines ?? []) byScene.set(l.scene, [...(byScene.get(l.scene) ?? []), l.text]);
  for (const s of c.scenes ?? []) {
    if (s.say === undefined) continue;
    const id = sceneId(s);
    const lines = byScene.get(id) ?? [];
    const words = lines.map((t) => t.split(/\s+/).map(cueNorm).filter(Boolean));
    const spoken = (phrase, only) => {
      const target = String(phrase).trim().split(/\s+/).map(cueNorm).filter(Boolean);
      if (!target.length) return true;
      return words.some((ws, li) => (only === null || li === only) && ws.some((_, i) => target.every((tw, k) => ws[i + k] !== undefined && (ws[i + k] === tw || (tw.length >= 4 && ws[i + k].startsWith(tw))))));
    };
    const check = (cue, where) => {
      if (typeof cue === 'number') {
        if (Math.floor(cue) >= lines.length) out.push(`scene "${id}": cue ${cue} (${where}) points past the scene's ${lines.length} line(s); it falls back to the scene start`);
        return;
      }
      let word = null;
      let only = null;
      if (typeof cue === 'string') {
        const v = cue.trim();
        if (!v || v === 'start' || v === 'end' || /^[+-]?\d+(\.\d+)?s$/.test(v)) return;
        const m = v.match(/^(?:(\d+):)?(.+?)(?:#\d+)?$/);
        word = m[2];
        only = m[1] !== undefined ? Number(m[1]) : null;
      } else if (cue && typeof cue === 'object' && cue.word !== undefined) {
        word = cue.word;
        only = cue.line ?? null;
      }
      if (word !== null && !spoken(word, only)) out.push(`scene "${id}": cue "${word}" (${where}) is not spoken in this scene's narration; it falls back to a default time`);
    };
    const walk = (node, path) => {
      if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`));
      if (!node || typeof node !== 'object') return;
      for (const [k, v] of Object.entries(node)) {
        if (k === 'variants' || k === 'say') continue;
        const at = path ? `${path}.${k}` : k;
        if (k === 'at' || k === 'until' || k === 'stampAt') check(v, at);
        else walk(v, at);
      }
    };
    walk(s, '');
  }
  return out;
};

/* ------------------------------------------------------------------ voice + keys */

/**
 * Read KEY from the environment, else from <projectDir>/.trailer/.env, else <projectDir>/.env.
 * Returns { value, source }; the value is never logged or written anywhere.
 */
export const envKeySource = (key, p) => {
  if (process.env[key]) return { value: process.env[key], source: 'environment' };
  for (const [f, source] of p ? [[p.env, '.trailer/.env'], [resolve(p.projectDir, '.env'), '.env']] : []) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=\\s*(.*?)\\s*$`));
      if (m && m[1]) return { value: m[1].replace(/^['"]|['"]$/g, ''), source };
    }
  }
  return { value: null, source: null };
};

export const envKey = (key, p) => envKeySource(key, p).value;

/** The provider a render is forced to: --voice-engine, else TRAILER_VOICE_ENGINE, else null. */
export const voiceEngineOverride = ({ engine } = {}) => engine ?? process.env.TRAILER_VOICE_ENGINE ?? null;

/**
 * The config with the render's voice provider written into it (config.voice.provider), so the
 * timeline, the captions and the lint see the text mode whether it came from the config, the
 * environment or --voice-engine. Returns the same object when nothing changes.
 */
export const withVoiceEngine = (c, opts = {}) => {
  const engine = voiceEngineOverride(opts);
  if (!engine) return c;
  const v = c.voice;
  const o = typeof v === 'string' ? { model: v } : v && typeof v === 'object' ? v : {};
  if (o.provider === engine) return c;
  return { ...c, voice: { ...o, provider: engine } };
};

/**
 * The voice settings for a render: config.voice (a model name or an object) over the default
 * (Deepgram aura-2-hermes-en at 1.0), then TRAILER_VOICE (model) and TRAILER_VOICE_ENGINE
 * (provider) from the environment, then --voice-engine. Provider "text" is the no-voice mode.
 */
export const resolveVoice = (c, { engine } = {}) => {
  const v = c.voice;
  const o = typeof v === 'string' ? { model: v } : v && typeof v === 'object' ? v : {};
  const out = { ...DEFAULT_VOICE, ...o };
  if (process.env.TRAILER_VOICE) out.model = process.env.TRAILER_VOICE;
  if (process.env.TRAILER_VOICE_ENGINE) out.provider = process.env.TRAILER_VOICE_ENGINE;
  if (engine) out.provider = engine;
  if (!VOICE_PROVIDERS.includes(out.provider)) throw new Error(`voice engine "${out.provider}" is not one of ${VOICE_PROVIDERS.join(', ')}`);
  if (!VOICE_MODEL.test(out.model)) throw new Error(`voice model "${out.model}" is not an Aura-2 model name (aura-2-<name>-<lang>)`);
  out.speed = Math.max(0.9, Math.min(1.1, Number(out.speed) || 1));
  return out;
};

export { ASPECTS, aspectSlug };

#!/usr/bin/env node
// Generates schema/trailer.schema.json (JSON Schema draft 2020-12) from the option lists in
// src/options.mjs and the character folders in public/characters, so the schema never drifts
// from what the engine accepts. A test fails when the committed schema is stale.
//
//   node scripts/gen-schema.mjs          write the schema
//   node scripts/gen-schema.mjs --check  exit 1 if the committed schema differs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as O from '../src/options.mjs';
import { SCENE_TYPES } from '../src/timeline.mjs';
import { characterNames } from './lib.mjs';
import { ENGINE } from './runtime.mjs';

export const SCHEMA_FILE = resolve(ENGINE, 'schema', 'trailer.schema.json');
export const SCHEMA_ID = 'https://raw.githubusercontent.com/Dileep2896/trailer/main/engine/schema/trailer.schema.json';

const str = (description, extra = {}) => ({ type: 'string', ...(description ? { description } : {}), ...extra });
const num = (description, extra = {}) => ({ type: 'number', ...(description ? { description } : {}), ...extra });
const bool = (description) => ({ type: 'boolean', ...(description ? { description } : {}) });
const en = (list, description) => ({ enum: [...list], ...(description ? { description } : {}) });
const arr = (items, description, extra = {}) => ({ type: 'array', items, ...(description ? { description } : {}), ...extra });
const obj = (properties, description, extra = {}) => ({ type: 'object', properties, ...(description ? { description } : {}), ...extra });
const hex = { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' };
const cue = { description: 'A cue: frames into the scene (number), or a string: "line:2", "word:Lumen", "line:2+10", "end-30".', type: ['number', 'string'] };

export const buildSchema = () => {
  const chars = characterNames();
  const whoPattern = `^(blob(:[a-z-]+)?|open-peeps/(${chars['open-peeps'].join('|')})|notionists/(${chars.notionists.join('|')})|(fluent|emoji)/[a-z0-9-]+)$`;
  const castMember = obj(
    {
      who: str('blob, open-peeps/<name>, notionists/<name> or fluent/<emoji-name>', { pattern: whoPattern }),
      shape: en(O.BLOB_SHAPES, 'Body of a blob character'),
      color: { type: 'string' },
      accessory: en(O.ACCESSORIES),
      mood: str('A mood (blob: see BLOB_MOODS; open-peeps and notionists have their own sets)'),
      pose: en(O.NOTIONIST_POSES, 'notionists only'),
      x: num('Feet x in 16:9 frame px (mapped in 9:16 and 1:1 unless variants override it)'),
      y: num('Feet y in 16:9 frame px'),
      size: num('Height in px'),
      flip: bool(),
      label: str(),
      at: cue,
      enter: en(O.CAST_ENTERS),
      exit: obj({ at: cue, kind: str() }),
      moods: arr(obj({ at: cue, mood: str() }, null, { required: ['mood'] })),
      look: arr(obj({ at: cue, dir: en(['left', 'right', 'up', 'down', 'center']) })),
      react: arr(obj({ at: cue, kind: en(O.CAST_REACTS) }, null, { required: ['kind'] })),
      move: arr(obj({ at: cue, x: num(), y: num(), dur: num('seconds') })),
      bubble: arr(obj({ at: cue, until: cue, text: str(), kind: en(O.BUBBLE_KINDS), side: en(['left', 'right']) }, null, { required: ['text'] })),
      pops: arr(obj({ at: cue, emoji: str() })),
      sweat: cue,
      podium: str('cast scenes: a podium label under the character'),
    },
    'A character on stage',
    { required: ['who'] },
  );
  const uiElement = {
    type: 'object',
    required: ['type'],
    properties: { type: en(O.UI_ELEMENTS, 'Element type (see docs/config-reference.md for each one\'s fields)'), at: cue, children: { type: 'array', items: { $ref: '#/$defs/uiElement' } } },
  };
  const say = {
    description: 'What the narrator says in this scene: a string, or a list of strings / { text, gap } (gap: frames before the line).',
    oneOf: [str(), arr({ oneOf: [str(), obj({ text: str(), gap: num() }, null, { required: ['text'], additionalProperties: false })] })],
  };
  const sceneCommon = {
    type: en(SCENE_TYPES, 'Scene type'),
    id: str('Unique id (defaults to the type); cuts, credit.scene and overrides refer to it', { pattern: '^[A-Za-z0-9][A-Za-z0-9_-]*$' }),
    say,
    captions: en(O.SCENE_CAPTIONS, 'Caption position for this scene'),
    transition: en(O.TRANSITIONS, 'The cut into this scene'),
    bg: en(O.SURFACES, 'Surface the scene sits on'),
    lead: num('Frames before the first line'),
    breath: num('Seconds after the last line'),
    hold: num('Minimum length in seconds'),
    turn: bool('The scene where the project is named: the music drums come in on the next bar'),
    poster: bool('Take the poster frame from this scene'),
    loop: bool('Last scene only: its final 12 frames fade into frame 0 (scene 1 settled), so the last frame matches the first and the film loops'),
    firstFrame: en(['settled', 'live'], 'Scene 1 only: "settled" shows its first cue already in place on frame 0 (the default for 9:16, 1:1 and looping films); "live" starts it empty'),
    cast: arr(castMember),
    sfx: arr(obj({ sound: en(O.SFX_NAMES), at: cue, volume: num() }, null, { required: ['sound'] })),
    cornerBug: { description: 'A small broadcast bug in the top corner', oneOf: [obj({ text: str(), sub: str(), at: cue, until: cue, tone: en(['live', 'accent', 'warn']), side: en(['right', 'left']) }, null, { required: ['text'] }), arr(obj({ text: str() }, null, { required: ['text'] }))] },
    variants: {
      description: 'Per-aspect overrides, deep-merged over this scene when rendering at that aspect (objects merge, arrays replace)',
      type: 'object',
      propertyNames: en(O.ASPECTS),
      additionalProperties: { type: 'object' },
    },
  };
  const when = (type, properties, required = []) => ({ if: { properties: { type: { const: type } }, required: ['type'] }, then: { properties, ...(required.length ? { required } : {}) } });
  const scene = {
    type: 'object',
    required: ['type'],
    properties: sceneCommon,
    allOf: [
      when('kinetic', { layout: en(O.KINETIC_LAYOUTS), beats: arr(obj({ text: str(), accent: { type: ['string', 'array'] }, fx: en(O.KINETIC_FX), at: cue, until: cue, sub: str(), size: num(), color: en(['accent', 'warn', 'ink']) }, null, { required: ['text'] }), null, { minItems: 1 }) }, ['beats']),
      when('title', { layout: en(O.TITLE_LAYOUTS), title: str(), eyebrow: str(), sub: str() }, ['title']),
      when('outro', {
        layout: en(O.OUTRO_LAYOUTS),
        headline: str('Shown before the name (card: held at least 1.5 s, or kept above the name when nameAt comes sooner); the top label of a ticket, packet or certificate'),
        tagline: str(),
        nameAt: cue,
        repoAt: cue,
        fields: arr(obj({ k: str(), v: str() }, null, { required: ['k', 'v'] }), 'ticket and packet layouts: label / value pairs (ticket default: PASSENGER = projectName)'),
        gate: str('ticket layout: the big code on the stub (e.g. "v2", "B12"), under a GATE label; when unset the stub shows only the barcode'),
      }),
      when('ui', { frame: en(O.UI_FRAMES), elements: arr({ $ref: '#/$defs/uiElement' }) }),
      when('screenshot', { page: str('A capture.pages name'), frame: en(O.SCREENSHOT_FRAMES) }, ['page']),
      when('split', { mode: en(O.SPLIT_MODES), divider: en(['vs', 'line']), left: { $ref: '#/$defs/panel' }, right: { $ref: '#/$defs/panel' } }, ['left', 'right']),
      when('evidence', { layout: en(O.EVIDENCE_LAYOUTS), cards: arr(obj({ kind: en(O.EVIDENCE_KINDS), text: str(), source: str(), at: cue }, null, { required: ['kind'] })) }, ['cards']),
      when('metric', { style: en(O.METRIC_STYLES), metrics: arr(obj({ label: str(), from: num(), to: num() }, null, { required: ['label'] }), null, { minItems: 1, maxItems: 3 }) }, ['metrics']),
      when('casefile', { pins: arr(obj({ kind: en(O.CASEFILE_PINS), x: num(), y: num(), at: cue }, null, { required: ['kind'] })) }, ['pins']),
      when('scoreboard', { teams: arr(obj({ label: str(), value: num() }, null, { required: ['label', 'value'] })) }, ['teams']),
      when('chalkboard', { font: en(['Caveat', 'Kalam', 'Permanent Marker', 'Architects Daughter']), items: arr(obj({ kind: en(O.CHALK_KINDS), x: num(), y: num(), at: cue }, null, { required: ['kind'] })) }, ['items']),
      when('chat', { style: en(O.CHAT_STYLES), people: { type: 'object', additionalProperties: obj({ name: str(), side: en(['left', 'right']) }, null, { required: ['name'] }) }, messages: arr(obj({ from: str(), text: str(), at: cue }, null, { required: ['from', 'text'] })) }, ['people', 'messages']),
      when('countdown', { style: en(O.COUNTDOWN_STYLES), from: num(), step: num('seconds per number') }),
      when('rewind', { from: str(), to: str(), slate: str(), ghosts: arr(str()) }),
      when('calendar', { pages: arr(obj({ day: str(), date: { type: ['string', 'number'] }, note: str(), at: cue }, null, { required: ['day'] })) }, ['pages']),
      when('lanes', { lanes: arr(obj({ label: str(), tone: str() }, null, { required: ['label'] }), null, { minItems: 1 }), items: arr(obj({ label: str(), lane: { type: 'integer', minimum: 0 }, at: cue }, null, { required: ['label'] })) }, ['lanes', 'items']),
      when('walkthrough', { shots: arr(obj({ page: str(), title: str() }, null, { required: ['page'] }), null, { minItems: 1, maxItems: 3 }) }, ['shots']),
    ],
  };
  const panel = obj({ label: str(), tone: en(['bad', 'good', 'neutral']), title: str(), sub: str(), elements: arr({ $ref: '#/$defs/uiElement' }), cast: arr(castMember), emoji: str(), at: cue });
  const captions = {
    description: 'Karaoke captions; true / false or the settings',
    oneOf: [
      bool(),
      obj(
        {
          enabled: bool(),
          position: en(O.CAPTION_POSITIONS),
          style: en(O.CAPTION_STYLES),
          size: num('px at 1080 short side', { minimum: 24, maximum: 120 }),
          case: en(['none', 'upper', 'lower']),
          fontRole: en(O.FONT_ROLES),
          activeWordColor: hex,
          maxWords: { type: 'integer', minimum: 1, maximum: 12 },
          weight: num(),
          avoid: bool('Keep captions clear of on-screen elements'),
        },
        null,
        { additionalProperties: false },
      ),
    ],
  };
  const music = {
    description: 'The music: false for none, a path to a licensed track (relative to the config), or a synthesized bed',
    oneOf: [{ const: false }, str(), obj({ bpm: num(null, { minimum: 90, maximum: 132 }), mood: en(O.MOODS), file: str(), volume: num(null, { minimum: 0, maximum: 2 }) }, null, { additionalProperties: false })],
  };
  const fontName = en(O.FONT_NAMES);
  const theme = obj(
    {
      preset: en(Object.keys(O.PRESETS)),
      mode: en(['light', 'dark']),
      bg: hex, surface: hex, ink: hex, muted: hex, accent: hex, accent2: hex, warn: hex,
      altBg: hex, altSurface: hex, altInk: hex, altMuted: hex,
      fonts: obj({ display: fontName, ui: fontName, mono: fontName }, null, { additionalProperties: false }),
      displayCase: en(['none', 'upper']),
      displayWeight: num(),
      tracking: num(),
      radius: num(),
      background: en(O.BACKGROUNDS),
      altBackground: { oneOf: [en(O.BACKGROUNDS), { type: 'null' }] },
      chrome: en(O.CHROMES),
      transition: en(O.TRANSITIONS),
      motion: en(O.MOTIONS),
      camera: en(O.CAMERAS),
      type: en(O.TYPES),
      motif: en(O.MOTIFS),
      grain: num(null, { minimum: 0, maximum: 0.3 }),
      rhythm: en(['mono', 'alternate']),
    },
    'Look and motion of the film',
  );
  const box = obj({ name: str(), selector: str(), x: num(), y: num(), width: num(), height: num(), optional: bool() }, null, { required: ['name'] });
  const capture = obj(
    {
      pages: arr(
        obj(
          {
            name: str(),
            path: str('URL path for a live capture'),
            image: str('A ready-made screenshot, relative to the config'),
            scale: num('Device pixel ratio of the image (default 2)'),
            boxes: arr(box),
            actions: arr({ type: 'object' }),
            waitFor: str(),
            fullPage: bool(),
            maxHeight: num(),
            settle: num('ms'),
            hideSelectors: arr(str()),
          },
          null,
          { required: ['name'] },
        ),
      ),
      serve: obj({ dir: str('Static folder, relative to the project'), port: num() }, 'Serve a static folder for the capture'),
      baseUrl: str(),
      port: num(),
      startCmd: str('Command that starts the app (run in capture.cwd)'),
      cwd: str('Folder for startCmd, relative to the project'),
      readyPath: str(),
      readyTimeout: num('seconds'),
      width: num('Viewport width in CSS px'),
      height: num('Viewport height in CSS px'),
      colorScheme: en(['light', 'dark']),
      hideSelectors: arr(str()),
    },
    'Screens of the app, for screenshot and walkthrough scenes',
  );
  const voice = {
    description: 'The narrator. Default: Deepgram aura-2-hermes-en at 1.0, falling back to macOS say, espeak-ng, then silence',
    oneOf: [
      str('An Aura-2 model name', { pattern: O.VOICE_MODEL.source }),
      obj(
        {
          provider: en(O.VOICE_PROVIDERS),
          model: str('Deepgram Aura-2 model', { pattern: O.VOICE_MODEL.source }),
          speed: num('Pace (pitch kept); above 1.05 sounds hurried', { minimum: 0.9, maximum: 1.1 }),
          sayVoice: str('macOS say voice for the fallback'),
        },
        null,
        { additionalProperties: false },
      ),
    ],
  };
  const cut = obj(
    {
      aspect: en(O.ASPECTS),
      scenes: arr(str(), 'Scene ids in play order (default: every scene)'),
      targetSeconds: num(null, { minimum: 10, maximum: 120 }),
      fitSeconds: num(null, { minimum: 10, maximum: 120 }),
      overrides: { type: 'object', description: 'Per scene id: fields deep-merged over that scene in this cut', additionalProperties: { type: 'object' } },
      captions,
      music,
      theme,
      voice,
    },
    'A shorter or differently shaped render from the same scenes',
    { additionalProperties: false },
  );
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: SCHEMA_ID,
    title: 'trailer.config.json',
    description: 'A trailer: scenes in play order, each with what the narrator says, plus the look, the voice and the cuts. Generated by engine/scripts/gen-schema.mjs.',
    type: 'object',
    required: ['projectName', 'scenes'],
    additionalProperties: false,
    properties: {
      $schema: str(),
      version: { const: 1, description: 'Config format version' },
      projectName: str('The project, as said and shown', { minLength: 1 }),
      tagline: str('One line under the name on the end card'),
      repoUrl: str('Repository URL (shown without https:// unless link is set)'),
      link: obj({ text: str('What the end card shows, e.g. github.com/you/project'), url: str() }, 'The link on the end card', { required: ['text'], additionalProperties: false }),
      credit: obj({ text: str('e.g. "Built by Ada Example"'), scene: str('Scene id to show it on (default the outro)') }, 'A credit line', { required: ['text'], additionalProperties: false }),
      narration: obj({ person: en(['third', 'first', 'any'], 'third (default): first-person copy is a lint error') }, null, { additionalProperties: false }),
      aspect: en(O.ASPECTS, 'The film\'s aspect (default 16:9); --aspect and cuts override it'),
      targetSeconds: num('The length the film aims at (default 60)', { minimum: 10, maximum: 120 }),
      fitSeconds: num('Trim pauses (never the voice) until the film is at most this long', { minimum: 10, maximum: 120 }),
      theme,
      app: { type: 'object', description: 'Design tokens of the app, for recreated UI (font, mono, bg, surface, ink, muted, border, accent, good, bad, warn, radius)' },
      captions,
      music,
      sfx: { description: 'Sound effects: true, false or a volume (0 to 2)', oneOf: [bool(), num(null, { minimum: 0, maximum: 2 })] },
      voice,
      forbiddenTerms: arr(str(), 'Words that warn when they appear anywhere in the copy'),
      capture,
      cuts: { type: 'object', description: 'Named cuts (e.g. "short", "square")', propertyNames: { pattern: '^[a-z0-9][a-z0-9-]*$' }, additionalProperties: cut },
      meta: obj(
        {
          useCase: en(O.USE_CASES),
          format: str('The film format chosen (e.g. courtroom, sports broadcast)'),
          formatWhy: str(),
          tone: str(),
          sources: arr({ type: ['string', 'object'] }, 'Where each claim in the script comes from'),
        },
        'Notes for people and agents; not rendered',
      ),
      scenes: arr({ $ref: '#/$defs/scene' }, 'Scenes in play order', { minItems: 1 }),
    },
    $defs: { scene, uiElement, panel, castMember },
  };
};

export const schemaText = () => `${JSON.stringify(buildSchema(), null, 2)}\n`;

if (process.argv[1] && resolve(process.argv[1]) === resolve(ENGINE, 'scripts', 'gen-schema.mjs')) {
  const text = schemaText();
  if (process.argv.includes('--check')) {
    let cur = '';
    try {
      cur = readFileSync(SCHEMA_FILE, 'utf8');
    } catch {}
    if (cur !== text) {
      console.error('schema/trailer.schema.json is stale; run `node scripts/gen-schema.mjs`');
      process.exit(1);
    }
  } else {
    writeFileSync(SCHEMA_FILE, text);
    console.log(`wrote ${SCHEMA_FILE.slice(ENGINE.length + 1)}`);
  }
}

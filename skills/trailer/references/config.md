# Config reference: `.trailer/trailer.config.json`

One JSON file describes the whole film: the script (each scene's `say`), the scenes, the
look, the voice, the captions, the music and any derived cuts. No engine code needs editing.

Set `"$schema"` to the schema URL (`<engine> schema` prints the local path too) so editors
autocomplete. `--lint` validates against the schema plus semantic checks (cue words, assets on
disk, word budget, copy lint). The schema is authoritative; this page explains intent.

## Top level

| key | type | default | notes |
| --- | --- | --- | --- |
| `$schema` | string | | `https://raw.githubusercontent.com/Dileep2896/trailer/main/engine/schema/trailer.schema.json` |
| `version` | `1` | `1` | the config schema version |
| `projectName` | string | required | what narration and the outro call the project |
| `tagline` | string | | under the name on the outro |
| `repoUrl` | uri | | the outro pill when `link` is unset |
| `link` | `{ text, url? }` | | the outro pill for non-repo targets ("Live on Product Hunt", "Demo at table 12") |
| `aspect` | `16:9` `9:16` `1:1` | `16:9` | the main film's frame |
| `targetSeconds` | 10 to 120 | 60 (a cut: 30) | drives the word-budget lint and the duration warning |
| `fitSeconds` | 10 to 120 | | trims slack (never the voice) toward this length |
| `voice` | string or Voice | `aura-2-hermes-en` | see Voice |
| `narration` | `{ person: "third" | "first" | "any" }` | `third` | `third` makes first person in narration an error |
| `credit` | `{ text, scene? }` | | an on-screen credit on the outro ("Built by Jane Doe"); linted like copy |
| `theme` | Theme | | the film's world (below) |
| `app` | AppTokens | | the app's own UI tokens for `ui` scenes (below) |
| `captions` | Captions or `false` | on | burned-in captions (below) |
| `music` | Music or a path | `{ bpm: 120, mood: "driving" }` | below |
| `sfx` | `true` `false` or 0 to 2 | `true` | sound effects on, off, or a level |
| `forbiddenTerms` | string[] | | whole words that **warn** anywhere in copy |
| `capture` | Capture | | live screenshots (below) |
| `scenes` | Scene[] | required | in play order (`scenes.md`) |
| `cuts` | `{ [name]: Cut }` | | derived edits: shorts, square, teaser (below) |
| `meta` | object | | `{ useCase, format, formatWhy, tone, sources: [{ claim, source }] }`; never rendered |

**Banned terms** are not in the config. They live in `.trailer/private/banned-terms.txt` (one
per line, gitignored), and every hit anywhere in copy is a lint **error**. Use it to keep names
that must never appear (a target company in the job-hunt independence mode, a client under
NDA) out of the committed config itself.

## Theme (`theme`): the film's world

Resolution: defaults, then `preset`, then the keys you set. Set at least the accent, the fonts
and two of `background`, `chrome`, `transition`, `type`, `motif` to get away from the defaults.

| key | values |
| --- | --- |
| `preset` | `studio` `terminal` `editorial` `blueprint` `playful` `newsroom` `brutal` (a starting point; always re-accent and re-font it) |
| `mode` | `dark` `light` |
| `bg` `surface` `ink` `muted` | `#rrggbb` (main surface) |
| `accent` `accent2` `warn` | `#rrggbb` (accent: cursor, rings, active caption word; accent2: glows; warn: problems, strikes) |
| `altBg` `altSurface` `altInk` `altMuted` | `#rrggbb` (the alt surface; default the main one inverted) |
| `fonts` | `{ display, ui, mono }` (names from the font list) |
| `displayCase` | `none` `upper` |
| `displayWeight` | 100 to 900 (single-weight faces such as Anton use 400) |
| `tracking` | em, about `-0.045` to `0.02` |
| `radius` | px |
| `background` / `altBackground` | `plain` `grid` `blueprint` `paper-grain` `scanlines` `dots` `gradient-mesh` `noise-glow` `newsprint` `concrete` |
| `chrome` | `mac` `minimal` `terminal` `none` `device-frame` |
| `transition` | `whip` `cut` `mosaic` `wipe` `page-turn` `glitch` `iris` `slide-stack` `redaction-bar` `push` `zoom` `dissolve` `flash` |
| `motion` | `calm` `smooth` `snappy` `bouncy` `aggressive` |
| `camera` | `static` `drift` `push` `handheld-subtle` |
| `type` | `giant-kinetic` `stacked` `typewriter` `stamp` `split-reveal` |
| `motif` | `none` `radar-sweep` `ecg-line` `measurement-ticks` `highlighter` `scoreboard` `calendar-grid` `heat-glow` `chalk-underline` `hazard-stripes` |
| `grain` | 0 to 0.15 |
| `rhythm` | `alternate` (hook/pain/payoff on the alt surface) `mono` |

### Fonts (any role)

| group | fonts |
| --- | --- |
| grotesk / sans | Inter, Inter Tight, Geist, Sora, Space Grotesk, Manrope, DM Sans, Plus Jakarta Sans, Outfit, Archivo, Archivo Black, Syne, Unbounded, Bricolage Grotesque, Schibsted Grotesk, Hanken Grotesk, Familjen Grotesk, Work Sans, IBM Plex Sans, Lexend, Figtree, Onest, Chivo, Epilogue, Instrument Sans, Public Sans |
| serif | Fraunces, Instrument Serif, Playfair Display, DM Serif Display, Newsreader, Source Serif 4, Libre Baskerville, Cormorant Garamond, EB Garamond, IBM Plex Serif, Literata, Lora, Gloock, Young Serif |
| slab | Roboto Slab, Zilla Slab, Bitter |
| condensed | Bebas Neue, Anton, Oswald, Barlow Condensed, Archivo Narrow, Roboto Condensed, Saira Condensed, Teko |
| mono | JetBrains Mono, IBM Plex Mono, Space Mono, DM Mono, Fira Code, Geist Mono, Share Tech Mono, VT323 |
| rounded | Nunito, Quicksand, Fredoka, Rubik, Varela Round, M PLUS Rounded 1c, Baloo 2 |
| hand | Caveat, Permanent Marker, Kalam, Architects Daughter |

Fonts load from Google Fonts at render time (each under the SIL OFL or Apache-2.0).

## App tokens (`app`): the app's own UI

All optional: `font`, `mono`, `bg`, `surface`, `subtle`, `ink`, `muted`, `border`, `accent`,
`onAccent`, `good`, `bad`, `warn` (all `#rrggbb` except the fonts), `radius` (px), `size` (base
text px, default 22; raise to 26 to 30 for portrait), `dark` (boolean). Extract them from the
app's source (`tokens.md`). They describe the app being filmed, never anyone else's brand.

## Captions (`captions`)

| key | values | default |
| --- | --- | --- |
| `enabled` | boolean | `true` |
| `position` | `bottom` `top` `lower-third` `center-low` | `bottom` (9:16: `center-low`) |
| `style` | `box` `outline` `plain` `pill` | `box` |
| `size` | px | 50 (9:16: 64) |
| `maxWords` | per chunk | 6 (9:16: 3) |
| `case` | `none` `upper` `lower` | `none` |
| `fontRole` | `display` `ui` `mono` | `ui` |
| `weight` | 100 to 900 | 700 |
| `activeWordColor` | `#rrggbb` | the accent, nudged until readable |
| `avoid` | boolean | `true` (captions hop to the other edge when they would cover a target) |

Chunks break at punctuation and never strand one word. The same chunks are written to `.srt`
and `.vtt`, using the script's own words ("100" stays "100").

## Music (`music`) and SFX

`{ bpm: 90..132, mood: calm | warm | tense | driving | playful, volume?, file? }`. The bed is
synthesized at that bpm (the beat grid also rounds scene lengths); the drums enter at the
`turn` scene. `file` (or a bare path string) uses the user's own licensed track from
`.trailer/assets/` at its real bpm. `sfx: false` silences effects; a number scales them.

## Voice (`voice`)

`"aura-2-hermes-en"` or `{ provider: "deepgram" | "say" | "none" | "text", model, speed, sayVoice }`.
Default Deepgram `aura-2-hermes-en` at `speed: 1.0`; speed 0.9 to 1.1, warning above 1.05.
`{ "provider": "text" }` is the no-voice mode: no narration and no API key; every line is shown
as title-style on-screen text at a reading pace (2.2 words a second, 0.7 s per line, at least
1.5 s, 0.5 s between lines), the music is never ducked and the SFX still fire. Captions are
forced on, in the display face, at most 5 words a phrase (4 in 1:1, 3 in 9:16), and the word
budget drops to 1.5 a second (1.65 for cuts and 30 s films). `none` is only the silent layout
draft. Environment overrides: `TRAILER_VOICE`, `TRAILER_VOICE_ENGINE`. See `voice.md`.

## Capture (`capture`): live screenshots (optional)

Only needed for `screenshot` scenes. Prefer recreated `ui` scenes.

| key | notes |
| --- | --- |
| `baseUrl` | default `http://localhost:<port>` |
| `port` | default 3000; passed to `startCmd` as `PORT` |
| `startCmd` | starts the app (stopped after capture; an app already answering is reused) |
| `cwd` | where `startCmd` runs, relative to the project (default the project dir) |
| `readyPath`, `readyTimeout` | polled until it answers (default `/`, 120 s) |
| `width`, `height`, `colorScheme` | viewport (default 1440x900, light), captured at 2x |
| `hideSelectors` | hidden on every page (cookie banners, dev overlays) |
| `pages[]` | `{ name, path, waitFor?, actions?, boxes?, hideSelectors?, fullPage?, maxHeight?, settle? }`, or `{ name, image, scale?, boxes }` for a ready-made image (path relative to `.trailer/`) |

Selectors: `tid:x` (data-testid), `text:Some text` (substring), `exact:Some text`, or any
Playwright/CSS selector, with `@n` for the nth match. For click targets and boxes, match text
exactly (`exact:Apply`), because substring matches also hit "Apply all". `actions` run in order:
`{ click }`, `{ hover }`, `{ fill, value }`, `{ press, selector? }`, `{ wait: ms }`,
`{ waitFor }`, `{ scroll: y }`. Check `.trailer/.stage/shots.json` after a capture: every box
should sit on the element you meant.

## Cuts (`cuts`): derived edits

A cut re-renders a subset of the film's scenes, in a given order, at its own aspect and length.

```json
"cuts": {
  "short":  { "aspect": "9:16", "scenes": ["hook", "turn", "queue", "proof", "end"], "targetSeconds": 28, "fitSeconds": 30,
              "overrides": { "hook": { "say": "Every update, opened by hand." } },
              "captions": { "size": 66, "maxWords": 3, "position": "center-low" } },
  "square": { "aspect": "1:1", "scenes": ["hook", "turn", "queue", "end"], "targetSeconds": 30 }
}
```

- `scenes` lists scene ids in play order (it can reorder).
- `overrides` deep-merges per scene id (usually a shorter `say`; budget 2.1 words a second).
- Render one with `--cut short`, every cut plus the main film with `--all`. Outputs are
  `trailer-9x16-short.mp4` and so on. Only new or changed lines are re-voiced.

## Variants (`scene.variants`)

`variants["9:16"]` (or `"1:1"`) is a partial scene deep-merged over the scene when that aspect
renders (objects merge, arrays replace). Config coordinates are authored in 1920x1080 space and
mapped automatically into other frames, which is usable but never the best. Write a variant for:

- every scene with absolute coordinates (cast `x`/`y`, chalkboard items, telestrator, shapes,
  props) that appears in a portrait cut (the lint warns otherwise);
- `ui` scenes that need a larger `app.size` or fewer rows in portrait;
- kinetic beats longer than 3 words a line.

```json
{ "id": "lesson", "type": "chalkboard", "items": [ ... ],
  "variants": { "9:16": { "items": [ { "kind": "text", "text": "44 px", "x": 120, "y": 520, "size": 120, "at": "thumb" } ] } } }
```

## Meta (`meta`)

Free-form, for humans and skills; never rendered. Always fill it:

```json
"meta": { "useCase": "explainer", "format": "F06 The Checkpoint",
          "formatWhy": "Updates are travellers; risk tiers are the security lanes.",
          "tone": "calm announcer",
          "sources": [{ "claim": "3 of 40 updates need review", "source": "test/fixtures/week.json" }] }
```
After every finished render the engine appends one line to `.trailer/out/history.jsonl`
(JSON Lines: one JSON object per line, not a JSON array) with `at`, `render`, `aspect`, `cut`,
`format` and `useCase` (copied from `meta`), `seconds`, `words`, `voice` and `outputs`. Read it
line by line to see which formats this repo has used, so the next film picks a different one.
`out/` is gitignored, so the history is local to one machine: on a fresh clone, also treat the
committed `meta.format` in the config and the "Why this fit" note in `script.md` as used.

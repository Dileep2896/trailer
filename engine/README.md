# trailer engine

The config-driven [Remotion](https://www.remotion.dev) engine behind trailer. It turns a
project's `.trailer/trailer.config.json` into a narrated, captioned film at 16:9, 9:16 or
1:1: lint, capture, voice (with word timings), music, render, captions and a poster, in one
command.

> **Remotion has its own license.** It is free for individuals and for companies of up to 3
> people; larger companies need a Remotion company license
> (https://www.remotion.dev/license). trailer's MIT license covers trailer's own code and
> does not relicense Remotion.

You normally drive the engine through the trailer skills, which read your project and write
the config. This page is the engine's own reference. For every config key see
[docs/config-reference.md](../docs/config-reference.md); for frames and safe areas see
[docs/aspect-ratios.md](../docs/aspect-ratios.md); for how it fits together see
[docs/architecture.md](../docs/architecture.md).

## Requirements

- Node 20 or newer
- ffmpeg on `PATH` (recommended; Remotion's bundled ffmpeg is the fallback)
- A Deepgram API key for the real narrator (optional: without it the run drafts with macOS
  `say`, Linux `espeak-ng`, or silence, and says so loudly)

The first run installs the engine's dependencies (pnpm, else npm) and Remotion downloads its
headless browser. `node engine/trailer.mjs doctor` checks everything.

## Quick start

```sh
node engine/trailer.mjs init my-project --use-case explainer   # writes my-project/.trailer/
node engine/trailer.mjs my-project --lint                       # schema, rules, copy, word budget
export DEEPGRAM_API_KEY=...                                      # or put it in my-project/.trailer/.env
node engine/trailer.mjs my-project                              # -> my-project/.trailer/out/trailer-16x9.mp4
node engine/trailer.mjs my-project --all --review --gif         # the film, every cut, review stills, a GIF
```

Try it on the example (a fictional app, no key needed with `--voice-engine none`):

```sh
node engine/trailer.mjs examples/driftcheck --lint --all
node engine/trailer.mjs examples/driftcheck --cut short --stills scenes --safe-overlay --voice-engine none
```

## CLI

```text
trailer 0.1.0: turn a project into a narrated, captioned film (16:9, 9:16 or 1:1)

Usage
  trailer <projectDir> [flags]            lint, voice, render .trailer/trailer.config.json
  trailer init <dir> [--use-case <name>] [--aspect <a>] [--force]
                                          start .trailer/ from a template
                                          (use cases: explainer, launch, jobhunt, hackathon, shorts)
  trailer doctor [projectDir] [--json]    check Node, ffmpeg, browser, the install, and whether
                                          a Deepgram key is present for projectDir (default .)
  trailer schema                          print the path of the config JSON Schema
  trailer install                         install the engine's dependencies now

Render flags
  --config <path>        a config other than <projectDir>/.trailer/trailer.config.json
  --aspect 16:9|9:16|1:1 render at this aspect (default: the cut's, else the config's)
  --cut <name>           render one of config.cuts (e.g. short, square)
  --all                  render the film and every cut
  --lint                 only validate (schema + rules) and lint the copy; no voice, no render
  --no-render            stop after writing the props (for --studio or a later render)
  --voice-engine deepgram|say|none
                         override the voice provider (falls back deepgram > say > espeak-ng > none)
  --keep-voice           use your own recordings at .trailer/voice/line-N.wav
  --skip-capture         reuse the last capture (.trailer/.stage/shots.json)
  --stills scenes|cues|<seconds or scene ids, comma separated>
                         render stills instead of the film into .trailer/review/<aspect>[-<cut>]/
                         (one per scene at 60%, one per line, or e.g. 0,1.5,hook), plus sheet.jpg
  --review               after the film: a still per scene (at 60% of it) + sheet.jpg, a
                         contact sheet 4 across (outputs.sheet; outputs.review is the folder)
  --safe-overlay         draw the safe areas and caption band on stills
  --frames a-b           render only frames a to b (a quick check; written as *-frames.mp4)
  --gif                  also write a GIF (<= 4 MiB; a looping cut loops whole) next to the film
  --studio               open Remotion Studio on this render's props
  --json                 print a JSON summary on stdout (logs go to stderr)
  -h, --help             this help;  -v, --version  the version

Outputs (in <projectDir>/.trailer/out/)
  trailer-16x9.mp4, trailer-9x16-<cut>.mp4, .srt, .vtt, poster-16x9.jpg, *.gif,
  history.jsonl (one JSON line per finished render: format, useCase, seconds, outputs)

Environment
  DEEPGRAM_API_KEY       Deepgram key (else .trailer/.env, else <projectDir>/.env)
  TRAILER_VOICE          Aura-2 model override (default aura-2-hermes-en)
  TRAILER_VOICE_ENGINE   deepgram | say | none
  TRAILER_HOME           engine runtime + cache (default ~/.cache/trailer)
  REMOTION_BROWSER       a Chrome / headless shell executable to render with

Exit codes: 0 ok, 1 failure, 2 lint errors, 3 missing dependency.
Docs: https://github.com/Dileep2896/trailer (Remotion is licensed separately: see its license)
```

## A project's files

```
my-project/.trailer/
  trailer.config.json     the film (committed)
  brief.md, script.md      the brief and the script with a source per claim (committed)
  assets/                  screenshots, music, images the config points at (committed)
  .gitignore               written by init: everything below stays out of git
  out/                     trailer-16x9.mp4, trailer-9x16-short.mp4, .srt, .vtt, poster-*.jpg, *.gif, history.jsonl
  voice/                   voiced lines (<hash>.wav, <hash>.words.json); your own line-N.wav for --keep-voice
  shots/                   captured screens (their boxes are in .stage/shots.json)
  review/<aspect>[-<cut>]/ stills and sheet.jpg from --stills and --review
  .stage/                  props.json and timeline.json per render, the render's public folder
  private/                 banned-terms.txt and anything else that must never be published
  .env                     DEEPGRAM_API_KEY (never committed)
```

## Writing a good film

- **Explain the pain first, and concretely.** A moment, a number and who feels it ("Friday,
  six p.m. The release passed every check in staging."). Then why it happens, then name the
  project on the turn (`turn: true`).
- **Vary the structure, not only the skin.** Open, explain and end differently from film to
  film: a cold open, a countdown, a rewind or a case title; a lesson, a versus split, a
  sorting machine or a cork board; a folder, a ticket, a scoreboard or a certificate.
- About 105 to 123 words for 60 s, in 7 to 11 scenes, one or two sentences each, with the
  visuals cued to the words in them.
- Show the product working for at least a quarter of the film (`ui` or `screenshot`).
- Third person by default: the film talks about the project ("Driftcheck flags...").
  First-person copy is a lint error unless `narration.person` is `first`.
- Every number needs a source (record it in `script.md` and `meta.sources`).
- When a cut rewrites a scene's `say`, rewrite its word cues too: `--lint --all` warns for
  any cue whose word is no longer spoken in that scene.

## Development

```sh
cd engine
pnpm install --ignore-workspace     # or: npm ci
pnpm typecheck                      # tsc --noEmit, strict
pnpm test                           # node --test test/*.test.mjs
node scripts/gen-schema.mjs         # regenerate schema/trailer.schema.json after changing options
pnpm studio                         # Remotion Studio (or: node trailer.mjs <project> --studio)
```

Layout of the source:

- `trailer.mjs`: the CLI.
- `scripts/`: `lib` (paths, loading, validation, copy and format lint, budgets, voice
  settings), `runtime` (runtime folder, installs, ffmpeg, browser), `capture` and `serve`,
  `voice` (TTS, speech-to-text, alignment, fallback), `audio` (sound effects, music bed),
  `render` (Remotion bundle, film, stills, poster, GIF, contact sheet), `gen-schema`.
- `src/options.mjs`: every option, its values and defaults, the presets, `resolveTheme()`,
  `resolveCaptions()`.
- `src/config.mjs`: cuts, aspects, variants, `say` flattening. `src/timeline.mjs`: beat-grid
  timing and `fitSeconds`. `src/cues.mjs`: cue resolution. `src/captions.mjs`: caption
  chunks, `.srt` and `.vtt`. All shared by the scripts and the video.
- `src/frame.ts`: frame sizes, safe areas, the caption band, `place()`. `src/overlay.tsx`:
  the `--safe-overlay` guides.
- `src/theme.ts`: surfaces, motion energy, fonts, context. `src/fonts.ts`: the font registry.
- `src/ui.tsx`, `src/kit.tsx`, `src/transitions.tsx`, `src/motifs.tsx`, `src/Captions.tsx`:
  backgrounds, chromes, headline treatments, transitions, motifs and captions.
- `src/v3/`: `prims.tsx` (motion, type, stamps, labels, emoji, lockups), `Character.tsx`
  (rigged blobs, asset characters, bubbles), `appui.tsx` (recreated app UI), `scenes/type.tsx`
  (kinetic, title, outro), `scenes/stage.tsx` (cast, ui, screenshot, split, evidence,
  metric), `scenes/format.tsx` (casefile, scoreboard, chalkboard, chat, countdown, rewind,
  calendar, lanes), `registry.tsx` (dispatch and per-scene sound).
- `src/scenes/`: the classic scene types (16:9). `src/Trailer.tsx`: assembly, voice, sound
  and the ducked music. `src/Root.tsx`: the composition and its size per aspect.
- `templates/`: starter configs for `init --use-case`. `test/`: unit tests and fixtures.
- `public/characters/`: CC0 and MIT character art (sources and licenses in
  `public/characters/LICENSES.md`). Only CC0, MIT, Apache-2.0 or OFL assets go here.

Adding a scene type: write the component in `src/v3/scenes/`, register it in
`src/v3/registry.tsx` and `V3_TYPES` (`src/config.mjs`), give it timing defaults in
`src/timeline.mjs`, a portrait layout (read `useArea()`; never assume 1920x1080), schema
fields in `scripts/gen-schema.mjs`, and a section in `docs/config-reference.md`. Check it at
all three aspects with `--stills scenes --safe-overlay`.

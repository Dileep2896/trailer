# Changelog

All notable changes to trailer are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A no-voice mode for a finished film without any speech API: `"voice": { "provider": "text" }`
  (or `--voice-engine text`, `TRAILER_VOICE_ENGINE=text`). No text-to-speech or speech-to-text
  call, no fallback warning and no "not for publishing" label; `--json` reports
  `voice.engine: "text"`, `voice.mode: "text"`, `voice.fallback: false`.
  - Each line is shown as title-style captions: the display face, one phrase at a time (at
    most 5 words in 16:9, 4 in 1:1, 3 in 9:16), sized up to fill the caption band on one line,
    no karaoke lighting. Captions are always on in this mode.
  - Lines are timed at a reading pace (`READING` in `src/timeline.mjs`): 2.2 words a second
    plus 0.7 s per line, 0.3 s per sentence break, 0.1 s per comma, at least 1.5 s a line, and
    a 0.5 s blank beat between lines. Word cues fire when their phrase comes on screen.
  - The word budget uses the reading pace: 1.5 words per second of film, 1.65 for cuts and
    films of 30 s or less.
  - The music bed is no longer ducked when a line has no audio, so it stays up for the whole
    film in the text mode (and in silent drafts); the sound effects fire on their cues. In the
    text mode the bed (0.75 instead of 0.42) and the effects (1.4x) are lifted to carry the
    film (`TEXT_MIX`).
  - A caption phrase the scene already shows on screen (a kinetic beat, the outro's name and
    tagline) is not burned in twice in the text mode; the `.srt` and `.vtt` keep it.
  - Lint warns when the text mode has captions turned off, or a scene with `"captions": "off"`
    does not show its own words.
  - `doctor --json` reports `voice.provider`, `voice.mode` (`narration`, `text`, `draft`,
    `silent-draft`) and `voice.recommended` (`text` when there is no key).
- When a render falls back all the way to a silent draft (no key, no local voice), the warning
  recommends the text mode.
- Docs and skills: the intake's voice question offers "No narration: music, sound effects and
  on-screen text (free, no API key)" and defaults to it when no `DEEPGRAM_API_KEY` is found,
  for anything meant to be published (the system voice is free too, but robotic). `voice.md`,
  `config.md`, `docs/config-reference.md`, `craft.md` ("Writing for reading"), the use-case
  skills' voice preflight, `/trailer:doctor` and the README cover it.

### Changed

- Intake questions are now clickable option pickers (AskUserQuestion) instead of a typed,
  numbered list: the recommended option comes first, and every question has a text box for a
  custom answer. When the natural narrator is picked and no `DEEPGRAM_API_KEY` is set, a
  follow-up picker offers a text box for the key, which is saved only to the git-ignored
  `.trailer/.env` and never echoed. The typed list stays as the fallback when the tool is
  unavailable.
- Caption chunks split a long phrase into even parts (7 words at 3 a chunk: 3, 2, 2, never
  3, 3, 1) and avoid ending a chunk on a word that leans on the next ("the", "of", "to").
  The grouping lives in `src/phrases.mjs`, shared by the captions and the text mode's timer.
- Renamed from showreel to trailer: the plugin, skills (`trailer`, `trailer-launch`, ...),
  commands (`/trailer:new` and friends), engine CLI (`engine/trailer.mjs`), env vars
  (`TRAILER_*`), the per-project `.trailer/` folder, `trailer.config.json` and the
  `trailer-*` output files. The repo moved to github.com/Dileep2896/trailer.

### Fixed

- Remotion's headless browser (about 570 MB) is downloaded once into `TRAILER_HOME/browser`
  and remembered in `TRAILER_HOME/browser.json`, instead of into each project's
  `node_modules/.remotion` or `.remotion`. `.remotion/` is also gitignored.
- Frame 0 of 9:16 and 1:1 renders shows scene 1 with its first cue settled, so the thumbnail
  is never blank. Scene 1 `firstFrame: "live" | "settled"` overrides the default.
- `loop: true` on the last scene now works: its last 12 frames fade into frame 0, so the last
  frame matches the first. It is in the schema, and lint warns on a 9:16 render without it.
- `--stills` accepts scene ids as well as seconds and fails on anything else before it
  touches the review folder, instead of silently deleting the earlier stills.
- `doctor [projectDir]` reports the Deepgram key as `present` or `absent` with its source
  (`environment`, `.trailer/.env` or `.env`), using the same lookup a render does.
- The render history is `out/history.jsonl` (JSON Lines), and each entry records `format`,
  `useCase`, `aspect` and `cut`.
- Docs: the review sheet is `sheet.jpg` at `outputs.sheet`; shorts path B drops `--cut
  short`; the voice key lookup order; the `.stage/shots.json` path; the quickstart runs
  `install` first; the skills share one set of pre-approved tools and build on their own
  `assets/` starter config.
- The plugin has an icon (`.claude-plugin/icon.png`, 512 x 512), so `claude plugin validate
  --strict` passes without `ICON_MISSING`.
- `init` templates (`engine/templates/*.json`) are the single source of the starter configs:
  the skills' `assets/*.config.json` are byte copies (CI checks). Each is a worked example for
  a fictional product with `[FILL: ...]` placeholders; `init` swaps its product name for the
  project's. Every template lints with zero warnings, and CI now fails on any lint warning in
  a template or starter.
- Lint for shorts: scene 1 may be a `ui` scene (the product mid-action) as well as kinetic or
  title; new warnings when the first word is spoken after 1 s, when frame 0 is blank, and
  when the last scene of a 9:16 or 1:1 short has no `loop: true`.
- Lint at 1:1 flags a cast position only when the mapped position actually leaves the safe
  area (it warned on every cast `x` before).
- Silent drafts (`--voice-engine none`, `--lint`) estimate each line from its text,
  calibrated to Deepgram aura-2 at 1.0 (about 3 words a second while speaking, plus 0.5 s a
  line and pauses at sentence and clause breaks), instead of a flat 2.2 words a second that
  ran long; on the example the estimate lands within 0.3 s of the voiced film and cuts. macOS `say` drafts are slowed to aura-2's pace.
- Outro `card`: the `headline` holds at least 1.5 s before the name replaces it, or stays
  above the name when `nameAt` comes sooner. `ticket`: `gate` is documented in the schema and
  shows nothing unless set (no "OSS" stub); the default fields are just the passenger name.
- 9:16: a `ui` window and every outro layout fit inside the platform safe area (they crossed
  into the 136 px right rail); kinetic type is sized to about 77% of the safe width.
- GIF sizes are logged in MiB (the limit is 4 MiB = 4 x 1024 x 1024 bytes); a looping cut's
  GIF is the whole loop when it fits.
- The example's outro link is the fictional `driftcheck.example`.
- A settled start (9:16, 1:1 and looping films) no longer flashes: scene 1 holds its settled
  frame from frame 0 until the live scene reaches it, instead of showing it on frame 0 only
  and restarting empty on frame 1. Cues after that point animate as before, a looping short
  wraps without a blank frame, and its GIF no longer starts blank. `firstFrame: "live"`
  still opts out.

## [0.1.0] - 2026-10-21

The first public release.

### Added

- **Claude Code plugin** (`.claude-plugin/plugin.json`), and the repository works as its own
  one-plugin marketplace (`.claude-plugin/marketplace.json`). Install it with
  `/plugin marketplace add Dileep2896/trailer`, then `/plugin install trailer@trailer`.
- **Core skill `trailer`:** reads a project (README, routes, components, theme files, seed
  data, tests, CHANGELOG, git history) and makes a 60 s explainer film. It covers intake tiers
  (Quick, Standard, Studio), the brief, design-token mapping, format choice, the script with a
  source per number, the config, lint, a layout pass, the render and a frame-review loop. It
  also routes to the use-case skills.
- **Use-case skills:**
  - `trailer-launch`: product launch, feature announcement and release-recap films (the
    recap is mined from git tags, merged PRs and the CHANGELOG), plus a launch copy pack.
  - `trailer-jobhunt`: an "I built this for your problem" portfolio film, plus private
    outreach drafts (a cold email, a job-board message, e.g. for YC Work at a Startup, Wellfound or LinkedIn Jobs, and a LinkedIn post) that use
    only facts from the user's own profile file, and an optional independence mode.
  - `trailer-hackathon`: a judge-structured 45 to 75 s demo-day film in a 60-minute
    timebox, plus a Devpost or README blurb and a 3-sentence pitch.
  - `trailer-shorts`: 9:16 shorts (15 to 30 s) and 1:1 squares (20 to 45 s) derived from a
    film, with portrait variants, a hook in the first 1.5 s, a loopable end and per-platform
    post copy.
- **Commands:** `/trailer:new`, `/trailer:render`, `/trailer:review`, `/trailer:short`
  and `/trailer:doctor`.
- **Format library:** 20 narrative formats (F01 to F20), each with an arc, openers and
  closers, a signature type move, a scene recipe, "fits when" guidance and portrait notes.
- **Shared references:** the project-inventory flow, craft rules (pacing, captions, type,
  characters, sound), every scene type and the cue grammar, config keys, token extraction for
  Tailwind, CSS variables, MUI, Chakra, SwiftUI and Flutter, the character catalog, voice
  setup, the review checklist and troubleshooting.
- **Engine CLI** `engine/trailer.mjs` with `init` (templates for explainer, launch, jobhunt,
  hackathon and shorts), `doctor`, `schema`, `install`, and render flags `--lint`, `--aspect`,
  `--cut`, `--all`, `--stills`, `--review`, `--safe-overlay`, `--frames`, `--gif`,
  `--studio`, `--voice-engine`, `--keep-voice`, `--skip-capture`, `--no-render` and `--json`.
  Exit codes: 0 ok, 1 failure, 2 lint errors, 3 missing dependency.
- **Three aspects from one config:** 16:9, 9:16 and 1:1, with a frame and safe-area contract,
  portrait layouts per scene type, `cuts` (scene subsets and overrides that reuse voiced lines)
  and per-aspect `variants`.
- **Config JSON Schema** (`engine/schema/trailer.schema.json`), generated from the engine's
  options, for validation and editor autocomplete.
- **Voice:** Deepgram Aura-2 (`aura-2-hermes-en` at 1.0 by default) with Nova-3 word timings,
  and a fallback chain to macOS `say`, `espeak-ng` and a silent draft, flagged in `--json`.
  Your own recordings work with `--keep-voice`. Only changed lines are re-voiced.
- **Captions:** word-level chunks, burned in and exported as `.srt` and `.vtt`.
- **Sound:** synthesized sound effects and a music bed on a beat grid, ducked under the voice.
- **Copy lint:** the word budget per length, third-person narration by default, forbidden and
  banned terms (`.trailer/private/banned-terms.txt`), and cue words that aren't spoken.
- **Character art:** Open Peeps and Notionists (CC0 1.0) and Microsoft Fluent Emoji (MIT),
  plus code-drawn characters.
- **Example project** `examples/driftcheck`: a fictional app with a finished 60 s film config
  and two cuts (`short` at 9:16, `square` at 1:1), a brief and a script.
- **Docs:** architecture, config reference and aspect ratios, plus the README media.
- **Project files:** MIT license, third-party notices, contributing guide, Contributor
  Covenant 2.1, security policy, issue and pull request templates, and CI (install,
  typecheck, unit tests, schema check, example and starter-config lint, manifest check and a
  privacy scan).

[Unreleased]: https://github.com/Dileep2896/trailer/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Dileep2896/trailer/releases/tag/v0.1.0

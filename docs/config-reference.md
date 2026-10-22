# Config reference

A project's film lives in `<project>/.trailer/trailer.config.json`. The JSON Schema is
`engine/schema/trailer.schema.json` (generated from the engine's option lists; editors that
read `$schema` autocomplete every key):

```json
{ "$schema": "https://raw.githubusercontent.com/Dileep2896/trailer/main/engine/schema/trailer.schema.json" }
```

`node engine/trailer.mjs <project> --lint` checks a config against the schema and the rules
below, lints the copy, checks that every word cue (`at`, `until`, `stampAt`) is spoken in its
scene (after a cut's overrides), and reports the word budget, without voicing or rendering
anything.
The complete working example is `examples/driftcheck/.trailer/trailer.config.json`.

## Top level

| key | type | default | notes |
| --- | --- | --- | --- |
| `version` | `1` | `1` | config format version |
| `projectName` | string | required | said and shown; the narration names the project with it |
| `tagline` | string | | under the name on the end card |
| `repoUrl` | string | | repository URL; the end card shows it without `https://` unless `link` is set |
| `link` | `{ text, url? }` | | what the end card shows, e.g. `{ "text": "github.com/you/project" }` (product URL for a launch) |
| `credit` | `{ text, scene? }` | | a credit line ("Built by ...") on the outro, or on scene `scene` |
| `aspect` | `16:9`, `9:16`, `1:1` | `16:9` | the film's frame; `--aspect` and cuts override it |
| `targetSeconds` | 10 to 120 | `60` (a cut: `30`) | the length aimed at; sets the word budget and the duration warning |
| `fitSeconds` | 10 to 120 | | trims pauses (never the voice) until the film is at most this long |
| `narration` | `{ person }` | `{ "person": "third" }` | `third`: first-person copy is a lint error; `first` or `any` turn the check off |
| `voice` | string or Voice | Deepgram `aura-2-hermes-en` at 1.0 | see [Voice](#voice) |
| `theme` | Theme | | the whole look, see [Theme](#theme-theme) |
| `app` | AppTokens | | the app's own look, for recreated UI (`ui` and `split` scenes) |
| `captions` | Captions or `false` | on | burned-in karaoke captions, see [Captions](#captions-captions) |
| `music` | `{ bpm, mood, volume?, file? }`, a path, or `false` | `{ "bpm": 120, "mood": "driving" }` | `bpm` 90 to 132 also sets the cut grid; `mood` `calm`, `warm`, `tense`, `driving`, `playful`; `file` (or a bare path, relative to the config) uses a licensed track instead of the synthesized bed |
| `sfx` | `true`, `false` or 0 to 2 | `true` | sound effects on, off, or at a level |
| `forbiddenTerms` | string[] | | words that warn when they appear anywhere in the copy |
| `capture` | Capture | | screens of the app, see [Capture](#capture) |
| `cuts` | `{ <name>: Cut }` | | shorter or reshaped renders of the same scenes, see [Cuts](#cuts) |
| `meta` | `{ useCase, format, formatWhy, tone, sources }` | | notes for people and agents; never rendered |
| `scenes` | Scene[] | required | in play order |

Banned terms: one per line in `.trailer/private/banned-terms.txt` (gitignored). Any of them
anywhere in the copy is a lint error. Use it to keep names out of a public film.

## Cuts

A cut renders a subset of the scenes, in its own order, at its own aspect and length, reusing
the film's voice lines where the text is the same.

```json
"cuts": {
  "short": {
    "aspect": "9:16",
    "targetSeconds": 25,
    "fitSeconds": 27,
    "scenes": ["open", "diff", "turn", "shot", "end"],
    "overrides": { "open": { "say": "Friday deploy. Staging is green. Production is down." } },
    "captions": { "position": "center-low", "size": 68, "maxWords": 3 }
  }
}
```

| key | notes |
| --- | --- |
| `aspect` | the cut's frame |
| `scenes` | scene ids in play order (default: all) |
| `targetSeconds` | default 30; the budget is 2.1 words a second for a cut |
| `fitSeconds` | the cut's own; the film's `fitSeconds` does not carry over |
| `overrides` | per scene id, fields deep-merged over that scene (objects merge, arrays replace); most often a shorter `say` |
| `captions`, `music`, `theme`, `voice` | merged over the film's |

`node engine/trailer.mjs <project> --cut short` renders one cut, `--all` renders the film
and every cut. The output is `.trailer/out/trailer-<aspect>-<cut>.mp4`.

## Variants (per-aspect overrides)

Any scene can carry `variants`, keyed by aspect. When the film or a cut renders at that
aspect, the variant is deep-merged over the scene (objects merge, arrays replace):

```json
{ "id": "lesson", "type": "chalkboard", "items": [ ... 16:9 positions ... ],
  "variants": { "9:16": { "items": [ ... positions for a tall board ... ] } } }
```

Positions in a config (cast `x`/`y`, chalkboard items, telestrator marks, shapes, props) are
authored in 16:9 frame pixels (1920x1080). At 9:16 and 1:1 the engine maps them into the
content area, which is usually good; a variant gives exact control. `--lint` warns for every
scene at 9:16 or 1:1 that has positions and no variant for that aspect. See
[aspect ratios](aspect-ratios.md).

## Narration and timing

- `say`: a string, `{ text, gap? }`, or a list of them (one voice line each; `gap` is frames
  before the line). The engine turns every scene's `say` into the voice lines, in scene order.
- A scene lasts `lead + its lines (+ gaps between them) + tail`, never less than `min`, then
  rounds up to a half beat of the music. Per scene, `breath` (seconds after the last line,
  replaces `tail`), `hold` (minimum seconds, replaces `min`) and `lead` (frames) tune it. The
  default gap between lines is 8 frames.
- The narrator reads about 2.2 words a second at a natural pace. The word budget is 1.9 words
  per second of `targetSeconds` for a film (105 to 123 words for 60 s) and 2.1 for a cut, a
  short or any target of 30 s or less (58 to 68 words for 30 s), plus or minus 8%. Never speed the voice up to fit: cut words, or set `fitSeconds`.
- After voicing, the run warns when the film is more than 5 s (3 s at 30 s and under) off
  `targetSeconds`.
- `turn: true` marks the turn (usually where the project is first named). The music's drums
  enter on the next bar line.
- `poster: true` picks the poster frame's scene (default: the first `ui` or `screenshot`).
- `loop: true` on the last scene fades its final 12 frames into frame 0, so the last frame
  matches the first and a replay is seamless (shorts). Lint warns on a 9:16 render whose last
  scene lacks it, and on `loop` anywhere but the last scene.
- Frame 0 of a 9:16 or 1:1 render (and of any looping film) shows scene 1 with its first cue
  already settled, about 0.7 s into its first line: the thumbnail platforms show before
  playback. It holds that picture until the live scene reaches the same frame, then plays on,
  so scene 1 never goes empty and later cues animate as usual. Scene 1 `firstFrame: "live"`
  turns this off; `"settled"` turns it on for a 16:9 film.

Defaults per type (frames at 30 fps):

| type | lead | tail | min |
| --- | --- | --- | --- |
| kinetic | 6 | 10 | 60 |
| title | 8 | 10 | 75 |
| outro | 8 | 45 | 105 |
| cast, chat | 8 | 12 / 14 | 90 |
| ui, screenshot, split, evidence, casefile, chalkboard | 8 | 14 | 105 |
| scoreboard | 8 | 16 | 90 |
| countdown | 6 | 10 | 75 |
| rewind | 4 | 10 | 60 |
| calendar | 8 | 10 | 90 |
| lanes | 8 | 14 | 120 |
| metric | 8 | 20 | 105 |

## Cues: timing anything to the voice

Every `at` and `until` is a **cue**, resolved against that scene's own lines, using the word
timestamps (Deepgram speech-to-text, aligned to the script; else spread by word length):

| cue | means |
| --- | --- |
| `0`, `1` | the start of the scene's line 0, line 1 |
| `1.5` | halfway through line 1 |
| `"renamed"` | the moment the word "renamed" is spoken in this scene (prefixes of 4+ letters match) |
| `"pipeline#2"` | the second time it is spoken |
| `"1:fix"` | the word in line 1 only |
| `"2.5s"`, `"-1s"` | 2.5 s after the scene starts; 1 s before it ends |
| `"start"`, `"end"` | the scene's first or last frame |
| `{ "word": "fix", "offset": 0.3 }` | the object form: `line`, `word`, `nth`, `s`, `offset` (s), `edge` (`start`/`end`) |

When an element has no `at`, the engine spreads it evenly across the scene's narration.

## Common scene keys

| key | values | notes |
| --- | --- | --- |
| `type` | a scene type | required |
| `id` | string | default: the type; required when two scenes share a type; cuts refer to it |
| `say` | see above | the narration |
| `lead`, `breath`, `hold` | frames, seconds, seconds | timing, see above |
| `transition` | see below | the cut *into* this scene |
| `captions` | `auto`, `bottom`, `top`, `lower-third`, `center-low`, `off` | where captions sit in this scene; layouts keep clear of them |
| `bg` | `main`, `alt`, `stage`, `paper` | the surface |
| `cast` | CastMember[] | characters over the scene (see [Characters](#characters)) |
| `sfx` | `[{ sound, at, volume? }]` | extra sounds: `click`, `pop`, `tick`, `ding`, `impact`, `whoosh`, `glitch`, `swish`, `thunk`, `key`, `riser`, `gavel`, `whistle`, `buzzer`, `rewind`, `chalk`, `chime`, `shatter`, `boing`, `beep` |
| `cornerBug` | `{ text, sub?, at?, until?, tone?, side? }` or a list | a small broadcast bug in the top corner |
| `turn`, `poster` | boolean | see above |
| `loop` | boolean | last scene only: fade into frame 0 for a clean loop |
| `firstFrame` | `settled`, `live` | scene 1 only: whether frame 0 shows it settled (see above) |
| `variants` | `{ "9:16": {...}, "1:1": {...}, "16:9": {...} }` | per-aspect overrides |

Every scene type also adds its own sounds (pops on entrances, clicks on cursor clicks, thunks
on stamps, chalk on drawings, ticks on counters) on top of the cut sounds.

## Transitions

`theme.transition` (or a scene's `transition`) is one of `cut`, `whip`, `mosaic`, `wipe`,
`page-turn`, `glitch`, `iris`, `slide-stack`, `redaction-bar`, `push` (the next scene pushes
the last one out sideways), `zoom` (the last zooms past the camera as the next settles in),
`dissolve` (a soft cross-fade) and `flash` (a hard cut under a bright frame). Mix them.

## Scene types

**kinetic**: big type, one idea at a time (at most about 5 words on screen). Every entrance
has an exit. `fx`: `rise`, `mask`, `punch`, `blur`, `stamp`, `type`, `split`, `swap` (cycles
`swap` words through `{}`), `count`. `layout`: `center`, `left`, `stack`.

```json
{ "type": "kinetic", "layout": "center",
  "beats": [
    { "text": "Mergeline changes the order.", "accent": "order", "fx": "split", "at": 0 },
    { "text": "Sorts the {}", "fx": "swap", "swap": ["typos", "bumps", "risk"], "at": "reads" },
    { "text": "PRs merged today", "fx": "count", "count": { "from": 0, "to": 18 }, "at": "merge" }
  ],
  "say": "Mergeline changes the order. It reads every pull request first, and the safe ones merge." }
```

**title**: an opening or chapter card. `layout`: `card`, `slate` (a film slate with
`fields`), `broadcast` (a news bug, `bug`, `channel`), `stamp` (a case title stamped with
`stamp` at `stampAt`), `marquee`, `hud` (boot `lines`).

```json
{ "type": "title", "layout": "slate", "eyebrow": "Take 1", "title": "Monday, 9:00",
  "fields": [{ "k": "SCENE", "v": "The queue" }, { "k": "ROLL", "v": "40 PRs" }], "say": "..." }
```

**outro**: the end card, always with the project name and the repo pill. `layout`: `card`,
`folder` (a case file that shuts), `scoreboard` (flap letters), `ticket` (with `fields`),
`certificate`, `cloche` (a reveal under a dome), `calendar` (`day`), `chalk`. Options:
`headline`, `accent`, `tagline`, `stamp`, `at` (headline), `nameAt`, `repoAt`.

- `card`: the headline shows for at least 1.5 s before the project name replaces it. A
  `nameAt` cued earlier, or a scene too short for that hold, keeps the headline on screen
  above the name instead.
- `ticket`: `fields` fill the ticket, and the optional `gate` is the big code on the stub
  (for example `"v2"`). It is empty by default, and then no gate box is drawn.

```json
{ "type": "outro", "layout": "ticket", "headline": "Next in line: yours.", "accent": "yours",
  "fields": [{ "k": "PROJECT", "v": "Mergeline" }, { "k": "LICENSE", "v": "MIT" }],
  "say": "Mergeline. Free and open source on GitHub." }
```

**cast**: characters on a stage (`stage`: `floor`, `spotlight`, `none`), with optional
`podium` name plates, floating emoji `props` and a `headline`.

```json
{ "type": "cast", "stage": "spotlight",
  "headline": { "text": "Two witnesses. Both honest.", "accent": "honest", "at": "passed", "position": "top" },
  "cast": [
    { "who": "open-peeps/maya", "x": 600, "size": 380, "podium": "THE ANALYST", "mood": "frustrated", "at": "analyst",
      "bubble": [{ "at": "analyst", "until": "pipeline#2", "text": "The numbers were fine yesterday!", "kind": "shout" }],
      "react": [{ "at": "blames", "kind": "shake" }], "moods": [{ "at": "passed", "mood": "confused" }] },
    { "who": "blob", "shape": "bot", "accessory": "headset", "x": 1320, "size": 300, "podium": "THE PIPELINE", "mood": "smug",
      "at": "pipeline", "pops": [{ "at": "passed", "emoji": "check-mark-button" }] }
  ],
  "say": "The analyst blames the pipeline. The pipeline says every job passed." }
```

**ui**: the app's interface **recreated** as animated components in the app's own tokens
(`config.app`), in a frame (`browser`, `app`, `phone`, `panel`, `none`), with an optional
`sidebar`, a `side` text column (`sideAlign`), a multi-click `cursor`, a `camera` (focus zoom
that never crops its target), `spotlight`, `highlight` rings and callout `notes`. Elements
enter staggered, and `states` change them on cue (before and after).

```json
{ "type": "ui", "frame": "browser", "url": "driftcheck.local/checks", "sidebar": ["Checks", "Sources", "History"],
  "side": { "eyebrow": "Step 1", "title": "Check every source", "accent": "every source",
            "points": [{ "text": "48 sources, one click", "at": "click" }] },
  "elements": [
    { "type": "header", "id": "head", "title": "Checks", "sub": "Every source, validated", "actions": ["Run all checks"] },
    { "type": "row", "children": [
      { "type": "stat", "label": "Sources", "value": 48 },
      { "type": "stat", "id": "passing", "label": "Passing", "value": 48, "tone": "good", "states": [{ "at": "flagged", "set": { "value": 47 } }] } ] },
    { "type": "table", "id": "sources", "columns": ["Source", "Owner", "Status"],
      "rows": [["orders.csv", "Data", { "text": "Passing", "tone": "good", "badge": true }],
               ["billing_export.json", "Finance", { "text": "Queued", "badge": true }]],
      "states": [{ "at": "flagged", "row": 1, "set": { "cells": ["billing_export.json", "Finance", { "text": "Schema drift", "tone": "bad", "badge": true }], "tone": "bad" } }] }
  ],
  "cursor": [{ "at": "click", "to": "head.action0" }],
  "spotlight": [{ "at": "flagged", "target": "sources.row1" }],
  "notes": [{ "at": "seconds", "target": "sources.row1", "text": "amount → amount_cents", "side": "bottom" }],
  "say": "One click runs all forty-eight checks, and the drifted file is flagged in seconds." }
```

Elements (each takes `id`, `at`, `states`): `header` (`title`, `sub`, `actions`), `text`,
`card` (`title`, `body`, `meta`, `badge`, `icon`), `table` (`columns`, `rows`, `widths`),
`list` (`items` with `title`, `sub`, `badge`, `chips`, `icon`), `diff` (`file`, `lines` of
`{ op, text }`), `code` (`file`, `lines`, `highlight`), `chips`, `chart` (`kind` bar or line,
`series`, `max`, `unit`), `toggle` (`items` of `{ label, sub, value }`), `stat` (`label`,
`value`, `from`, `prefix`, `suffix`, `decimals`, `delta`, `tone`), `progress` (`value`, `kind`
bar or ring), `button` (`label`, `tone`, ripple on click), `input` (`placeholder`, `value`,
typed from `typeAt`), `kv` (`pairs`, with `redacted`), `row` (`children`, `widths`), `toast`,
`spacer`. Targets: an element `id`, or a part of one: `sources.row1`, `inbox.item0`,
`patch.line3`, `chart.bar2`, `toggles.item1`, `head.action0`.

Optional, off unless used: `shapes` (a vector drawing in its own units, such as a floor plan
or a map: `view: [w, h]`, `items` of kind `poly`, `rect`, `circle` (with `clip` to a named
poly), `dot` (with `label`, `pulse`, `move`), `text`, `line`, `cells` (a heatmap that blooms
from `from` and dissolves from `outFrom` at `until`), `sweep` (a scan line from `at` to `to`)
and `grid`; each item takes `at`, `until`, `recolor: [{ at, fill?, stroke? }]`, and a `name`
that makes it a target, e.g. `plan.waiting`), and `col` (only as a `row` child: stacks its
`children` in that column at their own heights).

App tokens (`config.app`, all optional): `font`, `mono`, `bg`, `surface`, `subtle`, `ink`,
`muted`, `border`, `accent`, `onAccent`, `good`, `bad`, `warn`, `radius`, `size` (base text
px, default 22), `dark`. Match them to the app's own CSS, so the recreation reads as that
app. They describe the app, not anyone's brand.

**screenshot**: a real capture, always **framed**: browser chrome, a device bezel or a plain
rounded card, with padding, a shadow and a backdrop. It fits by aspect ratio, never squashed
or cropped edge to edge. The slow camera drifts. `moves` push in toward a box (focus zoom),
blur and dim the rest (spotlight), and label it with a callout. `page` names a
`capture.pages` entry (use `capture.pages[].image` for a ready-made image).

```json
{ "type": "screenshot", "page": "diff", "frame": "browser", "url": "driftcheck.local/sources/billing_export",
  "moves": [
    { "at": "names", "focus": "added", "zoom": 1.8, "spotlight": true, "label": "The exact field that changed" },
    { "at": "suggests", "focus": "fix", "zoom": 1.6, "label": "One-click mapping" },
    { "at": "-1s", "reset": true }
  ],
  "say": "The schema diff names the field that changed, and suggests the fix." }
```

**split**: two halves, same input, different outcome. `mode`: `versus` or `before-after`.
A panel takes `label`, `tone` (`bad`, `good`, `neutral`), `title`, `sub`, `elements` (a
small recreated UI), `stat`, `cast`, `emoji` and `verdict`.

```json
{ "type": "split", "mode": "versus", "divider": "vs",
  "left":  { "label": "ONE-LINE TYPO", "stat": { "value": 3.2, "decimals": 1, "suffix": " days", "label": "in the queue" },
             "cast": [{ "who": "open-peeps/sam", "x": 480, "size": 330, "mood": "tired" }] },
  "right": { "label": "AUTH REWRITE", "tone": "bad", "stat": { "value": 3.1, "decimals": 1, "suffix": " days" },
             "verdict": { "text": "SAME LINE", "at": "burn" } },
  "say": "So a one-line typo waits as long as a risky rewrite, and reviewers burn out reading noise." }
```

**evidence**: public evidence as neutral cards, never logos or company names, attributed
generically ("a data lead on a forum"). `layout`: `wall`, `stack`, `grid`, `row`. A card's
`kind` is `quote`, `thread`, `post`, `stat` or `headline`; `thread` and `post` show a `count`
(replies or votes) only when you give one with a source. An optional `stamp` lands across
the cards.

```json
{ "type": "evidence", "layout": "wall", "eyebrow": "Exhibits",
  "cards": [
    { "kind": "headline", "meta": "INCIDENT LOG", "text": "Revenue down 40% overnight", "source": "dashboard alert", "at": 0 },
    { "kind": "quote", "text": "Finance found it before any test did.", "source": "a data lead on a forum", "at": "Finance" },
    { "kind": "stat", "value": "3 days", "text": "until anyone noticed", "at": "later" }
  ],
  "stamp": { "text": "NO ALERT FIRED", "at": "later" }, "say": "..." }
```

**metric**: `style`: `ring`, `gauge`, `bars` (before and after) or `flip`. The classic `cards`
look stays the default. Up to three metrics count up (or down) on cue. A ring for a drop with
no `max` fills by the share removed. Under the number a ring shows the start value ("was 72",
struck through); `fromLabel` changes the word, `strike: false` keeps it unstruck for a
comparison, and a count up from 0 hides it unless `fromLabel` is set. An optional `verdict`
closes the scene.

```json
{ "type": "metric", "style": "ring", "eyebrow": "The verdict",
  "metrics": [{ "label": "Time to catch drift", "from": 72, "to": 1, "suffix": " h", "at": 0 },
              { "label": "Sources covered", "from": 12, "to": 48, "max": 48, "at": "find" }],
  "say": "Drift that took three days to find now surfaces within the hour." }
```

**casefile**: a cork board of pinned evidence joined by red string, with a stamp at the end.
A pin's `kind` is `note`, `photo` (a character or emoji with a caption), `exhibit`, `poster`
or `card`.

```json
{ "type": "casefile", "title": "Solved", "caseNo": "0417",
  "pins": [{ "kind": "exhibit", "label": "SOURCE", "title": "billing_export.json", "at": "Source" },
           { "kind": "photo", "title": "the culprit", "emoji": "face-with-monocle", "at": "field" },
           { "kind": "note", "title": "Fix:", "body": "map amount_cents → amount ÷ 100", "at": "fix" }],
  "strings": [{ "from": 0, "to": 1 }, { "from": 1, "to": 2 }],
  "stamp": { "text": "SOLVED", "at": "place" }, "say": "Source, field and fix, pinned in one place." }
```

**scoreboard**: a broadcast board. It has a `bug` (`LIVE`, `REPLAY`, `FINAL`) and a `clock`.
Score rows (`teams`) flip from `from` to `value`, a lower third slams in, a `ticker` crawls,
and `telestrator` circles are drawn on.

```json
{ "type": "scoreboard", "bug": "FINAL", "title": "WEEK ONE", "clock": "FULL TIME", "ticker": "40 PULL REQUESTS SORTED",
  "teams": [{ "label": "Median wait", "from": 77, "value": 0.7, "decimals": 1, "suffix": " h", "tone": "good", "at": "drops" }],
  "lowerThird": { "title": "3 days → 40 minutes", "sub": "median time to merge", "at": "minutes" },
  "telestrator": [{ "at": "minutes", "x": 1320, "y": 420, "r": 90, "text": "!" }], "say": "..." }
```

**chalkboard**: a lesson drawn in chalk, stroke by stroke. An item's `kind` is `text`,
`circle`, `rect`, `line`, `underline`, `arrow`, `poly`, `fill`, `cross`, `tick` or `dot`, in
frame pixels. `color` is `white`, `yellow`, `pink`, `blue`, `green`, `red` or `accent`. An
item can also take `erase`, and the scene can end on a `wipe`. The `font` is a hand font.

```json
{ "type": "chalkboard", "font": "Caveat",
  "items": [{ "kind": "text", "text": "The review queue", "x": 150, "y": 96, "size": 84, "color": "yellow", "at": 0 },
            { "kind": "rect", "x": 150, "y": 290, "w": 220, "h": 120, "at": "change" },
            { "kind": "arrow", "x": 1040, "y": 350, "w": 230, "at": "human" },
            { "kind": "text", "text": "1 human", "x": 1300, "y": 300, "size": 96, "at": "human" }],
  "wipe": { "at": "-0.6s" }, "say": "..." }
```

**chat**: a conversation, each message preceded by a typing indicator. `style` is
`messenger` (a phone with bubbles; `side: "right"` for the sender) or `thread` (a team
channel). `people` maps ids to `{ name, avatar (emoji), color, side }`, and a message can
take a `reaction`.

```json
{ "type": "chat", "style": "thread", "title": "data-incidents",
  "people": { "bot": { "name": "Pipeline bot", "avatar": "robot" }, "fin": { "name": "Finance", "avatar": "weary-face" } },
  "messages": [{ "from": "bot", "text": "All 48 jobs succeeded.", "tone": "good", "at": 0 },
               { "from": "fin", "text": "Why is revenue down 40%?", "reaction": "exploding-head", "at": "loudly" }],
  "say": "That's the pain. Schema drift breaks nothing loudly." }
```

**countdown**: 3, 2, 1 with a draining ring, giant digits or hazard stripes (`style`: `ring`,
`bold`, `crash`), then a stamped `then` word (at `then.at`). Each number lands when it is
spoken ("three", "two", "one"), or on its `ticks` cue, else every `step` seconds from `at`.

```json
{ "type": "countdown", "style": "bold", "from": 3, "step": 0.62, "at": "Three", "then": { "text": "MONDAY" },
  "say": "Three. Two. One. It's Monday, and forty pull requests are waiting." }
```

**rewind**: a VHS rewind. Tracking noise, `◀◀ REW`, the clock spinning back from `from` to
`to` (days of the week wrap backwards), `ghosts` streaking past, then a typed `slate` at
`slateAt`.

```json
{ "type": "rewind", "from": "MON 09:00", "to": "FRI 17:00", "slate": "LAST FRIDAY", "slateAt": "Every",
  "ghosts": ["40 open", "review?"], "say": "Rewind to Friday. Every one of them was opened before the weekend." }
```

**calendar**: a tear-off desk calendar flipping on cue, with sticky notes piling up and an
optional `pileLabel` (`{n}` is the count).

```json
{ "type": "calendar", "pileLabel": "{n} still waiting",
  "pages": [{ "day": "MON", "date": "14", "note": "typo fix: waiting", "at": 0 },
            { "day": "TUE", "date": "15", "note": "version bump: waiting", "at": "Tuesday" }],
  "say": "Tuesday. Wednesday. Thursday. Still waiting." }
```

**lanes**: items ride a conveyor through a scanner, get a score badge and are sorted into
lanes, with a running count per lane.

```json
{ "type": "lanes", "source": "incoming pull requests", "scanner": { "label": "RISK" },
  "lanes": [{ "label": "auto-merge", "tone": "good" }, { "label": "quick look", "tone": "warn" }, { "label": "deep review", "tone": "bad" }],
  "items": [{ "label": "Fix typo in README", "emoji": "sparkles", "lane": 0, "score": "3", "at": 0 },
            { "label": "Rewrite auth tokens", "emoji": "warning", "lane": 2, "score": "92", "at": "risky" }],
  "say": "Each one gets a risk score. Safe changes merge on their own, and only the risky few reach a deep review." }
```

The classic scene types (`hook`, `problem`, `reveal`, `features`, `walkthrough`, `metric`,
`payoff`, `end`) still work inside a film, with `say` and `cast` too.

## Characters

A cast member (in `cast` scenes, any scene's `cast`, or a split panel):

```json
{ "who": "blob", "shape": "bot", "color": "#7c8cff", "accessory": "headset",
  "x": 1320, "y": 860, "size": 300, "flip": false, "label": "PIPELINE",
  "mood": "smug", "at": "pipeline", "enter": "pop", "exit": { "at": "-0.5s", "kind": "fade" },
  "moods": [{ "at": "passed", "mood": "worried" }],
  "look": [{ "at": "blames", "dir": "left" }],
  "react": [{ "at": "passed", "kind": "jump" }],
  "move": [{ "at": "2s", "x": 1100, "dur": 0.6 }],
  "bubble": [{ "at": "pipeline", "until": "end", "text": "Every job passed!", "kind": "speech", "side": "left" }],
  "pops": [{ "at": "passed", "emoji": "check-mark-button" }],
  "sweat": "passed" }
```

- `who: "blob"`: drawn in code (original work, no licence question) and fully rigged. It
  blinks every 2 to 4 s, has eyes that look around, brows, mood mouths, blush, and squash and
  stretch.
  - `shape`: `blob`, `bot`, `note`, `cloud`, `flame`, `doc`, `dummy`, `marble`, `envelope`, `sprout`
  - `accessory`: `glasses`, `chef-hat`, `cap`, `crown`, `headset`, `bowtie`, `magnifier`
  - `mood`: `happy`, `joy`, `calm`, `neutral`, `sad`, `worried`, `angry`, `surprised`, `sleepy`, `smug`, `dizzy`, `love`, `determined`
- `who: "open-peeps/<maya|leo|sam|ivy>"`: CC0 Open Peeps, 16 moods (happy, celebrating,
  delighted, confused, suspicious, frustrated, angry, stressed, tired, thinking, calm, awe,
  fear, cheeky, serious, driven).
- `who: "notionists/<nia|theo>"`: CC0 Notionists, with `mood` (happy, neutral, confused,
  frustrated) and `pose` (point, wave, ok, phone, hands-up, idle).
- `who: "fluent/<emoji>"`: MIT Fluent Emoji (3D). The names are in
  `public/characters/fluent-emoji/flat/`. The same names work for `pops`, `props`, `avatar`
  and `emoji` fields.
- `react`: `jump`, `bounce`, `shake`, `tremble`, `spin`, `nod`, `tilt`, `shrink`, `grow`,
  `squash`, `faint`. Mood changes cross-fade. Bubbles come as `speech`, `thought` or `shout`
  and are linted like narration.
- Every asset's source and licence is in `public/characters/LICENSES.md`. Add new ones
  there, and use only CC0, MIT, Apache-2.0 or OFL assets.

## Classic scene types

The first scene set. They still work in any film (with `say` and `cast`), but they are laid out
for 16:9 only: in 9:16 and 1:1 use the scene types above (`--lint` warns). Each takes the
common keys plus, for hook, problem and payoff, `typeStyle`.

| type | fields | what it shows |
| --- | --- | --- |
| `hook` | `giant: [{ text, accent? }]`, `sub?` | the pain in headline type, with no product name |
| `problem` | `nodes: [{ label, sub? }]`, `title?: [{ text, accent? }]`, `caption?` | the status quo as a diagram: nodes pop in, tangled warn-coloured lines cross, a "?" sits where the answer should be |
| `reveal` | `tagline?` | an accent pixel mosaic drains away and the project name assembles |
| `features` | `items: [{ title, why }]` (up to 4), `eyebrow?` (default "What <projectName> does"), `whyLabel?` (default "Why it matters") | one card per feature. **Give it one line per card**: each card lands on its own line and stays lit while it plays |
| `walkthrough` | `shots: WalkShot[]` (1 to 3), `whyLabel?` | real screens in the theme's chrome next to the feature name and why it matters |
| `metric` | `metrics: [{ label, from, to, prefix?, suffix?, decimals?, note? }]` (1 to 3), `eyebrow?`, `title?` | before and after counters, centred and sized to fill, the "before" struck through |
| `payoff` | `giant: [...]`, `then?: [...]` | headline type; with `then`, a second set swaps in behind a pixel glitch |
| `end` | `tagline?`, `cta?` | the project name, the tagline and the GitHub URL pill |

`WalkShot`: `{ page, title, why?, eyebrow?, target?, ring?, highlight?, zoom?, click?, clickAt?, toast?: { title, sub? } }`

- `page` names a `capture.pages` entry. `target`, `ring` and `highlight` name boxes on that page.
- The camera moves inside the window toward `target` (zoom default 1.3) per `theme.camera`;
  the window itself never leaves the frame. The cursor glides in and clicks the target.
- `click: false` shows no cursor at all (the ring and zoom still mark the target). Use it for
  shots that point at a result rather than a button.
- `clickAt` is the click time as a fraction of the shot (default 0.45). `ring` defaults to
  `target`. `highlight` wipes an accent bar over a row.
- When a walkthrough has one line per shot, each shot starts near its line.


## Theme (`theme`)

Every key is optional. Resolution order: defaults, then `preset`, then (legacy top-level
`accent`/`secondAccent`/`fonts`), then the keys you set here. The defaults (no preset) are the
studio look: `dark`, `dots`, `mac`, `whip`, `smooth`, `push`, `giant-kinetic`, motif `none`,
Sora/Inter/JetBrains Mono, `upper`, weight 800, tracking -0.045, radius 26, rhythm `alternate`.
So set at least `background`, `chrome`, `transition`, `type` and `motif` (or a preset) to get
away from it.

| key | values | notes |
| --- | --- | --- |
| `preset` | `studio`, `terminal`, `editorial`, `blueprint`, `playful`, `newsroom`, `brutal` | a starting point that fills every token below; override at least the accent and fonts |
| `mode` | `dark`, `light` | the main surface; colours you do not set follow it |
| `bg`, `surface`, `ink`, `muted` | `#rrggbb` | main background, card surface, text, secondary text |
| `accent`, `accent2`, `warn` | `#rrggbb` | accent (mosaic, rings, cursor, highlights, active caption word), second accent (glows, mesh), warning red (problem tangles, strike-throughs) |
| `altBg`, `altSurface`, `altInk`, `altMuted` | `#rrggbb` | the alt surface (default: the main one inverted) |
| `fonts` | `{ display, ui, mono }` | names from the font list below |
| `displayCase` | `none`, `upper` | headline case |
| `displayWeight` | 100 to 900 | headline weight (single-weight faces like Anton use 400) |
| `tracking` | em, e.g. `-0.045` to `0.02` | headline letter spacing |
| `radius` | px | corner radius of cards, toasts, tiles (0 for square) |
| `background` | `plain`, `grid`, `blueprint`, `paper-grain`, `scanlines`, `dots`, `gradient-mesh`, `noise-glow`, `newsprint`, `concrete` | the scene background |
| `altBackground` | same | background on alt scenes (default: same as `background`) |
| `chrome` | `mac`, `minimal`, `terminal`, `none`, `device-frame` | the window around product screens |
| `transition` | `whip`, `cut`, `mosaic`, `wipe`, `page-turn`, `glitch`, `iris`, `slide-stack`, `redaction-bar`, `push`, `zoom`, `dissolve`, `flash` | every cut (a scene's own `transition` overrides the cut into it) |
| `motion` | `calm`, `smooth`, `snappy`, `bouncy`, `aggressive` | the easing curve, speed, springs and impact shake of every arrival |
| `camera` | `static`, `drift`, `push`, `handheld-subtle` | slow move on each scene; in the walkthrough: no zoom, a slow partial zoom, a push to the target, or a push with handheld jitter |
| `type` | `giant-kinetic`, `stacked`, `typewriter`, `stamp`, `split-reveal` | hook and payoff headline treatment (a scene's `typeStyle` overrides it) |
| `motif` | `none`, `radar-sweep`, `ecg-line`, `measurement-ticks`, `highlighter`, `scoreboard`, `calendar-grid`, `heat-glow`, `chalk-underline`, `hazard-stripes` | a recurring accent mark; `highlighter` and `chalk-underline` mark the accent line of headlines, the rest sit at the frame edges |
| `grain` | 0 to 0.15 | film grain over everything (default 0.05) |
| `rhythm` | `alternate`, `mono` | `alternate` puts hook, problem and payoff on the alt surface; `mono` keeps every scene on the main one |

What the choices look like:

- **Backgrounds.** `plain` flat colour with a vignette. `grid` drifting square grid. `blueprint` fine and major grid lines plus a title block. `paper-grain` fibrous paper with warm edges. `scanlines` CRT lines with a rolling band and glow. `dots` the dot grid with two drifting glows. `gradient-mesh` large blurred accent and accent2 blobs. `noise-glow` animated noise over a big accent glow. `newsprint` halftone dots, column rules and a masthead rule. `concrete` mottled low-frequency noise and specks.
- **Chrome.** `mac` the traffic-light browser bar with the path. `minimal` hairline border, no bar. `terminal` mono title bar `~/repo — /path`, accent border, faint scanlines on the screen. `none` the bare screen with a shadow. `device-frame` a dark tablet bezel with a camera dot.
- **Transitions.** `whip` content whips out and in with motion blur, plus a tile sweep where the surface changes. `cut` hard cut. `mosaic` a tile field floods and drains. `wipe` an accent panel then an ink panel wipe across. `page-turn` the outgoing scene turns away like a page over the next. `glitch` chromatic split, slices and pixel noise. `iris` circle close and open over the accent. `slide-stack` the next scene slides up over the last, which sinks back. `redaction-bar` black bars (one accent) strike across, then pull away.
- **Motion.** `calm` slow ease, long settles (durations x1.4). `smooth` expo-out. `snappy` quick ease (x0.7). `bouncy` overshoot and loose springs. `aggressive` very fast (x0.55), tight springs, impact shake.
- **Type.** `giant-kinetic` lines rise out of a mask (plus a pixel glitch on the hook's accent line). `stacked` lines on solid slabs, the accent line on an accent slab. `typewriter` typed character by character with a block caret (and key clicks). `stamp` lines slam down rotated with a shake, the accent line boxed (and a thunk). `split-reveal` each line's halves slide in from opposite sides past an accent rule.

## Fonts

Any of these names, for any role (`display`, `ui`, `mono`). Each loads only when used, with the
weights it has.

| group | fonts |
| --- | --- |
| grotesk / sans | Inter, Inter Tight, Geist, Sora, Space Grotesk, Manrope, DM Sans, Plus Jakarta Sans, Outfit, Archivo, Archivo Black, Syne, Unbounded, Bricolage Grotesque, Schibsted Grotesk, Hanken Grotesk, Familjen Grotesk, Work Sans, IBM Plex Sans, Lexend, Figtree, Onest, Chivo, Epilogue, Instrument Sans, Public Sans |
| serif | Fraunces, Instrument Serif, Playfair Display, DM Serif Display, Newsreader, Source Serif 4, Libre Baskerville, Cormorant Garamond, EB Garamond, IBM Plex Serif, Literata, Lora, Gloock, Young Serif |
| slab | Roboto Slab, Zilla Slab, Bitter |
| condensed | Bebas Neue, Anton, Oswald, Barlow Condensed, Archivo Narrow, Roboto Condensed, Saira Condensed, Teko |
| mono | JetBrains Mono, IBM Plex Mono, Space Mono, DM Mono, Fira Code, Geist Mono, Share Tech Mono, VT323 |
| rounded | Nunito, Quicksand, Fredoka, Rubik, Varela Round, M PLUS Rounded 1c, Baloo 2 |
| hand | Caveat, Permanent Marker, Kalam, Architects Daughter |

## Voice

```json
"voice": { "provider": "deepgram", "model": "aura-2-hermes-en", "speed": 1.0, "sayVoice": "Samantha" }
```

| key | values | default | notes |
| --- | --- | --- | --- |
| `provider` | `deepgram`, `say`, `none` | `deepgram` | `say` is the macOS voice; `none` is silent (lengths estimated from the words) for layout work and CI |
| `model` | `aura-2-<name>-<lang>` | `aura-2-hermes-en` | any Deepgram Aura-2 voice, e.g. `aura-2-thalia-en`, `aura-2-apollo-en`, `aura-2-luna-en`, `aura-2-orion-en` |
| `speed` | 0.9 to 1.1 | `1.0` | pace with pitch kept; above 1.05 warns |
| `sayVoice` | a macOS voice | `Samantha` | the voice for the `say` fallback |

`voice` can also be a bare model name. `TRAILER_VOICE` (a model) and `TRAILER_VOICE_ENGINE`
(a provider) in the environment override the config; `--voice-engine` overrides both.

The key is read from `DEEPGRAM_API_KEY` in the environment, else `.trailer/.env`, else the
project's `.env`. It is never printed or written. When Deepgram cannot be used (no key, a
401/403, no network), the run falls back to `say` (macOS), then `espeak-ng` (Linux), then
silence, with a loud warning and `"fallback": true` in the `--json` summary. A fallback
render is a draft, not for publishing. Generated audio is subject to your Deepgram account's
terms.

Your own recordings: put `line-1.wav`, `line-2.wav`, ... in `.trailer/voice/` (one per line,
in render order) and pass `--keep-voice`. They are trimmed and loudness-matched, and the
film is cut to their lengths.

## Captions (`captions`)

On by default. Words light up as they are spoken (karaoke), in short chunks of up to
`maxWords` that break at punctuation and never strand one word. `false` turns them off. Scene
layouts keep the caption band clear.

| key | values | default | notes |
| --- | --- | --- | --- |
| `enabled` | boolean | `true` | |
| `position` | `bottom`, `top`, `lower-third`, `center-low` | `bottom` (9:16: `center-low`) | `center-low` sits just below the centre (72% of the height in 9:16), clear of the platform buttons |
| `style` | `box`, `outline`, `plain`, `pill` | `box` | dark translucent box; stroked text; soft shadow; a rounded surface pill |
| `size` | px | `50` (9:16: `64`, 1:1: `54`) | |
| `case` | `none`, `upper`, `lower` | `none` | |
| `fontRole` | `display`, `ui`, `mono` | `ui` | which theme font |
| `weight` | 100 to 900 | `700` | |
| `activeWordColor` | `#rrggbb` | the accent | the spoken word |
| `maxWords` | number | `6` (9:16: `3`, 1:1: `4`) | per chunk |
| `avoid` | boolean | `true` | move off a walkthrough's target |

At 9:16 and 1:1 the film's caption settings never go below the aspect's size or above its
words per chunk, and `bottom` or `lower-third` become `center-low` in 9:16, unless a cut sets
its own `captions`. The same chunks are written to `.srt` and `.vtt` next to the film.
Captions follow the script's words (not the recogniser's), so "100" stays "100".

## Capture

Screens for `screenshot` and `walkthrough` scenes. Three sources, per page:

| key | notes |
| --- | --- |
| `pages` | `[{ name, path?, image?, scale?, waitFor?, actions?, boxes?, hideSelectors?, fullPage?, maxHeight?, settle? }]` |
| `pages[].image` | a ready-made screenshot, relative to the config, with `scale` (default 2) and literal boxes. Needs no browser |
| `serve` | `{ dir, port? }`: the engine serves this static folder (relative to the project) for the capture |
| `baseUrl`, `port` | an app that is already running (default `http://localhost:3000`) |
| `startCmd`, `cwd` | else this command starts the app in `cwd` (relative to the project), with `PORT` set; it is stopped after |
| `readyPath`, `readyTimeout` | page polled until it answers (default `/`, 120 s) |
| `width`, `height`, `colorScheme` | viewport (default 1440x900, light), captured at 2x |
| `hideSelectors` | hidden on every page before the shot (toasts, cookie banners, dev overlays), with `visibility` so nothing moves |

- Selectors: `tid:x` (a `data-testid`), `text:Some text` (substring, any case), `exact:Some
  text` (the whole text), or any Playwright/CSS selector. An `@n` suffix picks the nth match.
- **Click targets: match text exactly** (`exact:Apply` or `button:text-is("Apply")`), since
  `text:Apply` also hits "Apply all". Check `.trailer/.stage/shots.json` after a capture.
- `actions` run in order before the shot: `{ click }`, `{ hover }`, `{ fill, value }`,
  `{ press, selector? }`, `{ wait: ms }`, `{ waitFor }`, `{ scroll: y }`.
- `boxes`: `[{ name, selector, optional? }]`, or literal `{ name, x, y, width, height }` in CSS px.
- Live captures use Playwright's Chromium, installed on first use.

## Legacy keys

Older configs still load. These keys are read but are not in the schema (`--lint` warns):
`kit: 3` (same as `version: 1`), `lines` (top-level voice lines; use `say`), `voiceSpeed`
(use `voice.speed`), `accent`, `secondAccent` and `fonts` (use `theme`), `outDir`, `slug`,
`ownerVoiceOverride`.

# Scene reference

A film is an ordered list of typed scenes in `scenes`. Each scene carries its own narration in
`say`, and each **type** is a different visual device. This file lists every type, its fields,
the cue grammar that times things to the voice, and how each type behaves in 9:16 and 1:1.

The machine-readable truth is the schema (`<engine> schema` prints its path). When this file
and the schema disagree, the schema wins; run `--lint` to find out.

## Fields every scene takes

| key | values | notes |
| --- | --- | --- |
| `type` | see the list below | required |
| `id` | string | default: the type; required when two scenes share a type |
| `say` | string, `{ text, gap? }`, or an array of them | the narration; each entry is one voice line |
| `breath` | seconds | room after the last line (replaces the type's default tail) |
| `hold` | seconds | minimum scene length (replaces the type's default minimum) |
| `lead` | frames | delay before the first line (rarely needed) |
| `transition` | `cut` `whip` `mosaic` `wipe` `page-turn` `glitch` `iris` `slide-stack` `redaction-bar` `push` `zoom` `dissolve` `flash` | the cut **into** this scene; default `theme.transition` |
| `captions` | `auto` `bottom` `top` `lower-third` `center-low` `off` | caption placement for this scene; layouts keep clear of it |
| `cast` | CastMember[] | characters laid over the scene (`characters.md`) |
| `sfx` | `[{ at, sound, volume? }]` | extra sounds: pop click whoosh swish thunk key tick ding impact riser glitch gavel whistle buzzer rewind chalk chime shatter boing beep |
| `turn` | `true` | where the project is named; the drums enter here (exactly one per film) |
| `poster` | `true` | the poster frame comes from this scene (one per film) |
| `bg` | `main` `alt` | which surface (see `theme.rhythm`) |
| `variants` | `{ "9:16": {...}, "1:1": {...} }` | partial scene deep-merged when rendering that aspect (objects merge, arrays replace) |

A scene lasts: lead + its lines (with gaps) + breath, never less than `hold`, rounded up to a
half beat of the music. The voice decides the length; `fitSeconds` only trims slack.

## Cues: timing anything to the voice

Every `at`, `until`, `stampAt`, `nameAt`, `typeAt` and state change is a **cue**, resolved
against **that scene's own lines** using the word timestamps:

| cue | means |
| --- | --- |
| `0`, `1` | the start of the scene's line 0, line 1 |
| `1.5` | halfway through line 1 |
| `"flagged"` | when "flagged" is spoken in this scene (a prefix of 4+ letters also matches: `"flag"` matches "flagged") |
| `"flagged#2"` | the second time it is spoken |
| `"1:fix"` | "fix" in line 1 only |
| `"2.5s"`, `"-1s"` | 2.5 s after the scene starts; 1 s before it ends |
| `"start"`, `"end"` | the scene's first or last frame |
| `{ "word": "fix", "offset": 0.3 }` | object form: `line`, `word`, `nth`, `s`, `offset` (seconds), `edge` (`start`/`end`) |

- An element without `at` is spread evenly across the scene's narration.
- A cue word that is never spoken falls back to even spacing and the lint warns. Pick
  distinctive words of 4+ letters that appear exactly where the picture should change.
- Numbers in narration are digits ("40"), and cues can target them: `"at": "40"`.

## Type and titles

### `kinetic`
Big type, one idea at a time (at most about 5 words on screen).

| field | values |
| --- | --- |
| `layout` | `center` `left` `stack` |
| `size` | px, max size (fits automatically) |
| `beats[]` | `{ text, accent?, fx?, at?, until?, sub?, size?, color?, swap?, count? }` |
| `beats[].fx` | `rise` `mask` `punch` `blur` `stamp` `type` `split` `swap` (cycles `swap` words through `{}`) `count` (`count: { from, to, prefix?, suffix?, decimals? }`) |
| `beats[].color` | `accent` `warn` `ink` |

```json
{ "type": "kinetic", "turn": true, "captions": "off",
  "beats": [{ "text": "Enter Gatepost.", "accent": "Gatepost", "fx": "punch", "at": 0 },
            { "text": "Every update, {}", "fx": "swap", "swap": ["scored", "sorted", "logged"], "at": "reads" }],
  "say": "Enter Gatepost. It reads every update before anything merges." }
```
Portrait: font size fits the safe width, at most 3 words per line, `left` becomes `stack`. The
lint warns on beats over 5 words.

### `title`
An opening or chapter card.

| `layout` | extra fields |
| --- | --- |
| `card` | `eyebrow`, `title`, `accent`, `sub` |
| `slate` | `fields: [{ k, v }]` (a film slate) |
| `broadcast` | `bug` (`LIVE`...), `channel` |
| `stamp` | `stamp` (text), `stampAt` (cue) |
| `marquee` | `title` (scrolling marquee lights) |
| `hud` | `lines: [text]` (boot lines, typed) |

```json
{ "type": "title", "layout": "stamp", "eyebrow": "Case 0042", "title": "Staging v. Production",
  "stamp": "IN SESSION", "stampAt": "versus", "say": "Order in court. Staging versus production." }
```

### `outro`
The end card: always the project name and the link pill (`link` or `repoUrl`), plus the
`credit` line if set.

| `layout` | extra fields |
| --- | --- |
| `card` | `headline`, `accent`, `tagline`; the headline shows for at least 1.5 s before the name replaces it (a `nameAt` cued earlier, or a scene too short for the hold, keeps the headline above the name) |
| `folder` | `caseLabel`, `stamp` (a case file that shuts) |
| `scoreboard` | flap letters |
| `ticket` | `fields: [{ k, v }]`, optional `gate` (the big code on the stub, such as `"v2"`; empty by default, so no gate box is drawn) |
| `certificate` | `stamp` |
| `cloche` | a reveal under a dome |
| `calendar` | `day`, `date`, `prevDay`, `prevDate` |
| `chalk` | chalked on |
| `packet` | `headline`, `emoji: [names]`, `fields`, `packetColor` |

Common: `headline`, `accent`, `tagline`, `stamp`, `stampAt`, `at` (headline), `nameAt`, `repoAt`,
`loop: true` (any scene type, last scene only: its final 12 frames fade into frame 0, which
shows scene 1 settled, so the last frame matches the first and the film loops cleanly).

```json
{ "type": "outro", "layout": "ticket", "headline": "Cleared for takeoff.", "accent": "takeoff",
  "fields": [{ "k": "PROJECT", "v": "Gatepost" }, { "k": "LICENSE", "v": "MIT" }],
  "say": "Gatepost. Open source on GitHub." }
```

## Stage and product

### `cast`
Characters on a stage.

| field | values |
| --- | --- |
| `stage` | `floor` `spotlight` `none` |
| `headline` | `{ text, accent?, at?, until?, position?: top | bottom }` |
| `cast[]` | CastMember plus `podium` (a name plate) |
| `props[]` | `{ emoji, x, y, size?, at?, float? }` |

Portrait: positions go through automatic mapping, sizes x0.8; write `variants["9:16"]` for
hero scenes. The lint warns above 2 characters in portrait.

### `ui` (recreated app UI)
The app's interface rebuilt as animated components in `config.app` tokens.

| field | values |
| --- | --- |
| `frame` | `browser` `app` `phone` `panel` `none` |
| `url`, `title` | chrome text |
| `sidebar` | `[label]` (nav items) |
| `elements[]` | see the element table |
| `width` | px, the window width |
| `side` | `{ eyebrow?, title?, accent?, body?, points?: [{ text, at? }], at? }` a text column |
| `sideAlign` | `left` `right` |
| `tilt`, `perspective` | a slight 3D plane that settles flat |
| `app` | a per-scene override of `config.app` |
| `cursor[]` | `{ at, to: target, click? }` (multi-click) |
| `camera[]` | `{ at, focus: target, zoom? }` or `{ at, reset: true }` (never crops its target) |
| `spotlight[]` | `{ at, until?, target }` (dims and blurs the rest) |
| `highlight[]` | `{ at, until?, target }` (an accent ring) |
| `notes[]` | `{ at, until?, target, text, side?: left | right | top | bottom }` (a callout) |

**Elements** (each takes `id`, `at`, `h`, `states: [{ at, set: {...}, row? | item? }]`):

| element | fields |
| --- | --- |
| `header` | `title`, `sub`, `actions: [label]`, `active` |
| `text` | `text`, `size`, `tone`, `weight` |
| `card` | `title`, `body`, `meta`, `badge` (text or `{ text, tone }`), `icon` (emoji), `tone`, `quoted` |
| `table` | `columns`, `rows` (arrays of cells, or `{ cells, tone?, strike?, at? }`), `widths` (fr) ; a cell is text or `{ text, tone?, badge?, mono?, strike?, bold? }` |
| `list` | `items: [{ title, sub?, badge?, meta?, chips?, icon?, tone?, strike?, at? }]` |
| `diff` | `file`, `lines: [{ op: "+" | "-" | " ", text }]` |
| `code` | `file`, `lines: [text]`, `highlight: [n]` |
| `chips` | `items: [text | { text, tone }]` |
| `chart` | `kind: bar | line`, `series: [{ label, value, tone? }]`, `max`, `unit`, `h` |
| `toggle` | `items: [{ label, sub?, value }]` |
| `stat` | `label`, `value`, `from`, `prefix`, `suffix`, `decimals`, `delta`, `tone` |
| `progress` | `label`, `value` (0 to 100), `kind: bar | ring`, `tone`, `suffix` |
| `button` | `label`, `tone: primary | ghost | danger`, `align` |
| `input` | `placeholder`, `value`, `typeAt` (cue), `icon` |
| `kv` | `pairs: [[k, v] | { k, v, tone?, redacted? }]` |
| `row` / `col` | `children`, `widths` (`col` only inside a `row`) |
| `toast` | `title`, `sub`, `tone` (floats bottom-right of the window) |
| `spacer` | `h` |
| `shapes` | `view: [w, h]`, `items` of `poly` `rect` `circle` `dot` `text` `line` `cells` `sweep` `grid`, each with `at`, `until`, `recolor: [{ at, fill?, stroke? }]`, `name` (a vector drawing: a floor plan, a map, a machine) |

**Targets** for cursor, camera, spotlight, highlight and notes: an element `id`, or a part of
one: `deps.row1`, `inbox.item0`, `patch.line3`, `chart.bar2`, `toggles.item1`, `head.action0`,
`plan.<shape name>`.

Tones: `good`, `bad`, `warn`, `accent`, `muted` (from the app tokens).

```json
{ "type": "ui", "frame": "browser", "url": "gatepost.local/updates", "poster": true,
  "side": { "eyebrow": "Step 1", "title": "Every update, scored", "accent": "scored",
            "points": [{ "text": "Patches merge on their own", "at": "patches" }] },
  "elements": [
    { "type": "header", "id": "head", "title": "Updates", "sub": "This week", "actions": ["Review queue"] },
    { "type": "table", "id": "deps", "columns": ["Package", "Change", "Risk"],
      "rows": [["date-utils", "2.3.1 → 2.3.2", { "text": "Low", "tone": "good", "badge": true }],
               ["auth-client", "4.9.0 → 5.0.0", { "text": "Review", "tone": "warn", "badge": true }]],
      "states": [{ "at": "majors", "row": 1, "set": { "tone": "warn" } }] } ],
  "cursor": [{ "at": "human", "to": "head.action0" }],
  "spotlight": [{ "at": "majors", "target": "deps.row1" }],
  "notes": [{ "at": "majors", "target": "deps.row1", "text": "Major version: a human looks", "side": "bottom" }],
  "camera": [{ "at": "patches", "focus": "deps", "zoom": 1.3 }, { "at": "-0.8s", "reset": true }],
  "say": "Patches merge on their own. Majors wait for a human." }
```
Portrait: the `sidebar` is dropped, `side` text moves below the frame (above it when captions
are `top`), the frame takes the full safe width and defaults to `phone` when `frame` is unset.

### `screenshot`
A real capture, always framed.

| field | values |
| --- | --- |
| `page` | a `capture.pages` name (required; use `capture.pages[].image` for a ready-made image) |
| `frame` | `browser` `device` `plain` |
| `url`, `side`, `sideAlign`, `tilt` | as in `ui` |
| `moves[]` | `{ at, focus: boxName | { x, y, width, height }, zoom?, spotlight?, label?, scroll? }` or `{ at, reset: true }` |

Portrait: fit to width, focus zoom at least 1.4. Keep any screenshot at most 4 s per stretch.

### `split`
Two halves: same input, different outcome.

| field | values |
| --- | --- |
| `mode` | `versus` `before-after` (a wipe from left to right) |
| `divider` | `vs` `line`; `vsText` |
| `enter` | `none` (continue straight from another split) |
| `left`, `right` | Panel |

Panel: `label`, `tone` (`bad` `good` `neutral`), `title`, `titleAt`, `sub`, `at`, `elements`
(small UI), `frame`, `app`, `stat: { value, from?, label?, prefix?, suffix?, decimals?, tone? }`,
`cast` (x in panel px 0 to 960), `emoji`, `verdict: { text, at?, tone? }`, `dimUntil` (cue).

Portrait: panels stack top and bottom with a horizontal divider.

### `evidence`
Public evidence as neutral cards. Never logos or names; attribute generically.

| field | values |
| --- | --- |
| `layout` | `wall` `stack` `grid` `row` |
| `eyebrow`, `title`, `accent`, `titleSize` | header |
| `cards[]` | `{ kind: quote | thread | post | stat | headline, text, source?, title?, meta?, value?, labels?, count?, at?, tone? }` |
| `stamp` | `{ text, at?, size?, x?, y?, rotate? }` |

Portrait: `wall` and `grid` become `stack`, at most 3 cards.

### `metric`
| field | values |
| --- | --- |
| `style` | `ring` `gauge` `bars` (before and after) `flip` (`cards` is the classic look) |
| `eyebrow`, `title` | header |
| `metrics[]` (1 to 3) | `{ label, from, to, prefix?, suffix?, decimals?, note?, max?, at?, fromLabel?, strike? }` |
| `verdict` | `{ text, accent?, at? }` |

`strike: false` keeps the start value unstruck (a comparison, not a before/after). Portrait:
rings and gauges stack; the lint warns above 2 metrics.

## Format scenes

### `casefile`
A cork board with pins joined by red string. `title`, `caseNo`, `pins: [{ kind: note | photo |
exhibit | poster | card, title?, body?, label?, emoji?, who?, mood?, at?, x?, y?, rot?, w? }]`,
`strings: [{ from, to, at? }]` (pin indices), `stamp: { text, at? }`. Portrait: a 2-column pin grid.

### `scoreboard`
A broadcast board. `bug` (`LIVE` `REPLAY` `FINAL`), `title`, `clock`, `teams: [{ label, value,
from?, at?, tone?, decimals?, suffix? }]`, `lowerThird: { title, sub?, at? }`, `ticker` (text),
`telestrator: [{ at, x, y, r?, text? }]`. Portrait: rows stack, the ticker spans the width;
telestrator coordinates need `variants["9:16"]`.

### `chalkboard`
A lesson drawn stroke by stroke. `font` (`Caveat` `Kalam` `Permanent Marker` `Architects
Daughter`), `items: [{ kind: text | circle | rect | line | arrow | poly | cross | tick |
underline | dot | fill, text?, x, y, w?, h?, r?, points?, size?, color?: white | yellow | pink |
blue | green | red | accent, at?, dur?, erase? }]` in frame pixels, `wipe: { at }`. Portrait:
items are mapped automatically, but always write `variants["9:16"]` (the lint warns otherwise).

### `chat`
A conversation, each message after a typing indicator. `style` (`messenger` `thread`), `title`,
`people: { <id>: { name, color?, side?, avatar? (emoji) } }`, `messages: [{ from, text, at?,
reaction?, tone? }]`. Messages are in-world dialogue: first person there is only a warning.
Portrait: unchanged (already phone-shaped), centred.

### `countdown`
3, 2, 1, then a stamped word. `from` (default 3), `label`, `style` (`ring` `bold` `crash`), `at`,
`step` (seconds, default 0.75), `ticks` (cues), `then: { text, at? }`. Each number lands when it
is spoken ("three", "two", "one"), else on its tick.

### `rewind`
A VHS rewind. `from` and `to` (clock text, e.g. `"FRI 18:02"` to `"FRI 15:02"`; days wrap
backwards), `ghosts: [text]`, `slate` (typed at `slateAt`), `at`.

### `calendar`
A tear-off calendar flipping faster and faster. `pages: [{ day, date?, note?, at? }]`,
`pileLabel` (`{n}` is the count), `notesOff`.

### `lanes`
A conveyor through a scanner into lanes. `source`, `scanner: { label }`, `lanes: [{ label,
tone?, counts? }]`, `items: [{ label, emoji?, lane, score?, at? }]`, `headline`, `travel`
(frames, default 54). Portrait: a top-to-bottom conveyor with 3 bins at the bottom.

## Classic scenes

`hook`, `problem`, `reveal`, `features`, `walkthrough`, `payoff` and `end` (the original fixed
grammar) still render inside a film, with `say` and `cast`. Prefer the scene types above for
new films; see the docs' architecture page for their fields.

## Default lengths (frames at 30 fps)

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

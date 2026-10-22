# Launch formats: which film for which launch

This file adapts the shared format library to launches. The full entries (arc, motion,
signature type, characters, portrait notes) live in
[`../../trailer/references/formats.md`](../../trailer/references/formats.md). Scene fields
are in [`../../trailer/references/scenes.md`](../../trailer/references/scenes.md). This file
adds only what changes for a launch: which format to pick, the act timings for each kind, and
a scene recipe for each format.

## 1. Decision table

Pick by the **shape of what shipped**, not by taste. Then shortlist 3, drop any format listed
in `.trailer/out/history.jsonl`, and write one sentence of "Why this fit" for the winner.

| the shape of what shipped | first pick | also consider | avoid |
| --- | --- | --- | --- |
| A new product for a pain people already feel | **F16 Unboxing** | F19 Before/After Swipe, F14 Cold Open, Rewind | Countdown (nothing to rank yet) |
| A pain that is silent until it hurts (missed jobs, drift, leaks) | **F14 Cold Open, Rewind** | F03 Forecast, F16 Unboxing | F02 Instant Replay (the pain is not a race) |
| A product that detects or predicts before the damage | **F03 Forecast** | F14 Cold Open, Rewind | Unboxing (it hides the "before") |
| The same screen, visibly better (one workflow, fewer steps) | **F19 Before/After Swipe** | F10 Two Lanes, One Input | Countdown |
| A speed, cost or accuracy launch with a benchmark | **F02 Instant Replay** (its scoreboard carries the race) | F19 Before/After Swipe, F10 Two Lanes, One Input | Unboxing (the number is the story) |
| Setup or onboarding that is now fast ("running in 1 minute") | **F18 Speedrun** | F02 Instant Replay | Forecast |
| One new feature inside a known product | **F19 Before/After Swipe** | F16 Unboxing (one item), F14 Cold Open, Rewind | a 5-move film |
| A release with 3 to 5 user-visible changes of different weight | **F17 Countdown Changelog** | F02 Instant Replay | Unboxing (no ranking) |
| A release with one headline change plus fixes | **F19 Before/After Swipe** for the headline | F17 with 3 beats | a 5-beat countdown |
| A major version with breaking changes | **F14 Cold Open, Rewind** (open on the old error) | F17 with a "migrate" beat | hiding the breakage |
| A launch-week finale | **F17 Countdown Changelog** over the week's drops | F02 Instant Replay | repeating a format used that week |

Two rules sit above the table:

- **The metaphor must carry meaning.** A box only fits when the product really "arrives"
  with distinct pieces. A countdown only fits when the items can be ranked honestly. A new
  skin on the same structure is not a new format.
- **Pain before product.** Every format below shows the "before" before the first product
  UI. A recap does this inside each beat: the before clause first, then the after clause.

## 2. Act timings by kind

These replace the core 60 s default for launch films. Scale proportionally for other
lengths, and keep the word budget from SKILL.md.

### Product launch (55 s default, 45 to 60 s)

| act | time (s) | job | notes |
| --- | --- | --- | --- |
| hook | 0 to 5 | one concrete moment of the pain, with no product name | a chat, a log, a calendar, a person |
| pain and why the fix fails | 5 to 17 | evidence, then why today's workaround breaks | at least 12 s, before any product UI |
| turn | 17 to 21 | name the product and its availability ("ships today") | `turn: true` brings the drums in |
| in the box | 21 to 41 | 2 or 3 moves, each a recreated `ui` scene | one move per scene, with cursor, spotlight and a note |
| proof | 41 to 48 | one measured number, with its source in `script.md` | `split` before/after, a `metric` ring or a `scoreboard` |
| CTA | 48 to 55 | name, the availability words, the link pill | `outro` with `hold` 4 to 5 s |

### Feature announcement (40 s default, 30 to 45 s)

| act | time (s) | job | notes |
| --- | --- | --- | --- |
| the old way | 0 to 4 | one beat of how it works today | the product may be named here, since viewers know it |
| why it costs | 4 to 11 | the cost of the old way, concretely | at least 6 s |
| turn | 11 to 14 | "New in <Product> <version>: <Feature>." | kinetic, `turn: true` |
| the feature | 14 to 31 | 1 or 2 moves of recreated UI | at least 40% of the runtime |
| proof or unlock | 31 to 35 | one number, or "now you can..." | qualitative is fine when there is no number |
| how to get it | 35 to 40 | update command, setting path, or plan | outro with `link` set to the docs or changelog |

### Release recap (45 to 60 s)

| act | time (s) at 45 / 60 | job | notes |
| --- | --- | --- | --- |
| open | 0 to 4 / 0 to 5 | version and "N changes that matter" | `title` layout `broadcast` or `slate` |
| beats, low to high | 4 to 33 / 5 to 45 | 3 beats (45 s) to 5 beats (60 s), 6 to 9 s each | each beat: before clause, then after clause |
| No. 1 | inside the beats | the biggest change, 10 to 14 s, recreated UI | the No. 1 scene carries `turn: true` and `poster: true` |
| tally | 33 to 39 / 45 to 52 | up to 3 git-derived counts | `scoreboard` with bug `FINAL` |
| CTA | 39 to 45 / 52 to 60 | the upgrade command and the changelog link | outro, `hold` of 4 s or more |

## 3. Scene recipes

Each recipe lists the engine scene types in order. `→` separates scenes. Scene counts assume
the default length. Every recipe ends in an `outro` whose `link` is the CTA.

### F16 Unboxing (product launch, the starter `launch.config.json`)

The canonical recipe, signature move (label-maker tape) and arc are in the core
`formats.md` under F16. Read it first. These are the launch choices on top of it:

- **Opening A, box first (the core recipe):** a `title` `layout: "card"` with the box and
  its version label, then the pain. Choose it when an audience already waits for the release
  (a v2, a launch-week day).
- **Opening B, pain first (the starter):** `chat` (the pain moment) → `ui` with `frame:
  "panel"` (the status quo, such as a log, an inbox or a spreadsheet, *not* the product) →
  `evidence` (why today's fix fails). Choose it for a new product nobody is waiting for: the
  viewer must feel the pain before a box means anything.
- **The rest, either way:** a `kinetic` turn ("<Product> ships today.", with `fx: "stamp"`
  for the label tape or `fx: "split"` for a lid opening) → 2 to 4 × `ui`, one feature each,
  the headline feature first with the camera push → the proof (`split` before/after in the
  starter, or `kinetic` `fx: "count"` / `metric` in the core recipe) → `outro` `layout:
  "ticket"`, a shipping label whose `fields` hold the product, status and plan.
- **Counting the items:** give the `ui` scenes the same side eyebrow pattern ("In the box ·
  2 of 3"), so the unpacking reads as a structure.
- **Ends:** the ticket outro. Use a headline like "Delivered today." only when it really is
  live today.

### F17 Countdown Changelog (release recap, the starter `release-recap.config.json`)

The canonical recipe (broadcast open, the request behind the release, a `countdown`, ranks 5
to 1, the scoreboard, a `scoreboard` outro) is in the core `formats.md` under F17. These are
the launch choices on top of it:

- **The compact 45 s, 3-beat version (the starter):** `title` `layout: "broadcast"` (bug
  "RELEASE", channel "vA → vB") → No. 3 as `split` before/after → No. 2 as `kinetic` with
  `fx: "count"` (when the beat has a number) or `ui` → No. 1 as `ui` (`turn: true`, `poster:
  true`, cursor, note) → `scoreboard` tally (bug `FINAL`, `teams` for up to 2 counts, a
  `ticker` carrying only spoken numbers) → `outro` (`layout: "card"` with the upgrade
  command, or `"scoreboard"` as in the core recipe). It drops the core's request beat and
  `countdown` scene to fit 79 to 92 words.
- **50 to 60 s, 4 or 5 beats:** restore the core's `evidence` beat (the request behind the
  release, attributed generically) and its `countdown`. No. 5 and No. 4 are short `kinetic`
  or `split` scenes of 5 to 6 s. Only No. 1, and optionally No. 2, get recreated UI.
- **Signature move:** each beat opens on its rank, spoken ("Number 2.") and shown (a label,
  a stamp or a count). The rank always counts down.

### F18 Speedrun (when the launch is about speed)

- **F18 Speedrun** (core `formats.md`) suits a launch whose story is "setup in 1 minute": an
  onboarding flow, an installer, a template. Keep its split timer HUD, and use measured split
  times only.

### F19 Before/After Swipe (feature announcement, one-screen improvements)

The core recipe in `formats.md` under F19 is portrait-first; in 16:9 its split runs left and
right. It suits a feature announcement where one screen changes, and the teaser cut of that
announcement. Set `meta.format` to `F19 Before/After Swipe` for either version below.

- **The core order:** `ui` (before) → `split` before/after (`turn: true`) → `ui` (after) →
  `metric` → `outro`. Use it for the teaser and for short announcements.
- **The launch order, after first (40 s):** `ui` (the finished "after" screen, 3 s, no
  narration about the product yet: "This is Tuesday's report, done by 9.") → `split`
  before/after or `rewind` ("Last month it took this...") → `ui` (the old flow in the app's
  tokens, the costly steps highlighted) → `kinetic` turn ("New in <Product> 3.2:
  <Feature>.") → 1 or 2 × `ui` (the new flow, the cursor doing the one action) → `split`
  before/after proof (steps or minutes) → `outro`.
- **Signature move:** the opening frame returns at the end, earned this time.

### F14 Cold Open, Rewind (silent pain, breaking changes)

- **Recipe:** `title` layout `slate` or `chat` (the failure at a timestamp) → `rewind` (to
  "3 hours earlier") → `ui` or `evidence` (how it happened) → `kinetic` turn → 2 × `ui` (the
  timeline where it is caught) → `title` layout `slate` (the same timestamp, now calm) →
  `outro`.
- **For a major version:** the cold open is the old error the new version prevents, and one
  beat shows the migration (a `ui` scene with a `diff` element).

### F03 Forecast (detect before damage)

- **Recipe:** `title` layout `broadcast` ("Tonight's forecast") → `ui` with `shapes` (a map
  of the system) → `evidence` (the storm: what breaks) → `kinetic` turn → 2 × `ui` (detection
  pins that open into app cards) → `metric` (the outlook) → `outro`.

### F02 Instant Replay (benchmark launches: the scoreboard race)

The core entry in `formats.md` under F02 owns the broadcast look, the `scoreboard` motif and
the `scoreboard` outro. For a benchmark launch, the two "runs" are the old way and the new way
on the same input. Set `meta.format` to `F02 Instant Replay`.

- **Recipe:** `title` layout `broadcast` (bug "LIVE") → `split` versus (the old way and the
  new way on the same input, racing) → `ui` (where the time goes) → `kinetic` turn →
  `scoreboard` (bug `LIVE`, rows flipping) → `ui` (how it gets that speed, one move) →
  `scoreboard` (bug `FINAL`, `lowerThird` with the headline number) → `outro` layout
  `scoreboard`.
- **Honesty rule:** a benchmark launch names the setup on screen (`lowerThird.sub`: "same
  machine, same 10,000 rows"). The source row in `script.md` points to the benchmark file
  and the command that produced it.

## 4. Look and sound for launches

- Theme: the starter's theme is a placeholder. Change the accent and fonts, and at least two
  of background, chrome, transition, type and motif (see `../../trailer/references/config.md`).
- Music: launches suit `driving` or `playful` at 110 to 124 bpm. Recaps suit a `driving` bed
  of 116 to 128 bpm. Feature announcements for calm tools suit `warm` at 96 to 104 bpm. The
  drums enter at the scene with `turn: true`.
- SFX: a `ding` or `impact` on the proof number and a `thunk` on the rank stamps. Do not add
  more than the scene types already add.
- Characters: optional. A launch film with no characters is fine. If you use them, give one
  character one job (the user feeling the pain), and let it react on the turn and the proof.

## 5. Portrait and teasers

Do not author a 16:9 launch film in portrait. Make it, review it, then hand off to
`trailer-shorts`. That skill adds `cuts.short` (9:16) and `cuts.square` (1:1). The best
teaser usually comes from the hook, the turn, the hero UI scene and the outro.

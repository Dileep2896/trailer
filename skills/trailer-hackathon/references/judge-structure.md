# Judge structure: acts, timings and scene recipes

This file is the hackathon detail behind steps 2 to 4 of the skill. Scene fields and cue
grammar are in the core skill's [scenes.md](../../trailer/references/scenes.md), and full
format entries are in [formats.md](../../trailer/references/formats.md). This file only covers what changes for judges.

## Why this order

Judges at a hackathon watch many videos in a row, often on a laptop in a loud room or on a
projector, and they score against a rubric. The usual criteria are impact or usefulness,
technical difficulty, completeness (does it work), design or UX, and creativity. The
structure answers them in the order a judge asks:

1. **What is the problem?** If the judge can't say it after 10 s, the rest is scored with
   less attention. So the problem gets at most 10 s, not the 14 s or more a general
   explainer gives it.
2. **Does it work?** This is the biggest act, at least 40% of the runtime. Judges reward a
   finished core loop over a long feature list.
3. **How?** One sentence and one diagram show the technical depth without a stack dump.
4. **So what?** One honest result, or the next step.
5. **Who, and where?** A name to remember and a place to find it (repo, demo URL, table).

How this differs from the core explainer: the pain is shorter, the demo is longer, the
proof number may be qualitative, and the end card carries a credit line and a booth or demo
link.

## Act timings by length

Seconds of film. The demo act never drops below 40% of the runtime.

| act | 30 s | 45 s | 60 s (default) | 75 s | 90 s | 120 s |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Problem | 0 to 6 | 0 to 8 | 0 to 10 | 0 to 10 | 0 to 12 | 0 to 15 |
| 2. Turn | 6 to 8 | 8 to 10 | 10 to 13 | 10 to 13 | 12 to 15 | 15 to 19 |
| 3. Live demo | 8 to 22 | 10 to 30 | 13 to 40 | 13 to 50 | 15 to 60 | 19 to 82 |
| 4. How it works | (cut) | 30 to 36 | 40 to 48 | 50 to 60 | 60 to 72 | 82 to 98 |
| 5. Impact or next | 22 to 26 | 36 to 41 | 48 to 55 | 60 to 69 | 72 to 83 | 98 to 112 |
| 6. Team and repo | 26 to 30 | 41 to 45 | 55 to 60 | 69 to 75 | 83 to 90 | 112 to 120 |
| demo share | 47% | 44% | 45% | 49% | 50% | 53% |
| demo steps | 2 | 2 or 3 | 3 | 3 or 4 | 4 | 4 or 5 |

Word budget is 1.9 spoken words per second of film, plus or minus 8% (2.1 per second for a
film of 30 s or less, so 58 to 68 words at 30 s). A demo step usually
takes 14 to 20 words and 7 to 10 s with its breath.

## Act 1: Problem (one person, one moment, one failure)

- **Do:** one named person (fictional or from the seed data), one moment, and one concrete
  failure the viewer can picture. If the repo has a real number for the pain, use it here.
- **Don't:** market sizes, "millions of people", or any product UI.
- **Scenes that work:** `title` with `layout: "hud"` or `"stamp"` (Speedrun, Crash-Test
  Lab), `rewind` after a cold open (F14), `cast` with one character and a bubble, `chat`
  with the failure as a message, or `split` in `before-after` mode. Use `evidence` only if
  the brief holds public evidence, attributed generically ("a wheelchair user on a city
  forum"), never a company name.
- **One scene, or two at most.** At 60 s that is 17 to 19 words.

```json
{ "id": "problem", "type": "title", "layout": "hud", "title": "RUN 01 · CURB CHECK",
  "lines": ["ROUTE   home → clinic", "RAMPS   unknown", "MAP     shows none"],
  "say": "Four curbs on Maria's route to the clinic have no ramp. She finds out at the curb." }
```

## Act 2: Turn (name it and promise one thing)

A `kinetic` scene with `"turn": true`. The music's drums enter here. One line names the
project and states what it does, in 5 to 8 words. Add no feature list here.

```json
{ "id": "turn", "type": "kinetic", "turn": true, "transition": "flash", "captions": "off",
  "beats": [{ "text": "Rampwise", "accent": "Rampwise", "fx": "punch", "at": 0 },
            { "text": "maps them first.", "fx": "rise", "at": "maps" }],
  "say": "Rampwise maps every curb before she leaves." }
```

## Act 3: Live demo (the core loop, step by step)

**Proof of life first (optional, recommended).** Judges have seen recreated UI that does
not exist. One framed `screenshot` of the real running app, 4 s or less, at the start of
the demo answers that. It needs `capture.pages` (a live path while the app runs, or
`image` for a screenshot the user already has). See `skills/trailer/references/config.md`.
If capture fails, drop it: the recreated UI carries the demo.

**Then 2 to 4 demo steps, one scene each.** Each step is one user action and one visible
result. Rules:

- Use the app's real tokens (`config.app`) and real seed rows, names and labels. The
  recreation must look like the app the judge will open.
- Show the action: a `cursor` click, an `input` typed from `typeAt`, or a `button` ripple.
- Show the result: `states` change a row, a badge or a stat on a cue word; a `spotlight`
  and a `notes` callout land on the result.
- Label the step on screen (`side.eyebrow` such as "Split 1" or "Step 1"), so the demo
  survives the muted test.
- Give the scene an id that starts with `demo-`, so the demo share can be measured.
- **Only what works.** If a step is hard-coded or simulated, it is not a demo step. Move it
  to act 5 as "next".

```json
{ "id": "demo-scan", "type": "ui", "frame": "phone", "transition": "push",
  "side": { "eyebrow": "Split 1", "title": "Snap the corner", "accent": "Snap" },
  "elements": [
    { "type": "header", "id": "head", "title": "Elm St & 3rd", "sub": "Scan each corner" },
    { "type": "button", "id": "scan", "label": "Scan corner" },
    { "type": "list", "id": "curbs", "at": "tagged", "items": [
      { "title": "NE corner", "badge": { "text": "Ramp", "tone": "good" } },
      { "title": "NW corner", "badge": { "text": "No ramp", "tone": "bad" }, "tone": "bad" },
      { "title": "SW corner", "badge": { "text": "Blocked", "tone": "warn" }, "tone": "warn" } ] } ],
  "cursor": [{ "at": "Point", "to": "scan" }],
  "spotlight": [{ "at": "blocked", "target": "curbs.item1" }],
  "notes": [{ "at": "blocked", "target": "curbs.item1", "text": "Missing ramp, flagged", "side": "bottom" }],
  "say": "Point a phone at the corner. Every curb gets tagged: ramp, no ramp, or blocked." }
```

Pick the frame and elements by product type with the table in SKILL.md step 2.

## Act 4: How it works (one sentence, one diagram)

The narration names the 2 or 3 parts that do the work, in one sentence. The picture is a
diagram of 3 to 5 boxes with the data moving through it. Pick the diagram by the shape of
the system:

| the system is... | diagram |
| --- | --- |
| a pipeline (input, model or rules, output) | `ui` with `frame: "none"` and a `shapes` element: boxes, arrows drawn on cue, one `dot` that moves box to box |
| a sorter or classifier | `lanes`: items ride through a scanner into labelled lanes |
| one clever function | `ui` with a `code` element, 6 lines at most, with `highlight` on the line that matters |
| a client, server and a third-party API | `shapes` with three boxes and two labelled arrows |

```json
{ "id": "how", "type": "ui", "frame": "none", "transition": "dissolve",
  "side": { "eyebrow": "How it works", "title": "Photo in, safe route out", "accent": "safe route" },
  "elements": [{ "type": "shapes", "id": "flow", "view": [100, 36], "items": [
    { "kind": "rect", "x": 2, "y": 12, "w": 18, "h": 12, "fill": "surface", "stroke": "border", "width": 0.4, "at": 0 },
    { "kind": "text", "text": "Photo", "x": 11, "y": 19, "anchor": "middle", "size": 2.6, "at": 0 },
    { "kind": "line", "points": [[20, 18], [27, 18]], "stroke": "muted", "width": 0.5, "draw": true, "at": "vision" },
    { "kind": "rect", "name": "model", "x": 27, "y": 12, "w": 20, "h": 12, "fill": "surface", "stroke": "accent", "width": 0.6, "at": "vision" },
    { "kind": "text", "text": "Vision model", "x": 37, "y": 19, "anchor": "middle", "size": 2.6, "at": "vision" },
    { "kind": "line", "points": [[47, 18], [54, 18]], "stroke": "muted", "width": 0.5, "draw": true, "at": "labels" },
    { "kind": "rect", "x": 54, "y": 12, "w": 18, "h": 12, "fill": "surface", "stroke": "border", "width": 0.4, "at": "labels" },
    { "kind": "text", "text": "Curb tags", "x": 63, "y": 19, "anchor": "middle", "size": 2.6, "at": "labels" },
    { "kind": "line", "points": [[72, 18], [79, 18]], "stroke": "muted", "width": 0.5, "draw": true, "at": "routing" },
    { "kind": "rect", "x": 79, "y": 12, "w": 19, "h": 12, "fill": "surface", "stroke": "accent", "width": 0.6, "at": "routing" },
    { "kind": "text", "text": "Router", "x": 88.5, "y": 19, "anchor": "middle", "size": 2.6, "at": "routing" },
    { "kind": "dot", "x": 11, "y": 7, "r": 1.4, "fill": "accent", "at": 0,
      "move": [{ "at": "vision", "x": 37 }, { "at": "labels", "x": 63 }, { "at": "routing", "x": 88.5 }] } ] }],
  "say": "Under the hood, a vision model labels each curb, and a routing layer steers around the bad ones." }
```

Sponsor or technology prizes: name the sponsor's API or tool in this act only if the hack
really uses it, and only by its public product name. Never show a third-party logo.

## Act 5: Impact or what's next

- **With an honest number** (from tests, fixtures, a benchmark or the user): a `metric`
  scene (`ring`, `bars` or `flip`) with the number counting up, and a sources-table row in
  `script.md`. One number, or two at most.
- **Without one:** qualitative proof as a `kinetic` beat ("Works offline. No account.") or
  a `split` in `before-after` mode on the same screen.
- **What's next:** one `kinetic` line for the next step, labelled as next. This is where a
  mocked or planned feature may appear, never in the demo.

```json
{ "id": "proof", "type": "metric", "style": "ring", "transition": "zoom",
  "eyebrow": "Test set · photos in the repo",
  "metrics": [{ "label": "Missing ramps caught", "from": 0, "to": 37, "max": 39, "suffix": " of 39", "at": "caught" }],
  "say": "On its test photos, it caught 37 of 39 missing ramps." }
```

## Act 6: Team and repo card

An `outro` scene. It always shows the project name and the link pill. Set these at the top
level of the config:

- `credit`: `{ "text": "Built at <event> by <team>" }`. It is linted like copy. Use only
  names the user gave you. If there are none, "Built at <event>" or no credit at all.
- `link`: `{ "text": "Demo at table 12" }` or `{ "text": "rampwise.example", "url": "https://..." }`.
  Without `link`, the pill shows `repoUrl`.

The outro layout follows the format: `scoreboard` for Speedrun (a "personal best" board),
`certificate` for Crash-Test Lab, `card` for F19 Before/After Swipe, `ticket` or `card` for
Cold Open, Rewind, and `card` with confetti from the cast for Spot the Fake. The spoken line
is the name and the tagline, 5 to 8 words. The credit is shown, not spoken.

```json
{ "id": "team", "type": "outro", "layout": "scoreboard", "bug": "PB", "headline": "PERSONAL BEST",
  "tagline": "Every curb, checked before you go.", "transition": "iris",
  "say": "Rampwise. Every curb, checked before you go." }
```

## Format recipes for hackathons

The core entries in `formats.md` give the full arc, motion, signature type and characters.
These are the hackathon versions: the same metaphor, bent to the six acts.

### F18 Speedrun (default)

- **Fits:** a core loop of 2 to 4 quick steps, where ease or speed is the point.
- **Recipe:** `title` hud (problem, a "RUN 01" readout) → `kinetic` turn ("Start the run")
  → optional framed `screenshot` (proof of life) → 3 `ui` demo steps, each with
  `side.eyebrow` "Split 1", "Split 2", "Split 3" → `ui` with `shapes` (how) → `metric` or
  `kinetic` (impact or next) → `outro` `scoreboard` ("PERSONAL BEST").
- **Look:** dark, one hot accent, a mono HUD font, `background: "grid"`,
  `motif: "scoreboard"`, `transition: "flash"` between splits, `motion: "snappy"`,
  `music: { "bpm": 124, "mood": "driving" }`.
- **Signature move:** the split label stamped onto each demo step. Never show a run timer
  unless it reads a real measured time.

### F14 Cold Open, Rewind

- **Fits:** the hack prevents a dramatic failure (an outage, a missed alert, a wrong dose).
- **Recipe:** `title` `stamp` or `chat` on the failure at full stop (problem, 0 to 5 s) →
  `rewind` to "earlier" (5 to 8 s) → `kinetic` turn → 2 or 3 `ui` demo steps on the same
  moment, now caught → `shapes` or `lanes` (how) → a `split` in `before-after` mode back at
  the same timestamp, now calm (impact) → `outro` `card` or `ticket`.
- **Look:** a mono timestamp slate, `transition: "glitch"` into the rewind, then `dissolve`.
- **Watch:** the rewind eats time. Keep the cold open to one line.

### F05 Crash-Test Lab

- **Fits:** testers, validators, guardrails, linters, safety or privacy tools.
- **Recipe:** `countdown` with `style: "crash"` or `title` `stamp` "TEST 01" (problem) →
  `kinetic` turn → `ui` demo steps where each bad input hits the hack and is caught
  (`states` flip rows to blocked, `notes` name the rule) → `lanes` (inputs sorted pass,
  review or block) for how → `metric` (caught counts from the test suite) → `outro`
  `certificate` ("PASSED").
- **Look:** `motif: "hazard-stripes"`, stencil labels, `sfx` `shatter` on a caught failure.

### F19 Before/After Swipe

- **Fits:** a visible transformation of one artifact (messy to clean, inaccessible to
  accessible, raw to explained). Set `meta.format` to `F19 Before/After Swipe`; this is its
  16:9 hackathon version (the core entry is portrait-first).
- **Recipe:** `split` in `before-after` mode showing the "before" only (problem) →
  `kinetic` turn → 2 or 3 `ui` demo steps doing the transformation → `shapes` (how) →
  `split` `before-after` with both sides (impact) → `outro` `card`.
- **Look:** light theme, `transition: "wipe"`, `motif: "highlighter"`.

### F11 Spot the Fake (game show)

- **Fits:** detectors of something humans miss (fakes, fraud, errors, hallucinations).
- **Recipe:** `countdown` "5 seconds, spot it" over a recreated item (problem; the judge
  plays) → reveal of the miss → `kinetic` turn ("the player who never misses") → 2 or 3 `ui`
  demo steps flagging each fake → `lanes` (how) → `scoreboard` with real counts from tests
  (impact) → `outro` `card` with confetti.
- **Look:** `music: { "mood": "playful" }`, buzzer `sfx`, big flashing numerals.
- **Watch:** the game must use the hack's real seed items. Never invent a fake example the
  hack was not tested on.

## Tailoring to a track

Move seconds between acts 1, 4 and 5 to match what the track scores. The demo act keeps at
least 40%.

| track | lean into | how |
| --- | --- | --- |
| social impact, health, civic | act 1 and act 5 | a sharper person-and-moment problem; impact as who is helped and how often (sourced) |
| technical, infra, AI | act 4 | the diagram gets 2 more seconds; a `code` element for the clever part |
| best design, UX | act 3 | 4 demo steps, a camera push on each detail, no diagram if time is short |
| sponsor API or tool | act 4 | the sponsor's tool named in the how line and shown in the diagram |
| beginner, first hack | act 6 | the credit line names what the team learned to build; keep the claims modest |

## Narration person

The lint makes third person the default, and it reads well to judges: "Rampwise maps every
curb." If the team asks for "we", set `"narration": { "person": "first" }`. Then keep "we"
to the turn and the team card ("We built Rampwise in 36 hours"). The demo lines still
describe what the viewer sees.

## The optional 9:16 cut

For posting the hack after the event. Add `cuts.short` with 4 or 5 scenes (problem, turn,
the best demo step, proof, team), `targetSeconds` 25 to 30, shorter `say` overrides at 2.1
words per second, and captions `center-low`. The starter config has one ready. For anything
more (platform captions, loops, square cuts), hand off to the `trailer-shorts` skill after
the main film is delivered.

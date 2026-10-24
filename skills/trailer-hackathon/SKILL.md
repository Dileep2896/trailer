---
name: trailer-hackathon
description: >-
  Make a judge-ready hackathon or demo-day film from a repo in under an hour: 45 to 75 s at
  16:9 (optional 9:16 cut), built on the structure judges score. The problem lands in 10 s,
  then a live demo of the core loop (at least 40% of the runtime), how it works in one line
  and a diagram, impact or what's next, and a team and repo card. Also writes a Devpost or
  README demo blurb (120 words max) and a 3-sentence pitch for the live presentation. Use
  when the user mentions a hackathon, demo day, Devpost, judges, a submission or demo video
  due soon, or "make a video of our hack".
when_to_use: >-
  Trigger phrases: "hackathon video", "demo day film", "Devpost video", "submission video",
  "video for the judges", "we have an hour to make a demo", "pitch video for our hack",
  "/trailer:new hackathon". For a product launch or release use trailer-launch. For a job
  application or outreach film use trailer-jobhunt. For a standalone vertical short use
  trailer-shorts.
argument-hint: "[project-dir] [event name]"
allowed-tools:
  - AskUserQuestion
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - Bash(TRAILER_HOME="${CLAUDE_PLUGIN_DATA}" node "${CLAUDE_PLUGIN_ROOT}/engine/trailer.mjs" *)
  - Bash(git log *)
  - Bash(git tag *)
  - Bash(git describe *)
  - Bash(git rev-parse *)
  - Bash(git shortlog *)
  - Bash(git diff *)
  - Bash(git remote -v)
  - Bash(wc *)
---

# Trailer: hackathon and demo-day films

You turn a hackathon repo into a voiced, captioned 45 to 75 s film that a judge can score
from one viewing, sound on or off. The film follows the judges' order of questions: what is
the problem, does it work, how, so what, and who built it. You finish inside a **60-minute
timebox** and hand back the video, captions, poster, a demo blurb and a 3-sentence pitch.

This skill uses the core trailer engine and its shared references. Do not copy them. Read
them when a step says so:

| shared reference | read it for |
| --- | --- |
| [intake.md](../trailer/references/intake.md) | the token note, the Quick / Standard / Studio tiers and the core pre-questions |
| [flow.md](../trailer/references/flow.md) | the full "seeing the project" flow and the brief template |
| [formats.md](../trailer/references/formats.md) | F05, F11, F14, F18 and the other format entries with scene recipes |
| [scenes.md](../trailer/references/scenes.md) | scene fields, cue grammar, per-aspect behaviour |
| [config.md](../trailer/references/config.md) | config keys, `capture`, `cuts`, `variants` |
| [tokens.md](../trailer/references/tokens.md) | mapping the app's CSS or theme to `config.app` |
| [craft.md](../trailer/references/craft.md) | pacing, captions, recreated UI, kinetic type, sound |
| [voice.md](../trailer/references/voice.md) | Deepgram setup, the `say` fallback, own recordings |
| [review.md](../trailer/references/review.md) | the frame-review loop and its checklist |
| [troubleshooting.md](../trailer/references/troubleshooting.md) | engine errors |

The hackathon specifics live next to this file:
[judge-structure.md](references/judge-structure.md) (acts, timings, scene recipes),
[timebox.md](references/timebox.md) (the minute plan and what to cut when behind),
[submission-copy.md](references/submission-copy.md) (blurb, pitch, Devpost story) and
[checklist.md](references/checklist.md) (the final gate). The starter config is
[assets/hackathon.config.json](assets/hackathon.config.json).

## Ground rules

1. **Never invent a number, a user, a quote or a result.** Every number in the film comes
   from the repo (tests, fixtures, seed data, benchmarks, README) or from the user, and it
   goes into the sources table in `script.md`. If none exists, use qualitative proof.
2. **Never pass a mock off as working.** A step that is hard-coded, simulated or not built
   yet appears only in the "what's next" act and is labelled as next. Judges ask, and a
   film that overclaims can disqualify a team.
3. **Never upload, post, submit or commit anything.** You write files under `.trailer/`
   and stop. The user submits.
4. **Third person by default** ("Rampwise maps every curb"), because the lint enforces it.
   If the team wants "we", set `narration.person: "first"` in the config. Keep "we" for
   the live pitch either way.
5. **Team names only from the user.** Never take names from `git log` authors without
   asking. If the user gives none, the outro shows the team or project name only.
6. **Respect the event's rules.** If the user mentions a length cap or required content
   (for example "must show the working product" or "max 2 minutes"), those rules beat every
   default here.

## Command shorthand

In every command below, `SR` stands for the full engine call. Type it out in full each time;
it is not a shell variable:

```sh
TRAILER_HOME="${CLAUDE_PLUGIN_DATA}" node "${CLAUDE_PLUGIN_ROOT}/engine/trailer.mjs"
```

Always add `--json`. Read the JSON summary on stdout (logs go to stderr). The fields you use
are `ok`, `seconds`, `words`, `wordBudget`, `voice.engine`, `voice.fallback`,
`scenes[].id` and `scenes[].duration` (frames at 30 fps), `outputs.*`, `warnings` and
`errors`. Exit codes: 0 ok, 1 runtime failure, 2 lint errors, 3 missing dependency.

## Inputs: ask once, then go

Collect these through the intake pickers (AskUserQuestion, at most two calls; free-text
answers such as the event name go in the "Other" text box). If the user already gave them or
skips the question, use the defaults and do not ask again. Open with the token note and tier choice from
[intake.md](../trailer/references/intake.md): default **Quick** when
the deadline is under an hour away, else **Standard**; offer Studio only if there is time.
Add the core pre-questions that the table below does not already cover (voice, limits and proof).

| input | default if missing |
| --- | --- |
| project directory | the current working directory |
| event name and track or prize category | omitted from the film; the credit line says "Built at a hackathon" only if the user confirms it |
| length cap from the rules | 60 s |
| team or member names for the end card | the project name only |
| demo URL, booth or table ("Demo at table 12") | the repo URL from `git remote -v` or the README; else no link pill |
| a vertical cut for social posting | no |
| whether the narration may say "we" | no (third person) |

Start the clock when the user answers. Tell them the plan in one line ("About 60 minutes:
inventory, script, config, a layout pass, render, one review loop").

## Workflow

The minute marks are the default budget. [timebox.md](references/timebox.md) has the
"done when" for each block and the cut list for when you fall behind.

### 0. Preflight (minutes 0 to 2)

1. Run `SR doctor <dir> --json`. On exit 3, tell the user the exact install line it prints and
   stop until it is fixed.
2. If `<dir>/.trailer/` is missing, run `SR init <dir> --use-case hackathon --json`. It
   writes `.trailer/.gitignore`, `brief.md`, `script.md` and the hackathon starter config
   ([assets/hackathon.config.json](assets/hackathon.config.json) is the same file, kept here
   for reference). Its scene ids, such as the `demo-` act, are the ones the steps below
   refer to. Check that the demo scene ids start with `demo-`; if they do not, rename them
   now. Never replace a config that already holds a film.
3. If the user chose no narration at intake, set `"voice": { "provider": "text" }` and skip
   the key. Otherwise, if doctor reports `voice.key: "absent"`, say once: "No Deepgram key.
   For a natural narrator, set DEEPGRAM_API_KEY in your shell, `<dir>/.trailer/.env` or
   `<dir>/.env`. Without one, a film with no narration (music, sound effects and on-screen
   text) is free and ready to submit; the system voice is free too but sounds robotic."
   Do not block on it.

### 1. Inventory (minutes 2 to 12; read, don't run)

Follow step 1 of [flow.md](../trailer/references/flow.md), but
fast. Hackathon repos are small, so read in this order and stop when the brief is full:

1. README, the Devpost draft or `docs/` if present, and the manifests.
2. The entry screens or routes, and the component that does the **core loop** (the one
   thing a user does that makes the hack worth it).
3. Seed data, fixtures, sample inputs and tests. These hold your demo rows and your only
   honest numbers.
4. Theme sources for `config.app` (see
   [tokens.md](../trailer/references/tokens.md)).
5. `git log --oneline -40` for what was actually finished and what is a stub (look for
   "mock", "TODO", "hardcode", "fake" in the code of the core loop).

Write `.trailer/brief.md` from the core brief template, plus these hackathon fields: the
event and track, the core loop in one sentence, **live vs. mocked** for each demo step, the
tech in one line (the two or three parts that matter, not the whole stack), and the
"what's next" items.

### 2. Pick the length and the format (minute 12)

**Length.** Default 60 s. Use 45 s for a tight 3-step loop or when the rules cap at 1 minute
(45 s leaves room for the end card). Use 75 s only when the demo has 4 or more steps a judge
must see. Go above 75 s only if the rules ask for a longer walkthrough.

**Format.** Pick from this table by the shape of the hack. Then read that format's entry in
[formats.md](../trailer/references/formats.md) and the hackathon
recipe for it in [judge-structure.md](references/judge-structure.md).

| the hack is mostly... | format | why it fits judges |
| --- | --- | --- |
| a fast sequence of steps where speed or ease is the point | **F18 Speedrun** (default) | each demo step is a "split", so the demo act reads as progress |
| a fix for a dramatic failure moment (a crash, a missed alert, an emergency) | **F14 Cold Open, Rewind** | opens on the failure, so the problem lands in under 10 s |
| a tester, validator, guardrail or safety tool | **F05 Crash-Test Lab** | the demo is "throw bad inputs at it and watch it hold" |
| a visible transformation of one thing (messy to clean, hidden to shown) | **F19 Before/After Swipe** (`split` in `before-after` mode) | one input, two outcomes, nothing to explain |
| a detector of something humans miss (fakes, fraud, errors) | **F11 Spot the Fake** (game show) | the judge plays first and fails, then watches the hack win |

Write the choice and one sentence of "Why this fit" in `script.md` and in `meta.formatWhy`.
If `.trailer/out/history.jsonl` shows the format was used before in this repo, pick the next
best row.

**How to show the product.** Pick the scene for each demo step by what the hack is:

| the product is... | demo scenes | proof of life |
| --- | --- | --- |
| a web app | `ui` with `frame: "browser"`, real seed rows, cursor and spotlight | one framed `screenshot` of the running app, 4 s or less |
| a mobile app | `ui` with `frame: "phone"` | a framed real screenshot from the repo or the user |
| a CLI or dev tool | `ui` with `frame: "app"` and `code` or `diff` elements, typed in | `code` lines copied from a real run in the README or tests |
| an API or backend | `lanes` for the flow, then `ui` with a `kv` or `code` response | a real response from fixtures or docs |
| an ML model | `ui` with input, then `chart` or `stat` output; `metric` for the eval | the eval numbers from the repo |
| hardware | framed photos via `capture.pages[].image`, plus a `shapes` diagram | the photos the user supplies |
| a browser extension | `ui` with `frame: "browser"` and a `toast` or `card` overlay | a framed real screenshot |

### 3. Script (minutes 12 to 22)

Write `.trailer/script.md` from the core script template: the scene table (scene, on
screen, narration), the full narration, the sources table, and "Why this fit".

Use the judge structure. Default act timing for 60 s (other lengths are in
[judge-structure.md](references/judge-structure.md)):

| act | 60 s timing | job | judge criterion it serves |
| --- | --- | --- | --- |
| 1. Problem | 0 to 10 s | one person, one moment, one concrete failure | impact |
| 2. Turn | 10 to 13 s | name the project and its promise in one line | clarity |
| 3. Live demo | 13 to 40 s (at least 40%) | the core loop, step by step, in recreated UI on real seed data | completeness, design |
| 4. How it works | 40 to 48 s | one sentence plus one diagram of 3 to 5 boxes | technical difficulty |
| 5. Impact or next | 48 to 55 s | one honest proof number, or what ships next | impact, ambition |
| 6. Team and repo | 55 to 60 s | project name, credit line, link pill | memory |

Give the demo scenes ids that start with `demo-` (for example `demo-scan`, `demo-map`).
Step 8 measures the demo share from them.

**Word budget = 1.9 words per second of film, plus or minus 8%** (2.1 per second for a cut,
or for any film of 30 s or less; 1.5 and 1.65 with no narration, where the lines are read).
Count the words in `say` only. Never speed up the voice to fit; cut words instead.

| target | words (16:9) | demo act words | 9:16 cut (2.1 per second) |
| --- | --- | --- | --- |
| 45 s | 79 to 92 | at least 36 | 30 s: 58 to 68 |
| 60 s | 105 to 123 | at least 46 | 30 s: 58 to 68 |
| 75 s | 131 to 154 | at least 58 | 30 s: 58 to 68 |
| 90 s (only if the rules ask) | 157 to 185 | at least 70 | 30 s: 58 to 68 |
| 120 s (only if the rules ask) | 210 to 246 | at least 92 | 30 s: 58 to 68 |

**Line rules.** One idea per line. At most one number per sentence and three per film, as
digits. Name the project at the turn and at the end. Each demo line describes what the
viewer sees happen. The tech line names the 2 or 3 parts that do the work. No stack lists.

| bad line | why it fails | good line |
| --- | --- | --- |
| "Accessibility is a huge problem affecting millions of people." | abstract, no moment, unsourced number | "Four curbs on Maria's route to the clinic have no ramp. She finds out at the curb." |
| "Introducing Rampwise, a revolutionary AI-powered platform." | hype words, says nothing it does | "Rampwise maps every curb before she leaves." |
| "Users can utilize the scanning functionality to capture data." | describes a feature, not what happens | "Point a phone at the corner. Every curb gets tagged: ramp, no ramp, or blocked." |
| "We used React, FastAPI, Postgres, Docker and an LLM." | stack dump, judges learn nothing | "A vision model labels each curb, and a routing layer steers around the bad ones." |
| "It saves people 90% of their time." | invented number | "On its test photos, it caught 37 of 39 missing ramps." (from the test fixtures) |
| "It also auto-files reports with the city." (when that is a stub) | presents a mock as live | "Next, it files every missing ramp with the city." (in the next act, labelled next) |
| "Our amazing team worked so hard for 36 hours." | first person, effort is not impact | on screen only: the credit line "Built in 36 hours at the event by Team Curbcut" |

### 4. Config (minutes 22 to 37)

Start from `.trailer/trailer.config.json` (the hackathon starter `init` wrote in step 0).
Replace every fictional field:
`projectName`, `tagline`, `repoUrl`, `link`, `credit`, `meta`, `app`, every scene's content
and `say`. Then:

1. Write the scenes from the script table, in order. Cue every `at` to a spoken word in
   that scene (`"at": "tagged"`), never to a guessed second.
2. Put the app's real tokens in `config.app`. For a projector, set `app.size` to 24 to 26.
3. Use the real seed rows, names and labels from the repo in every `ui` scene.
4. Change the starter theme: a new accent and fonts, and at least two of background, chrome,
   transition, type and motif, chosen for the format.
5. Fill `meta`: `useCase: "hackathon"`, `format`, `formatWhy`, `tone`, and a `sources` entry
   for every number.
6. Set `targetSeconds` to the chosen length. Keep `cuts.short` only if the user wants a
   vertical cut; otherwise delete it.

### 5. Lint (minute 37)

Run `SR <dir> --lint --json`. Fix every error and re-run until it exits 0. Read each warning:
fix it, or write one line in `script.md` saying why it stays. The usual errors here are
first person in the copy (rewrite it, or set `narration.person: "first"` if the user asked
for "we") and a cue word that is not in the scene's narration.

### 6. Layout pass before the voice (minutes 37 to 42)

Run `SR <dir> --stills scenes --voice-engine none --safe-overlay --json` (`--voice-engine text` for a film with no narration). Open the stills
listed in `outputs`. Fix overflow, clipped text, captions over a focus target, and empty
frames. This pass is cheap; do it before spending time on the real voice.

### 7. Render with review frames (minutes 42 to 52)

Run `SR <dir> --review --json`. This renders the film with the real voice and writes the
per-scene review frames and the contact sheet. If the user asked for the vertical cut, add
`--all` so `cuts.short` renders too. Read the summary:

- `voice.fallback: true` means the system voice was used. Tell the user, and keep going.
- `seconds` must be within 5 s of `targetSeconds`. `words` must fall inside `wordBudget`.
- **Demo share:** add up `scenes[].duration` for the demo act's scenes (the ids that start
  with `demo-` in the starter; keep that prefix when you rename them), divide by
  `seconds × 30`, and check that the result is at least 0.40. If it is short, cut words from
  acts 1, 4 and 5, or add a demo step. Do not pad the demo with silence.

### 8. Frame-review loop (minutes 52 to 60; one loop by default)

Follow [review.md](../trailer/references/review.md):

1. Open `outputs.sheet` (`sheet.jpg`, the contact sheet). Then open each per-scene still in
   `outputs.review` that looks wrong.
2. Check the core list: nothing clipped, the caption band clear of focus targets, text at
   least 28 px at 1080p, contrast at least 4.5:1, no raw crop of a screenshot, the UI reads
   as the app, characters fully on stage, every entrance has an exit, no dead frame longer
   than 4 s.
3. Add the three hackathon checks:
   - **Muted test.** From the frames and captions alone, could a judge with the sound off
     say what the hack does? If not, add on-screen labels to the demo steps.
   - **Projector test.** Could the demo text be read from the back of a hall? If not, push
     the camera in or raise `app.size`.
   - **Thumbnail test.** Does the poster frame show the product and its name? Set
     `poster: true` on the best demo scene if not.
4. Fix the config and re-run step 7 (only changed lines are re-voiced). If you are inside
   the timebox, one more loop is allowed (three at most in total). Then stop and report what
   is left.

### 9. Deliver (at minute 60 or earlier)

1. Write `.trailer/out/submission.md` from
   [submission-copy.md](references/submission-copy.md): the demo blurb (120 words max), the
   3-sentence pitch, and the Devpost story sections drafted from the brief, with
   `[FILL: ...]` wherever a fact is missing.
2. Run the final gate in [checklist.md](references/checklist.md).
3. Report in this shape, with paths relative to the project:

```text
Film:      .trailer/out/trailer-16x9.mp4   61.8 s · 117 words · voice deepgram (no fallback)
Short:     .trailer/out/trailer-9x16-short.mp4   27.4 s           (only if requested)
Captions:  .trailer/out/trailer-16x9.srt, .vtt
Poster:    .trailer/out/poster-16x9.jpg
Copy:      .trailer/out/submission.md (blurb 98 words, pitch, Devpost story)
Format:    F18 Speedrun: the core loop is three quick steps
Demo:      46% of the runtime
Open:      2 warnings kept (listed in script.md); 1 [FILL] in submission.md
Time:      54 min
```

Say plainly what the user still has to do: upload the video, paste the blurb, fill any
`[FILL]`. Never do those steps yourself.

## Failure handling

| what happens | what you do |
| --- | --- |
| exit 3 (missing dependency) | run `SR doctor --json`, give the user its install line, stop |
| exit 2 (lint errors) | fix each error in the config, re-lint; never delete a scene just to pass |
| exit 1 (runtime failure) | read the last 30 lines of stderr; check [troubleshooting.md](../trailer/references/troubleshooting.md); isolate with `--frames 0-150`; retry once |
| no Deepgram key, or `voice.fallback: true` | deliver with the system voice and say so; for the final, the user adds a key and re-runs step 7, records their own lines and uses `--keep-voice`, or switches to the no-voice text mode (`"voice": { "provider": "text" }`, cut words to its budget) |
| `words` over budget | cut words from acts 1, 4 and 5 first, never from the demo; never raise `voice.speed` above 1.05 |
| `seconds` more than 5 s off target | adjust words first, then `breath` and `hold`; `fitSeconds` only trims slack |
| the app will not start for a capture | drop the proof-of-life `screenshot`, use `--skip-capture` or a screenshot already in the repo; the recreated UI carries the demo |
| no honest number anywhere | use qualitative proof ("works offline", "3 taps, no account"), or ask the user one question: "Did you measure anything during the build?" |
| the core loop is mostly mocked | demo only the parts that work; move the rest to act 5 as "next"; tell the user |
| you are behind the timebox | apply the cut list in [timebox.md](references/timebox.md); ship a 45 s film before missing the deadline |
| the user's rules cap the length below 45 s | build a 30 s 16:9 film: problem, turn, two demo steps, end card; 58 to 68 words (the engine budgets 30 s or less at 2.1 words per second) |

## Final checklist (short form)

The full gate is [checklist.md](references/checklist.md). Never deliver without these:

- [ ] Problem lands by 10 s, with one person, one moment and one concrete failure.
- [ ] Demo scenes are at least 40% of the runtime and show only what works.
- [ ] How it works is one sentence and one diagram of 3 to 5 boxes.
- [ ] Every number has a row in the `script.md` sources table.
- [ ] `words` inside `wordBudget`; `seconds` within 5 s of the target; lint exits 0.
- [ ] The muted, projector and thumbnail tests pass.
- [ ] The end card shows the name, the credit line and a link pill.
- [ ] `submission.md` is written; the blurb is 120 words or fewer; the pitch is 3 sentences.
- [ ] Nothing was uploaded, posted, submitted or committed.

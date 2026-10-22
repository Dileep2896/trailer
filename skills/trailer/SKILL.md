---
name: trailer
description: Turn any software project into a voiced, captioned explainer film (60 s, 16:9) or a vertical short (9:16, 15 to 30 s) rendered with Remotion. Reads the repo, finds the problem, the feature and the proof, picks a narrative format from a 20-format library, writes an original script, rebuilds the app's UI in its own design tokens, narrates it, and reviews the frames before delivering. Also the router for the use-case skills (launch, job hunt, hackathon, shorts).
when_to_use: Use when the user says "make a video of this project", "trailer", "explainer video", "demo video", "promo film", "walkthrough video", "turn this repo into a video", "make a reel", or wants to show off something they built. Routes "launch / release / changelog / announce" to trailer-launch, "job / apply / portfolio / outreach / founders" to trailer-jobhunt, "hackathon / demo day / devpost / judges" to trailer-hackathon, and "short / reel / tiktok / vertical / 9:16" to trailer-shorts.
argument-hint: "[explainer|launch|jobhunt|hackathon|shorts] [project-dir]"
allowed-tools:
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

# trailer: a project explainer film, end to end

You are making a short film about a software project: problem first, then the product working,
then one piece of proof. Your job is **story and craft**. The engine does the rendering, voice,
captions, music and SFX from one JSON config.

The films that work share six traits. Reproduce all of them every time:

1. **The pain comes first and is concrete:** a moment, a person and one number, then why
   today's fix fails, all before any product UI appears.
2. **A format with a real metaphor**, not a new skin. A courtroom suits contradictory records;
   a split screen suits "same input, different outcome".
3. **Recreated UI in the app's own tokens with the app's real seed data.** Every product beat
   is a `ui` scene with a cursor, camera push, spotlight and a callout note. Screenshots are
   only establishing shots.
4. **Narration drives the picture.** Every element is cued to a spoken word (`"at": "flagged"`).
5. **Measured pace:** about **1.9 spoken words per second of film**, breaths included.
6. **A sources table for every number** in `script.md`. Never invent a number.

## The engine command

Every engine call uses this exact prefix (it matches this skill's permission rule, so type it
character for character and never chain it with `&&` or pipes):

```sh
TRAILER_HOME="${CLAUDE_PLUGIN_DATA}" node "${CLAUDE_PLUGIN_ROOT}/engine/trailer.mjs" <args>
```

The reference files write this prefix as `<engine>`. The main commands:

| goal | args after the prefix |
| --- | --- |
| environment check | `doctor --json` |
| scaffold `.trailer/` | `init <dir> --use-case explainer` |
| validate + copy lint | `<dir> --lint --json` |
| cheap layout stills, no TTS | `<dir> --stills scenes --voice-engine none --safe-overlay --json` |
| full render | `<dir> --json` |
| render, then review frames | `<dir> --review --json` (add `--skip-capture` when screenshots are unchanged) |
| one cut / every cut | `<dir> --cut short --json` / `<dir> --all --json` |
| print the schema path | `schema` |

Exit codes: **0** ok, **1** runtime failure, **2** lint errors, **3** missing dependency
(run `doctor --json`, then follow its hint). With `--json` the summary is the last JSON object
on stdout (logs go to stderr). Read `ok`, `seconds`, `words`, `wordBudget`, `voice.fallback`,
`warnings`, `errors` and `outputs` from it. All paths in it are relative to the project.

Everything for a project lives in `<dir>/.trailer/`: `trailer.config.json`, `brief.md`,
`script.md` and `assets/` are committed; `out/`, `voice/`, `shots/`, `review/`, `.stage/` and
`private/` are gitignored.

## References (read them when the step says so)

| file | read it for |
| --- | --- |
| `${CLAUDE_SKILL_DIR}/references/intake.md` | the token note, the Quick / Standard / Studio tiers and the pre-questions |
| `${CLAUDE_SKILL_DIR}/references/flow.md` | the full inventory procedure, what to grep, how to fill the brief |
| `${CLAUDE_SKILL_DIR}/references/formats.md` | F01 to F20: arcs, scene recipes, "fits when", portrait notes |
| `${CLAUDE_SKILL_DIR}/references/craft.md` | pacing, explaining, captions, footage, type, characters, sound, line examples |
| `${CLAUDE_SKILL_DIR}/references/scenes.md` | every scene type, its fields, the cue grammar |
| `${CLAUDE_SKILL_DIR}/references/config.md` | top-level keys, theme, app tokens, captions, music, capture, cuts, variants, meta |
| `${CLAUDE_SKILL_DIR}/references/tokens.md` | pulling colours, radius and fonts out of Tailwind, CSS vars, MUI, SwiftUI, Flutter... |
| `${CLAUDE_SKILL_DIR}/references/characters.md` | who exists, moods, poses, emoji names, blob shapes |
| `${CLAUDE_SKILL_DIR}/references/voice.md` | Deepgram key, models, pace, the `say` fallback, own recordings |
| `${CLAUDE_SKILL_DIR}/references/review.md` | the frame-review loop and the full checklist |
| `${CLAUDE_SKILL_DIR}/references/troubleshooting.md` | every failure and its fix |
| `${CLAUDE_SKILL_DIR}/assets/` | `brief.template.md`, `script.template.md`, `starter.config.json` |

## Step 0: route

Decide the use case from the user's words and the arguments (`$ARGUMENTS`):

| the user says... | use case | do this |
| --- | --- | --- |
| launch, release, changelog, announce, "what's new", ship, Product Hunt | launch | invoke the `trailer-launch` skill and stop here |
| job, apply, portfolio, outreach, founders, "for this company", hiring | jobhunt | invoke the `trailer-jobhunt` skill and stop here |
| hackathon, demo day, devpost, judges, "submission video" | hackathon | invoke the `trailer-hackathon` skill and stop here |
| short, reel, tiktok, vertical, 9:16, square, "for Instagram" | shorts | invoke the `trailer-shorts` skill and stop here |
| anything else ("explain this project", "demo video") | explainer | continue with step 1 below |

Inside this plugin the use-case skills show up as `/trailer:trailer-launch` and so on. When the
intent is truly ambiguous, ask **one** question ("Is this for a launch, a job application, a
hackathon, or a general explainer?"), then route. The arguments are `[use-case] [project-dir]`:
the use case comes first (optional), then the project directory, else the current working
directory.

## Step 0.5: intake (token note, tier, pre-questions)

Before reading any file, follow `references/intake.md` and send the user **one** message:

1. A two-line heads-up that a film is token-heavy (the agent reads the project and reviews
   rendered frames as images), with the per-tier figures from `intake.md`. Rendering runs locally.
2. The three tiers: **Quick** (cheapest, thinner story, no frame-by-frame polish),
   **Standard** (the default) and **Studio** (the full bar below, the most tokens).
3. At most five pre-questions with defaults in brackets: tier, length and shape, audience and
   call to action, voice, limits and proof.

Skip anything the request already answers; if the user says "defaults" or "just go", use the
defaults. Record the answers under "Intake" in `brief.md`. **Every step below follows the
chosen tier's column in `intake.md`**: the file cap in step 2, the shortlist size in step 4,
the number of `ui` scenes, whether step 8 runs, and the loop cap in step 10. The steps as
written describe Studio.

## Step 1: preflight

1. Run `<engine> doctor <dir> --json`. On exit 3, show the user the one missing dependency and
   the exact install command from the output, then stop until it is fixed. Node 20 or newer,
   ffmpeg and a headless browser are required; everything else installs on first run.
2. If `<dir>/.trailer/trailer.config.json` does not exist, run
   `<engine> init <dir> --use-case explainer`. It writes the explainer starter (the worked
   starter this skill builds on; `assets/starter.config.json` is the same file, kept here
   for reference), plus `brief.md`, `script.md` and `.gitignore`. If the config already
   exists, read it and `.trailer/out/history.jsonl` (formats already used here) before
   changing anything. Never overwrite a committed config without saying so.
3. If `doctor` reports `voice.key: "absent"`, tell the user **once**: the draft will use the
   free system voice (`say` on macOS, `espeak-ng` on Linux), and a natural voice needs a
   `DEEPGRAM_API_KEY` in the environment, `<dir>/.trailer/.env` or `<dir>/.env` (see
   `references/voice.md`). Do not
   block on it, and never ask the user to paste a key into the chat.

## Step 2: inventory (read the project, do not run it)

Respect the tier's file cap (Quick: at most 8 files; Standard: up to 20). Follow `references/flow.md`. Read the README, manifests, routes/pages, components, theme
sources, fonts, seed/fixture/demo data, tests and benchmarks, `docs/`, `CHANGELOG`,
`git log --oneline -50` and tags, and any screenshots. Then write `.trailer/brief.md` from
`assets/brief.template.md`. The brief must answer, in plain words:

- **Who hurts**, and **what breaks** for them, as one concrete example (ideally from the seed data).
- **Why today's fix fails** (the workaround and its cost).
- **The mechanism** in one sentence a 12-year-old follows.
- **2 or 3 product moves**, each with the screen or component file to rebuild.
- **Proof numbers**, each with `file:line`. If the repo has none, use qualitative proof
  ("flags it before merge") or ask the user one question. Never invent one.
- **UI tokens** with their source file, the **font mapping**, any **forbidden terms**, and the
  assets the user owns.

Stop and ask the user only if you cannot name who hurts or what breaks after reading.

## Step 3: tokens and components

Map the app's tokens into `config.app` (`font`, `mono`, `bg`, `surface`, `subtle`, `ink`,
`muted`, `border`, `accent`, `onAccent`, `good`, `bad`, `warn`, `radius`, `size`, `dark`) using
`references/tokens.md`. Pick the **2 to 4 moments** worth rebuilding as `ui` scenes and copy
their real rows, names and numbers from the seed data. Use `capture` screenshots only for
establishing shots of at most 4 s each.

## Step 4: pick a format

Read `references/formats.md`. Shortlist **3** formats by how well the shape of the problem
matches the metaphor, then pick one. Skip any format in `out/history.jsonl` (JSON Lines: the
`format` field of each line) or in the committed config's `meta.format`.

| the problem's shape | strongest formats |
| --- | --- |
| two records, sources or memories disagree | F01 Courtroom, F15 Case File |
| two runs of the same thing diverge somewhere | F02 Instant Replay, F10 Two Lanes |
| one change ripples out across many places | F03 Forecast, F13 Chain Reaction |
| the same work repeats or piles up | F04 The Loop |
| it must be tested safely before real use | F05 Crash-Test Lab, F07 Test Kitchen |
| many items need risk-based sorting | F06 Checkpoint |
| a rule or idea needs teaching first | F08 Chalkboard Lesson |
| two sides see the same data differently | F09 POV Switch |
| same input, different outcome | F10 Two Lanes, One Input |
| an error hides in plain sight | F11 Spot the Fake |
| slow decay nobody notices | F12 Nature Documentary |
| a late, confusing failure with an early cause | F14 Cold Open, Rewind |
| things go missing silently | F15 Case File |
| a launch with several new features | F16 Unboxing |
| a release with many shipped changes | F17 Countdown Changelog |
| speed is the point (setup, hackathon build) | F18 Speedrun |
| one visible before/after change | F19 Before/After Swipe |
| one sharp question with a 3-beat answer | F20 One Question |

Write "Why this fit" (2 or 3 sentences) in `script.md`, and set `meta.format` and
`meta.formatWhy` in the config. The theme must differ from the starter in its accent, its
fonts and at least two of `background`, `chrome`, `transition`, `type` and `motif`.

## Step 5: write the script

Fill `assets/script.template.md` into `.trailer/script.md`: the scene table (scene, on
screen, narration), the full narration, the sources table and the format rationale.

**Word budget = 1.9 x targetSeconds, plus or minus 8%** (cuts, shorts and any film of 30 s or
less are denser: 2.1x).
The engine's `--json` `wordBudget` is the authority; these are the numbers it computes:

| film | words | scenes | notes |
| --- | --- | --- | --- |
| 15 s short (2.1x) | 29 to 34 | 4 or 5 | hook lands in 1.5 s |
| 30 s short (2.1x) | 58 to 68 | 5 or 6 | one product move |
| 30 s film (2.1x, as for every target of 30 s or less) | 58 to 68 | 6 or 7 | feature announcement |
| 45 s film | 79 to 92 | 8 or 9 | launch, release recap |
| 60 s film (default) | 105 to 123 | 9 to 12 | the explainer |
| 75 s film | 131 to 154 | 11 to 13 | hackathon maximum |

Default act timing for 60 s (each format bends it; keep the order):

| act | seconds | rule |
| --- | --- | --- |
| hook | 0 to 6 | a moment, a person or a question; no product name |
| pain with evidence | 6 to 22 | at least 14 s, before any product UI |
| turn | 22 to 27 | the project is named (`turn: true`, the drums enter) |
| how it works | 27 to 48 | 2 or 3 moves, each a recreated `ui` scene |
| proof | 48 to 55 | one number with its source |
| end | 55 to 60 | name, tagline, link; music breathes |

Script rules: at most **3 numbers** per film, written as digits; at most one number (or one
before-and-after pair) per sentence; third person about the project by name unless `narration.person` says otherwise;
one or two sentences per scene; each sentence carries one idea.

| bad line | why | good line |
| --- | --- | --- |
| "We built a revolutionary tool that leverages AI to streamline workflows." | first person, slop words, no picture | "Every Friday, Priya re-reads 40 alerts to find the one that matters." |
| "Many teams face challenges with configuration." | vague, nobody hurts | "Staging says the flag is on. Production says off. Both files look right." |
| "Gatepost is a dependency-update management solution." | a category, not a mechanism | "Gatepost reads each update first. Patches merge on their own; majors wait for a human." |
| "It is 10x faster and saves 50% of time and costs." | three numbers, no source | "On the test fixtures, review time drops to 3 hours." |
| "Check it out now!" | no destination | "Gatepost. Open source on GitHub." |

## Step 6: write the config

Write `.trailer/trailer.config.json` from the script, scene by scene (`references/scenes.md`,
`references/config.md`, and the format's scene recipe). Rules:

- Set `"$schema"` to the raw GitHub URL the starters use,
  `https://raw.githubusercontent.com/Dileep2896/trailer/main/engine/schema/trailer.schema.json`
  (`<engine> schema` prints a local path, which must not go into a committed config), `version: 1`, `projectName`, `tagline`,
  `repoUrl` or `link`, `aspect`, `targetSeconds`, `meta` (use case, format, why, tone, sources).
- Every `at`, `until` and state change is cued to a word in that scene's own `say`
  (`"at": "flagged"`, `"at": "1:fix"`, `"at": "-1s"`). Pick distinctive words of 4+ letters.
- Exactly one scene has `turn: true` (where the project is named); one scene has `poster: true`
  (the best `ui` frame).
- `ui` scenes use the app's real seed rows and include at least a `cursor` or `camera` move, a
  `spotlight` or `highlight`, and a `notes` callout on the key beat.
- `theme` fits the format, `music` (`bpm` 90 to 132, `mood`) fits the tone, `captions` stay
  clear of focus targets.
- Add `cuts` only if the user asked for shorts (or route to trailer-shorts afterwards).

## Step 7: lint

Run `<engine> <dir> --lint --json`. Fix **every** error (exit 2): schema errors, first person
in third-person narration, banned terms, unknown characters, fonts or cue words. Read each
warning and either fix it or write one line in `script.md` under "Accepted warnings" saying why.
A word count outside `wordBudget` is fixed by **cutting words**, never by raising `voice.speed`.

## Step 8: layout pass (cheap, before any TTS)

Quick skips this step; Standard runs it once.

Run `<engine> <dir> --stills scenes --voice-engine none --safe-overlay --json`, then Read the
stills under `.trailer/review/<aspect>/`. Fix clipped text, overlaps, captions over focus
targets and empty frames in the config. Repeat once if needed. This costs seconds; a full
render costs minutes.

## Step 9: render

Run `<engine> <dir> --review --json`. Check the summary: `ok`, `seconds` within plus or minus
5 s of `targetSeconds` (3 s for a target of 30 s or less), and `voice.fallback`. If the voice fell back, say so plainly in the
delivery.

## Step 10: the frame-review loop

Follow `references/review.md`. In short:

1. Read `outputs.sheet` (`sheet.jpg`: one still per scene at 60% of it, 4 across).
2. For every tile that looks wrong, Read that scene's full-size still in `outputs.review`.
3. Check against the review checklist: nothing clipped; captions clear of the focus target;
   text at least 28 px at 1080p (40 px in 9:16); contrast at least 4.5:1; no raw screenshot
   crop; the UI reads as the app; characters fully on stage; every entrance has an exit; no
   dead frame over 4 s; a meaningful first frame (shorts); duration within plus or minus 5 s.
4. Fix the config and re-render with `--review --skip-capture --json` (only changed lines are
   re-voiced).
5. **Loop cap by tier:** Quick reads `sheet.jpg` once and re-renders only for clipped text
   or a broken frame; Standard runs 1 loop; Studio at most 3. Then stop and report what is
   left, with the frame paths.

## Step 11: deliver

Report, using the relative paths from `--json`:

- the MP4 (and any cuts), duration, word count, poster, `.srt`/`.vtt`, and `sheet.jpg`
- the voice engine, and a clear warning if it fell back to `say`, `espeak-ng` or silence
- the format and one line on why it fits
- any accepted warnings and anything the review loop could not fix
- the tier used and, for Quick or Standard, one line offering the next tier up

**Never upload, post, publish or send anything.** The user does that.

## Failure handling

| symptom | do this |
| --- | --- |
| exit 3 (missing dependency) | run `doctor --json`, show the single install command, wait |
| exit 2 (lint) | fix the config; never weaken the lint by renaming or removing banned terms |
| exit 1 during voice | check the key is set (never print it), then retry once with `--voice-engine say` and say so |
| exit 1 during render | read the error tail; see `references/troubleshooting.md`; try `--frames 0-150` to isolate |
| `seconds` far over target | cut words in the longest scenes, lower `hold`/`breath`, then set `fitSeconds` |
| a cue word "not found" warning | the element fell back to even spacing; cue it to a word that is actually spoken |
| no seed data or numbers in the repo | qualitative proof, or ask the user one question; never invent |
| the user wants their own voice | record `voice/line-N.wav` per line, then render with `--keep-voice` (`references/voice.md`) |

## Hard rules

- Never invent a number, a quote, a customer or a result. Every number has a source in `script.md`.
- Evidence from the public is attributed generically ("a developer on a forum"), never by
  company, product or person name, and never with logos or copied brand colours.
- Do not modify the project's own source code; write only inside `.trailer/`.
- Never write API keys into any file, log or chat message.
- Remotion has its own license: free for individuals and companies of up to 3 people; larger
  companies need a Remotion company license. Mention it if the user says the film is for a
  larger company.

## Final checklist (all must be true before you deliver)

- [ ] The token note and tier choice were offered before any work, and `brief.md` records the intake.
- [ ] `brief.md` names who hurts, what breaks (one concrete example) and why today's fix fails.
- [ ] `script.md` has the scene table, full narration, "Why this fit" and a source for every number.
- [ ] The pain runs at least 14 s (60 s film) before any product UI.
- [ ] The format is not in `out/history.jsonl`; the theme differs from the starter as required.
- [ ] 2 to 4 recreated `ui` scenes use the app's tokens and real seed data.
- [ ] Every visual cue is tied to a spoken word; exactly one `turn`, one `poster`.
- [ ] Word count inside `wordBudget`; at most 3 numbers; voice speed 1.0 unless the user chose otherwise.
- [ ] `--lint` passes with 0 errors; every warning fixed or justified.
- [ ] The review loop ran (at most 3 times) and the checklist in `references/review.md` passes.
- [ ] Duration within plus or minus 5 s of `targetSeconds`.
- [ ] Delivery lists outputs, duration, words, voice engine (fallback flagged) and leftovers.
- [ ] Nothing was uploaded, posted or sent.

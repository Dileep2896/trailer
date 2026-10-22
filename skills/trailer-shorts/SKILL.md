---
name: trailer-shorts
description: >-
  Make vertical 9:16 shorts (15 to 30 s) and square 1:1 social cuts (20 to 45 s) of a software
  project for TikTok, Instagram Reels, YouTube Shorts, LinkedIn and X, with burned-in word-level
  captions, a hook that lands in the first 1.5 s, a loopable ending and per-platform post copy.
  Derives `cuts.short` and `cuts.square` from an existing trailer config (preferred), or
  builds a short from scratch by reading the repo. Renders with the trailer engine; never posts.
when_to_use: >-
  Use when the user says "make a short", "vertical video", "9:16", "reel", "TikTok", "YouTube
  Shorts", "Instagram Reels", "square video", "1:1", "social cut", "clip for LinkedIn", "clip
  for X/Twitter", "teaser", "cut this film down", "15 second version", "30 second version", or
  runs /trailer:short. Also when another trailer skill finishes a film and the user wants it
  on social. Not for a 60 s 16:9 explainer (use the core trailer skill) or for posting.
argument-hint: "[projectDir] [--fresh] [--platforms tiktok,reels,shorts,linkedin,x] [--seconds 15|20|30]"
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

# trailer-shorts

Turn a project, or a film already made for it, into a vertical short and a square cut that
work on a muted phone feed. Someone scrolling decides in about a second, so the first frame
and the first three spoken words decide whether anyone watches the other 28 seconds.

A short is not a 60 s film played fast. It is one idea: **hook, one product move, one number,
loop.** Everything else goes.

Arguments: `$ARGUMENTS` (all optional). `projectDir` defaults to the current directory.
`--fresh` ignores any existing film and starts from the repo. `--platforms` limits the post
copy. `--seconds` sets the 9:16 target (default 28).

## Shared references (read these, do not duplicate them)

The core skill owns the craft. This skill only adds what changes for shorts.

| need | read |
| --- | --- |
| the token note, the Quick / Standard / Studio tiers, the core pre-questions | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/intake.md` |
| the full "seeing the project" flow and the brief | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/flow.md` |
| formats F01 to F20 with scene recipes (F11, F17, F18, F19, F20 matter here) | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/formats.md` |
| pacing, captions, recreated UI, kinetic type, sound | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/craft.md` |
| every scene type, cue grammar, per-aspect behaviour | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/scenes.md` |
| config keys, `cuts`, `variants`, captions | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/config.md` |
| app tokens from Tailwind, CSS vars and theme files | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/tokens.md` |
| characters, moods, emoji names | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/characters.md` |
| voice setup, fallback, word budget | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/voice.md` |
| the general frame-review loop | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/review.md` |
| engine errors | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/troubleshooting.md` |

Shorts-specific references in this skill:

- [references/vertical-layout.md](references/vertical-layout.md): 9:16 and 1:1 safe zones,
  how each scene type behaves in portrait, when and how to write `variants`, type sizes.
- [references/hooks-and-loops.md](references/hooks-and-loops.md): the hook library, the
  short arcs with timings, loop endings, good and bad lines.
- [references/platforms.md](references/platforms.md): per-platform specs, cover crops, post
  copy rules and the `out/short-captions.md` template.
- [references/checklist.md](references/checklist.md): the frame-review checklist with the
  safe-zone pixel values and the final delivery checklist.

Starter snippets: `${CLAUDE_PLUGIN_ROOT}/skills/trailer-shorts/assets/short.cut.json` and
`${CLAUDE_PLUGIN_ROOT}/skills/trailer-shorts/assets/square.cut.json`. Each is one entry for
`config.cuts` holding only the structure (aspect, timing, captions, the hook, turn and loop
flags). Rename the placeholder scene ids (`hook`, `pain`, `turn`, `demo`, `proof`, `end`) to
the film's own ids and add the `say` overrides you write in step 3.

## The engine call

Every engine command in this skill uses this exact prefix (`<engine>` below stands for it;
always type the prefix out in full, because shell state does not persist between calls):

```sh
TRAILER_HOME="${CLAUDE_PLUGIN_DATA}" node "${CLAUDE_PLUGIN_ROOT}/engine/trailer.mjs"
```

followed by `doctor`, `init <projectDir> ...`, or `<projectDir>` and the make options. For
example, the lint of the short cut is:

```sh
TRAILER_HOME="${CLAUDE_PLUGIN_DATA}" node "${CLAUDE_PLUGIN_ROOT}/engine/trailer.mjs" . --cut short --lint --json
```

On make commands, always add `--json` and read the summary object from stdout (logs go to stderr). Use its
`seconds`, `words`, `wordBudget`, `voice.fallback`, `scenes`, `outputs`, `warnings` and
`errors`. Never guess output paths; take them from `outputs`. Exit codes: `0` ok, `1` runtime
failure, `2` lint errors, `3` missing dependency.

## The rules that make a short work

1. **Frame 0 is the thumbnail.** In every 9:16 and 1:1 render the engine draws frame 0 as
   scene 1 with its first cue already settled (about 0.7 s into its first line), and holds
   that picture until the live scene catches up, so scene 1 never goes empty and a loop
   wraps without a flash; later cues animate as usual. So make scene 1 something that reads as a thumbnail
   once settled: a `title` or `kinetic` beat or a UI already mid-action, with `lead: 0` and
   `transition: "cut"` so the hook still lands fast. No logo, no project name first. (Scene 1
   `firstFrame: "live"` turns the settled frame 0 off; `"settled"` turns it on for 16:9.)
2. **The hook lands by 1.5 s.** The first 3 to 4 spoken words carry it, and the same idea is
   on screen as type at frame 0. Full library in `hooks-and-loops.md`.
3. **One idea.** Hook, then one product move shown in recreated UI, then one proof number,
   then the loop. One number per short is ideal, two at most, written as digits.
4. **Built for muted autoplay.** Captions are burned in, `center-low`, 64 to 72 px, 3 words
   a chunk. The picture has to explain itself with the sound off.
5. **Denser pace, never a faster voice.** The word budget is 2.1 words a second of film,
   give or take 8%. If the line count is over, cut words. Never raise `voice.speed` to fit.
6. **Nothing important in the platform chrome.** The 9:16 safe box is 1080 x 1920 minus
   220 px top, 420 px bottom, 64 px left and 136 px right. Captions, UI focus targets and
   characters all stay inside it.
7. **The end loops.** Put `loop: true` on the last scene: the engine fades its final 12
   frames into frame 0's picture, so the last frame is frame 0 again. Pair it with a last
   line that runs on into the opening line. Platforms replay shorts, and a clean loop counts
   as a rewatch. Lint warns on a 9:16 render whose last scene has no `loop: true`.
8. **The same truth as the film.** Every number comes from the sources table in
   `.trailer/script.md`. A short never invents or rounds up a number.

## Decide: which path, which format, which length

### Path

| situation | path |
| --- | --- |
| `.trailer/trailer.config.json` exists with an approved 16:9 film | **A. Cut from the film** (default; reuses the voice cache, UI scenes and sources) |
| a config exists and already has `cuts.short` / `cuts.square` | **A**, but review and render the existing cuts first; edit them, do not replace them silently |
| no config, or `--fresh`, or the film's story does not survive being cut (it needs its 14 s of pain to make sense) | **B. Short from scratch** |
| the user wants a short and a full film | run the core `trailer` skill first, then path A |

### Format (path B, or when a cut needs a new opener)

| the project's value is... | format | 9:16 recipe (scene types in order) |
| --- | --- | --- |
| a visible change to one screen (a messy state becomes a clean one) | **F19 Before/After Swipe** | `ui` (before, hook at frame 0) → `split` (before-after, `turn: true` as the divider crosses) → `ui` (after: the move, cursor) → `metric` → `outro` loop |
| an answer to a question the audience already asks themselves | **F20 One Question** | `kinetic` (the question) → `kinetic` `turn: true` (the name) → `ui` x 1 or 2 (a 3-beat answer) → `outro` loop (the headline restates the question) |
| several shipped things (a release, a changelog) | **F17 Countdown Changelog** | `countdown` or `kinetic` (3, 2, 1) → 3 short `ui` / `kinetic` beats → `scoreboard` → `outro` |
| telling good output from bad (detection, review, testing, AI output) | **F11 Spot the Fake** | `split` or `evidence` stack ("which one is wrong?") → beat of silence → `ui` reveals it → `outro` |
| speed (setup time, build time, time to first result) | **F18 Speedrun** | `title` hud with a timer → `ui` splits → `metric` (the time) → `outro` |
| none of these fits | the film's own format, compressed (path A) | hook → turn → best UI beat → proof → outro |

Read the full entry for the chosen format in the shared `formats.md` before writing scenes.

### Length and word budget

Budget = 2.1 x seconds, give or take 8%. The `wordBudget` in the `--json` summary is
authoritative; this table is for planning.

| cut | seconds | spoken words | scenes | use |
| --- | --- | --- | --- | --- |
| 9:16 micro | 15 | 29 to 34 | 3 to 4 | a teaser, one move, no pain beat beyond the hook |
| 9:16 short | 20 | 39 to 45 | 4 to 5 | TikTok and Reels when the move is very visual |
| 9:16 short (default) | 28 to 30 | 54 to 68 | 5 to 6 | Shorts, Reels, TikTok |
| 1:1 square | 30 | 58 to 68 | 5 to 6 | X, LinkedIn, Bluesky |
| 1:1 square long | 40 to 45 | 77 to 102 | 6 to 7 | LinkedIn, where a pain beat with evidence earns its place |

Leave about 1.5 to 3 s with no voice in total: a half-second beat after the hook, a beat on
the proof number, and the loop hold. The engine's duration warning fires outside the target
plus or minus 3 s.

## Workflow (follow it end to end)

### 1. Preflight

0. Send the single intake message from `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/intake.md`: the token note, the tier choice
   (default **Quick**; path A, cutting from an existing film, is the cheapest option and
   should be offered first when a film exists) and the core pre-questions, plus the target
   platform. Follow the chosen tier's column from then on.
1. Run `<engine> doctor <projectDir> --json`. Exit 3 means a missing dependency: show the user the exact
   install hint from the output and stop. Do not install system packages yourself.
2. If `doctor` reports `voice.key: "absent"`, say once that this draft will use the free
   `voice.fallback` voice, and that a key in the environment, `.trailer/.env` or `.env`
   gives the natural narrator. Do not block on it, and never print or write a key.
3. Read `.trailer/trailer.config.json`, `.trailer/script.md` and `.trailer/brief.md` if
   they exist. Choose path A or B with the table above. Tell the user which one in one line.

### 2a. Path A: cut from the film

1. **Read the film.** List its scenes from the config (id, type, `say`). Read the sources
   table in `script.md`. Find the `turn: true` scene, the strongest `ui` scene (a cursor,
   a state change on cue, real seed rows) and the proof scene.
2. **Pick 4 to 6 scenes** for `cuts.short`, in play order. The usual pick: hook (or the
   proof, moved first as the hook), turn, the best UI beat, proof, outro. Order is free: a
   cut's `scenes` list sets the order, so opening on the after state and rewinding is a
   valid hook. Drop evidence walls, second UI moves, calendars and anything that needs 10 s
   to make sense. Keep the `turn` scene, or the music's drums enter at bar 1.
3. **Rewrite narration in `overrides`.** Every kept scene gets a shorter `say` in
   `cuts.short.overrides.<sceneId>`, written with the beat table and line rules in step 3.
   Keep the cue words:
   if the UI's `notes`, `states` or `cursor` are cued to `"flagged"`, the new line still says
   "flagged", or the override also restates those cues. A missing cue word silently falls
   back to even spreading, and the click lands on the wrong word.
4. **Make scene 1 a hook.** In its override: `lead: 0`, `transition: "cut"`, a `say` whose
   first 3 or 4 words are the hook, and on-screen type that is visible at frame 0. Pick the
   hook type from `hooks-and-loops.md`.
5. **Make the last scene loop.** The outro override gets `loop: true` (the engine fades its
   last 12 frames into frame 0) and a short line that runs on into scene 1's line. A matching
   `bg` makes the fade read as one picture rather than a dissolve.
6. **Write `variants["9:16"]`** on every kept scene whose absolute coordinates (cast
   `x`/`y`, chalkboard items, telestrator circles, `shapes`) map outside the safe area (the
   lint flags these in step 4), or that uses a layout portrait handles badly (more than 3 evidence cards, more than 2 metrics, more than 2 characters,
   kinetic beats over 5 words). Rules and examples in `vertical-layout.md`. Variants are
   per aspect and shared by every 9:16 cut; overrides are per cut.
7. **Set the cut's captions:** `{ "position": "center-low", "size": 68, "maxWords": 3,
   "case": "none", "style": "box" }` (or `pill` if the film uses pill). Set
   `targetSeconds` (default 28) and `fitSeconds` (target + 2).
8. **Add `cuts.square`** from `assets/square.cut.json`: the same scenes plus, if the budget
   allows, one pain beat; captions `bottom`, 56 px, 4 words. Add `variants["1:1"]` where the
   square lint (step 4) warns that a mapped position leaves the safe area, and where the
   square stills show a problem. Nothing else needs a square variant.
9. Record the cut in `script.md`: a "Short cut" section with the scene table (scene, on
   screen, narration), the full short narration, its word count, and which sources-table
   rows it uses. Go to step 4.

### 2b. Path B: short from scratch

1. Run `<engine> init <projectDir> --use-case shorts --aspect 9:16` if `.trailer/`
   does not exist. It writes the shorts starter (a 9:16 film with a hook, a `ui` answer, a
   proof and a looping outro) plus `brief.md` and `script.md`; build on it.
2. Follow the shared `flow.md` steps 1 to 5 (inventory, tokens and components, format,
   script, config) with these parameters:
   - the brief can be short: one-liner, who hurts, one concrete example from the seed data,
     **one** product move with its component file path, **one** proof number with its
     `file:line`, the UI tokens with their source file, forbidden terms;
   - pick the format from the table above; read `out/history.jsonl` and prefer a format this
     repo has not used;
   - top level: `"aspect": "9:16"`, `"targetSeconds": 28`, `"fitSeconds": 30`, captions as in
     step 2a.7, `meta.useCase: "shorts"`, `meta.format`, `meta.formatWhy`, `meta.sources`;
   - 5 or 6 scenes; scene 1 obeys rule 1; the last scene obeys rule 7;
   - write the narration with step 3, and `variants["9:16"]` for every scene whose
     coordinates the lint flags as leaving the safe area (see `vertical-layout.md`).
3. Add `cuts.square` as in step 2a.8. Write `script.md` with the scene table, narration,
   word count, "Why this fit" and the sources table. Go to step 4.

### 3. Write the script lines (used by 2a.3 and 2b.2)

Allocate the budget by beat, then write. For a 28 to 30 s short:

| beat | time | words | job |
| --- | --- | --- | --- |
| hook | 0 to 1.5 s (line may run to 3 s) | 4 to 8 | the pain or the payoff, concrete, no name |
| stakes | 1.5 to 6 s | 6 to 10 | why it hurts or why today's fix fails, in one line |
| turn | 6 to 9 s | 3 to 6 | name the project once |
| the move | 9 to 21 s | 20 to 26 | what it does, in the UI, cued to the cursor and states |
| proof | 21 to 26 s | 7 to 10 | one number, as digits, from the sources table |
| loop | 26 to 30 s | 4 to 8 | the name or the link, running on into the hook |

For 15 s, merge stakes into the hook and the turn into the move: hook (4 to 6 words), move
(14 to 18), proof (5 to 7), loop (3 to 5).

Good and bad lines (all fictional):

| beat | bad | good | why |
| --- | --- | --- | --- |
| hook | "Introducing the next generation of test tooling." | "Your tests passed. Prod is down." | concrete contradiction in 6 words, no name |
| hook | "Have you ever wondered about flaky tests?" | "1 test failed 40 times this week." | a number beats a rhetorical question |
| stakes | "Teams struggle with many challenges in their CI pipelines every single day." | "So the team reruns it until it's green." | one picture, not a category |
| turn | "That's why we built an amazing new tool called {Name}." | "Enter {Name}." | the name once, no adjectives; "we" also fails the third-person lint |
| move | "It has lots of powerful features that help you manage everything." | "It replays the failing run and flags the one shared fixture." | a visible action the UI shows on the cued word |
| proof | "It's super fast and saves tons of time!" | "Reruns dropped from 40 to 3." | a sourced number, digits, before and after |
| loop | "Thanks for watching, follow for more!" | "Next time your tests pass..." | runs on into the hook line |

Lint rules that still apply in shorts: third person unless `narration.person` says
otherwise, `forbiddenTerms` warn, `.trailer/private/banned-terms.txt` errors.

### 4. Lint

> **Path B: drop `--cut short`.** In path B the short is the config's own 9:16 film, not a
> cut, so there is no `cuts.short` and `--cut short` fails with `no cut "short"`. In steps 4
> to 7, run every `--cut short` command without that flag (for example
> `<engine> <projectDir> --lint --json`); the film lands at `.trailer/out/trailer-9x16.mp4`.
> The `--cut square` commands stay as they are.

```sh
<engine> <projectDir> --cut short --lint --json
<engine> <projectDir> --cut square --lint --json
```

Exit 2: fix every error and rerun. Then read each warning. These shorts warnings are fixed,
never just accepted:

- scene 1 is not a `kinetic`, `title`, `hook` or `ui` scene, or it has a `lead` over 6 frames;
- frame 0 is blank (nothing on screen yet at the first frame);
- the hook starts after 1 s (the first spoken word comes too late), or the first line has more
  than 8 words;
- a 9:16 `targetSeconds` outside 15 to 30 s;
- the last scene of a 9:16 render has no `loop: true`;
- a position authored in 16:9 coordinates maps outside the safe area and the scene has no
  variant for that aspect (fix it with `variants["9:16"]` or `variants["1:1"]`);
- a kinetic beat over 5 words, more than 2 metrics or 2 characters in a scene, or a classic
  16:9-only scene type;
- a caption chunk longer than two lines;
- the word count outside `wordBudget`.

Any other warning is fixed or justified in one line in `script.md`.

### 5. Layout pass (cheap, before any voice)

```sh
<engine> <projectDir> --cut short --stills scenes --voice-engine none --safe-overlay --json
<engine> <projectDir> --cut square --stills scenes --voice-engine none --safe-overlay --json
```

Read every still with the Read tool. Check it against the layout section of
`checklist.md`: nothing in the overlay's red zones, nothing clipped, type readable, the
caption band clear of the focus target. Fix `variants` and rerun until the stills pass. This
loop costs seconds; the render costs minutes.

### 6. Render with review frames (one pass)

```sh
<engine> <projectDir> --cut short --review --safe-overlay --json
<engine> <projectDir> --cut square --review --safe-overlay --json
```

Each command renders the cut once and then writes its per-scene review stills and contact
sheet; there is no separate render pass. The overlay is drawn on the review stills only, never
on the MP4. Only new or changed lines are voiced; unchanged film lines come from the voice
cache. If `voice.fallback` is true, tell the user the short uses the fallback voice and that
timing will shift slightly with the real one. Compare `seconds` with the target and `words`
with `wordBudget`. Over by more than 3 s: cut words or drop a scene, then rerender. Never
speed up the voice.

### 7. Frame-review loop (at most 3 rounds)

1. Read the contact sheet from step 6 at `outputs.sheet` (`sheet.jpg`; the per-scene stills
   are in the `outputs.review` folder).
2. Run `<engine> <projectDir> --cut short --stills 0,1.5,<seconds minus 0.1> --safe-overlay --json` and
   read the three stills: frame 0 must work as a thumbnail, the 1.5 s frame must show the
   hook landed, and the last frame must match frame 0 closely enough to loop.
3. Open the per-scene frames that look wrong in the contact sheet. Check everything in the
   frame-review section of `checklist.md` and the shared `review.md`.
4. Fix the config (variants for layout, overrides for words and cues) and rerender only the
   affected cut with the step 6 command plus `--skip-capture`. Repeat the square cut the same
   way.
5. After 3 rounds, stop and report what is still wrong, with the scene id and a suggested
   fix. Do not loop further without the user.

Review frames come with the overlay; final renders never carry it.

### 8. Post copy

Write `.trailer/out/short-captions.md` from the template in `platforms.md`: per platform
(only those in `--platforms`, else all five), a hook line, the body, the link, hashtags and
the cover frame to choose. Same claims and numbers as the film, from the sources table.
Humanized: no em dashes, no slop words ("revolutionary", "game-changer", "leverage",
"delve", "unlock", "seamless"), contractions fine. `out/` is gitignored, so links and handles
there stay out of the repo.

### 9. Deliver

Report, with paths relative to `projectDir` and taken from `outputs`:

- the 9:16 MP4 and the 1:1 MP4, each with seconds, words against budget and the voice engine
  (flag any fallback);
- the `.srt` and `.vtt` for each cut and the posters per aspect;
- `out/short-captions.md`;
- what was left unfixed after the review loop, if anything;
- one line on platform captions: the video already has captions burned in, so do not also
  switch on the platform's auto-captions.

**Never upload, post, schedule or send anything**, and never ask for platform credentials.
The user posts.

## Failure handling

| symptom | do this |
| --- | --- |
| exit 3 (missing dependency) | show `doctor`'s install hint verbatim and stop |
| exit 2 (lint errors) | fix each error by its scene id; the common ones are first person, a banned term, a cue that names no spoken word, an unknown scene id in `cuts.*.scenes` |
| exit 1 (runtime failure) | read the last 40 lines of stderr, then `troubleshooting.md`; rerun once with `--voice-engine none` to tell voice problems from render problems |
| voice fell back to `say` or silent | keep going; warn in the delivery; a Deepgram 403 usually means a mistyped `aura-2-*` model name |
| over budget or over time | cut words in the overrides, then drop the weakest scene; `fitSeconds` only trims slack, it never shortens the voice |
| under 15 s | add a held beat on the proof (`hold`), not filler words |
| a click or note lands on the wrong word | the cue word is missing from the rewritten `say`; put it back or recue |
| mapped-coordinate warning (a position leaves the safe area) | write `variants["9:16"]` (or `variants["1:1"]` for the square cut) for that scene (`vertical-layout.md`) |
| caption covers the UI target | set the scene's captions to `top` in its variant, or move the focus with `camera` |
| kinetic type clipped or tiny | 5 words a beat at most, 3 a line; split the beat |
| a variant broke the cast or beats | arrays replace in a deep merge: restate every cast member or beat in the variant |
| music drums start at 0 | the cut lost its `turn` scene; add `turn: true` to a kept scene in `overrides` |
| the last frame does not match the first | `loop: true` must be on the last scene of that cut (in its `overrides`); check the stills at 0 s and the final 0.1 s side by side |

## Final checklist

Run the full list in [references/checklist.md](references/checklist.md) before delivering.
The short version:

- [ ] Frame 0 is meaningful; the hook is spoken and on screen by 1.5 s; no project name first
- [ ] 9:16 within 15 to 30 s and 1:1 within 20 to 45 s; `words` inside `wordBudget`
- [ ] one idea, one product move in recreated UI, one or two numbers, all in the sources table
- [ ] captions `center-low`, 64 to 72 px, 3 words a chunk, inside the safe box, never over a focus target
- [ ] nothing important in the top 220 px, bottom 420 px or right 136 px of the 9:16 frame
- [ ] every scene the lint flags for mapped coordinates has a variant for that aspect; no clipped text; nothing smaller than 40 px that must be read
- [ ] the last frame loops to the first; the last line runs on into the hook
- [ ] third person, no banned or forbidden terms, no invented numbers
- [ ] lint clean; review loop done (at most 3 rounds); leftovers reported
- [ ] `out/short-captions.md` written; nothing uploaded, posted or sent

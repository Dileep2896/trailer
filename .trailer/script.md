# Script: trailer

- **Use case:** explainer (the plugin's own showcase film), plus a 9:16 short cut
- **Format:** F18 Speedrun, bent for an explainer
- **Target:** 60 s, 16:9. Word budget 105 to 123 (1.9 x target, plus or minus 8%).
- **Tone:** quick, wry, confident
- **Voice:** Deepgram `aura-2-hermes-en` at 1.0
- **Look:** world: dark `#07080c`, acid-lime accent `#c8ff2e`, magenta `#ff4fd8`; Unbounded /
  Instrument Sans / Share Tech Mono; `scanlines` background, `terminal` chrome, `glitch`
  default transition (plus cut, flash, whip, zoom, push, slide-stack, iris, dissolve),
  `stacked` type, `scoreboard` motif (the split-timer HUD in the top-right corner of every
  scene). App: trailer's own engine defaults (see `brief.md`), Inter / JetBrains Mono.
- **Music:** 128 BPM, driving

## Why this fit

The promise is a run from a repo to a finished film, so the film is shaped as a speedrun: a
run starts on Friday's TODO, the slow way (screen-recording takes piling up) is shown first,
then each split is one step a person would otherwise do by hand: read the repo, cue the UI to
the voice, narrate and review, render three aspects. The split-timer HUD in the corner counts
scenes, not invented times; the run ends on a FINAL scoreboard of what the repo actually
ships. The metaphor explains the mechanism (a sequence of automated steps), not only the pain.

Shortlist considered: F18 Speedrun, F16 Unboxing (a launch, but its "box" framing hides the
pipeline), F04 The Loop (re-recording after every UI change; strong pain, weaker mechanism).
Not used before in this repo: `out/history.jsonl` did not exist; the bundled example
(`examples/driftcheck`) uses Case File.

Bend: F18 normally shows a time per split and a personal-best time. No time per step is
measured in the repo for a Studio film, so the splits are named, not timed, and the final
card is the scoreboard of sourced counts.

## Scenes (16:9 film)

| # | t (s) | act | scene (id, type, layout) | on screen | narration |
| --- | --- | --- | --- | --- | --- |
| 1 | 0.0 | hook | `open` title / hud | typed HUD: `git push --tags  v1.0 shipped`, `TODO a demo video for the launch`; "Now make the demo." | Friday. The feature ships. Now someone has to make the demo. |
| 2 | 5.4 | pain | `takes` calendar | a tear-off "TAKE 1..4" counter with sticky notes: missed the menu, wrong tab open, music too loud, a button moved | So you hit record, miss a click, and start over. |
| 3 | 9.4 | pain | `feed` split / versus | WHAT SHIPS: demo-final-v3.mov, a screen recording card, chips "no captions / no story / stale next release"; THE FEED: launch videos marked skipped, then "yours"; stamp SCROLLED PAST | What ships is a screen recording with music. No story. The feed scrolls past. |
| 4 | 16.6 | turn | `turn` kinetic (`turn: true`) | "Enter trailer." then "REPO IN. FILM OUT." | Enter trailer. Point it at your repo; it makes the film. |
| 5 | 21.8 | how | `read` ui / app (terminal) | `> /trailer:new`, reading, brief.md, shortlist, "Picked F18 Speedrun 1 of 20" highlighted with a note; side: SPLIT 1 READ, "Reads it. Never runs it." | One command. It reads your code, finds who hurts, and picks one of 20 story formats. |
| 6 | 29.3 | how | `cue` ui / app (poster) | the config JSON with a cursor cue `"at": "flagged"`; a timeline (VOICE words, CURSOR dot, CAPTIONS, MUSIC); the word "flagged" lights up and the click lands on it | It rebuilds your UI in your own colors, every click cued to a spoken word. |
| 7 | 35.4 | how | `review` ui / app | chips voice, captions .srt .vtt, music + sfx, rendered locally; the contact sheet, one tile flagged "caption covers the target", then fixed, toast "Round 2: nothing clipped" | Then it narrates, captions and renders locally, reviews its own frames, and fixes them. |
| 8 | 42.4 | how | `aspects` ui / none | three frames draw on: 16:9 1920 x 1080, 9:16, 1:1; note "same voice, same cues" | One config renders a wide film, a vertical short and a square. |
| 9 | 47.8 | proof | `proof` scoreboard FINAL | REPO TO FILM / RUN COMPLETE: STORY FORMATS 20, SKILLS 5, ASPECTS 3; ticker of features; lower third "Directed by a config file" | No screen recorder. This film was made by trailer, from its own repo. |
| 10 | 53.7 | end | `end` outro / card | "Your repo has a film in it." then the name, `/plugin install trailer@trailer`, the pill github.com/Dileep2896/trailer; music breathes | trailer. Open source on GitHub. |

## Full narration (16:9 film)

> Friday. The feature ships. Now someone has to make the demo.
> So you hit record, miss a click, and start over.
> What ships is a screen recording with music. No story. The feed scrolls past.
> Enter trailer. Point it at your repo; it makes the film.
> One command. It reads your code, finds who hurts, and picks one of 20 story formats.
> It rebuilds your UI in your own colors, every click cued to a spoken word.
> Then it narrates, captions and renders locally, reviews its own frames, and fixes them.
> One config renders a wide film, a vertical short and a square.
> No screen recorder. This film was made by trailer, from its own repo.
> trailer. Open source on GitHub.

Word count: 121 (budget 105 to 123). Spoken numbers: 1 ("20").

## Short cut (9:16, `cuts.short`)

Path A (cut from the film). Hook card at frame 0, one product move, one proof, a loop.

| # | scene | on screen | narration |
| --- | --- | --- | --- |
| 1 | `open` (override: title / card) | YOUR NEXT DEMO VIDEO / "No screen recorder." / "Your repo is the script." (visible at frame 0) | Your next demo video needs no screen recorder. |
| 2 | `turn` | "Enter trailer." then "REPO IN. FILM OUT." | Enter trailer. Point it at your repo, and it makes the film. |
| 3 | `read` (override) | the terminal: `/trailer:new`, reading, brief.md, "Picked F18 Speedrun", script.md | It reads your code, picks a story format, and writes the script. |
| 4 | `review` (9:16 variant) | the contact sheet as 2 x 4 tiles, the flagged tile fixed, toast | Then it narrates, captions, renders locally, reviews its own frames, and fixes what it finds. |
| 5 | `proof` (override) | FINAL scoreboard, lower third "Directed by a config file" | This film? trailer made it, from its own repo. |
| 6 | `end` (`loop: true`) | name, install line, pill; fades into frame 0 | trailer. Open source on GitHub. |

> Your next demo video needs no screen recorder.
> Enter trailer. Point it at your repo, and it makes the film.
> It reads your code, picks a story format, and writes the script.
> Then it narrates, captions, renders locally, reviews its own frames, and fixes what it finds.
> This film? trailer made it, from its own repo.
> trailer. Open source on GitHub.

Word count: 61 (budget 54 to 64 at 28 s). The last line runs into the hook on replay
("...on GitHub. Your next demo video needs no screen recorder."). Sources: rows 1 to 3 and 6
below.

## Sources for every number and claim

| claim as spoken or shown | source |
| --- | --- |
| 20 story formats ("1 of 20", STORY FORMATS 20) | README.md:46; `skills/trailer/references/formats.md` (F01 to F20) |
| SKILLS 5 | `skills/`: trailer, trailer-launch, trailer-jobhunt, trailer-hackathon, trailer-shorts |
| ASPECTS 3; 16:9 1920 x 1080, 9:16, 1:1 from one config | README.md:57 |
| captions burned in, plus .srt and .vtt | README.md:60 |
| renders locally | README.md:66 ("Local and private by default") |
| reads the code, never runs it | README.md:43 |
| rebuilds the UI in the app's own colours; every element cued to a spoken word | README.md:49, README.md:52 |
| reviews its own frames and fixes them | README.md:62; `skills/trailer/references/review.md` |
| only changed lines are re-voiced (ticker) | README.md:368 |
| this film was made by trailer, from its own repo | `.trailer/trailer.config.json` in this repo |
| "Most demo videos are a screen recording with music" (framing, no statistic) | README.md:32 |
| `/plugin install trailer@trailer` | README.md:104 |

The `#3b82f6` in the on-screen JSON is trailer's own default accent (`engine/src/options.mjs`).
The terminal lines, the takes and the feed items are illustrative recreations, not records of
real users or real runs.

## Accepted warnings

- None open: lint reports 0 warnings for the film and the short.

## Review log

See the delivery report; rounds are summarized there.

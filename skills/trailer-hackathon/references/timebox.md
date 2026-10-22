# The 60-minute timebox

A hackathon film is due when the submission closes, not when it is perfect. This plan
ships a judge-ready film in 60 minutes. Each block has a "done when" test. When a block
runs over, take the cuts below in order and keep moving. A 45 s film delivered beats a 60 s
film that misses the deadline.

## The plan

| minutes | block | done when |
| --- | --- | --- |
| 0 to 2 | **Preflight**: doctor, `init`, the one question | doctor exits 0 (or the missing-dependency line is with the user); `.trailer/` exists; the inputs are known or defaulted |
| 2 to 12 | **Inventory**: README, core loop, seed data, tests, tokens, `git log` | `brief.md` has the problem moment, the core loop, live vs. mocked per step, the tech line, 0 to 3 sourced numbers, and the app tokens with their source file |
| 12 to 22 | **Script**: length, format, scene table, narration, sources | the word count is inside the budget; the demo act has its minimum words; every number has a source row |
| 22 to 37 | **Config**: from the starter, scene by scene | every scene has its `say`; every `at` is a spoken word in that scene; the app tokens and seed rows are real |
| 37 | **Lint** | `--lint --json` exits 0 |
| 37 to 42 | **Layout pass**: stills with no voice | no clipped text, no caption over a focus target, no empty frame |
| 42 to 52 | **Render + review frames** | the mp4 exists; `seconds` is within 5 s of the target; the demo share is at least 0.40 |
| 52 to 60 | **One review loop + deliver** | the review checklist passes or the leftovers are listed; `submission.md` is written; the report is sent |

The render takes most of block 42 to 52 on a laptop. Write `submission.md` while it runs.
It needs only the brief and the script.

## When you fall behind

Check the clock at minutes 12, 22, 37 and 52. If you are more than 5 minutes behind, apply
the next cut that still applies, in this order:

1. **Skip the proof-of-life capture.** No `capture`, no app start. Use `--skip-capture` if a
   capture already ran. The recreated UI carries the demo.
2. **Drop characters and extra `sfx`.** They are polish, not proof.
3. **Keep the starter theme's structure.** Change only the accent, the fonts and two other
   theme keys (the minimum the craft rules ask for).
4. **Merge act 4 into one line.** Replace the `shapes` diagram with a `kinetic` beat
   ("Vision model → curb tags → router") and keep the tech sentence.
5. **Go to 45 s.** Two demo steps, no separate next scene (fold it into the proof line).
   Re-check the 45 s word budget (79 to 92).
6. **Skip the layout pass.** Go straight to the render and let the review loop catch layout
   problems.
7. **Ship after the first render.** No review loop. Report the frames you did not check.

Never cut: the problem by 10 s, the demo share of at least 40%, the sources table, the
lint, or the rule that only working steps are demo steps.

## The 20-minute emergency path

When the user says the deadline is in 20 to 30 minutes:

| minutes | do |
| --- | --- |
| 0 to 2 | doctor; `init --use-case hackathon` |
| 2 to 7 | read the README and the core loop component only; write a 10-line brief |
| 7 to 11 | 45 s script: problem, turn, 2 demo steps, proof or next, team (about 85 words) |
| 11 to 17 | edit the starter: replace content in place, keep the theme except accent and fonts, delete `cuts`, drop the `how` scene |
| 17 | lint |
| 17 to 25 | `--review --json` render |
| 25 to 28 | look at the contact sheet only; fix one thing if it is broken; write a 3-sentence pitch |

Say in the report which steps were skipped.

## Defaults that save time

- **Voice.** Render the draft with whatever voice doctor finds. Do not stop to set up a
  Deepgram key. If the user adds one later, re-running the render re-voices only what
  changed.
- **One loop.** The core allows three review loops. Here the default is one, and a second
  only if you are inside the timebox.
- **No new assets.** Use the bundled characters and emoji only. Adding and licensing new
  assets is never worth the time here.
- **No music hunt.** Set `music.bpm` and `music.mood`. The engine synthesizes the bed.
- **Reuse the scene ids.** Keep the starter's ids (`problem`, `turn`, `demo-*`, `how`,
  `proof`, `next`, `team`), so the demo-share check and the cut lists keep working.

## Stop rules

Stop and ask the user (one question) only when:

- doctor exits 3 and the fix needs a system install (for example ffmpeg);
- the core loop is mostly mocked and you cannot tell which steps work;
- there is no product UI, no screenshot and no output you can show (the film would have no
  demo act).

Everything else gets a sensible default and a line in the final report.

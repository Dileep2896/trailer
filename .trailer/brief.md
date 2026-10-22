# Trailer: brief

## Intake

| question | answer |
| --- | --- |
| tier | Studio (the full craft bar, up to 3 review loops) |
| length and shape | 60 s 16:9 main film, plus one 9:16 short cut (25 to 30 s). Nothing else (no square cut). |
| audience | developers and founders on GitHub and LinkedIn |
| takeaway / call to action | the repo `github.com/Dileep2896/trailer` and the install line `/plugin install trailer@trailer` |
| voice | Deepgram natural narrator, `aura-2-hermes-en` at speed 1.0 (key read from the environment at render time, never written) |
| limits | no company names other than generic ones, no personal data, no real customer data |
| proof | from this repo only; no user counts, no benchmarks, no invented timings |

## The one-liner

trailer is a Claude Code plugin: point it at a repo and it makes a narrated, captioned film of
the project (16:9, 9:16 or 1:1), rendered locally.

## Who hurts

A developer or founder who just shipped something and now needs a demo video for the launch
post, the README or LinkedIn.

## What breaks (one concrete example)

The feature ships on a Friday. The "demo video" becomes a screen recording: hit record, click
through the app, miss a click, start over; add a stock music bed; export. The result has no
problem, no story and no captions, and it goes out of date the next time the UI moves a button.
In a muted feed it gets scrolled past. (Framing only: README.md:32 "Most 'demo videos' are a
screen recording with music." No viewing statistics are claimed.)

## Why today's fix fails

A screen recording shows clicks, not a story, and redoing it after every UI change means
recording it again. A real edit (script, voice, captions, music, cuts for three aspect
ratios) is a video-editing job most developers will not take on.

## The mechanism (for a 12-year-old)

It reads the project like a person would, writes a short story about the problem and the
fix, rebuilds the app's screens as animations, and lets a narrator read the story while the
animations move on the narrator's words.

## Product moves (rebuilt as `ui` scenes; trailer has no GUI, so its "UI" is its own workflow)

1. **`/trailer:new` in a Claude Code terminal** reading the repo and writing `brief.md`, a
   format pick and `script.md`. Source: `commands/`, `skills/trailer/SKILL.md` steps 2 to 5.
2. **One config, cued to the voice**: `.trailer/trailer.config.json` with an `"at"` cue tied to
   a spoken word, and a timeline (voice words, cursor cue, captions, music). Source:
   `skills/trailer/references/scenes.md` (cue grammar), `engine/src/timeline.mjs`.
3. **The review contact sheet**: `review/16x9/sheet.jpg`, one still per scene 4 across, with a
   flagged tile fixed. Source: `skills/trailer/references/review.md`, README "Built-in review".
4. **Three aspects from one config**: 16:9 1920x1080, 9:16 1080x1920, 1:1 1080x1080.
   Source: README.md:57.

## Proof (every number and claim, with its source)

| claim | source |
| --- | --- |
| 20 narrative formats | README.md:46; `skills/trailer/references/formats.md` (F01 to F20) |
| 5 skills (core + launch, jobhunt, hackathon, shorts) | `skills/` (5 folders); README.md "Use-case skills" |
| 3 aspects: 16:9, 9:16, 1:1 from one config | README.md:57 |
| word-level captions, burned in, `.srt` and `.vtt` | README.md:60 |
| renders locally; nothing uploaded, posted or sent | README.md:66 |
| reads the project, does not run it | README.md:43 |
| recreated UI in the app's own colours, cues tied to spoken words | README.md:49, README.md:52 |
| only changed lines are re-voiced | README.md:368 |
| this film was made by trailer from its own repo | this config: `.trailer/trailer.config.json` in this repo |

No timing claim ("in an hour", "in minutes") is spoken: none is measured in the repo for a
Studio film.

## UI tokens (trailer's own defaults)

| token | value | source |
| --- | --- | --- |
| bg | `#0b111c` | `engine/src/options.mjs:120` (MODE.dark) |
| surface | `#151d2b` | `engine/src/options.mjs:120` |
| ink | `#eef2f6` | `engine/src/options.mjs:120` |
| muted | `#a3aebb` | `engine/src/options.mjs:120` |
| accent | `#3b82f6` | `engine/src/options.mjs:127` (DEFAULT_THEME.accent) |
| good / bad / warn | `#34d399` / `#f87171` / `#fbbf24` | `engine/src/v3/appui.tsx:81-83` (dark defaults) |
| radius | 10 | `engine/src/v3/appui.tsx:84` |
| font / mono | Inter / JetBrains Mono | `engine/src/options.mjs:130` (DEFAULT_THEME.fonts ui, mono) |

Font mapping: the terminal is JetBrains Mono (the engine's default mono); UI text is Inter.

## Forbidden terms

No company or product names other than generic ones on screen. Claude Code is named because
trailer is a Claude Code plugin (it is the install target and the tool it runs in); no logos
or brand colours are copied. No personal data, no customer data.

## Assets the user owns

None needed: every scene is recreated; music and SFX are synthesized by the engine.

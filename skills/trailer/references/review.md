# Review: the frame-review loop and the checklist

You cannot watch a video, but you can read frames. The engine renders stills at the moments
that matter and a contact sheet; you read them as images, compare them to this checklist, fix
the config, and re-render. That loop is what turns a valid config into a good film.

## Two passes

| pass | command (after the `<engine>` prefix) | cost | when |
| --- | --- | --- | --- |
| layout stills | `<dir> --stills scenes --voice-engine none --safe-overlay --json` | seconds | before any TTS, after every big config change |
| cue stills | `<dir> --stills cues --voice-engine none --json` | seconds | when timing of elements matters (many cues) |
| exact moments | `<dir> --stills 3,12.5,40 --json` | seconds | to check one moment you suspect |
| full review | `<dir> --review --json` | minutes | after the real render |
| re-review | `<dir> --review --skip-capture --json` | minutes, but only changed lines re-voice | each loop |

`--safe-overlay` draws the platform safe areas and the caption band on stills (never on final
renders). Output lands in `.trailer/review/<aspect>[-<cut>]/` (the `outputs.review` folder):
one full-size still per scene, taken at 60% of the scene (`scene-01-<id>.png`, ...), and
`sheet.jpg`, a contact sheet of those stills 4 across in scene order (its path is
`outputs.sheet`). `--stills cues` takes one still 12 frames after each line starts instead, and
`--stills 0,1.5,<scene-id>` takes exact moments; a value that is neither fails before anything
is deleted. For a moment the 60% still misses (an entrance, a pre-exit), add it with
`--stills <seconds>`.

## The loop (at most 3 rounds)

1. **Read `sheet.jpg`** (the `outputs.sheet` path). Scan tile by tile, in scene order: does
   each scene's picture match its line in `script.md`? Mark every tile that looks wrong.
2. **Read the full-size still** (in `outputs.review`) for each marked tile. Never judge small text from the sheet.
3. **Check the frame against the checklist** below. Write down each failure as
   `scene id: problem -> fix`.
4. **Fix the config** (not the engine, not the project). Typical fixes are in the table below.
5. **Re-render** with `--review --skip-capture --json` and re-read only the scenes you changed,
   plus their neighbours (a transition can move).
6. After **3 rounds**, stop. Report what is still wrong, with frame paths, and let the user decide.

## Checklist

Layout:
- [ ] Nothing is clipped or overflowing: text, cards, table rows, characters' heads and feet.
- [ ] Every character is fully on stage; no more than 2 or 3 in 16:9, 2 in 9:16.
- [ ] The caption band is clear of the focus target (the spotlit row, the cursor target, the
      number being shown). The safe overlay shows the band.
- [ ] In 9:16, nothing important sits in the top 220 px, the bottom 420 px or the right 136 px
      (platform UI). In 1:1, nothing in the outer 56 to 64 px.

Legibility:
- [ ] Text is at least 28 px tall at 1080p in 16:9, at least 40 px in 9:16.
- [ ] Contrast is at least 4.5:1 (text on its surface, captions on their box).
- [ ] At most about 5 words of display type on screen at once.
- [ ] No raw crop of a screenshot; every screenshot is framed and readable.

Story:
- [ ] The first frame is meaningful (always for shorts: no blank or fading-in frame 0).
- [ ] The pain is on screen before any product UI, and it shows a concrete example.
- [ ] The recreated UI reads as the app (its fonts, colours, radius, real seed rows).
- [ ] Each product beat shows the thing the narration names, at the moment it is named
      (check the key-cue frame).
- [ ] The turn names the project; the outro shows the name and the link pill.
- [ ] Every entrance has an exit; nothing lingers into the next scene by accident.
- [ ] No dead frame: nothing new for more than 4 s anywhere.

Numbers and copy:
- [ ] Every number on screen matches `script.md` and its source.
- [ ] No company, product or person names that should not be there; no logos.
- [ ] On-screen type does not repeat the caption word for word in the same second.

Timing and sound (from `--json`):
- [ ] `seconds` within plus or minus 5 s of `targetSeconds` (plus or minus 3 s for 30 s or less).
- [ ] `words` inside `wordBudget`.
- [ ] `voice.fallback` is false, or the delivery says which fallback was used.
- [ ] No warnings left unexplained.

## Common problems and fixes

| what you see | fix in the config |
| --- | --- |
| text overflows a card or a table cell | shorten the copy; fewer `columns`; set `widths`; lower `app.size` by 2 |
| a `ui` window too small to read | remove the `side` column or the `sidebar`; raise `width`; add a `camera` push |
| captions cover the spotlit row | set that scene's `captions` to `top`; or move the target up (fewer rows above it) |
| a character's head cut off | lower `size`; raise `y` (feet) toward the floor; `variants["9:16"]` for portrait |
| two things land at once | cue them to different words, or offset one: `{ "word": "flagged", "offset": 0.4 }` |
| an element appears before its word | its cue word is spoken earlier in the line, or not at all: pick a distinctive later word |
| an empty frame at the start of a short | no `lead` on scene 1; make scene 1 a `title` or `kinetic` visible at frame 0 |
| a scene drags with nothing new | add a `state`, a `camera` move or a `notes` callout mid-line; or cut the line |
| the film runs long | cut words in the longest scenes first; lower `breath`/`hold`; then `fitSeconds` |
| the UI does not look like the app | re-check `app` tokens against the source (`tokens.md`); use real seed rows |
| a kinetic beat wraps to 3 lines | fewer words; `layout: "stack"`; a smaller `size` |
| portrait layout off for a coordinate scene | write `variants["9:16"]` with new coordinates |

## Reporting the review

In the delivery, include: rounds run, what was fixed (one line each), what is left (with the
frame path), and the `sheet.jpg` path (`outputs.sheet`) so the user can look themselves.

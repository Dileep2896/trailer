# Vertical and square layout

How a trailer scene behaves at 9:16 and 1:1, where things may go, and when to write a
`variants` block instead of trusting the automatic mapping. For the fields of each scene
type, see [scenes.md](../../trailer/references/scenes.md); for `cuts` and `variants` in the
config, see [config.md](../../trailer/references/config.md).

## Frames and safe boxes

| aspect | frame (px) | safe insets top / bottom / left / right | content box | what the insets protect |
| --- | --- | --- | --- | --- |
| 9:16 | 1080 x 1920 | 220 / 420 / 64 / 136 | 880 x 1280, from (64, 220) | the app's top bar and tabs; the caption, username, music and progress zone; the like, comment and share rail on the right |
| 1:1 | 1080 x 1080 | 56 / 56 / 64 / 64 | 952 x 968, from (64, 56) | feed rounding and the progress bar |
| 16:9 | 1920 x 1080 | 64 / 48 / 96 / 96 | 1728 x 968 | title safe |

The 9:16 box is asymmetric on purpose: the right rail is wider than the left margin. A
centred element sits at x = 64 + 880 / 2 = 504 px in frame space, not at 540. The engine's
layouts already centre in the content box; things you place by hand must do the same.

`--safe-overlay` draws these insets on stills and review frames (never on a final render).
Anything that must be read or that the camera focuses on stays inside the box.

### Caption band

- 9:16 default: `center-low`, which puts the centre of the caption chunk at 72% of the
  frame height (about y = 1382), above the bottom inset. Size 64 to 72 px, `maxWords` 3,
  `case: "none"`, style `box` or `pill`, weight 700 to 800.
- 1:1 default: `bottom`, size 54 to 60 px, `maxWords` 4.
- The caption width is the safe width, so a 3-word chunk of long words can still wrap. The
  lint measures chunks and warns when one runs past two lines (more than 52 characters at
  9:16, 64 at 1:1); shorten the words or lower `captions.maxWords`.
- Layouts keep clear of the caption band. A scene whose focus target sits low (a bottom
  table row, a toast, a phone keyboard) moves its captions to `top` in its variant:
  `"variants": { "9:16": { "captions": "top" } }`.
- Diegetic text (a scoreboard, a transcript, a stamp) that says the same words as the
  caption at the same moment is a double read. Turn the caption `off` for that scene, or
  change one of the two.

## Type sizes at 1080 px wide

| element | minimum | typical |
| --- | --- | --- |
| captions (9:16) | 64 px | 68 px |
| captions (1:1) | 54 px | 56 px |
| kinetic display type | 96 px | 120 to 160 px, sized by fit to the content width |
| anything the viewer must read (a number, a row label under focus, a note) | 40 px | 44 to 56 px |
| supporting UI text that only sets the scene | 24 px | the app's own size inside a phone frame |

If the focus target is under 40 px at rest, push in with the scene's `camera` or spotlight
rather than enlarging the whole UI, so the recreation still reads as the app.

## Scene types in portrait

What the engine does automatically at 9:16, and what to check or override.

| type | automatic portrait behaviour | check, and write a variant when |
| --- | --- | --- |
| `kinetic` | font size fits the type to about 77% of the safe width; at most 3 words a line; `layout: left` becomes `stack` | a beat has more than 5 words (split it); an accent word ends up alone on a line |
| `title` | card width from the frame; starts visible at frame 0 | the title runs past 2 lines; `stamp` covers the title |
| `outro` | name, tagline and link pill stacked and centred; the `ticket` layout is scaled to fit the safe area | the link text is longer than about 28 characters (use a shorter `link.text`) |
| `ui` | the `sidebar` is dropped; `side` text moves below the frame (above it when captions are `top`); frame width is the content width; `frame` defaults to `phone` when unset; a `browser` frame is auto-fitted to the safe area | the focus row sits in the caption band; a table has more than 3 columns (drop columns in the variant); notes point off the frame |
| `screenshot` | fits to width; focus zoom is at least 1.4 | the shot is a desktop page whose text is unreadable even at 1.4; rebuild it as a `ui` scene instead |
| `split` | panels stack top and bottom with a horizontal divider | each panel has more than a label, one stat and one character; the verdict stamp overlaps the divider |
| `evidence` | `wall` and `grid` become `stack`, at most 3 cards | the scene has more than 3 cards (cut to the strongest 3 in the cut's override) |
| `metric` | rings and gauges stack vertically | more than 2 metrics (keep one, the one the narration says) |
| `cast` | positions go through `place()`; size x 0.8 | more than 2 characters on stage; any character with `x`, `y` or `move` (always write a variant) |
| `chalkboard` | items go through `place()` | always write a variant: chalk layouts are drawn for a wide board |
| `scoreboard` | rows stack; the ticker spans the width | `telestrator` circles have frame coordinates (always write a variant) |
| `casefile` | 2-column pin grid; strings recomputed | more than 4 pins |
| `chat` | unchanged and centred (already phone-shaped) | messages longer than about 8 words |
| `countdown`, `rewind`, `calendar` | centred on the frame | nothing usually |
| `lanes` | a top-to-bottom conveyor with 3 bins at the bottom | more than 3 lanes or 4 items |
| any `shapes` drawing | scaled into the content box | always write a variant if labels must be read |

## Automatic mapping vs `variants`

Config coordinates are authored in 16:9 space (1920 x 1080). At other aspects the engine
maps them with `place(x, y)` into the frame's safe content box: x maps linearly across the
content width, y keeps its distance from the floor for cast and other floor-standing things,
and maps linearly for free-floating items. The result is usable, never the best.

Write `variants["9:16"]` for:

- every scene in a 9:16 cut whose absolute coordinates (cast `x`/`y`/`move`, chalkboard
  items, telestrator, props, `shapes`) map to a position outside the safe area. The lint
  warns on exactly these (a position that stays inside the safe area passes without a
  variant), and a warning is fixed with a variant, not accepted;
- every hero scene (the hook, the main UI beat, the proof), even if the automatic layout
  passes, because these are the frames people screenshot;
- any scene the layout stills flag.

Variant coordinates go through the same mapping as the scene's own, so author them in the
same space and confirm the result on a `--stills scenes --safe-overlay` pass. If
`scenes.md` documents a different coordinate space for variants in your engine version,
follow it.

### Merge rules (important)

- The engine applies the cut first (its scene subset in its order, then `overrides`), then
  deep-merges `scene.variants[aspect]`, then flattens `say`.
- **Variants win over cut overrides** for the same field. Put words and cues (`say`,
  `beats` text, `at` cues) in the cut's `overrides`. Put layout (positions, sizes, captions
  position, frame, columns) in `variants`. Never put `say` in a variant: it would change
  every cut at that aspect.
- **Objects merge, arrays replace.** A variant that sets `cast` replaces the whole cast list,
  so restate every member you want to keep, with all its cues. The same goes for `beats`,
  `cards`, `items`, `metrics`, `elements`, `notes` and `cursor`.
- Variants are per aspect, so `variants["9:16"]` applies to every 9:16 cut and to a config
  whose top-level `aspect` is 9:16.

### Examples

Two characters that stood far left and far right in the film, pulled toward the centre so
both stay inside the 880 px content width, smaller, with the bubble turned away from the
right rail:

```json
{
  "id": "witnesses", "type": "cast", "stage": "floor",
  "cast": [
    { "who": "open-peeps/maya", "x": 560, "size": 380, "mood": "frustrated", "at": 0,
      "bubble": [{ "at": 0, "until": "end", "text": "It passed locally!", "kind": "shout" }] },
    { "who": "blob", "shape": "bot", "x": 1360, "size": 300, "mood": "smug", "at": "pipeline" }
  ],
  "variants": {
    "9:16": {
      "cast": [
        { "who": "open-peeps/maya", "x": 760, "size": 340, "mood": "frustrated", "at": 0,
          "bubble": [{ "at": 0, "until": "end", "text": "It passed locally!", "kind": "shout", "side": "right" }] },
        { "who": "blob", "shape": "bot", "x": 1160, "size": 260, "mood": "smug", "at": "pipeline" }
      ]
    }
  }
}
```

A `ui` scene whose focus row falls in the caption band, with a table too wide for a phone:

```json
"variants": {
  "9:16": {
    "captions": "top",
    "frame": "phone",
    "camera": [{ "at": "flagged", "focus": "runs.row2", "zoom": 1.5 }]
  }
}
```

If the element list itself must change (fewer columns, fewer rows), restate that element's
whole `elements` array in the variant, since arrays replace.

A kinetic beat that is too long for 3 words a line:

```json
"overrides": {
  "hook": { "lead": 0, "transition": "cut",
            "beats": [{ "text": "Tests passed.", "fx": "punch", "at": 0 },
                      { "text": "Prod is down.", "accent": "down", "fx": "stamp", "at": "Prod" }],
            "say": "Your tests passed. Prod is down." }
}
```

This one lives in the cut's `overrides`, not in a variant, because it changes the words.

## Square (1:1) notes

- The automatic mapping does well at 1:1 for most scenes. Write `variants["1:1"]` for every
  scene the square lint flags (a mapped position that leaves the safe area) and for what the
  square stills show is wrong; nothing else needs one.
- `split` panels at 1:1 have half the width they had at 16:9. Keep each panel to a label, a
  stat and one character, and check the stills for cramped type.
- A square cut can afford one more beat than the 9:16 short (a pain beat or an evidence
  stack of 2 cards), because its audience (LinkedIn, X) reads more.
- Keep the poster frame's key text inside the middle 80% of the square: some clients round
  the corners and overlay a play button or a duration badge.

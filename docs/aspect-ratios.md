# Aspect ratios

The engine renders the same config at three frame sizes, 30 fps, H.264 + AAC:

| aspect | frame | for |
| --- | --- | --- |
| `16:9` | 1920x1080 | the film: README, landing page, YouTube, a talk |
| `9:16` | 1080x1920 | Shorts, Reels, TikTok, stories |
| `1:1` | 1080x1080 | LinkedIn and X feeds |

Pick one with `aspect` in the config, `--aspect` on the command line, or a cut's `aspect`
(see [cuts](config-reference.md#cuts)). The timeline (every scene's start and length) is the
same at every aspect: only the layout changes.

## Safe areas

Every layout reads the frame size, the platform safe area and the caption band from one
place (`engine/src/frame.ts`) instead of assuming 1920x1080.

| aspect | top | bottom | left | right | why |
| --- | --- | --- | --- | --- | --- |
| `16:9` | 64 | 48 | 96 | 96 | title-safe |
| `9:16` | 220 | 420 | 64 | 136 | the platform's top bar, the caption and button zone at the bottom, and the action rail on the right |
| `1:1` | 56 | 56 | 64 | 64 | title-safe |

The content area is the frame minus the larger of the safe area and the caption band. Scene
layouts stay inside it; decorative backgrounds still fill the whole frame.

To see the zones, render stills with the overlay:

```sh
node engine/trailer.mjs my-project --cut short --stills scenes --safe-overlay
```

Red is the platform UI, the dashed blue box is the caption band of the scene under that
frame, and green is the content area. The stills and a contact sheet land in
`.trailer/review/<aspect>[-<cut>]/`. Overlays are never drawn on a final render.

## Captions per aspect

| aspect | default position | size | words per chunk |
| --- | --- | --- | --- |
| `16:9` | `bottom` | 50 | 6 |
| `9:16` | `center-low` (centred at 72% of the height) | 64 | 3 |
| `1:1` | `bottom` | 54 | 4 |

The film's caption settings never go below the aspect's size or above its words per chunk,
and `bottom` or `lower-third` become `center-low` in 9:16. A cut's own `captions` win over
all of that.

## How each scene type adapts

| scene | 9:16 and 1:1 |
| --- | --- |
| `kinetic` | the type is sized to about 77% of the safe width and wraps; keep beats to 5 words (`--lint` warns) |
| `title` | the title may wrap to two balanced lines; slate, ticket-like cards scale to fit |
| `outro` | the name, tagline, credit and link stack in a column; cards scale to fit, and the `ticket` layout is fitted to the safe area |
| `cast` | characters are placed in the content area (author positions are mapped) and drawn 15 to 20% smaller; keep it to 2 characters |
| `ui` | a phone frame (9:16) or app frame (1:1) by default; a `browser` frame in portrait is fitted to the safe area; the side text moves below the window; notes go above or below their target |
| `screenshot` | the window shows a taller crop of the capture (up to 4:5) and the moves pan across it; callouts sit below or above the focus |
| `split` | the panels stack top and bottom with a horizontal divider; before/after wipes vertically |
| `evidence` | a single column of the newest 3 cards |
| `metric` | rings, gauges and flips stack vertically in 9:16 and sit side by side in 1:1; keep it to 2 metrics |
| `casefile` | a 2-column pin grid, strings recomputed |
| `scoreboard` | the board scales to the width; the ticker spans the frame; telestrator marks are mapped |
| `chalkboard` | items are mapped into the board and text scales down (write `variants` for exact placement) |
| `chat` | already phone-shaped: centred, taller |
| `countdown`, `rewind` | centred, sized to the width |
| `calendar` | the calendar sits top centre, the notes pile up in two columns below |
| `lanes` | a top-to-bottom conveyor, with the lanes as bins along the bottom |
| classic types (`hook`, `problem`, `reveal`, `features`, `walkthrough`, `payoff`, `end`) | 16:9 only; `--lint` warns |

## Positions and variants

Positions in a config (cast `x`/`y`, chalkboard items, telestrator marks, shapes, props) are
authored in 16:9 frame pixels. At 9:16 and 1:1 they are mapped into the content area: x
across its width, y either linearly or (for characters standing on the floor) keeping their
distance from the floor. That is usually fine. For exact control, give the scene a variant:

```json
{
  "id": "board",
  "type": "chalkboard",
  "items": [{ "kind": "text", "text": "staging", "x": 300, "y": 400 }, { "kind": "arrow", "x": 600, "y": 430, "w": 400 }],
  "variants": {
    "9:16": { "items": [{ "kind": "text", "text": "staging", "x": 700, "y": 300 }, { "kind": "arrow", "x": 900, "y": 420, "w": 200 }] }
  }
}
```

A variant is deep-merged over the scene when rendering at that aspect: objects merge key by
key, arrays replace. `--lint` warns about a scene that has positions and no variant for the
aspect being rendered when a mapped position leaves the safe area. Fix each such warning with
a variant; a scene whose positions all stay inside the safe area needs none.

## Shorts

`--lint` also checks the shape of a short (9:16, or 30 s and under):

- scene 1 is a `kinetic`, `title`, `hook` or `ui` scene and moves at frame 0 (a lead of 6
  frames or less);
- frame 0 is not blank;
- the hook starts by 1 s, and the first line has 8 words or fewer;
- 9:16 targets 15 to 30 s;
- the last scene of a 9:16 render has `"loop": true`;
- the word budget is 2.1 words a second.

A typical short is 4 to 6 scenes from the film (hook, the turn, the best UI beat, a proof
number, the outro) with shorter `say` overrides:

```sh
node engine/trailer.mjs my-project --cut short --gif
```

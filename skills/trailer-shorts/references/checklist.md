# Shorts checklist

Two passes: the **frame review** after every render (at most 3 rounds), then the **delivery
checklist** once. The general review checklist for every film is in
[review.md](../../trailer/references/review.md); everything there applies too,
and this list adds what is specific to 9:16 and 1:1.

## The 9:16 safe zones (pixel values for checking stills)

Frame 1080 x 1920. Read stills rendered with `--safe-overlay`.

| zone | pixels | allowed there |
| --- | --- | --- |
| top inset | y 0 to 220 | background, motifs, decoration only |
| bottom inset | y 1500 to 1920 | background only (the platform's text and buttons sit here) |
| right rail | x 944 to 1080 | background only; no text, no bubble, no character face |
| left margin | x 0 to 64 | background only |
| content box | x 64 to 944, y 220 to 1500 | everything that matters |
| caption band (`center-low`) | centred near y 1382, inside the content box | captions only; no focus target, no note, no cursor click |
| Instagram grid crop (cover) | y 240 to 1680, full width | the cover's key text |

1:1 frame 1080 x 1080: the content box is x 64 to 1016, y 56 to 1024; captions sit at the
bottom of it.

## Frame review (after each render)

Read the contact sheet at `outputs.sheet` (`sheet.jpg`), the three loop stills (0 s, 1.5 s, the last
0.1 s) and any per-scene frame that looks wrong.

First and last frames:

- [ ] Frame 0 shows the hook: type, a UI mid-action or a split, readable as a thumbnail
- [ ] no fade from black, no blank or near-blank first frame, no logo, no project name as
      the first thing seen
- [ ] at 1.5 s, the hook's key words have been spoken and are on screen
- [ ] the last frame has scene 1's background and layout closely enough that the replay
      does not jump
- [ ] the last spoken line runs on into the first (read them back to back)

Layout, each scene:

- [ ] nothing that must be read sits in the top 220 px, the bottom 420 px or the right 136 px
- [ ] captions sit in their band, never over a focus target, a cursor click or a note
- [ ] no caption chunk wraps to a second line; at most 3 words each (4 for 1:1)
- [ ] kinetic type: at most 5 words a beat, 3 a line, nothing clipped at the sides
- [ ] anything the viewer must read is at least 40 px tall at 1080 px wide; captions at
      least 64 px (54 px for 1:1)
- [ ] `ui` scenes read as the app (its tokens, its font, its seed data), sized for a phone,
      with no sidebar squeezed in
- [ ] no screenshot shown as a raw crop, and none unreadable at its zoom
- [ ] at most 2 characters on stage, fully inside the frame, faces out of the right rail
- [ ] at most 3 evidence cards and 2 metrics in any scene
- [ ] split panels: each one readable on its own, the divider clear of the verdict stamp
- [ ] contrast at least 4.5:1 for captions and key text
- [ ] diegetic text and captions never say the same words at the same moment

Timing and sound:

- [ ] `seconds` within the target plus or minus 3 s; 9:16 inside 15 to 30 s, 1:1 inside
      20 to 45 s
- [ ] `words` inside `wordBudget`, and `voice.speed` not above 1.05
- [ ] every UI change (cursor click, state flip, note) lands on its spoken word
- [ ] no dead frame longer than about 3 s (a short has no room for one)
- [ ] the music's drums enter on the turn scene, not at 0
- [ ] no hard impact sound on the very last frame

If any box fails, fix it in the config (variants for layout, cut overrides for words and
cues), rerender only that cut and review again. Stop after 3 rounds and report what is left.

## Delivery checklist (once)

Content:

- [ ] one idea: one hook, one product move, one proof, one loop
- [ ] one or two numbers, written as digits, each in the sources table in `script.md`
- [ ] the turn names the project once; third person (unless `narration.person` says
      otherwise)
- [ ] no forbidden terms, no banned terms, no first-person lint errors
- [ ] `script.md` has a "Short cut" section: scene table, narration, word count, sources used

Config:

- [ ] `cuts.short` (9:16) and `cuts.square` (1:1) present, each with `targetSeconds`,
      `fitSeconds` and `captions`
- [ ] scene 1 in each cut has `lead: 0` and `transition: "cut"`
- [ ] the last scene has `loop: true` (ideally with scene 1's `bg`); the stills at 0 s and the
      final 0.1 s match
- [ ] every scene the lint flags for a mapped position outside the safe area has a variant for
      that aspect (`variants["9:16"]` or `variants["1:1"]`)
- [ ] no `say` inside any variant
- [ ] `--lint --json` exits 0 for both cuts; every shorts warning (SKILL.md step 4) fixed, any
      other warning fixed or justified in `script.md`

Outputs (paths from the `--json` summary, relative to `projectDir`):

- [ ] the 9:16 MP4 (1080 x 1920) and the 1:1 MP4 (1080 x 1080)
- [ ] the `.srt` and `.vtt` for each cut, and a poster per aspect
- [ ] `.trailer/out/short-captions.md` with copy for each requested platform, a cover frame
      per platform, and `[FILL: ...]` for anything unknown
- [ ] the voice engine reported, with a clear warning if it fell back

Boundaries:

- [ ] nothing uploaded, posted, scheduled or sent; no platform logged into
- [ ] no API key printed or written anywhere
- [ ] generated media stays in `.trailer/out/` (gitignored)

# Craft rules

These rules apply to every film, whatever the format or use case. They come from reviewing
finished films frame by frame: what made a viewer understand the problem, believe the fix and
remember the name.

## 1. Pacing

- **Budget: 1.9 spoken words per second of film**, plus or minus 8%, for 16:9 films. Cuts,
  shorts and any film of 30 s or less run denser at **2.1 words per second**. Measured on finished films, this rate already
  includes the breaths, the music-only end card and the scene transitions. The engine reports
  the exact `wordBudget` in `--json`; trust it over mental arithmetic.
- **Never speed the voice up to fit.** Keep `voice.speed` at 1.0 (0.9 to 1.1 is allowed, and
  the lint warns above 1.05). Cut words instead. Then use `hold`/`breath` and finally
  `fitSeconds`, which trims slack but never the voice.
- **Silence is part of the film:** a beat after the hook, a beat after the pain lands
  (`breath: 0.8` to `1.2`), a beat after the proof number, and an end card with music only.
- **Hold one idea for 3 to 6 s.** Every 2 to 3 s something new arrives (an element, a cue, a
  camera move). Nothing on screen sits still for more than 4 s.
- **Act order is fixed:** hook, pain with evidence, turn, how it works, proof, end. The pain
  gets at least 14 s in a 60 s film (at least 25% of any film) and comes **before any product UI**.
- **Show the product working for at least a quarter of the film**, in `ui` (or `screenshot`)
  scenes.

| target | words (film 1.9x) | words (cut 2.1x) | scenes | pain at least |
| --- | --- | --- | --- | --- |
| 15 s | 29 to 34 (2.1x at 30 s or less) | 29 to 34 | 4 or 5 | 3 s |
| 30 s | 58 to 68 (2.1x at 30 s or less) | 58 to 68 | 6 or 7 | 6 s |
| 45 s | 79 to 92 | 87 to 102 | 8 or 9 | 10 s |
| 60 s | 105 to 123 | 116 to 136 | 9 to 12 | 14 s |
| 75 s | 131 to 154 | 145 to 170 | 11 to 13 | 16 s |

## 2. Explaining

Every film answers four questions in plain words, in this order:

1. **Who hurts?** A role, a person ("an on-call engineer", "a shop owner") or one named
   fictional person from the seed data.
2. **What breaks?** One concrete example, ideally taken from the app's seed data ("staging
   says on, production says off"). Not a category ("configuration issues").
3. **Why does today's fix fail?** The workaround and its cost: by eye, every time, too slow,
   too costly, misses some.
4. **What changes?** The mechanism in one sentence a 12-year-old follows, then one measured
   number with its source.

Rules:

- One evidence beat per film. Public evidence is attributed generically ("a developer on a
  forum", "users of popular CI tools report"). Never name a company, product or person, and
  never show logos or copied brand colours. Keep the source URLs in `brief.md` only.
- **At most 3 numbers per film**, as digits ("40", not "forty"), at most one number or one
  before-and-after pair per sentence. Every number has a row in the sources table of
  `script.md` with `file:line` or a URL.
- Name the project at the turn, then use its name or "it". Do not repeat the full name more
  than 3 times.
- Explain the mechanism once, in words, then **show** it. Do not explain it again in type.

### Lines: bad and good

| bad | problem | good |
| --- | --- | --- |
| "In today's fast-paced world, teams struggle with alerts." | cliche opener, nobody hurts | "3 a.m. The pager fires. It's the fourth false alarm tonight." |
| "Our tool uses advanced AI to detect issues." | first person, vague, slop | "Leakbeat reads the pull request and flags the line that never frees its buffer." |
| "Configuration drift is a major problem for many organizations." | abstract | "Staging says the flag is on. Production says off. Both files look right." |
| "It offers powerful features like dashboards, alerts and integrations." | a feature list | "One click groups the 30 copies into one ticket." |
| "Massively improves performance by up to 10x." | unsourced, hedged superlative | "On the repo's benchmark, the page loads in 1.2 seconds." |
| "Hookfinder: Webhook Delivery Observability Platform." | a category name as the turn | "Enter Hookfinder. It follows every webhook to the door." |
| "Check it out!" | no destination | "Hookfinder. Open source on GitHub." |

Banned words (slop and hype): revolutionary, game-changing, cutting-edge, seamless,
leverage, unlock, supercharge, empower, delve, robust, streamline, next-generation,
world-class, "in today's world". Add project-specific ones to `forbiddenTerms`.

### Narration person

- Default `narration.person: "third"`: the film talks about the project by name. The lint
  fails on "I", "we", "my", "our", "us" in narration and on-screen copy. Attributed quotes and
  in-world chat are dialogue, so first person there is only a warning.
- `"first"` is for personal films only (a portfolio film, when the user asks). The lint then
  allows first person.
- A `credit` line on the outro ("Built by Jane Doe") credits a person without first-person
  narration.

## 3. Captions

- Captions are burned in, karaoke-style: the spoken word lights up in the accent.
- 16:9: **48 to 56 px**, UI font, weight 700, at most 6 words a chunk, `box` or `pill`.
  9:16: **64 to 72 px**, at most 3 words a chunk, `position: "center-low"`.
- Contrast at least 4.5:1 against a solid or 85%-opaque box.
- Keep the caption band (the bottom 16% of a 16:9 frame) clear of focus targets. Scene layouts
  already shrink to keep clear; when a scene puts its own text in the world (a transcript, a
  scoreboard, a turn title), set that scene's `captions` to `top` or `off`.
- On-screen type never repeats the caption word for word in the same second. A `kinetic` beat
  either says the line (and the scene turns captions `off`) or adds to it.

## 4. Product footage: never a raw crop

- **Prefer recreated UI** (`ui` scenes) for anything that moves: rows, counters, toggles, diffs,
  charts. They render sharp at any size, stay on-brand, can be cued word by word, and use the
  app's real seed data.
- A real screenshot always appears **framed** (browser chrome, device bezel or a rounded card),
  with padding, a soft shadow and a backdrop. It fits by aspect ratio, never squashed and never
  cropped edge to edge.
- Use **focus zoom** (`moves` with `focus`, `zoom` 1.4 to 1.9, `spotlight: true`) instead of
  cropping. Pull back out (`reset`) before the scene ends.
- Screenshots are establishing shots: at most 4 s on screen in one stretch.
- If text in a screenshot is not readable at 1080p, zoom in or rebuild it as UI.

## 5. Recreated UI matches the app

- Pull the tokens from the app's own source (`references/tokens.md`). The film's **world**
  (`theme`) can be stylised; the **UI inside its frame** (`app`) looks like the real app.
- Use the app's real seed data: real row names, real values, real statuses. A recreation with
  "Lorem ipsum" or "Row 1" reads as fake.
- Show only what carries the beat: 3 to 6 rows, one header, one action. Delete everything else.
- Every product beat has: a **cursor** click or a **camera** push, a **spotlight** or
  **highlight** on the thing that matters, and a **notes** callout that names it in 2 to 5 words.
- State changes happen on the word that names them (`states: [{ "at": "flagged", ... }]`).

## 6. Kinetic type

- At most **5 words** of display type on screen at once, for at most 3 s. One accent word per line.
- Every entrance has an exit; no word just vanishes. Entrances 8 to 14 frames, exits 6 to 8.
- Big type lands on a music beat with a sound (the engine adds thunks, swishes and ticks per
  `fx`). Never stack more than two type effects.
- Each format has a signature type move (`formats.md`). Use it once or twice, not everywhere.
- Portrait: at most 3 words per line; `layout: "left"` falls back to `stack`.

## 7. Characters

- A character has **one job** (witness, dummy, sprout, referee) and reacts on beats: moods
  change on cue words, `react` on the verdict, `sweat` on bad news.
- Characters never speak in a second voice. The narrator talks about them. Bubbles show 2 to 5
  words, linted like narration, and never name a real company.
- At most 2 or 3 characters on stage in 16:9, 2 in 9:16, and fully on stage (no cut-off heads).
- Use only the bundled CC0/MIT assets or code-drawn blobs (`references/characters.md`). Never a
  company mascot.

## 8. Sound and music

- One narrator per film. The music changes with the format: `bpm` 90 to 132 and a `mood`
  (`calm`, `warm`, `tense`, `driving`, `playful`). The bed is ducked under the voice.
- The drums enter on the `turn: true` scene. Put the turn where the project is first named.
- The engine adds per-scene SFX (gavel on stamps, chalk on drawings, ticks on counters). Add a
  few explicit `sfx` only where a moment needs one; more than one extra per scene is noise.
- A user-supplied track goes in `.trailer/assets/` (it must be theirs or licensed) and is set
  with `music.file` at its real bpm.

## 9. Variety between films

- Two films in one repo differ in **format** (not in `history.jsonl`), opener and closer, accent,
  fonts, and at least two of `background`, `chrome`, `transition`, `type` and `motif`.
- Mix transitions per scene; a film that uses one transition everywhere feels templated. Two to
  four different transitions, chosen for meaning (`flash` on a reveal, `glitch` into a flashback,
  `push` between steps, `iris` into the outro).

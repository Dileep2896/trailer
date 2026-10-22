# Architecture

Trailer has two halves: **skills** that read a project and write a film config (the
creative work: the story, the format, the script, the scenes), and the **engine** that turns
that config into a finished video (deterministic: same config and voice, same film). This
page covers the engine.

```
.trailer/trailer.config.json
        |
        v
  lint ---------> schema (ajv) + rules (validate) + copy lint + word budget + format lint
        |
  capture ------> .trailer/shots/<page>.png + boxes      (image, static serve, or live app)
        |
  voice --------> .trailer/voice/<hash>.wav + word timings (Deepgram, say, espeak-ng, none)
        |
  timeline -----> scene starts and lengths on the music's beat grid, fitted to the voice
        |
  captions -----> chunks -> burned in + .srt + .vtt
        |
  music --------> synthesized bed (or a licensed track), sound effects
        |
  render -------> Remotion bundle -> renderMedia (mp4) / renderStill (poster, stills, review)
        |
        v
.trailer/out/trailer-<aspect>[-<cut>].mp4, poster, .srt/.vtt, gif, history.jsonl
```

## The config is the interface

A config is a list of typed scenes in play order. Each scene carries its own narration
(`say`), and every animated element takes a cue (`at`) that resolves against the scene's
spoken words. Because the picture is timed to words rather than to frames, the voice can
change (a different model, your own recording, a fallback) and the cut still lines up.

`src/config.mjs` resolves one render: the cut (scene subset, overrides), the aspect (and each
scene's `variants`), and flattens `say` into voice lines. It is shared by the Node scripts
and the video, so both see exactly the same config.

## Timeline

`src/timeline.mjs` gives every scene `lead + voice lines (+ gaps) + tail`, never less than
its minimum, rounded up to half a beat of the music (15 frames at 120 BPM). Cuts land on the
grid, so the synthesized bed's bars line up with the scene changes, and the drums enter on
the bar after the turn. `fitSeconds` searches for the largest slack scale (half-beat grid,
then quarter beats, then single frames) that fits; it never touches the voice.

## Frames and safe areas

`src/frame.ts` is the frame contract: the frame size for the aspect, the platform safe area,
the caption band for the scene's caption position, and `place()`, which maps 16:9 author
coordinates into the current content area. Every layout reads these instead of assuming
1920x1080. In 16:9 the geometry is exactly the original film's; 9:16 and 1:1 get stacked or
scaled layouts per scene type. See [aspect ratios](aspect-ratios.md).

## Voice

`scripts/voice.mjs` voices each line, trims silence, sets the pace with pitch kept (`atempo`),
and normalises loudness to -16 LUFS. Files are named by a hash of provider, model, speed and
text, so cuts reuse the film's lines and only changed lines are re-voiced. With Deepgram,
each line goes through speech-to-text (nova-3) and the recognised words are aligned to the
script by edit distance; the captions and cues use the script's words with the recogniser's
timing. The fallback chain is deepgram, say, espeak-ng, none.

## Rendering

`scripts/render.mjs` bundles the Remotion project once per run and renders the film with
`renderMedia` and stills with `renderStill`, reusing one browser. The public folder for the
bundle is `.trailer/.stage/public/`: `characters/` and `sfx/` link to the engine runtime,
`vo/`, `shots/` and `assets/` link into the project's `.trailer/`, and `music/` holds the
generated beds. Nothing a render produces is written inside the engine folder.

The browser is Remotion's headless shell (about 570 MB), downloaded once on the first render
into `$TRAILER_HOME/browser/`. Remotion puts its download next to the nearest `package.json`
above the working directory, so the engine runs that step from `$TRAILER_HOME/browser/`
(which holds its own `package.json`) rather than from the user's project or home directory.
The executable is remembered in `$TRAILER_HOME/browser.json`, tagged with the Remotion
version, so a Remotion upgrade fetches a matching browser. Where the download fails, the
newest Playwright headless shell on disk is used and remembered instead. `REMOTION_BROWSER`
overrides both.

## Runtime folder

In a git checkout with `engine/node_modules` installed, the engine runs in place (dev mode).
In a plugin install the engine folder has no dependencies and may be read-only, so the CLI
copies `src/`, `public/characters/`, the Remotion config and the lockfiles into
`$TRAILER_HOME/engine-<version>-<hash>/` (hash of package.json and the lockfiles) and
installs there once, with `pnpm --frozen-lockfile`, else `npm ci`. The source is re-synced
when it changes. `TRAILER_HOME` defaults to `~/.cache/trailer`.

ffmpeg: the system one when it is on `PATH`, else Remotion's bundled binary. `doctor` checks
that every filter the engine uses is present.

## Files

| path | what |
| --- | --- |
| `engine/trailer.mjs` | the CLI |
| `engine/scripts/lib.mjs` | project paths, loading, validation, copy and format lint, word budget, voice settings |
| `engine/scripts/runtime.mjs` | runtime folder, installs, ffmpeg, browser |
| `engine/scripts/capture.mjs`, `serve.mjs` | screenshots (image, static folder, live app) |
| `engine/scripts/voice.mjs` | voice providers, fallback, alignment |
| `engine/scripts/audio.mjs` | sound effects and the music bed |
| `engine/scripts/render.mjs` | Remotion bundle, film, stills, poster, GIF, contact sheet |
| `engine/scripts/gen-schema.mjs` | generates `engine/schema/trailer.schema.json` |
| `engine/src/config.mjs`, `timeline.mjs`, `cues.mjs`, `captions.mjs`, `options.mjs` | shared by Node and the video |
| `engine/src/frame.ts` | the frame and safe-area contract |
| `engine/src/Trailer.tsx`, `Root.tsx` | the composition: scenes, transitions, captions, voice, sound, music |
| `engine/src/v3/` | the scene types, characters, recreated app UI |
| `engine/src/scenes/` | the classic scene types (16:9) |
| `engine/templates/` | starter configs for `init --use-case` (each byte-identical to its skill's `assets/` starter; the release-recap starter lives only in `skills/trailer-launch/assets/`) |
| `engine/test/` | unit tests (`node --test`) |

## Exit codes and `--json`

`0` ok, `1` failure, `2` lint errors, `3` a missing dependency (Node, ffmpeg, the engine
install). With `--json`, logs go to stderr and stdout carries one summary:

```json
{
  "ok": true,
  "aspect": "16:9",
  "cut": null,
  "seconds": 57.2,
  "voiceSeconds": 49.8,
  "words": 116,
  "wordBudget": [105, 123],
  "voice": { "engine": "deepgram", "model": "aura-2-hermes-en", "speed": 1, "fallback": false },
  "scenes": [{ "id": "open", "type": "title", "from": 0, "duration": 309, "lines": 1 }],
  "outputs": { "mp4": ".trailer/out/trailer-16x9.mp4", "srt": "...", "vtt": "...", "poster": "...", "gif": "...", "review": "..." },
  "warnings": [],
  "errors": []
}
```

Paths are relative to the project. With `--all`, the summary is `{ "ok", "renders": [...] }`
with one entry per render.

## Remotion's license

The engine is built on [Remotion](https://www.remotion.dev), which has its own license: free
for individuals and for companies of up to 3 people; larger companies need a Remotion
company license. trailer's MIT license covers trailer's own code only and does not
relicense Remotion.

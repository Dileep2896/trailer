# Troubleshooting

Start with `<engine> doctor <projectDir> --json`: it checks Node, ffmpeg and its filters, the browser, the
install in `TRAILER_HOME`, and whether a Deepgram key is present. Every run prints paths
relative to the project, so logs can be pasted into an issue as they are.

## Exit codes

| code | meaning | first step |
| --- | --- | --- |
| 0 | ok (warnings may still be listed) | read `warnings` in `--json` |
| 1 | runtime failure (capture, voice, audio, render) | read the error tail on stderr; find the stage below |
| 2 | lint errors | read `errors` in `--json`; fix the config |
| 3 | a missing dependency | run `doctor --json`; it names the command to run |

## Install and environment

| symptom | cause | fix |
| --- | --- | --- |
| `node: command not found` or a syntax error at startup | Node missing or older than 20 | install Node 20 or newer (nodejs.org or a version manager) |
| exit 3, "ffmpeg not found" or a missing filter | no system ffmpeg, and the bundled one lacks a filter | macOS `brew install ffmpeg`; Debian/Ubuntu `sudo apt install ffmpeg`; Windows `winget install ffmpeg` |
| first run is slow | dependencies install once into `TRAILER_HOME` | wait; later runs reuse them |
| install fails with a lockfile error | a partial earlier install | delete the `engine-*` folder inside `TRAILER_HOME`, then run `<engine> install` |
| "no browser to render with" | Remotion could not download its headless browser (offline, proxy) | `npx playwright install chromium-headless-shell`, or set `REMOTION_BROWSER` to a Chrome/Chromium binary |
| a `.remotion/` or `node_modules/.remotion/` folder (about 570 MB) in a project | left by an older engine; the engine now keeps the browser in `TRAILER_HOME/browser/` | delete that folder; the next render reuses (or fetches once) the copy in `TRAILER_HOME` |
| `EACCES` writing under the plugin folder | the plugin folder is read-only (as intended) | nothing to fix in the plugin; check `TRAILER_HOME` is writable |
| Linux render has missing glyphs or emoji | system fonts missing | install `fonts-noto` and `fonts-noto-color-emoji` |

## Lint (exit 2)

| error | fix |
| --- | --- |
| first person "we" / "our" / "I" in narration or copy | rewrite in the third person with the project name; for a personal film set `narration.person: "first"` |
| banned term found | remove it from every string; never delete it from `private/banned-terms.txt` to pass |
| unknown scene type, transition, font, mood | use a value from `scenes.md` / `config.md`; the error lists the allowed values |
| character or emoji not found | use a name from `characters.md` |
| screenshot `page` not in `capture.pages` | add the page, or switch the scene to a recreated `ui` scene |
| two scenes share an id | give one an `id` |
| metric needs 1 to 3 metrics | split into two scenes or drop one |

Warnings worth acting on: the word count outside `wordBudget` (cut words); a cue word not
spoken in its scene (re-cue it); a 9:16 or 1:1 scene whose 16:9 coordinates map outside the
safe area and has no variant for that aspect; and for shorts, a blank frame 0, a hook that
starts after 1 s, and a last scene with no `loop: true`; a speed above 1.05.

## Voice (exit 1 during voice, or a fallback warning)

| symptom | cause | fix |
| --- | --- | --- |
| "falling back to say" | no `DEEPGRAM_API_KEY` | see `voice.md` setup; the draft is still usable |
| 401 from Deepgram | wrong or revoked key | the user creates a new key; never print the old one |
| 402 or a credit error | the account is out of credit | the user tops up, or render with `--voice-engine say` |
| 403 / model not found | a mistyped or unavailable model | use `aura-2-hermes-en` or a name from Deepgram's list |
| a network timeout | offline or a proxy | retry once; then `--voice-engine say` and say so |
| words mistimed in captions | speech-to-text misheard a word, alignment fell back | rephrase the word; spell it the way it sounds in `say` |
| `say` missing on Linux | macOS only | install `espeak-ng`, use `--voice-engine none` for a silent layout draft, or choose the no-voice mode (`"voice": { "provider": "text" }`) for a finished film |
| "a silent draft ... For a finished film without a voice" | no key and no local voice; the run fell to `none` | offer the text mode (`voice.md`, "No voice"): set `"voice": { "provider": "text" }` and cut words to its budget |
| a text-mode film runs long | reading is slower than speech: 1.5 words a second of film | cut words and shorten lines (`craft.md`, "Writing for reading"); `fitSeconds` only trims slack |

## Capture (only with `screenshot` scenes)

| symptom | fix |
| --- | --- |
| the app never answers | check `startCmd`, `port`, `readyPath`; raise `readyTimeout`; start the app yourself and the engine reuses it |
| a box lands on the wrong element | use `exact:` text or a `tid:` selector; check `.trailer/.stage/shots.json` |
| cookie banners or dev overlays in shots | add their selectors to `hideSelectors` |
| capture is slow and nothing changed | `--skip-capture` |
| capture is not worth it | replace the screenshot with a recreated `ui` scene |

## Render (exit 1 during render)

| symptom | fix |
| --- | --- |
| it fails at one scene | `--frames <a-b>` around it to isolate; check that scene's fields against `scenes.md` |
| out of memory or very slow | close other apps; render a cut at a time instead of `--all` |
| a font renders as a fallback | the name is not in the list; pick one from `config.md` |
| the film is much longer than the voice | `hold` values too large, or too many scenes with long minimums; trim them |
| music too loud or too quiet | `music.volume` (default 1) |
| SFX too busy | remove extra `sfx`, or set `"sfx": 0.6` |

## Duration

| symptom | fix |
| --- | --- |
| over target by more than 5 s | cut words (the voice is the length), then `breath`/`hold`, then `fitSeconds` |
| `fitSeconds` "not met" | the voice alone is longer than the target; cut words |
| under target | add a breath after the pain and after the proof; give the outro `hold: 3`; do not pad words |
| a silent or system-voice draft was on target, the real narrator is not | `--voice-engine none` estimates each line's length from its word count, and `say` / `espeak-ng` speak at their own pace, so the final Deepgram render can land a few seconds longer or shorter; check `seconds` again after the real voice and trim or add `breath` then |

## Licensing questions

- trailer itself is MIT. Remotion is **not** relicensed by trailer: it is free for
  individuals, non-profits and companies of up to 3 people; larger companies need a Remotion
  company license (see [remotion.dev/license](https://www.remotion.dev/license)). Bundled characters are CC0 or MIT. Fonts are OFL or
  Apache-2.0. Synthesized music and SFX are original (MIT). Deepgram audio is under the user's
  own Deepgram terms.

## Filing an issue

Include: the `doctor --json` output (it contains no secrets), the exit code, the last 40 lines
of stderr, the scene that fails (as JSON), and the OS. Never include `.env` or a key.

# Voice: narrator, no voice, pace and fallbacks

Every film has **one narrator**, or deliberately **none**. With a narrator, the engine
synthesizes each `say` line, measures it, aligns word timestamps for the cues and captions,
loudness-matches it, and only re-voices lines whose text changed. With no voice (the text
mode, below), each `say` line is shown as on-screen text instead, timed for reading.

## The choices

| choice | `voice.provider` | needs | cost | result |
| --- | --- | --- | --- | --- |
| natural narrator | `deepgram` (default) | `DEEPGRAM_API_KEY` | Deepgram credit | a finished, narrated film |
| no voice | `text` | nothing | free | a **finished** film: music, sound effects and the script as on-screen titles |
| system voice | `say` (or `espeak-ng` as a fallback) | macOS / the package | free | robotic narration; drafts only |
| your own recording | any, plus `--keep-voice` | your WAVs | free | a finished, narrated film |

When there is no key, recommend **no voice** for anything that will be published and the
system voice only for drafts. `none` is not a choice to offer: it is the silent layout draft
at the end of the fallback chain.

## No voice: the text mode

`"voice": { "provider": "text" }` (or `--voice-engine text`, or `TRAILER_VOICE_ENGINE=text`).
No speech is synthesized, no API is called, nothing is sent anywhere, and there is no
fallback warning: `--json` reports `voice.engine: "text"`, `voice.mode: "text"` and
`voice.fallback: false`.

- **Captions become titles.** Each line is shown one short phrase at a time (at most 5 words
  in 16:9, 4 in 1:1, 3 in 9:16) in the display face, sized up to fill the caption band on one
  line and centred in it, with no word-by-word lighting. Captions are always on in this mode;
  `captions.position`, `style`, `size` and `case` still apply. A scene with `"captions":
  "off"` must show its own words (a `kinetic` beat, a `title`), or the lint warns.
- **Reading pace, not speech pace.** Each line lasts 2.2 words a second, plus 0.7 s to notice
  the new phrase, 0.3 s per sentence break and 0.1 s per comma, at least 1.5 s; lines in a
  scene are 0.5 s apart (a blank beat, so the next phrase reads as new). The numbers come from
  subtitle guidance (BBC: 160 to 180 words a minute; Netflix: 17 characters a second for
  adults, 13 for children), set below them because the text shares the frame with a moving
  picture. A phrase stays up until the next one replaces it.
- **Cues still work.** `"at": "flagged"` fires when the phrase holding "flagged" comes on
  screen; line cues (`"at": 1`) and second cues work as before.
- **Music stays up.** The bed is never ducked (there is no voice to duck under) and is lifted
  to carry the film (bed 0.75 instead of 0.42, effects 1.4x), so a text film lands near a
  narrated film's loudness; the sound effects land on their cues as usual. `music.volume` and
  `sfx` still scale the levels.
- **No double text.** A phrase the scene already shows on screen (a `kinetic` beat, the
  outro's name and tagline) is not burned in again; it stays in the `.srt` and `.vtt`.
- **The budget is smaller**: 1.5 words per second of film (1.65 for a cut or a 30 s film),
  about four fifths of a narrated film. See "Writing for reading" in `craft.md`.
- `.srt` and `.vtt` are still written (the on-screen phrases, with their times), and the mode
  works at 16:9, 9:16 and 1:1, with `loop` and `firstFrame`.
- For the layout pass, keep the text mode (`--voice-engine text`, or no flag), not `none`:
  `none` lays the film out at speech pace with narration-style captions.

## The fallback chain (narration)

| order | engine | needs | quality |
| --- | --- | --- | --- |
| 1 | Deepgram Aura-2 (default `aura-2-hermes-en`) | `DEEPGRAM_API_KEY` | natural; word timestamps from speech-to-text |
| 2 | `say` (macOS) | nothing | robotic but clear; fine for drafts |
| 3 | `espeak-ng` (Linux, if installed) | the package | robotic; drafts only |
| 4 | `none` | nothing | a **silent** draft, words timed by length; for layout checks |

Each fallback prints a loud warning and sets `voice.fallback: true` in `--json`. Always tell the
user when the delivered film used a fallback voice. When the chain ends at `none` (no key, no
local voice), the warning recommends the text mode, the finished voiceless option; offer it
rather than delivering a silent draft. The text mode is never reached by falling back: it
is only used when chosen. Force a path with `--voice-engine deepgram|say|none|text` (or
`TRAILER_VOICE_ENGINE`).

## Setting up Deepgram

1. The user creates an account at deepgram.com and an API key with the default (member) scope.
   New accounts come with free credit; a 60 s film costs a small fraction of it. Generated
   audio is subject to Deepgram's terms on the user's own account.
2. The key goes in **one** of these, which the engine reads in this order and stops at the
   first that has it:
   1. the shell environment: `export DEEPGRAM_API_KEY=...` in the user's shell profile;
   2. `<projectDir>/.trailer/.env` with the line `DEEPGRAM_API_KEY=...` (the
      `.trailer/.gitignore` that `init` writes already ignores it);
   3. `<projectDir>/.env` with the same line.
   Nothing else is read.
3. Before suggesting `<projectDir>/.env`, check that the project's `.gitignore` ignores `.env`.
   If it does not, tell the user to add it **before** writing the key, or use
   `.trailer/.env` instead.
4. Run `<engine> doctor <projectDir> --json`: `voice.key` is `present` or `absent` (never the
   value) and `voice.source` says which of the three places it came from.

Rules for you, the model: never ask for a key in plain chat text, never print or echo it, never
pass it on a command line, and never write it anywhere except as described next.

### A key pasted at intake

The intake picker (`intake.md`, call 2) lets the user paste the key into the AskUserQuestion
text box, after telling them it stays in the session transcript. When they do:

1. Check it looks like a key (one token, no spaces). If not, say so in one line without
   repeating what they typed, and fall back to no narration.
2. Hold it until step 1 of the preflight has run `init`, then check that
   `<projectDir>/.trailer/.gitignore` lists `.env` (add the line if it is missing).
3. Write `<projectDir>/.trailer/.env` with the Write tool (never a shell command), containing
   `DEEPGRAM_API_KEY=<key>` plus any lines already in that file. Never write it to
   `<projectDir>/.env`, the config, the brief or any other file.
4. Run `doctor <projectDir> --json` and confirm `voice.key: "present"` and
   `voice.source` points at `.trailer/.env`. Report only "key saved to .trailer/.env"; never
   quote the key or a prefix of it.

## Choosing a voice

`voice` is a model name or an object:

```json
"voice": "aura-2-hermes-en"
"voice": { "provider": "deepgram", "model": "aura-2-helena-en", "speed": 1.0 }
"voice": { "provider": "say", "sayVoice": "Samantha" }
```

Measured on one neutral test sentence (speech-to-text accuracy and natural pace), these read
explainer narration well:

| model | character | pace |
| --- | --- | --- |
| `aura-2-hermes-en` (default) | expressive, engaging, professional | about 2.5 words/s |
| `aura-2-helena-en` | warm, natural, friendly | about 2.6 words/s |
| `aura-2-odysseus-en` | calm, smooth, the clearest sentence pauses | about 2.5 words/s |
| `aura-2-minerva-en` | positive, friendly, natural | about 2.6 words/s |

Any model matching `aura-2-<name>-<lang>` is accepted; see Deepgram's own model list for the
current set. An unknown model returns an error from Deepgram and the run falls back to `say`
with a clear message. Use the default unless the user asks; never pick a voice per film just
for variety. The user can listen to a few and decide.

## Pace and the word budget (narration)

- `speed` defaults to **1.0**. Allowed 0.9 to 1.1; the lint warns above 1.05. Pitch is kept.
- A voice speaks about 2.5 words a second, but a **film** runs at about **1.9 words per second**
  once breaths, scene transitions, holds and the end card are counted. That is the budget
  (`craft.md`). Cuts, and any film of 30 s or less, are denser: 2.1.
- Too long? **Cut words.** Then lower `breath`/`hold`. Then set `fitSeconds`. Never raise speed
  to fit; the result sounds rushed and the captions flicker.

## Writing for the ear

- Short sentences, one idea each. Read it aloud; if you need a breath mid-sentence, split it.
- Numbers as digits in the script ("40"), so captions show digits. The voice reads them naturally.
- Spell tricky names the way they should sound only if the TTS gets them wrong; keep the
  on-screen spelling correct (put the phonetic version in `say`, the real one on screen).
- Avoid abbreviations the voice may spell out ("e.g.", "vs.", "w/"). Write "for example", "versus".
- A line-level `gap` adds a pause after a line: `{ "text": "...", "gap": 12 }` (frames).

## The `say` fallback

On macOS, `say` is always available and free, but it sounds robotic: for a film that will be
published without a key, recommend the text mode instead. Good English voices: `Samantha` (default),
`Alex`, `Daniel`, `Karen`, `Moira`. Set `sayVoice`. Higher-quality "Premium"/"Enhanced" voices
can be downloaded in System Settings > Accessibility > Spoken Content. A `say` draft is fine for
checking timing and layout; recommend Deepgram (or the user's own recording) for the final.

## Own recordings

To narrate with a real voice:

1. Render once (any engine) so `.trailer/voice/line-N.wav` exist with the right numbering
   (line N follows scene order, then line order inside each `say`).
2. The user records each line and saves it over `line-N.wav` (mono or stereo WAV, any rate).
3. Render with `--keep-voice`: the engine keeps the files, trims, normalizes and re-measures
   them, and (with a key) still aligns word timestamps; without a key, words are timed by length.

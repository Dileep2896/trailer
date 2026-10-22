# Voice: narrator, pace and fallbacks

Every film has **one narrator**. The engine synthesizes each `say` line, measures it, aligns
word timestamps for the cues and captions, loudness-matches it, and only re-voices lines whose
text changed.

## The chain

| order | engine | needs | quality |
| --- | --- | --- | --- |
| 1 | Deepgram Aura-2 (default `aura-2-hermes-en`) | `DEEPGRAM_API_KEY` | natural; word timestamps from speech-to-text |
| 2 | `say` (macOS) | nothing | robotic but clear; fine for drafts |
| 3 | `espeak-ng` (Linux, if installed) | the package | robotic; drafts only |
| 4 | `none` | nothing | a **silent** draft, words timed by length; for layout checks |

Each fallback prints a loud warning and sets `voice.fallback: true` in `--json`. Always tell the
user when the delivered film used a fallback voice. Force a path with
`--voice-engine deepgram|say|none` (or `TRAILER_VOICE_ENGINE`).

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

Rules for you, the model: never ask the user to paste a key into the chat, never write a key
into any file yourself, never print or echo it, never pass it on a command line.

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

## Pace and the word budget

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

On macOS, `say` is always available and free. Good English voices: `Samantha` (default),
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

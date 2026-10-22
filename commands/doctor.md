---
description: Check that trailer can render here (Node, ffmpeg, browser, install, voice key or no-voice mode)
argument-hint: "[project-dir]"
allowed-tools:
  - Bash(TRAILER_HOME="${CLAUDE_PLUGIN_DATA}" node "${CLAUDE_PLUGIN_ROOT}/engine/trailer.mjs" *)
---

Check the trailer environment. Run this exact command:

`TRAILER_HOME="${CLAUDE_PLUGIN_DATA}" node "${CLAUDE_PLUGIN_ROOT}/engine/trailer.mjs" doctor <dir> --json`

where `<dir>` is the project directory from `$ARGUMENTS` (default `.`). The key lookup is the
same one a render uses: the environment, then `<dir>/.trailer/.env`, then `<dir>/.env`.

Then report, in a short table: Node version, ffmpeg (and any missing filter), the headless
browser, whether dependencies are installed in the trailer home, and the voice: `voice.key`
(`present` or `absent`), `voice.source` (`environment`, `.trailer/.env` or `.env`),
`voice.provider` (the project's `voice.provider`, when it has a config), `voice.mode`
(`narration`, `text`, `draft` with the system voice, or `silent-draft`), `voice.fallback`
(`say`, `espeak-ng` or `none`, a silent draft, for when there is no key; `null` in the text
mode, which has nothing to fall back from) and `voice.recommended` (`deepgram` with a key,
else `text`).
An `engine` failure before the first render only means the dependencies are not installed
yet: the first render installs them, or run the `install` command it names.

- For each failing item, give the one install command from the output.
- If `voice.mode` is `text`, say the project uses the no-voice mode by choice (music, sound
  effects and on-screen text): no key is needed and nothing is missing.
- Otherwise, if the key is absent, explain the two free options: **no narration** (set
  `"voice": { "provider": "text" }`: a finished film with music, sound effects and on-screen
  text, no API key), recommended for anything that will be published, and the system voice,
  which works for drafts but sounds robotic. A natural voice needs `DEEPGRAM_API_KEY` in the
  environment, in `<dir>/.trailer/.env` or in `<dir>/.env` (after checking that file is
  gitignored). Never ask the user to paste a key into the chat.
- If `node` itself is missing or older than 20, say to install Node 20 or newer first.

Remotion, which renders the films, has its own license: free for individuals and companies
of up to 3 people; larger companies need a Remotion company license.

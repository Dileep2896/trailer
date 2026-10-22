---
description: Check that trailer can render here (Node, ffmpeg, browser, install, voice key)
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
(`present` or `absent`), `voice.source` (`environment`, `.trailer/.env` or `.env`) and
`voice.fallback` (`say`, `espeak-ng` or `none`, a silent draft) for when there is no key.
An `engine` failure before the first render only means the dependencies are not installed
yet: the first render installs them, or run the `install` command it names.

- For each failing item, give the one install command from the output.
- If the key is absent, explain that drafts still work with the system voice, and that a
  natural voice needs `DEEPGRAM_API_KEY` in the environment, in `<dir>/.trailer/.env` or in
  `<dir>/.env` (after checking that file is gitignored). Never ask the user to paste a key into the chat.
- If `node` itself is missing or older than 20, say to install Node 20 or newer first.

Remotion, which renders the films, has its own license: free for individuals and companies
of up to 3 people; larger companies need a Remotion company license.

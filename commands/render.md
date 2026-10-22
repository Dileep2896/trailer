---
description: Re-render an existing trailer config (main film, one cut, or everything)
argument-hint: "[--aspect 16:9|9:16|1:1] [--cut <name>] [--all] [project-dir]"
allowed-tools:
  - Read
  - Bash(TRAILER_HOME="${CLAUDE_PLUGIN_DATA}" node "${CLAUDE_PLUGIN_ROOT}/engine/trailer.mjs" *)
---

Re-render the film in `.trailer/trailer.config.json` without rewriting the script.
Arguments: `$ARGUMENTS` (flags pass through; a bare path is the project directory, default
the current working directory).

1. If `<dir>/.trailer/trailer.config.json` is missing, say so and suggest `/trailer:new`. Stop.
2. Lint first, typing the command exactly like this:
   `TRAILER_HOME="${CLAUDE_PLUGIN_DATA}" node "${CLAUDE_PLUGIN_ROOT}/engine/trailer.mjs" <dir> --lint --json`
   On exit 2, list the errors and stop; do not edit the config unless the user asks.
3. Render with the same prefix: `<dir> <flags> --json` (add `--skip-capture` if
   `.trailer/.stage/shots.json` exists and the user did not mention new screenshots).
4. On exit 3, run `doctor --json` with the same prefix and show the one install command.
   On exit 1, show the last lines of the error and point to the troubleshooting reference
   at `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/troubleshooting.md`.
5. Report from the `--json` summary: output paths (relative), `seconds` against
   `targetSeconds`, `words` against `wordBudget`, the voice engine (flag `voice.fallback`),
   and every warning.

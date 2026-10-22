---
description: Review an existing trailer render frame by frame and fix what the checklist finds
argument-hint: "[--aspect 16:9|9:16|1:1] [--cut <name>] [project-dir]"
allowed-tools:
  - Read
  - Bash(TRAILER_HOME="${CLAUDE_PLUGIN_DATA}" node "${CLAUDE_PLUGIN_ROOT}/engine/trailer.mjs" *)
---

Run the frame-review loop on the film in `.trailer/`. Arguments: `$ARGUMENTS`.

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/review.md` and follow it.
2. Render review frames, typing the command exactly like this:
   `TRAILER_HOME="${CLAUDE_PLUGIN_DATA}" node "${CLAUDE_PLUGIN_ROOT}/engine/trailer.mjs" <dir> --review --skip-capture --json`
   (pass through `--aspect` or `--cut` if given).
3. Read `outputs.sheet` (`sheet.jpg`, the contact sheet), then the full-size stills in
   `outputs.review` of every scene that looks wrong. Check each against the review checklist.
4. List the findings as `scene id: problem -> proposed fix`. Apply the fixes to
   `.trailer/trailer.config.json` and re-render with the same command, at most 3 rounds.
   If the user only asked for a report, stop after the list.
5. Report what was fixed, what is left (with frame paths), the final duration and the voice
   engine. Never upload, post or send anything.

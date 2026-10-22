---
description: Cut a vertical 9:16 short and a 1:1 square from an existing trailer
argument-hint: "[project-dir] [--seconds 15-30]"
---

Make social cuts of this project's film. Arguments: `$ARGUMENTS`.

1. If `<dir>/.trailer/trailer.config.json` exists, the shorts are derived from it (preferred:
   the voice of unchanged lines is reused). If it does not, say that a short can be made from
   scratch and continue anyway.
2. Invoke the `trailer-shorts` skill with the Skill tool (`trailer:trailer-shorts`), passing
   the project directory and any length the user asked for, and follow it end to end. With a
   film config it adds `cuts.short` (9:16) and `cuts.square` (1:1); from scratch it starts a
   9:16 config (the short is the film itself, `trailer-9x16.mp4`) plus `cuts.square`. Either
   way it writes portrait `variants`, renders, reviews the frames in the 9:16 safe zones and
   writes the platform captions.
3. Never upload, post or send anything.

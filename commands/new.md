---
description: Make a new trailer for this project (explainer, launch, job hunt, hackathon or shorts)
argument-hint: "[explainer|launch|jobhunt|hackathon|shorts] [project-dir]"
---

Start a new trailer. Arguments: `$ARGUMENTS`

1. Work out the use case from the first argument, else from what the user said in this
   conversation:
   - `explainer` (or nothing clearer): the `trailer` skill (`/trailer:trailer`)
   - `launch`, `release`, `changelog`, `announce`: the `trailer-launch` skill
   - `jobhunt`, `job`, `portfolio`, `outreach`: the `trailer-jobhunt` skill
   - `hackathon`, `demo-day`, `devpost`: the `trailer-hackathon` skill
   - `shorts`, `short`, `reel`, `vertical`, `9:16`: the `trailer-shorts` skill
2. If it is still unclear, ask exactly one question: "Is this for a general explainer, a
   launch, a job application, a hackathon, or a vertical short?" Ask nothing else.
3. The project directory is the second argument if given, else the current working directory.
4. Invoke the chosen skill with the Skill tool (plugin skills are namespaced, for example
   `trailer:trailer-launch`), passing the project directory, and follow it end to end.

Never upload, post or send the result.

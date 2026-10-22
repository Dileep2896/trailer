---
name: trailer-jobhunt
description: Job-hunt portfolio film plus outreach drafts. Use it when someone has built a project aimed at one company's problem ("I built X for your problem") and wants a voiced 60-second film of it and private cold outreach. It writes a cold email (100 to 140 words, with hyperlinks), a job-board message (120 to 170 words, e.g. for YC Work at a Startup, Wellfound or LinkedIn Jobs) and a LinkedIn post with 3 hook options. Every fact about the user comes from their own profile file, and nothing is ever sent or posted. Triggers include "job hunt video", "portfolio film", "I built this for <company>", "make a video for my application", "pitch my build to the founders", "cold email with a demo", "job-board message", "Work at a Startup message", "outreach for this project", "apply with a demo video" and "/trailer:new jobhunt". An optional independence mode keeps the target company's name out of the film, the repo and the commits.
when_to_use: Use this skill when the film goes to a hiring team or founders and the user wants outreach copy with it. For a product launch use trailer-launch, for a hackathon demo use trailer-hackathon, for vertical cuts only use trailer-shorts, and for a general explainer use trailer.
argument-hint: "[project-dir] [--target <company>] [--independent] [--first-person]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - Bash(TRAILER_HOME="${CLAUDE_PLUGIN_DATA}" node "${CLAUDE_PLUGIN_ROOT}/engine/trailer.mjs" *)
  - Bash(git log *)
  - Bash(git tag *)
  - Bash(git describe *)
  - Bash(git rev-parse *)
  - Bash(git shortlog *)
  - Bash(git diff *)
  - Bash(git remote -v)
  - Bash(wc *)
---

# trailer-jobhunt: "I built this for your problem"

This skill makes a 60-second film of a project the user built for one target company's
problem, and three private outreach drafts that link to it. The film carries the proof.
The drafts are short and specific, and every fact about the user is one they wrote down
themselves.

It runs the core trailer flow with jobhunt parameters. Read the shared references when a
step points to them, and don't restate them:

| shared reference | read it for |
| --- | --- |
| `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/intake.md` | the token note, the Quick / Standard / Studio tiers and the core pre-questions |
| `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/flow.md` | the full "seeing the project" flow and the brief template |
| `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/formats.md` | F01 to F20, with arcs and scene recipes |
| `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/craft.md` | pacing, captions, recreated UI, type, characters, sound |
| `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/scenes.md` | every scene type, its fields and the cue grammar |
| `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/config.md` | config keys, including `credit`, `narration`, `cuts` and `meta` |
| `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/tokens.md` | mapping the app's design tokens to `config.app` |
| `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/voice.md` | Deepgram setup, the fallbacks and recording your own voice |
| `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/review.md` | the frame-review loop and its checklist |
| `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/troubleshooting.md` | engine errors and exit codes |

These references are specific to jobhunt:

| file | what is in it |
| --- | --- |
| [references/outreach.md](references/outreach.md) | the three drafts: shapes, word limits, templates, good and bad lines, humanizer rules |
| [references/profile-template.md](references/profile-template.md) | how the profile works, choosing the "about me" facts, `[FILL: ...]` handling |
| [references/independence.md](references/independence.md) | independence mode end to end: banned terms, neutral text, generic evidence, verification |
| [references/target-research.md](references/target-research.md) | researching the target from public sources, `private/target.json`, the fit statement |
| [references/checklist.md](references/checklist.md) | the full pre-delivery checklist |

## Ground rules (never broken)

1. **Facts about the user come only from `.trailer/private/profile.md`.** Never take them
   from memory, git authorship, a LinkedIn page or a guess. A missing fact becomes
   `[FILL: what is needed]` in the draft. Lines under "Never claim" are hard limits.
2. **Every number has a source.** Product numbers come from tests, benchmarks or seed data
   (`file:line`). Target numbers come from public pages (URL plus date). Numbers about the user
   come from the profile. No source means no number. Use qualitative proof instead, or ask
   one question.
3. **Never send anything.** Don't email, post, upload, submit forms or message anyone, and
   don't create drafts in any mail or social tool, even when a connector is available. The
   drafts are Markdown files the user copies. If the user asks you to send, say where the
   files are and that sending is theirs to do.
4. **Private stays private.** The profile, the target research, the outreach drafts and the
   banned terms live in `.trailer/private/`, which is gitignored. Check that before you write.
5. **Honest framing.** Call it what it is: a standalone demo on seed data, not a product the
   target uses. Never imply an affiliation, an endorsement or access to the target's
   internals. Never use their logo, screenshots of their product or their brand colours as
   branding.
6. **The film is third person about the project.** `narration.person` stays `"third"` and the
   person appears only in the `credit` line ("Built by Jane Doe"). Use `"first"` only when the
   user asks for it.

## Inputs

| input | where it comes from | if it is missing |
| --- | --- | --- |
| project dir | the argument, else the current directory | ask once |
| target company | `--target`, the conversation, or the repo's README | ask once. With no target, make the film and domain-level outreach (independence mode) |
| profile | `.trailer/private/profile.md` | copy `assets/profile.template.md` there, ask the user to fill it in, and carry on with the film |
| mode | `--independent`, or asked for | use the decision table below |
| narration person | `--first-person`, or asked for | third person |
| public evidence | target research (step 2) | qualitative pain, no numbers |

Ask everything you need in **one message**, and only for what you can't infer. That message
opens with the token note and the tier choice from `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/intake.md` (default **Studio** here,
because a founder decides on this film; offer Standard or Quick as cheaper options and say
what they give up), then the core pre-questions, then at most three of the questions above.
Don't block the film on the profile. The film never needs it.

### Named mode or independence mode

| situation | mode |
| --- | --- |
| one company, a private link, the user is happy to name them | **named**: the target may appear in the outreach and once, as text, in the film's outro ("An independent demo for teams like <Target>"), never as a logo |
| the repo or video will be public (YouTube, LinkedIn, a pinned repo) | **independent** |
| the same build will be pitched to several companies | **independent** |
| the user is unsure, or the target's brand rules are unknown | **independent** (the safer default) |
| the user says "independent", "neutral", "don't name them" or passes `--independent` | **independent** |

In independence mode the target is named **only** in `private/outreach/email.md`,
`private/outreach/job-board-message.md` and `private/target.json`. The LinkedIn post is public, so it
never names the target in either mode unless the user asks for that explicitly. The full
procedure is in [references/independence.md](references/independence.md).

## Workflow

Write every engine call in this exact form, because the plugin variables are substituted in
this file but are not in the shell:

```bash
TRAILER_HOME="${CLAUDE_PLUGIN_DATA}" node "${CLAUDE_PLUGIN_ROOT}/engine/trailer.mjs" <projectDir> <flags>
```

Below, `ENGINE` stands for that prefix.

1. **Preflight.** Run `ENGINE doctor <projectDir> --json`. If `.trailer/` is missing, run
   `ENGINE init <projectDir> --use-case jobhunt`. It writes the jobhunt starter config
   (`assets/jobhunt.config.json` is the same file, kept here for reference); treat every line
   of it as placeholder. Confirm that `.trailer/.gitignore` lists `private/`. Create
   `.trailer/private/outreach/`. If the user chose no narration at intake, set
   `"voice": { "provider": "text" }` and skip the key. Otherwise, if `doctor` reports
   `voice.key: "absent"`, say once how to add a key (see voice.md) and that without one the
   free choices are no narration (a finished film: music, sound effects and on-screen text;
   the better pick for a film a founder will watch) or the robotic system voice (drafts), then
   carry on.
2. **Target research** ([references/target-research.md](references/target-research.md)).
   Gather from public sources only: what the target makes, for whom, the specific problem the
   build addresses, 1 to 3 pieces of evidence (URL, date, exact wording), their stack, and the
   first names of the founders or hiring team for the greeting (public team page only, never a
   guessed email address). Write `private/target.json`. Write a one-sentence **fit statement**:
   "<Target>'s users hit <problem>; <project> shows <mechanism>, measured as <before → after>."
3. **Independence setup** (independent mode only). Write `private/banned-terms.txt` with the
   company, product, feature and founder names, the domains and the handles, plus their case
   and spacing variants. Pick a neutral project name if the repo name echoes the target.
   The steps after this one assume these terms are banned everywhere outside `private/`.
4. **Inventory** (flow.md, step 1). Read the repo, not the running app, and write
   `.trailer/brief.md` from the core brief template. Jobhunt additions:
   - **who hurts** is the target's user, described at the domain level ("payables teams").
   - **proof numbers** come from the user's own tests or seed data, each with `file:line`.
   - **evidence** links point to `private/target.json#evidence-N`, never to a raw URL, so the
     committed brief stays neutral in both modes.
5. **Tokens and components** (flow.md, step 2, and tokens.md). Use the user's app tokens.
   If the app copies the target's palette, shift `app.accent` so the film doesn't borrow
   their brand. Choose 2 or 3 moments to rebuild as `ui` scenes, using real seed rows.
6. **Format.** Choose from the table below, check `out/history.jsonl`, and write
   "Why this fit" in `script.md` and `meta.formatWhy`.
7. **Script.** Use the jobhunt act timing and word budget below. Write the scene table, the
   full narration and the sources table in `script.md`, with a source for every number.
8. **Config.** Write the scenes from the script, with every `at` cued to a spoken word. Set
   `meta.useCase: "jobhunt"`, `credit.text` from the profile name (or `[FILL: name]` when it
   is missing, which the review step catches), and `link` or `repoUrl`. Also set
   `targetSeconds`, `narration` and `forbiddenTerms` (the target's competitors, which only
   produce warnings).
9. **Lint.** Run `ENGINE <dir> --lint --json`. Exit 2 means errors: fix every one. A
   banned-term hit means you rewrite the copy neutrally; never delete the term from the
   file. Read each warning, then fix it or justify it in `script.md`.
10. **Layout pass.** Run
    `ENGINE <dir> --stills scenes --voice-engine none --safe-overlay --json`. Read the stills
    and fix the layout before you spend any TTS.
11. **Render with review frames.** Run `ENGINE <dir> --review --json` once: it renders the
    film, then writes the per-scene stills and `sheet.jpg`, so there is no separate render
    pass. Read `seconds`, `words`, `voice.fallback` and `warnings` from the summary.
12. **Frame-review loop.** Using the frames from step 11, follow review.md and the jobhunt
    checks below. Fix the problems and re-render with `ENGINE <dir> --review --skip-capture
    --json` (only changed lines are re-voiced).
    **Stop after 3 loops** and report whatever is left.
13. **Outreach drafts** ([references/outreach.md](references/outreach.md)). Write
    `private/outreach/email.md`, `private/outreach/job-board-message.md` and
    `private/outreach/linkedin-post.md`. Count the words with the command in outreach.md. Use
    `[VIDEO LINK]` until the user uploads the film themselves.
14. **Final checks.** Work through [references/checklist.md](references/checklist.md). In
    independence mode, also run the scans in independence.md.
15. **Deliver.** List the output paths (relative), the duration, the word count, the voice
    engine (and any fallback), the poster and captions, the three drafts with their word
    counts, every `[FILL: ...]` still open, and the `[VIDEO LINK]` to replace. Close with:
    "Nothing was sent or posted."

## Choosing a format

Match the **shape of the target's problem** to the metaphor. Each recipe is in formats.md.

| the problem looks like... | format | why it works for a hiring team |
| --- | --- | --- |
| two records or sources disagree, and the system trusts the wrong one | **F01 Courtroom** | the contradiction plays as testimony, and the build is the clerk who reads the whole record |
| risky actions need a gate: approvals, permissions, review queues | **F06 Checkpoint** | each request is a bag through a scanner, and the build is the scanner |
| two parties see different things: user and agent, buyer and seller | **F09 POV Switch** | the blindness is felt from both sides, and the build is the mirror |
| the same input leads to different outcomes depending on handling | **F10 Two Lanes, One Input** | a mirrored split proves the point before any UI appears |
| errors hide in plain sight in output that looks finished | **F11 Spot the Fake** | the viewer misses the error first, then watches the build catch it |
| something silently vanishes or breaks, and the cause takes digging | **F15 Case File** | clues lead to a cause and the cause leads to a fix, which is how engineers think |

If two fit, pick the one whose **opening shot** shows the target's pain fastest. If none
fits, use any F01 to F20 format and say why in `script.md`. When one user makes films for
several targets, give each film a different format, which also keeps the reused films from
looking alike.

## Act timing (60 s)

| t (s) | act | jobhunt rule |
| --- | --- | --- |
| 0 to 6 | hook | one concrete moment of the target's user's pain: a person, a time, an object. No product, no target name |
| 6 to 22 | pain and evidence | at least 14 s. Show why today's fix fails, with one evidence beat attributed generically |
| 22 to 27 | turn | the project is named (`turn: true`) and the drums enter |
| 27 to 48 | how it works | 2 or 3 moves in recreated UI with seed data, each move cued to its verb |
| 48 to 55 | proof | one measured before → after, scoped honestly ("on the demo data") |
| 55 to 60 | end | name, tagline, repo pill and the `credit` line. "A standalone demo" is said or shown once |

## Word budgets

Spoken words = **1.9 × targetSeconds, ± 8%** for 16:9. Cuts, and any film of 30 s or less, are denser at 2.1 ×. The engine
lints against `targetSeconds`. Never raise `voice.speed` to fit; cut words instead.

| film | target | spoken words | numbers spoken (max) |
| --- | --- | --- | --- |
| standard jobhunt film (16:9) | 60 s | 105 to 123 | 3 |
| short teaser (16:9) | 45 s | 79 to 92 | 2 |
| long walkthrough (only if asked) | 90 s | 157 to 185 | 3 |
| 9:16 cut for LinkedIn (via trailer-shorts) | 30 s | 58 to 68 | 1 |
| 9:16 cut, hook only | 15 s | 29 to 34 | 1 |

| outreach draft | limit (body only) |
| --- | --- |
| cold email | 100 to 140 words, subject at most 8 words |
| job-board message (e.g. YC Work at a Startup, Wellfound or LinkedIn Jobs) | 120 to 170 words, plain text |
| LinkedIn post | 3 hooks of at most 12 words each, a body of 120 to 220 words, at most 3 hashtags |

## Script lines: good and bad

The examples use a fictional build (Ledger Twins, a duplicate-invoice catcher). Use them
for the shape of a line, not the words.

| bad | why | good |
| --- | --- | --- |
| "I built an AI tool to help finance teams." | first person, vague, says nothing | "Thursday, the same bill arrives again, with a new invoice number." |
| "Duplicate payments cost businesses billions every year." | an unsourced number | "Most checks only match the exact number. Add a suffix, and no alert fires." |
| "Leveraging cutting-edge AI, it seamlessly detects anomalies." | slop words, no mechanism | "It compares each new invoice by vendor, amount and line items, not just the number." |
| "<Target>'s customers lose money every month." | a claim about their customers with no evidence, and it names them in a public film | "Someone spots it at the month-end close." |
| "It's ten times faster and 99% accurate." | invented numbers, spelled out | "On the demo ledger, it catches all 6 planted duplicates, with zero false holds." |
| "Hire me, I'd love to bring this to your team!" | the ask belongs in the email, not the film | "Ledger Twins. Pay every bill once. A standalone demo, open source on GitHub." |
| "Welcome to this video about Ledger Twins." | a dead first beat | "Monday, a vendor sends a bill." |

Every line of narration should pass three tests. A stranger could picture it, someone on the
target's team would nod at it, and its claim traces to the sources table.

## Frame-review loop: jobhunt checks

Run the review.md checklist first, then check these on the contact sheet and on any frame
that looks wrong:

- The credit line ("Built by ...") is legible: at least 28 px at 1080p and at least 4.5:1
  contrast. No `[FILL` text appears anywhere on screen or in the captions.
- **No target logo, product screenshot or brand palette** appears. In independence mode,
  read every visible word, the `.srt` file and the poster for banned terms.
- Seed data shows fictional names only. It never shows the target's real customers or staff.
- The proof scene states its scope ("on the demo data"), and its numbers match `script.md`.
- The first 6 s show the user's pain, not the product.
- The outro holds long enough to read the repo pill (at least 2 s of stillness).

Fix the config, then re-render. After 3 loops, stop and report what is still open.

## Failure handling

| what happens | what to do |
| --- | --- |
| no profile | copy the template to `private/profile.md`, ask the user to fill it in, finish the film, and write drafts with `[FILL: ...]` placeholders |
| the profile lacks a fact a draft needs | write `[FILL: <fact>]`, list it at delivery, and never guess |
| no proof numbers in the repo | use qualitative proof ("held before payment, with the matching lines shown"), or ask one question about the test or seed result |
| target evidence can't be verified (page gone, paywalled) | drop it from the film. In the drafts, keep only what you have read yourself |
| lint exit 2: banned term | rewrite the line at the domain level and lint again. Never weaken `banned-terms.txt` |
| lint exit 2: first person while `person` is `third` | rewrite in third person with the project name. Don't switch `person` to silence it |
| exit 3: missing dependency | run `ENGINE doctor`, then report its exact fix command. Don't install system packages yourself |
| `voice.fallback: true` | finish the render, warn at delivery, and offer to re-render once a key is set, or in the no-voice text mode (`"voice": { "provider": "text" }`) |
| duration more than 5 s off target | cut or add words to match the budget, and adjust `fitSeconds`. Never change the speed |
| the user asks you to send, post or schedule | decline. Point to the draft files and say that sending is up to them |
| the user wants a first-person film | set `narration.person: "first"`. Suggest recording the lines themselves (voice.md, `--keep-voice`), because a personal film sounds best in their own voice |

## Finish line

Before delivering, go through [references/checklist.md](references/checklist.md) in full.
Its short form:

- [ ] The film is 55 to 65 s, has 105 to 123 words, and the lint is clean (each warning is fixed or justified).
- [ ] Pain comes before any product UI. One format with a real metaphor. Recreated UI uses seed data.
- [ ] Every number appears in the `script.md` sources table. No more than 3 numbers are spoken.
- [ ] No logo, screenshot or brand colours of the target. In independence mode, the scans come up empty.
- [ ] Three drafts are inside their word limits, with links as hyperlinks and `[VIDEO LINK]` present.
- [ ] Every fact about the user traces to the profile. Every open `[FILL: ...]` is listed.
- [ ] `private/` is gitignored, and nothing was sent, posted, uploaded or drafted in a mail tool.

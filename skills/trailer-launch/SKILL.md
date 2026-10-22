---
name: trailer-launch
description: Make a voiced, captioned launch film from a software project. It covers three kinds of film. A product launch runs 45 to 60 s. A single-feature announcement runs 30 to 45 s. A release recap runs 45 to 60 s and is mined from git tags, merged PRs and the CHANGELOG. Each film comes with a launch copy pack (X/Bluesky post, LinkedIn post, Product Hunt tagline and first comment, release-notes intro, video description with chapters). Use it when the user wants to announce, launch or recap something they shipped.
when_to_use: Trigger phrases include "launch video", "launch film", "announcement video", "announce this feature", "feature video", "what's new video", "release video", "release recap", "changelog video", "video for v2", "recap v1.4 to v1.5", "ship week", "launch week", "Product Hunt video" and "demo for the launch post". It also triggers when the user names a tag range or a version for a video. Do not use it for portfolio or job outreach films (trailer-jobhunt), hackathon demos (trailer-hackathon) or vertical-only shorts (trailer-shorts). Use the core trailer skill for general explainers.
argument-hint: "[launch | feature <name> | recap <from>..<to>] [project dir]"
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
  - Bash(gh release view *)
  - Bash(gh release list *)
  - Bash(gh pr list *)
  - Bash(gh issue view *)
  - Bash(gh auth status)
---

# Trailer: launch, feature and release films

This skill reads a project and makes one film that announces what shipped, together with
the copy that goes with it. It follows the shared trailer spine: inventory, format, script,
config, lint, stills, render, review and deliver. This file adds what is specific to
launches. The spine, the craft rules and the scene reference live in the core skill and are
not repeated here:

| need | shared reference |
| --- | --- |
| the token note, the Quick / Standard / Studio tiers, the core pre-questions | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/intake.md` |
| the full "seeing the project" flow, brief template | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/flow.md` |
| format library F01 to F20 with scene recipes | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/formats.md` |
| pacing, recreated UI, type, characters, sound | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/craft.md` |
| every scene type, its fields and cue grammar | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/scenes.md` |
| config keys, theme, app tokens, captions, cuts | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/config.md` |
| mapping the app's design tokens | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/tokens.md` |
| characters, moods, emoji names | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/characters.md` |
| voice, Deepgram key, fallbacks | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/voice.md` |
| frame-review loop and checklist | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/review.md` |
| errors and fixes | `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/troubleshooting.md` |

Launch-specific detail lives in this skill's own references:

- `${CLAUDE_PLUGIN_ROOT}/skills/trailer-launch/references/launch-formats.md` covers the format decision table, launch arcs with timings, and scene recipes.
- `${CLAUDE_PLUGIN_ROOT}/skills/trailer-launch/references/release-recap.md` has the exact git and gh commands, plus how changes are grouped into 3 to 5 beats.
- `${CLAUDE_PLUGIN_ROOT}/skills/trailer-launch/references/launch-copy.md` covers the copy pack templates, limits and good and bad lines.
- `${CLAUDE_PLUGIN_ROOT}/skills/trailer-launch/references/checklist.md` is the final checklist.
- The starter configs are `${CLAUDE_PLUGIN_ROOT}/skills/trailer-launch/assets/launch.config.json` (product launch, F16 Unboxing) and `.../assets/release-recap.config.json` (release recap, F17 Countdown Changelog). `init --use-case launch` writes the launch starter; `assets/launch.config.json` is the same file, kept here for reference. The release-recap starter has no `init` template, so a recap is written from `assets/release-recap.config.json` in step 6.

## The engine call

Every engine call uses this exact prefix (written `$SR` below; always type it out in full):

```sh
TRAILER_HOME="${CLAUDE_PLUGIN_DATA}" node "${CLAUDE_PLUGIN_ROOT}/engine/trailer.mjs"
```

Pass `--json` whenever you need to read the result. The summary is one JSON object on stdout,
and the logs go to stderr. Exit codes: `0` ok, `1` runtime failure, `2` lint errors, `3`
missing dependency (run `doctor`). All paths in the output are relative to the project dir.

## Intake first

Before reading the repo, send the single intake message from `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/intake.md`: the token note,
the tier choice (default **Standard**; Studio for a flagship launch, Quick for a feature
teaser) and the core pre-questions. If the kind below is ambiguous, its one question goes in
the same message. The workflow follows the chosen tier's column in `intake.md`.

## Pick the kind first

Infer the kind from the request and the repo. Ask **one** question only if the request is
truly ambiguous ("a launch film for the whole product, or an announcement for one feature?").

| the user has... | kind | target | starter |
| --- | --- | --- | --- |
| a new product or a v1.0, with no earlier film | **product launch** | 55 s (45 to 60) | `launch.config.json` |
| one new capability inside a product people already use | **feature announcement** | 40 s (30 to 45) | `launch.config.json`, cut to 6 or 7 scenes |
| a version or tag range with several changes ("what's new in 2.0") | **release recap** | 45 to 60 s | `release-recap.config.json` |
| a range where one change dwarfs the rest | **feature announcement** about that change, plus "and N more" in the release notes | 40 s | `launch.config.json` |
| a launch week (one drop a day) | one feature film a day, then a recap on the last day | 40 s each, recap 50 s | both |
| a vertical teaser on top of any of these | make the 16:9 film first, then hand off to `trailer-shorts` | 15 to 30 s | |

Before you write anything, settle these **launch facts** and record each one in `brief.md`
with its source. Never guess any of them:

1. **What shipped**, in one sentence, with the version or tag.
2. **The availability claim**: "live today", "in beta", "waitlist", "in v2.0", "self-host
   only". Use only what the repo (a tag, release, README or pricing page) or the user says. A
   film that says "available now" for something unreleased is worse than no film.
3. **The CTA link**: the product URL, docs or changelog page. It goes in `link` (shown on the
   outro pill). Use `repoUrl` only when the repo itself is the product.
4. **Price or plan words**, but only if they appear in the repo or come from the user.
   Otherwise leave them out.
5. **Embargo**: if the launch is not public yet and the repo is public, warn the user that
   `.trailer/brief.md`, `script.md` and the config are normally committed, and suggest
   holding them back until launch day.

## Word budgets by duration

Measured pace: **1.9 spoken words per second of film**, breaths included, ±8%. A film of
30 s or less is budgeted like a cut, at **2.1 words per second**. Never speed the
voice up to fit (`voice.speed` stays at 1.0, and above 1.05 the engine warns). Cut words
instead. The engine's `--json` `wordBudget` is authoritative when it differs.

| film length | words | scenes (about) | typical use |
| --- | --- | --- | --- |
| 30 s (2.1 per second) | 58 to 68 | 5 | short feature announcement |
| 35 s | 61 to 72 | 5 to 6 | feature announcement |
| 40 s | 70 to 82 | 6 to 7 | feature announcement (default) |
| 45 s | 79 to 92 | 6 to 8 | short launch, 3-beat recap |
| 50 s | 87 to 103 | 7 to 9 | 4-beat recap |
| 55 s | 96 to 113 | 8 to 10 | product launch (default) |
| 60 s | 105 to 123 | 9 to 11 | full launch, 5-beat recap |

Each scene gets one or two sentences of 6 to 16 words. Use at most **3 data numbers per film**,
written as digits, and each one needs a source row in `script.md`. Version numbers and rank
labels ("Number 2") do not count.

## Workflow

Follow these steps in order. Do not skip the stills pass or the review loop.

0. **Preflight.** Run `$SR doctor <dir> --json`. If `.trailer/` is missing, run
   `$SR init <dir> --use-case launch`. It writes the launch starter (the same file as
   `assets/launch.config.json`); the steps refer to the starter's scenes. For a release recap,
   step 6 rewrites that config from `assets/release-recap.config.json`. If `doctor` reports `voice.key: "absent"`, say once
   that the draft will use the free `say` voice, and that `DEEPGRAM_API_KEY` in the
   environment or in `<dir>/.env` gives the real narrator. Do not block on it. If
   `.trailer/trailer.config.json` already holds a film, do not overwrite it. Ask whether to
   replace it or to add a cut.

1. **Inventory.** Follow `flow.md` step 1 (read, don't run). Write `.trailer/brief.md` from the
   core brief template, then add a **Launch facts** section (the five facts above). For a
   product launch or feature announcement, the brief still needs **who hurts, what breaks
   (one concrete moment from the seed data) and why today's fix fails**. A launch film that
   opens on the logo has already lost its viewer.

2. **Release mining (recap, and features that are tied to a version).** Follow
   `references/release-recap.md` exactly. Find the range, list the changes, drop the noise,
   cluster and score, then pick 3 to 5 beats. Write the beat table and every count's source
   command into `brief.md`. Turn commit language into user language. Never put a commit
   subject on screen verbatim.

3. **Tokens and components.** Map the app's tokens into `config.app` (`tokens.md`). Choose
   the 2 to 4 moments to rebuild as `ui` scenes with real seed rows. In a recap, the No. 1
   beat always gets recreated UI. Use screenshots only for establishing shots of 4 s or less,
   and always framed.

4. **Format.** Use the decision table in `references/launch-formats.md` to shortlist 3
   formats by how well the change's shape fits the metaphor. Read `.trailer/out/history.jsonl`
   and drop any format this repo has already used. Pick one and write "Why this fit" in
   `script.md` and in `meta.formatWhy`. Make the theme differ from the starter in its accent,
   its fonts, and at least two of background, chrome, transition, type and motif.

5. **Script.** Write `.trailer/script.md` with the scene table (scene, on screen, narration),
   the full narration, the sources table and the format rationale. Use the act timings for
   the kind from `launch-formats.md`. Check the word count against the budget table above.
   Then check every line against the good and bad examples below.

6. **Config.** Read the starter for the kind and write `.trailer/trailer.config.json` from
   it. Then replace **everything** in it: names, tokens, theme, seed rows, numbers, sources and
   lines. Cue every `at` to a spoken word. Set `meta` (`useCase: "launch"`, `launchKind`,
   `format`, `formatWhy`, `tone`, `sources`; for a recap also `range`), set `targetSeconds`
   and `link`, and set `poster: true` on the hero UI scene. Delete `meta.notes`. Finally run
   `grep -n "\[FILL" .trailer/trailer.config.json`, which must print nothing.

7. **Lint.** Run `$SR <dir> --lint --json`. Fix every error. Read each warning and either fix
   it or justify it in `script.md`. Lint traps that are common in launch films:
   - `npm i` reads as a first-person "i". Write `npm install`.
   - "we" or "our" in the narration is an error. Write "Tinlark ships today", not "We're
     shipping".
   - In-world chat with "we" raises a warning. Rephrase it ("Can someone restore...").

8. **Layout pass before TTS.** Run `$SR <dir> --stills scenes --voice-engine none --safe-overlay --json`.
   Read every still in `.trailer/review/16x9/`. Fix clipping, overflow, captions covering a
   focus target, and unreadable text, and repeat until it is clean. This pass is cheap.

9. **Render with review frames.** Run `$SR <dir> --review --json` once: it renders the film
   and then writes the per-scene stills and the contact sheet, so there is no separate
   render pass. Read `seconds`, `words`, `wordBudget`, `voice` and `warnings`. If
   `voice.fallback` is true, say so plainly in the final report. If `seconds` is outside the
   window the engine warns about (±5 s of `targetSeconds`, ±3 s at 30 s or less), cut words
   (never speed up the voice), or set `fitSeconds`, which only trims slack.

10. **Frame-review loop (at most 3 rounds).** Using the frames from step 9, read
    `outputs.sheet` (`sheet.jpg`, the contact sheet) first, then the per-scene stills in
    `outputs.review` that look wrong. Check them against `review.md`, then run the **launch checks**:
    - The version string, product name and link match everywhere: narration, UI, outro pill
      and copy pack.
    - The availability words on screen are the true ones (step "Launch facts").
    - The poster frame is the hero UI moment and reads as a thumbnail at 320 px wide.
    - The outro holds on the link for at least 3 s, with nothing animating over the URL.
    - No change from another branch or an unreleased flag appears in the UI.
    - In a recap, the beats play from No. 3 up to No. 1, and every beat states its before
      clause and its after clause.
    - Every number on screen matches `script.md`'s sources table.

    Fix the config and re-render with `$SR <dir> --review --skip-capture --json` (only changed
    lines are re-voiced). After 3 rounds, stop and report what is still open.

11. **Copy pack.** Write `.trailer/out/launch-copy.md` from `references/launch-copy.md`: the
    X/Bluesky post, the LinkedIn post, the Product Hunt tagline (60 characters or fewer) and
    first comment, the release-notes intro (for a recap, the highlights match the film's
    beats), and the video title, description and chapters, built from the `--json` `scenes`
    timings. Take facts only from `brief.md` and `script.md`. Any fact that is missing
    becomes `[FILL: ...]`.

12. **Deliver.** Report the outputs as relative paths (`outputs.mp4`, `srt`, `vtt`,
    `poster`), plus the duration, word count, voice engine (with a loud note if it fell
    back), the format and why, the copy pack path, and any review items still open. Offer a
    vertical teaser through `trailer-shorts`. **Never upload, post, publish a release or
    send anything.**

## Script lines: good and bad

| bad | why it fails | good |
| --- | --- | --- |
| "We're excited to announce Tinlark, the revolutionary way to monitor jobs." | first person (a lint error), filler, no picture, the logo comes first | "Monday morning. The nightly backup hasn't run since Thursday. Nobody knew." |
| "Tinlark seamlessly leverages smart heuristics to surface insights." | abstract and unfilmable, and "seamless" is a forbidden term | "Miss a ping, and the job turns red 1 minute past its schedule." |
| "fix(sched): handle DST offset in tz calc (#412)" | a commit subject, not a benefit | "Around daylight saving, jobs used to show an hour late. Now the clock is right." |
| "Blazing-fast performance improvements across the board." | no number, no source, no "so what" | "Checks start 4 times faster, so a new server is watched in seconds." (source: the benchmark file and line) |
| "Available now on every platform!" | probably untrue, and it is unverified | "Tinlark is live today, free to start." (only when the tag and pricing page say so) |
| "It has groups, tags, webhooks, SSO, audit logs and dark mode." | a feature list that no picture can follow | "Tag a batch of jobs once, and one alert covers all of them." (one move, one scene) |
| "forty-eight pull requests" | the captions show words while the screen shows digits | "48 pull requests" |
| "Check it out!" | a CTA with no destination | "Update in one command." with `link` set to the changelog URL |
| On-screen text repeats the line word for word | it doubles up with the captions | Put the noun on screen ("Job groups") and say the action ("Tag a batch once...") |

More lines, including CTA phrasing by availability, are in `references/launch-copy.md`.

## Failure handling

| symptom | what to do |
| --- | --- |
| exit `3` (missing dependency) | Run `$SR doctor --json` and show the user its exact install hint (ffmpeg, a browser, Node ≥ 20). Do not try to install system packages yourself. |
| exit `2` (lint errors) | Fix each error at the config path it names, then re-lint. Never delete a scene just to silence the lint. |
| exit `1` (runtime) | Read the stderr tail and match it in `troubleshooting.md`. Re-run with `--frames 0-90` to isolate a scene. |
| `voice.fallback: true` | The film was rendered with `say`, `espeak-ng` or silence. Report it, and tell the user how to add the key. Do not present it as final. |
| more than 5 s over target | Cut words from the longest scenes. Never raise `voice.speed` above 1.05. |
| no git tags | Use a date range (`release-recap.md` section 1b), or ask the user for the two refs. |
| first release (no earlier tag) | Treat it as a product launch, not a recap. |
| shallow clone (`git rev-parse --is-shallow-repository` prints `true`) | Ask before running `git fetch --tags --unshallow`, because it is a network call. |
| `gh` missing or not logged in | Mine git only. PR titles come from merge and squash subjects (`release-recap.md` section 3). |
| no measurable proof in the repo | Use qualitative proof (the before/after state in the UI), or ask the user one question. Never invent a number. |
| the app can't be captured | Rebuild the UI from components and seed data. That is the default anyway. |
| a private codename or customer name appears in PRs | Add it to `.trailer/private/banned-terms.txt` (lint errors) and describe the change generically. |

## Rules that never bend

- The pain comes before the product, even in a launch: at least 25% of the runtime before the
  first product UI (a recap states each beat's "before" in its own first clause).
- The narration is third person about the product (`narration.person: "third"`). The copy
  pack may use the user's own first-person voice.
- Never invent a number, date, price, availability claim, quote or contributor name. Every
  number has a source row in `script.md`.
- Contributors appear as a count. Names or handles appear only when the user asks for them,
  and never as emails.
- The UI is recreated in the app's own tokens with real seed data. Never show a raw
  screenshot crop.
- Never upload, post, send, tag, publish a GitHub release or create a draft anywhere. The
  copy pack is a local file.
- Write only inside `<dir>/.trailer/`. Never write to the plugin folder.

Before you report, run through `references/checklist.md` and confirm every item.

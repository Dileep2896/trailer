# The flow: seeing the project

Every trailer skill follows this spine. The use-case skills change the parameters (length,
format shortlist, act structure, extra deliverables), never the order. `<engine>` is the full
command prefix from the core `SKILL.md`. `assets/` and the other reference files named here
live in the core skill's folder inside the plugin: `skills/trailer/assets/` and
`skills/trailer/references/`.

```text
0 preflight -> 1 inventory -> 2 tokens + components -> 3 format -> 4 script -> 5 config
  -> 6 lint -> 7 layout stills -> 8 render -> 9 frame-review loop (max 3) -> 10 deliver
```

## 0. Preflight

- `<engine> doctor <dir> --json`. Exit 3: show the one install command, wait.
- No `.trailer/`: `<engine> init <dir> --use-case <explainer|launch|jobhunt|hackathon|shorts>`.
  It writes the folder, its `.gitignore` (`out/ voice/ shots/ review/ .stage/ private/ .env`)
  `brief.md`, `script.md` and the use-case starter config, with `Projectname` replaced by the
  project's name. The starter is the one source the skill's steps refer to; the copy in the
  skill's `assets/` folder (core: `assets/starter.config.json`) is the same file, kept for
  reference. The release-recap starter (`trailer-launch/assets/release-recap.config.json`)
  has no `init` template, so the launch skill writes a recap from that asset.
- Existing `.trailer/`: read the config, `brief.md`, `script.md` and `out/history.jsonl` first.
  A second film in the same repo uses a different format and theme.
- No narration chosen at intake: set `"voice": { "provider": "text" }`; no key is needed or
  checked. Otherwise, Deepgram key absent: say once how to add a key (`voice.md`) and that the
  free choices are no narration (default for anything published) or the robotic system voice
  (drafts). Do not block.

## 1. Inventory (read, do not run)

Spend about 10 minutes reading, in this order. Use Glob and Grep; open files only when they
look relevant. Do not install, build or start the project for the inventory.

| look at | why | how |
| --- | --- | --- |
| `README*`, `docs/`, landing copy | the one-liner, who it is for, claimed results | Read |
| manifests: `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`, `*.csproj`, `pubspec.yaml`, `Package.swift` | name, stack, scripts (`dev`, `start`, `seed`, `test`, `bench`) | Read |
| routes and pages: `app/`, `pages/`, `src/routes`, `urls.py`, `router.*`, `screens/` | which screens exist; which carry the value | Glob `**/{page,route,screen}*` |
| components: `components/`, `ui/`, `widgets/` | what to rebuild (tables, lists, diffs, cards) | Glob, then Read 2 to 4 key ones |
| theme sources: `tailwind.config.*`, `globals.css`, `*.css` vars, `theme.*`, `Assets.xcassets`, `colors.xml`, `ThemeData` | the app tokens (`tokens.md`) | Grep `--[a-z-]+:`, `@theme`, `primary` |
| fonts: `next/font`, `@font-face`, `<link href="fonts.googleapis`, `GoogleFonts.` | the font mapping | Grep |
| seed, fixtures, demo data: `seed*`, `fixtures/`, `demo*`, `*.sample.json`, `db/seeds` | real names, rows and numbers for the UI scenes | Glob, Read |
| tests and benchmarks: `test/`, `__tests__`, `bench*`, `*.spec.*` | what is measured: the proof numbers, with `file:line` | Grep `expect\(|assert|bench` |
| `CHANGELOG*`, releases, tags | what shipped and when | Read; `git tag --sort=-creatordate` |
| history | the story of the build, the hard part | `git log --oneline -50` |
| screenshots and media: `*.png`, `*.gif` under `docs/`, `public/`, `assets/` | establishing shots; what the app looks like | Glob, Read the image |
| issues or a `research`/`notes` file (if present) | public pain, user quotes | Read |

Questions to answer while reading:

- What does a user do in the first 30 seconds, and what do they get?
- What is the **one** moment where the product visibly does something a person could not?
- Which seed row makes the problem concrete (a named record, a failing case, a before value)?
- Is there a number with a source? Which file and line?
- What would a skeptic say, and does the repo answer it?

### Write `brief.md`

Fill `assets/brief.template.md` into `.trailer/brief.md`. Rules:

- **Who hurts / what breaks / why today's fix fails** in one or two sentences each, concrete.
- **The mechanism** in one sentence a 12-year-old follows ("it reads every update first and
  sorts them by risk").
- **2 or 3 product moves**, each with the component or screen file path to rebuild and the
  seed rows to use.
- **Proof**: each number with `file:line` (a test assertion, a benchmark output, a seed
  computation, a README figure that cites its method). If none exists: qualitative proof
  ("caught before merge", "one click instead of five steps"), or ask the user one question
  ("Do you have a measured number for X?"). **Never invent one.**
- **Public evidence** (optional): what people say about the problem, with URLs, attributed
  generically in the film. Only include what you actually read.
- **Forbidden terms**: names that must not appear on screen (competitors, clients, internal
  code names). Put them in `forbiddenTerms` (warnings) or, if they must never appear,
  `.trailer/private/banned-terms.txt` (errors).
- **Assets the user owns**: logos of the project itself, music, recordings, in `.trailer/assets/`.

If after reading you cannot fill "who hurts" or "what breaks", ask the user one question
before going further. Everything else can be inferred.

## 2. Tokens and components

- Map tokens into `config.app` (`tokens.md`), each with its source file in `brief.md`.
- Choose the 2 to 4 moments to rebuild. For each: the screen, the 3 to 6 elements it needs
  (`header`, `table`, `list`, `diff`, `stat`...), the seed rows, the one state change that tells
  the story ("row 2 flips to Review"), and the target for the cursor, spotlight and note.
- Screenshots only as establishing shots (at most 4 s each). A recreated scene is almost
  always clearer.

## 3. Format

- Shortlist 3 from `formats.md` by the problem's shape. Pick the one whose metaphor also
  explains the mechanism.
- Skip any format in `out/history.jsonl` (JSON Lines; read the `format` field of each line)
  and the one in the committed config's `meta.format`.
- Write "Why this fit" in `script.md` and `meta.format` / `meta.formatWhy` in the config.
- Choose the theme for the format's world: accent, fonts, and at least two of `background`,
  `chrome`, `transition`, `type`, `motif` different from the starter and from earlier films.

## 4. Script

- Fill `assets/script.template.md` into `.trailer/script.md`.
- Budget: **1.9 x targetSeconds, plus or minus 8%** (2.1 for cuts, shorts and any target of 30 s or less).
- Default 60 s acts: hook 0 to 6, pain 6 to 22 (at least 14 s, before any product UI), turn 22
  to 27, how it works 27 to 48, proof 48 to 55, end 55 to 60. Bend per format, keep the order.
- At most 3 numbers, as digits, each in the sources table. Third person unless
  `narration.person` says otherwise. One or two sentences per scene.
- Read the narration aloud in your head. Every sentence must be sayable in one breath.

## 5. Config

- Write the scenes from the script table, following the format's scene recipe.
- Cue every `at` to a word in that scene's own `say`.
- Fill `meta`, `theme`, `app`, `captions`, `music`; `turn: true` once; `poster: true` once.
- `cuts` only if shorts were requested (or hand over to trailer-shorts afterwards).

## 6. Lint

`<engine> <dir> --lint --json`. Fix every error. Fix or justify every warning in `script.md`
under "Accepted warnings".

## 7. Layout stills

`<engine> <dir> --stills scenes --voice-engine none --safe-overlay --json` (`--voice-engine text`
in the text mode). Read the stills;
fix layout before spending on voice.

## 8. Render

`<engine> <dir> --review --json` (add `--all` if cuts exist). Check `seconds`, `words` and
`voice.fallback`.

## 9. Frame-review loop

`review.md`: read `sheet.jpg` (`outputs.sheet`), read the stills that look wrong, check them against the
checklist, fix, re-render with `--review --skip-capture --json`. At most 3 loops.

## 10. Deliver

Relative paths from `--json`: the MP4(s), poster, `.srt`/`.vtt`, `sheet.jpg`. Duration,
words, the voice engine (flag any fallback), the format and why, accepted warnings, leftovers.
Then the use-case extras. **Never upload, post or send anything.**

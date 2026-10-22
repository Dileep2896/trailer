# Contributing to trailer

Thanks for helping. Trailer has two halves, and most contributions touch one of them:

- **The skills** (`skills/`, `commands/`): the creative process. Formats, script rules,
  token extraction, review checklists and use-case workflows, written as Markdown that Claude
  Code follows.
- **The engine** (`engine/`): the Remotion kit that turns a config into a film. Scene types,
  layouts per aspect, captions, voice, sound and the CLI.

Useful contributions include a new narrative format, a new scene type or `ui` element, a token
extractor for another UI framework, portrait layout fixes, platform presets for shorts, better
lint rules, docs, and bug reports with a config that reproduces the bug.

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Report security
issues privately as described in [SECURITY.md](SECURITY.md), not in a public issue.

## Development setup

You need Node 20 or newer, pnpm (or npm) and ffmpeg. See the [README](README.md#requirements).

```sh
git clone https://github.com/Dileep2896/trailer.git
cd trailer/engine
pnpm install --ignore-workspace     # or: npm ci
cd ..

node engine/trailer.mjs doctor
node engine/trailer.mjs examples/driftcheck --lint --all
node engine/trailer.mjs examples/driftcheck --voice-engine none --frames 0-150   # 5 s render, no key
```

In a git checkout with `engine/node_modules` installed, the engine runs in place, so your
edits take effect on the next run.

### Checks to run before a pull request

These are what CI runs (`.github/workflows/ci.yml`). Run them locally first:

```sh
cd engine
pnpm typecheck                       # tsc --noEmit, strict
pnpm test                            # node --test test/*.test.mjs
node scripts/gen-schema.mjs --check  # the committed schema matches src/options.mjs
cd ..
node engine/trailer.mjs examples/driftcheck --lint --all
node scripts/check-clean.mjs         # privacy scan (see below)
```

If you change anything a viewer sees, also render and look at the frames. CI doesn't render.

```sh
node engine/trailer.mjs examples/driftcheck --stills scenes --safe-overlay --voice-engine none
node engine/trailer.mjs examples/driftcheck --cut short --stills scenes --safe-overlay --voice-engine none
node engine/trailer.mjs examples/driftcheck --cut square --stills scenes --safe-overlay --voice-engine none
```

The stills land in `examples/driftcheck/.trailer/review/<aspect>/`. Attach the relevant ones
to your pull request.

### Working on the plugin

Load your checkout as a plugin and validate the manifests:

```sh
claude --plugin-dir /path/to/trailer           # start Claude Code with this checkout loaded
claude plugin validate /path/to/trailer --strict
```

Skills are invoked as `/trailer:<skill-name>`, and commands as `/trailer:<command>`. Run
`/reload-plugins` in a session after editing a skill.

## Making changes

### A new scene type

1. Write the component in `engine/src/v3/scenes/`.
2. Register it in `engine/src/v3/registry.tsx` and in `V3_TYPES` (`engine/src/config.mjs`).
3. Give it timing defaults in `engine/src/timeline.mjs`.
4. Lay it out for every aspect: read `useArea()` and never assume 1920x1080.
5. Add its schema fields in `engine/scripts/gen-schema.mjs`, then run
   `node engine/scripts/gen-schema.mjs`.
6. Document it in `docs/config-reference.md` and `skills/trailer/references/scenes.md`.
7. Check it at 16:9, 9:16 and 1:1 with `--stills scenes --safe-overlay`.

### A new option value (background, transition, font, motif...)

Add it in `engine/src/options.mjs`, regenerate the schema, and add a test if it changes
resolution logic. A new font must be a Google Fonts family under the OFL or Apache-2.0,
registered in `engine/src/fonts.ts` and listed in `THIRD_PARTY_NOTICES.md`.

### A new narrative format

Formats live in `skills/trailer/references/formats.md`. A format is a narrative device, not
a new skin: how the film opens, explains, shows the pain, shows the product and ends. A new
entry needs everything the existing ones have: the arc with timings, opener, closer,
explanation style, how the pain and the product show, motion, the signature type move,
characters, the **scene recipe** (ordered engine scene types and layouts), **fits when...**,
best use cases and portrait notes. Use a made-up project for the example, never a real one.
Add it to the "How to choose" table and to the shape table in `skills/trailer/SKILL.md`.
Open a "Format proposal" issue first if you want feedback on the idea.

### A skill change

- Keep each `SKILL.md` under 500 lines. Put details in `references/` and link to them.
- Put the main use case first in `description`. Combined `description` and `when_to_use`
  text is cut at 1,536 characters.
- Keep `allowed-tools` narrow: the engine call and read-only tools, never broad `Bash`.
- Shared material belongs in `skills/trailer/references/`. Use-case skills link to it with
  relative Markdown links (`[flow.md](../trailer/references/flow.md)`) so the links work on
  GitHub, instead of copying it. Keep `${CLAUDE_PLUGIN_ROOT}` for shell commands only. No
  symlinks.
- Any engine command you write must match `node engine/trailer.mjs --help` exactly.
- Starter configs in `skills/*/assets/*.config.json` must pass `--lint` (CI checks them). A
  starter that `init` writes is the same file as its `engine/templates/<use-case>.json`; change
  both together so they stay byte-identical.

## Rules every contribution follows

### Assets and licenses

Only assets under **CC0, MIT, Apache-2.0 or the SIL Open Font License** are accepted. That
covers characters, emoji, images, fonts and audio. CC BY, CC BY-SA, "free for personal use"
and custom licenses are not. Every new asset needs:

- an entry in `engine/public/characters/LICENSES.md` (for anything under that folder), and
- an entry in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) with the source URL, the
  author, the license and, for MIT or Apache, the license text.

Prefer drawing in code or synthesizing sound over adding files. Never commit MP4, MOV or WAV
files: renders and voice lines are generated. The README media in `docs/media/` (a poster and
GIFs, 4 MiB or less each) is the only exception.

### Privacy and examples

The repository is public, so it must not contain anything private:

- no API keys, tokens or `.env` files (use `.env.example`);
- no absolute home-directory paths, personal email addresses or phone numbers;
- no real company, product or person names in examples, fixtures, tests or format examples.
  Make up a name and a fictional dataset, as `examples/driftcheck` does.

`node scripts/check-clean.mjs` catches the mechanical cases and runs in CI. It can't catch a
real company name, so check your examples yourself.

### Film craft

Changes to skills or defaults must keep what makes the films work: the pain first and
concrete, a format with a real metaphor, recreated UI in the app's own tokens, every visual
cued to a spoken word, about 1.9 spoken words per second, and a source for every number. If a
change trades one of these away, say so in the pull request.

### Writing style

Docs and skills are written in plain, direct English: short sentences, the reader as "you",
concrete examples, no marketing words. Narration examples are third person about the project
unless they show a first-person option.

## Pull requests

1. Open an issue first for anything large (a new skill, a new scene family, an engine
   refactor), so we can agree on the shape before you build it.
2. Keep each pull request to one change. Update the docs and `CHANGELOG.md` (under
   "Unreleased") in the same pull request.
3. Fill in the pull request template, including the checks you ran and stills for visual
   changes.
4. CI must pass. A maintainer reviews, may ask for changes, and merges.

By submitting a contribution, you agree that it is licensed under the project's
[MIT License](LICENSE).

## Releases

Versions follow [Semantic Versioning](https://semver.org). The version is kept in
`engine/package.json` and `.claude-plugin/plugin.json` (CI checks that they match), and
recorded in `CHANGELOG.md`.

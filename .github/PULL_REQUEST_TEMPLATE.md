## What this changes

<!-- One or two sentences. Link the issue: "Closes #123". -->

## Why

<!-- The problem it solves, ideally with a concrete example. -->

## Type

- [ ] Bug fix
- [ ] Engine feature (scene type, option, flag)
- [ ] Skill or command change
- [ ] New narrative format
- [ ] Docs
- [ ] CI, tooling or other

## Checks

<!-- Tick what you ran. CI runs the first five; it does not render. -->

- [ ] `pnpm typecheck` (in `engine/`)
- [ ] `pnpm test` (in `engine/`)
- [ ] `node engine/scripts/gen-schema.mjs --check` (regenerated if options changed)
- [ ] `node engine/trailer.mjs examples/driftcheck --lint --all`
- [ ] `node scripts/check-clean.mjs`
- [ ] For visual changes: rendered `--stills scenes --safe-overlay` at 16:9, 9:16 and 1:1, and attached the stills below
- [ ] For skill changes: every engine command matches `node engine/trailer.mjs --help`, and `claude plugin validate . --strict` passes
- [ ] Docs and `CHANGELOG.md` (under "Unreleased") updated

## Licensing and privacy

- [ ] Any new asset (art, font, sound) is CC0, MIT, Apache-2.0 or OFL, and is recorded in `THIRD_PARTY_NOTICES.md` (and `engine/public/characters/LICENSES.md` if it lives there)
- [ ] No API keys, `.env` files, personal contact details, absolute home paths, or real company, product or person names in examples, fixtures or tests
- [ ] I agree that this contribution is licensed under the project's MIT License

## Stills or output

<!-- Before/after stills for visual changes, or the relevant --json summary. -->

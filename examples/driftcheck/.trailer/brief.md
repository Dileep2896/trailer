# Brief: Driftcheck

> The inventory behind the film. Driftcheck is a made-up sample app that ships with trailer;
> every number below comes from `data/seed.json` and is made up too.

## One-liner

Driftcheck compares the config of every environment before a deploy, so that a release that
is green in staging does not break in production over a setting nobody can see.

## The problem

- **Who hurts:** the engineer on call on a Friday evening.
- **What breaks:** `PAYMENTS_TIMEOUT_MS` is `8000` in staging and not set in production, so
  production falls back to `2000` and gives up on the payment provider after two seconds
  (`data/seed.json:9`).
- **Why today's fix fails:** the build and the code are identical (`data/seed.json:6`), so
  diffs and CI are green; config is compared by eye, file by file, after the incident.
- **The moment:** Friday, 18:00, the deploy goes out; checkout is reported down at 18:22
  (`data/seed.json:6`).

## The mechanism

Before a deploy, Driftcheck reads every environment's config and lines up each key side by
side, so a missing or different value shows up in red.

## Product moves

| # | move | screen / component file | seed rows to show | the state change | cursor / spotlight / note target |
| --- | --- | --- | --- | --- | --- |
| 1 | lines up every key across environments | `index.html` (table `drift`), `app.js` | `PAYMENTS_TIMEOUT_MS`, `PAYMENTS_RETRY_LIMIT`, `CHECKOUT_FEATURE_V2`, `SESSION_SECRET` | drifted rows turn red | `keys` table |
| 2 | flags missing keys, changed values and stale secrets, with the source file | `index.html` (Status and Source columns) | rows at `data/seed.json:9`, `:11`, `:12` | spotlight moves row to row | boxes `missing`, `flag`, `secret` |

## Proof

| number | what it measures | source | how it was measured |
| --- | --- | --- | --- |
| 312 | keys compared | `data/seed.json:7` (`summary.keys`) | seed |
| 3 | environments | `data/seed.json:4`, `:7` | seed |
| 4 | keys that drifted | `data/seed.json:7` (`summary.drifted`) | seed (2 missing, 1 changed, 1 stale) |

## UI tokens (`config.app`)

| token | value | original value | source file |
| --- | --- | --- | --- |
| font | Inter | `'Inter', system-ui` | `app.css` (`--font`) |
| mono | JetBrains Mono | `'JetBrains Mono', ui-monospace` | `app.css` (`--mono`) |
| bg | `#f5f6f8` | same | `app.css` (`--bg`) |
| surface | `#ffffff` | same | `app.css` (`--surface`) |
| subtle | `#f9fafb` | same | `app.css` (`--subtle`) |
| ink | `#111827` | same | `app.css` (`--ink`) |
| muted | `#5f6b7a` | same | `app.css` (`--muted`) |
| border | `#e3e7ec` | same | `app.css` (`--border`) |
| accent | `#0f9d8a` | same | `app.css` (`--accent`) |
| good / bad / warn | `#16a34a` / `#dc2626` / `#d97706` | same | `app.css` |
| radius | 12 | `12px` | `app.css` (`--radius`) |
| dark | false | light app | `app.css` |

Film fonts: Space Grotesk (display), Inter (UI), JetBrains Mono (code).

## Forbidden terms

None for the sample.

## Assets the user owns

`assets/drift.png`: a capture of `index.html` at 1280x760, made from this example.

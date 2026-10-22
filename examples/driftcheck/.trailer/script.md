# Script: Driftcheck

- **Use case:** explainer
- **Format:** Case File
- **Target:** 60 s, 16:9. Word budget 105 to 123 (1.9 x target, plus or minus 8%). Cuts: `short` (9:16, 25 s) and `square` (1:1, 30 s).
- **Tone:** calm, dry, precise
- **Voice:** Deepgram aura-2-hermes-en at 1.0
- **Look:** world: dark, noise-glow background, minimal chrome, push transitions, giant kinetic type, Space Grotesk, teal accent `#2dd4bf` with amber `#f59e0b` / app: tokens from `brief.md`
- **Music:** 96 BPM, tense

## Why this fit

A deploy that passes staging and fails production is a mystery with one hidden culprit. The
case-file arc (an incident, the exhibits, the suspect, the reveal) maps onto it directly, and
the reveal is the mechanism itself: put the two environments side by side and the culprit is
the one line that differs.

Shortlist considered: Case File, Two Lanes, Checkpoint. First film in this example.

## Scenes

| # | t (s) | act | scene (id, type, layout) | on screen | narration |
| --- | --- | --- | --- | --- | --- |
| 1 | 0.0 | hook | `open` title / stamp | "Incident 0611", "Green in staging", stamp DOWN IN PROD | Friday, six p.m. The release passed every check in staging. Twenty minutes later, checkout is down in production. |
| 2 | 10.3 | pain | `evidence` wall | incident log, on-call post, "0 code changes" stat, stamp SAME BUILD | Same code, same build. Something else is different, and nobody can see it. |
| 3 | 16.9 | pain | `diff` split / versus | `payments.yaml` in staging (8000) vs production (not set), 8 s vs 2 s | One setting. Staging waits eight seconds for the payment provider. Production never got the key, so it gives up after two. |
| 4 | 25.6 | turn | `turn` kinetic | "Enter Driftcheck." | Enter Driftcheck. |
| 5 | 28.1 | how | `checks` ui / browser | the drift table rebuilt from seed rows, side notes | Driftcheck reads the config of every environment before a deploy, and lines up every key, side by side. |
| 6 | 36.3 | how | `shot` screenshot | the real page, spotlight on the missing key, the changed flag, the stale secret | Missing keys, changed values and secrets out of rotation are flagged in red, with the file each one came from. |
| 7 | 43.8 | proof | `result` metric / ring | 312 keys compared, 4 drifted | In the sample project: three hundred and twelve keys across three environments, and four that drifted. |
| 8 | 51.3 | end | `end` outro / card | name, tagline, link | Driftcheck. Catch config drift before your users do. |

Rendered length: 57.2 s (voice 48.5 s).

## Full narration

> Friday, six p.m. The release passed every check in staging. Twenty minutes later, checkout is down in production.
> Same code, same build. Something else is different, and nobody can see it.
> One setting. Staging waits eight seconds for the payment provider. Production never got the key, so it gives up after two.
> Enter Driftcheck.
> Driftcheck reads the config of every environment before a deploy, and lines up every key, side by side.
> Missing keys, changed values and secrets out of rotation are flagged in red, with the file each one came from.
> In the sample project: three hundred and twelve keys across three environments, and four that drifted.
> Driftcheck. Catch config drift before your users do.

Word count: 116 (budget 105 to 123).

## Cuts

| cut | aspect | target | scenes | rewritten lines |
| --- | --- | --- | --- | --- |
| `short` | 9:16 | 25 s | open, diff, turn, shot, end | open: "Friday deploy. Staging is green. Production is down." / diff: "One missing key: production gives the payment provider two seconds, not eight." / shot: "Driftcheck lines up the config of every environment, and flags each drifted key in red before the deploy ships." |
| `square` | 1:1 | 30 s | open, diff, turn, checks, result, end | open: "Friday deploy. Staging is green. Checkout is down." / diff: "Staging waits eight seconds for payments. Production never got the key, and gives up after two." / checks: "Driftcheck lines up every key of every environment before a deploy, so drift shows up in red." |

## Sources for every number and claim

| claim as spoken or shown | source |
| --- | --- |
| Friday, six p.m. (the deploy) | `data/seed.json:6` (`incident.deployedAt`) |
| twenty minutes later; reported 18:22 | `data/seed.json:6` (`incident.reportedAt`) |
| checkout failing for 41 minutes | `data/seed.json:6` (`incident.checkoutFailingMinutes`) |
| 0 code changes, same build | `data/seed.json:6` (`incident.codeChangesBetweenStagingAndProduction`) |
| staging waits eight seconds (8000) | `data/seed.json:9` (`PAYMENTS_TIMEOUT_MS`, staging value) |
| production never got the key, gives up after two | `data/seed.json:9` (production `null`, `defaultWhenMissing` 2000) |
| retry limit 3 in both | `data/seed.json:10` |
| changed value | `data/seed.json:11` (`CHECKOUT_FEATURE_V2`) |
| secret 94 days old | `data/seed.json:12` (`SESSION_SECRET`) |
| the file each one came from | `data/seed.json` (`file` on every key), `index.html` (Source column) |
| 312 keys, 3 environments, 4 drifted | `data/seed.json:4`, `:7` (`summary`) |

## Accepted warnings

- None for 16:9. In 9:16 and 1:1, `--lint` warns about nothing that needs a variant: every scene type used here adapts by itself.

## Review log

| round | fixed | left |
| --- | --- | --- |
| 1 | 9:16 `shot`: the crop was a thin strip, now a taller crop with the zoom clamped | 9:16 `diff`: panels sit at the top of the content area |
| 2 | 9:16 captions: moved from `bottom` to `center-low` for cuts | 1:1 `result`: the ring reads small but clear |
| 3 | cuts: the rewritten lines had lost their cue words (`--lint --all` now warns); `stampAt`, the short's `shot` moves and the square's cursor and note are re-cued, and the short's moves focus the value columns (`*-values` boxes) so the 9:16 crop shows the drift itself | |
| 4 | 1:1 `result`: the two rings sit side by side, larger; a count up from 0 no longer shows "was 0" | |

Font mapping: Inter -> Inter (available).

## Forbidden and banned terms

- `forbiddenTerms` (warn): none.
- `private/banned-terms.txt` (error, never committed): none.

## Assets the user owns

`assets/drift.png` (a capture of this example's `index.html`).

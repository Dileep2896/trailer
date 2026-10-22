# Launch film: final checklist

Go through every item before you report. An item you cannot tick goes into the report under
"Open items", with the reason. The shared review checklist in
[`../../trailer/references/review.md`](../../trailer/references/review.md) covers the frame
details; this list adds the launch-specific checks around it.

## Facts

- [ ] The kind is settled: product launch, feature announcement or release recap.
- [ ] `brief.md` has a **Launch facts** section: what shipped (with its version), the
      availability claim, the CTA link, plan or price words (or "none"), and the embargo
      status, each with a source.
- [ ] Recap only: `brief.md` has a **Release mining** section with the range, the beat table
      (rank, beat, PRs, score, source) and the dropped counts.
- [ ] Every number in the narration, the UI and the copy has a row in the `script.md` sources
      table: a file and line, a command and its output, or a URL kept in the brief only.
- [ ] There are 3 data numbers or fewer in the film, written as digits.
- [ ] No contributor names or handles appear unless the user asked for them. No emails appear
      anywhere.
- [ ] No customer names, codenames, internal hosts or private incidents from PR bodies appear.
      Any found are in `.trailer/private/banned-terms.txt`.

## Script

- [ ] The word count is inside the budget for `targetSeconds` (1.9 words per second ±8%, 2.1
      at 30 s or less; the engine's `wordBudget` decides).
- [ ] The pain comes before the first product UI and fills at least 25% of the runtime. In a
      recap, every beat states its before clause first.
- [ ] The product is named at the turn (feature announcements may name it in the first line).
- [ ] The narration is third person. No "we", "our", "I" or "my", and no slop words.
- [ ] Each scene carries one idea in 6 to 16 words. No feature lists.
- [ ] The CTA line uses the true availability words from the table in `launch-copy.md`.
- [ ] `script.md` has the scene table, the full narration, the sources table, and "Why this
      fit".

## Config

- [ ] `.trailer/trailer.config.json` started from the right starter, and every placeholder
      is replaced. `grep -n "\[FILL" .trailer/trailer.config.json` prints nothing, and
      `meta.notes` is deleted.
- [ ] `meta` has `useCase: "launch"`, `launchKind`, `format`, `formatWhy`, `tone` and
      `sources`, plus `range` for a recap.
- [ ] `targetSeconds` and `link` are set, and the link is the product, docs or changelog
      URL.
- [ ] The theme differs from the starter in its accent, its fonts, and at least two of
      background, chrome, transition, type and motif. The format is not one already listed
      in `out/history.jsonl`.
- [ ] `config.app` tokens come from the app's own theme files (the source is noted in the
      brief).
- [ ] Every UI row is real seed data from the repo.
- [ ] Every `at` is cued to a spoken word. One scene has `turn: true` (No. 1 in a recap) and
      the hero UI scene has `poster: true`.
- [ ] Install commands are spelled out (`npm install`, not `npm i`).
- [ ] `voice.speed` is 1.05 or lower.
- [ ] `--lint --json` exits 0. Every warning is either fixed or justified in `script.md`.

## Render and review

- [ ] The stills pass (`--stills scenes --voice-engine none --safe-overlay`) is clean.
- [ ] The full render exits 0, and `seconds` is within ±5 s of `targetSeconds`.
- [ ] `voice.fallback` is false, or the fallback is reported loudly.
- [ ] The `--review` contact sheet and the frames that looked wrong have been read. At most 3
      loops were run.
- [ ] Nothing is clipped. Captions are clear of focus targets. Text is at least 28 px at
      1080p. Contrast is at least 4.5:1. No raw screenshot crop appears.
- [ ] The version, name and link are identical in the narration, the UI, the outro pill and
      the copy.
- [ ] The poster frame reads as a thumbnail at 320 px wide.
- [ ] The outro holds on the link for at least 3 s, with nothing moving over the URL.
- [ ] No unreleased flag, branch or staging hostname is visible.

## Copy pack

- [ ] `.trailer/out/launch-copy.md` exists, with an X/Bluesky post, a LinkedIn post, a
      Product Hunt tagline (60 characters or fewer) and first comment, a release-notes intro
      with highlights and upgrade steps, and the video title, description, chapters and
      poster alt text.
- [ ] Every limit is checked with `wc -m` or a word count, and the counts are written into
      the headings.
- [ ] No em dashes and no slop words. The facts match the film. Missing facts appear as
      `[FILL: ...]`.
- [ ] Chapters start at 0:00, there are at least 3, and each is at least 10 s long.

## Delivery

- [ ] The report lists relative paths only: the MP4, `.srt`, `.vtt`, the poster, the copy
      pack, and any review frames worth a look.
- [ ] It states the duration, word count, voice engine and model, and the format and why.
- [ ] Open items are listed honestly, and a vertical teaser (through `trailer-shorts`) is
      offered.
- [ ] Nothing was uploaded, posted, sent, tagged or published. Nothing was written outside
      `<dir>/.trailer/`.
- [ ] For an embargoed launch on a public repo, the user has been warned about committing
      `.trailer/brief.md`, `script.md` and the config before launch day.

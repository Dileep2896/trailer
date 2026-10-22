# Final checklist: hackathon film

Run this before you report. A box you cannot tick goes into the report under "Open", with
the reason. The frame checks extend the core list in
`skills/trailer/references/review.md`; do those too.

## Story (judge structure)

- [ ] The problem lands by 10 s (60 s film; 8 s at 45 s): one person, one moment, one
      concrete failure. There is no product UI before the turn.
- [ ] The turn names the project and its promise in one line of 5 to 8 words.
- [ ] Demo scenes (ids starting with `demo-`) are at least 40% of `seconds`.
- [ ] Each demo step shows one action and one visible result, and has an on-screen step
      label.
- [ ] How it works is one sentence naming 2 or 3 parts, plus one diagram of 3 to 5 boxes
      (or one `kinetic` line if it was cut for time).
- [ ] Act 5 has one honest result or one "next" step, never both crammed into one line.
- [ ] The end card shows the name, the credit line (if the user gave one) and the link pill.

## Honesty

- [ ] Every demo step works in the repo today. Mocked or planned steps appear only as
      "next".
- [ ] Every number in the film, the blurb and the pitch has a row in the `script.md` sources
      table (file and line, or "from the user").
- [ ] No invented users, quotes, testimonials or results. Fictional people in act 1 are
      clearly an example, not a claimed user.
- [ ] Team names come from the user only.
- [ ] Public evidence, if any, is attributed generically, with no company names or logos.

## Script and config

- [ ] `words` is inside `wordBudget`; no line has more than one number; at most 3 numbers
      in the film, as digits.
- [ ] `voice.speed` is 1.05 or less.
- [ ] Every `at` is cued to a word spoken in that scene.
- [ ] `config.app` uses the app's real tokens, and the `ui` scenes use real seed rows.
- [ ] The theme differs from the starter in accent, fonts and at least two of background,
      chrome, transition, type and motif.
- [ ] `meta.useCase` is `hackathon`; `meta.format` and `meta.formatWhy` are set; every
      fictional starter field is replaced.
- [ ] `cuts.short` is removed unless the user asked for a vertical cut.
- [ ] `--lint --json` exits 0, and each remaining warning has a line in `script.md`.

## Frames (from the review pass)

- [ ] Nothing clipped or overflowing; the caption band is clear of every focus target.
- [ ] Text is at least 28 px at 1080p, contrast at least 4.5:1, captions at least 48 px.
- [ ] **Muted test:** the frames and captions alone tell what the hack does.
- [ ] **Projector test:** the demo text is readable from the back of a room (camera pushed
      in, or `app.size` raised to 24 to 26).
- [ ] **Thumbnail test:** the poster frame shows the product and its name.
- [ ] No raw crop of a screenshot; any real screenshot is framed and on screen 4 s or less.
- [ ] Every entrance has an exit; no dead frame longer than 4 s.

## Outputs

- [ ] `seconds` is within 5 s of `targetSeconds` and inside the event's length cap.
- [ ] `outputs.mp4`, the `.srt` and `.vtt` captions and the poster exist.
- [ ] The vertical cut exists, if it was requested, and `seconds` is 15 to 30.
- [ ] `voice.fallback` is reported to the user if it is true.
- [ ] `.trailer/out/submission.md` has the blurb (120 words or fewer, count printed), the
      3-sentence pitch, the Devpost drafts, and a "Still to fill" list.

## Safety

- [ ] Nothing was uploaded, posted, submitted, sent or committed.
- [ ] No API key, `.env` content or absolute home path appears in the config, the script,
      the brief or `submission.md`.
- [ ] The report gives paths relative to the project, the time taken, and what the user
      still has to do.

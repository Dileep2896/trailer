# Jobhunt checklist

Go through all of it before you deliver. For anything that doesn't pass, either fix it or
list it under "Still open" in the delivery message. Never skip an item silently.

## Inputs and privacy

- [ ] `.trailer/.gitignore` lists `private/` (and `out/`, `voice/`, `shots/`, `review/`,
      `.stage/` and `.env`). In a git repo, `git check-ignore -q .trailer/private/profile.md`
      succeeds.
- [ ] `private/profile.md` exists. Every fact about the user in any draft is in it, and
      nothing in its "Never claim" section is broken.
- [ ] `private/target.json` exists, every evidence entry has a URL you opened and a date,
      and `people[]` has names and roles only, with no addresses.
- [ ] The mode (`named` or `independent`) is recorded in `target.json` and was applied
      throughout.
- [ ] No Deepgram key, `.env` content or token appears in any file you wrote.

## Film: story

- [ ] The first 6 s show one concrete moment of pain (a person, a time, an object). The
      product and the target's name are absent.
- [ ] The pain and evidence act runs at least 14 s, before any product UI.
- [ ] One format with a real metaphor, chosen from the shortlist (or justified), and
      "Why this fit" is in `script.md` and `meta.formatWhy`.
- [ ] The turn names the project and sets `turn: true`.
- [ ] 2 or 3 product moves use recreated `ui` scenes with real seed rows. Screenshots, if
      any, are framed and on screen for at most 4 s each.
- [ ] The proof is one measured before → after, scoped ("on the demo data"), and matches
      its source exactly.
- [ ] The outro has the name, the tagline, the repo pill (or `link`) and the `credit` line.
      "Standalone demo" is said or shown once.

## Film: numbers and words

- [ ] There are 105 to 123 spoken words for 60 s (or the budget for `targetSeconds`), and
      the `--json` `words` value sits inside `wordBudget`.
- [ ] No more than 3 numbers are spoken, all written as digits, and each has a row in the
      `script.md` sources table.
- [ ] The narration is third person (`narration.person: "third"`) unless the user asked for
      first person.
- [ ] `voice.speed` is between 0.9 and 1.05. The film was cut for length, not sped up.
- [ ] No line from `meta.sources` still says "FICTIONAL STARTER". Every line of the jobhunt
      starter (`init`'s template, the same file as `assets/jobhunt.config.json`) has been
      replaced.

## Film: render and review

- [ ] `--lint --json` returns `errors: []`, and each warning is fixed or justified in
      `script.md`.
- [ ] The duration is within ±5 s of `targetSeconds`.
- [ ] `voice.fallback` is false, or the fallback is reported at delivery.
- [ ] The frame review passed review.md and the jobhunt checks in SKILL.md, in at most 3
      loops. Anything left is listed.
- [ ] No `[FILL` text appears on screen, in the captions or on the poster.
- [ ] No target logo, product screenshot or brand palette appears anywhere.
- [ ] The poster frame (`poster: true`) shows the pain or the key UI moment, not a blank card.

## Independence mode (skip in named mode)

- [ ] `private/banned-terms.txt` covers the company, product, feature, founder, domain and
      handle variants.
- [ ] The engine lint is clean, and the Grep across the project (outside `private/`) finds
      no banned terms.
- [ ] The `.srt` and `.vtt` files and the poster have no banned terms.
- [ ] The `git log` scan is clean, or its hits were reported to the user.
- [ ] `brief.md` and `script.md` cite `private/target.json#evidence-N` with generic labels,
      not URLs.
- [ ] The project and repo names don't echo the target.

## Outreach drafts

- [ ] `email.md`: the subject is at most 8 words. The body has 100 to 140 words (by the count
      command), one ask, no bullet lists and no paragraph longer than 2 sentences. The
      links are Markdown hyperlinks on their own lines, and the signature is exactly the
      profile's.
- [ ] `email.html` has the same body, with clickable links, no styles and no scripts.
- [ ] `job-board-message.md`: 120 to 170 words, plain text, raw URLs on their own lines at the end,
      and only the short name as a sign-off.
- [ ] `linkedin-post.md`: 3 hooks on different patterns (each at most 12 words), a body of
      120 to 220 words, at most 3 domain-specific hashtags, and no target name unless the
      user asked for it.
- [ ] All three: no em or en dashes used as punctuation, no banned phrases, no invisible
      characters, and contractions are fine.
- [ ] All three: the same proof number as the film, the evidence worded as its source
      worded it, and "standalone demo" where the build is described.
- [ ] `[VIDEO LINK]` is present wherever the video goes, and every other link is a real URL
      from the profile or the repo.
- [ ] The `To:` line is `[FILL: ...]` unless the user supplied an address.

## Delivery message

- [ ] The output paths (relative), the duration, the word count, the voice engine and any
      fallback, and the poster, captions and cuts.
- [ ] The three draft paths, each with its word count.
- [ ] Every `[FILL: ...]` still open, with the profile section that would fill it.
- [ ] A reminder to replace `[VIDEO LINK]` after the user uploads the film themselves.
- [ ] The last line: "Nothing was sent or posted."

# Submission copy: blurb, pitch and Devpost story

Step 9 of the skill writes all of this to `.trailer/out/submission.md`, a gitignored file the
user copies from. You write drafts only. Never paste them into a form, submit, post or send
anything.

Every fact comes from `brief.md` and `script.md`. Any number is the same as in the film and
has the same source. A missing fact becomes `[FILL: what is needed]` and is never invented.

## Style

- Plain words, short sentences, specific over general. Say what it does, not what it is.
- No hype words: "revolutionary", "cutting-edge", "game-changer", "leverage", "seamless",
  "harness", "unlock", "empower", "delve", "synergy", "next-generation".
- No em dashes. Use commas, periods or parentheses.
- The blurb is third person or "we", whichever the user chose. The pitch is "we" (it is
  spoken by the team).
- Say honestly what is a prototype: "a working prototype on sample data" is a strength
  with judges, and an overclaim is not.

## 1. Demo blurb (120 words max)

For the Devpost "video" description, the top of the README, or the event's form. Count the
words and print the count next to the heading.

Shape:

1. **One line: what it does, for whom.** The project name, the verb and the person.
2. **The problem in one sentence**, the same moment as act 1.
3. **The demo in two or three sentences**, the same steps as act 3, in the same order.
4. **How it works in one sentence**, the same parts as act 4.
5. **One result or the next step**, the same number and source as act 5.
6. **Links on their own lines**: video `[FILL: video URL after upload]`, repo, demo.

Example (fictional, 86 words):

> Rampwise maps missing curb ramps so wheelchair users can plan a step-free route.
> Four curbs on one route to a clinic had no ramp, and no map showed it.
> Point a phone at a corner and every curb is tagged: ramp, no ramp, or blocked. Scans land
> on a shared map, and routes bend around the bad corners.
> A vision model labels each curb, and a routing layer avoids the flagged ones.
> On the test photos in the repo, it caught 37 of 39 missing ramps.
>
> Video: [FILL: video URL after upload]
> Code: https://github.com/your-team/rampwise

## 2. The 3-sentence pitch (for the live presentation)

Spoken by the team in about 20 seconds before the live demo, or as the answer to "so what
did you build?". Exactly three sentences:

1. **Problem:** "[Person] [moment], and [what fails]."
2. **Build:** "We built [name], which [the core loop in one clause]."
3. **Proof or next:** "[One result with its source], and next we [one next step]."

Example (fictional):

> Wheelchair users find missing curb ramps only when they reach the curb. We built Rampwise,
> which tags every curb from a phone photo and routes around the ones without a ramp. On our
> test photos it caught 37 of 39 missing ramps, and next we'll file each one with the city.

Add two lines under it for the Q&A: the one technical decision the team is proudest of, and
the honest limit ("it runs on sample data from one neighbourhood"). Write both from the
brief, or as `[FILL: ...]` if the brief does not say.

## 3. Devpost story sections (drafts)

Devpost project pages usually ask for these sections. Draft each in 2 to 4 sentences from
the brief. Leave team-only facts (what was hard, what was learned) as `[FILL: ...]` unless
the user or the git history states them. Never write feelings for the team.

| section | draw it from |
| --- | --- |
| Inspiration | the problem moment (act 1) and who it is for |
| What it does | the demo steps (act 3), in order |
| How we built it | the tech line (act 4) and the main parts of the stack named in the manifests |
| Challenges we ran into | `[FILL: ...]`, unless the user or commit messages state them |
| Accomplishments that we're proud of | the result (act 5) and the finished core loop |
| What we learned | `[FILL: ...]` |
| What's next | the "next" items in the brief |
| Built with | the languages, frameworks and APIs in the manifests (only ones actually used) |

## 4. README "Demo" section (optional)

If the user wants it, draft a snippet for the README. Do not edit the README yourself unless
the user asks.

```markdown
## Demo

[![Rampwise demo](.trailer/out/poster-16x9.jpg)]([FILL: video URL after upload])

Rampwise maps missing curb ramps so wheelchair users can plan a step-free route.
[the blurb's sentences 2 to 5]
```

The poster lives in the gitignored `.trailer/out/`. Tell the user to copy it to a
committed folder (for example `docs/`) before linking it from the README.

## File layout of `submission.md`

```markdown
# Submission copy: <project>

## Demo blurb (<n> words)
...

## 3-sentence pitch
...
Q&A: proudest decision: ... · honest limit: ...

## Devpost story (drafts)
### Inspiration
...

## README demo snippet (optional)
...

## Still to fill
- [FILL: video URL after upload]
- ...
```

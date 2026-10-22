# Intake: the token note, the quality tier and the pre-questions

Run this once, before any file is read or any engine call is made. It is one message to the
user and one answer back. Every use-case skill (launch, jobhunt, hackathon, shorts) runs it
too, adding its own questions to the same message.

## 1. Tell the user what a film costs in tokens

A trailer is token-heavy: the agent reads the project, writes a script and config, and
then looks at rendered frames as images, several times. Say this plainly, in two or three
lines, before starting. Rendering, music and captions run locally and cost no tokens; a
Deepgram voice is billed by Deepgram, not in tokens, and a film with no voice costs nothing
outside the session.

What drives the cost, from most to least:

| driver | why it costs | how the tiers limit it |
| --- | --- | --- |
| frame review | every frame or contact sheet read is an image in context | number of review loops, number of frames read |
| conversation length | each step re-reads the whole session so far (mostly cached, but still counted) | fewer steps, fewer re-renders |
| project inventory | each source file read stays in context | a file cap per tier |
| re-renders | each loop adds logs, summaries and new frames | loop cap per tier |

## 2. Offer three quality tiers

| | **Quick** | **Standard** (default) | **Studio** |
| --- | --- | --- | --- |
| good for | a social short, a first draft, a hackathon in a hurry | most launches and explainers | job applications, a flagship launch, anything a founder or judge will watch closely |
| length | 20 to 30 s | 45 to 60 s | 60 s (75 s max) |
| inventory | README, manifest, the main screen, the theme file, the seed data (at most 8 files) | up to 20 files | the full `flow.md` inventory |
| format choice | straight from the shape table, no shortlist | shortlist 2, pick 1 | shortlist 3, pick 1, with "Why this fit" |
| recreated `ui` scenes | 1 | 2 | 2 to 4 |
| theme | starter theme, new accent and fonts | starter changed as `SKILL.md` requires | fully designed for the format |
| layout pass (`--stills`) | skipped | once | up to twice |
| review | read `sheet.jpg` once; fix only clipped text or broken frames; no second render unless something is broken | 1 review loop | up to 3 review loops, full checklist |
| relative token use | roughly 15 to 20% of Studio (estimate) | roughly 40 to 50% of Studio (estimate) | measured: median about 0.65M fresh input tokens plus about 16M cached-read tokens per film |

The Studio figure was measured on 13 60-second films made with this engine (making plus one
independent review pass each). The Quick and Standard figures are estimates scaled from it;
say "estimate" when you quote them. Never quote a dollar price: it depends on the user's model
and plan.

Quality differences to state honestly when the user picks:

- **Quick** reads less of the project, so the pain and the proof are thinner and the film may
  feel generic. Captions and timing are still correct; polish is not checked frame by frame.
- **Standard** is a complete film with one fix pass; small layout flaws can survive.
- **Studio** is the full craft bar in `SKILL.md`, with the most fix passes.

The user can always rerun a film at a higher tier later. Path A in `trailer-shorts` (cutting a
short from an existing film) is the cheapest way to get a short, because it reuses the film's
voice, scenes and sources.

## 3. The pre-questions (one message, defaults shown)

Ask only what the request and the repo don't already answer, at most **five** core questions,
each with its default in brackets so the user can reply "defaults". Merge the use-case skill's
own questions into the same message; never send a second round. If the user says "just go",
use every default.

1. **Quality tier:** Quick, Standard or Studio? [the use-case default below]
2. **Length and shape:** 30, 45 or 60 seconds; 16:9, 9:16 or 1:1? [the use-case default]
3. **Audience and takeaway:** who watches it, and what should they do afterwards (a link, a
   repo, "try the demo")? [developers; the repo link]
4. **Voice:** one of
   - **Natural narrator** (Deepgram; needs a `DEEPGRAM_API_KEY`);
   - **No narration: music, sound effects and on-screen text** (free, no API key; a finished
     film, the script shown as titles at a reading pace);
   - **System voice** (`say` / `espeak-ng`; free too, but it sounds robotic: fine for a draft);
   - **Your own recording**.

   [natural if a key is found; with no key, no narration for anything meant to be published,
   the system voice only if the user wants a quick draft]

   Check for the key first (`doctor <dir> --json`: `voice.key`) so the default in brackets is
   the real one. With no key, do not silently pick the robot voice: ask, defaulting to no
   narration. "No narration" sets `"voice": { "provider": "text" }` in the config (see
   `voice.md`); it also changes the script: fewer, shorter lines (`craft.md`, "Writing for
   reading").
5. **Limits and proof:** any names, brands, numbers or customer data that must not appear, and
   do you have a result number with its source? [none off-limits; proof from the repo only]

Use-case defaults:

| use case | tier | length and shape |
| --- | --- | --- |
| explainer | Standard | 60 s, 16:9 |
| launch | Standard | 45 to 55 s, 16:9 |
| jobhunt | Studio (a founder decides on it) | 60 s, 16:9 |
| hackathon | Quick if under an hour to the deadline, else Standard | 60 s or the rules' cap, 16:9 |
| shorts | Quick (or path A from an existing film) | 20 to 30 s, 9:16 |

Example message:

> This makes a 60 s film. Heads-up on cost: the agent reads your project and reviews
> rendered frames as images, so a Studio film is token-heavy (about 0.65M fresh plus 16M cached
> tokens measured per film); Standard is roughly half that and Quick about a fifth (estimates).
> Rendering itself runs locally. A few questions, reply "defaults" to skip:
> 1. Tier: Quick, Standard or Studio? [Standard]
> 2. Length and shape: 30/45/60 s, 16:9/9:16/1:1? [60 s, 16:9]
> 3. Who watches it, and where should they go after? [developers, the repo]
> 4. Voice: natural narrator (needs DEEPGRAM_API_KEY, not found here), no narration (music, sound effects and on-screen text; free, no API key), the system voice (free, robotic), or your own recording? [no narration]
> 5. Anything off-limits, and do you have a result number with its source? [none; repo only]

## 4. Record the answers

Write the answers at the top of `.trailer/brief.md` under "Intake" (tier, length, aspect,
audience, call to action, voice, limits, proof source). For "no narration", write
`voice: text (no narration)` and set `"voice": { "provider": "text" }` when the config is
written; every later render then uses it directly, with no key check and no fallback. Every later step reads the tier from
there and follows that tier's column above. In the delivery, name the tier used and, for Quick
or Standard, offer the next tier up in one line.

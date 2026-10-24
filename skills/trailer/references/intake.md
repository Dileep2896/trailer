# Intake: the token note, the quality tier and the pre-questions

Run this once, before any file is read or any engine call is made (the one exception is
`doctor --json`, to learn whether a voice key exists). It is a short text note followed by
one or two AskUserQuestion pickers. Every use-case skill (launch, jobhunt, hackathon, shorts)
runs it too, adding its own questions to the same pickers.

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

## 3. The pre-questions (option pickers, recommended first)

Ask with the **AskUserQuestion** tool, not as a typed list: the user clicks an option, and
every question gets a free-text box ("Other") for anything the options don't cover. Print the
token note and the tier summary (sections 1 and 2) as two or three lines of text first, then
call the tool. Ask only what the request and the repo don't already answer. If the user said
"just go" or "defaults", skip the questions and use every recommended option.

Tool rules: at most 4 questions per call, 2 to 4 options per question, a `header` of 12
characters or fewer. Put the default option **first** with "(Recommended)" at the end of its
label, so picking the top option everywhere equals the old "defaults". Never add an "Other"
option yourself; the tool adds the text box. Use at most **two** calls; never a third round.

### Call 1: the core four

| header | question | options (default first) |
| --- | --- | --- |
| `Tier` | Which quality tier? | the use-case default (Recommended), then the other two. Descriptions: Quick "cheapest, about a fifth of Studio's tokens (estimate); thinner story, no frame-by-frame polish"; Standard "about half of Studio (estimate); a complete film with one fix pass"; Studio "the full craft bar, up to 3 review loops; about 0.65M fresh + 16M cached tokens (measured)" |
| `Shape` | How long, and which aspect ratio? | the use-case default (Recommended), then up to three of: `60 s, 16:9`, `45 s, 16:9`, `30 s, 9:16`, `60 s, 1:1`. The user can type any other length or ratio in the text box |
| `Voice` | How should the film sound? | see the voice table below |
| `Audience` | Who watches it, and what should they do afterwards? | your best guess from the repo (Recommended), e.g. "Developers → star the repo", then one or two real alternatives from the repo (a demo link, a waitlist, an email found in the README). Never invent a URL or address |

Voice options. Check the key first (`doctor <dir> --json`: `voice.key`) so the order is right:

| option label | description |
| --- | --- |
| `Natural narrator` | Deepgram Aura-2; needs a `DEEPGRAM_API_KEY` (billed by Deepgram). Add "found" or "not found yet: you can paste it next" to the description |
| `No narration` | music, sound effects and on-screen titles; free, no API key, a finished film |
| `Mac system voice` (`System voice` off macOS) | `say` / `espeak-ng`; free but robotic, fine for a draft |
| `My own recording` | the user supplies a voice-over file |

Default: `Natural narrator` when the key is present; otherwise `No narration` first and
recommended. With no key, never default to the robot voice. "No narration" sets
`"voice": { "provider": "text" }` in the config (see `voice.md`) and changes the script:
fewer, shorter lines (`craft.md`, "Writing for reading").

### Call 2: only what is still open

Make this call only if at least one of these is needed, and fold them into one call (4 max):

1. **The Deepgram key** (only if the user picked `Natural narrator` and `voice.key` is
   `absent`). header `API key`, question: "Paste your Deepgram API key in the text box
   (Other). It is saved to .trailer/.env, which git ignores, and never shown again. Note:
   pasted text stays in this session's transcript; to avoid that, pick the first option and
   add it yourself." Options:
   - `I'll add it myself`: description: "Put `DEEPGRAM_API_KEY=...` in `<dir>/.trailer/.env`
     or export it in your shell, then say go."
   - `Use no narration instead`: description: "Free, a finished film with on-screen titles."

   If the user pastes a key into the text box, handle it as `voice.md` ("A key pasted at
   intake") says.
2. **Limits and proof.** header `Limits`, question: "Anything that must not appear, and do you
   have a result number with its source?" Options: `Nothing off-limits; proof from the repo
   only (Recommended)`, `Keep real names out`. The user types specific limits or a number
   with its source in the text box. Never invent a number.
3. **The use-case skill's own questions** (launch kind, hackathon event and length cap,
   jobhunt target and mode, shorts platforms). Turn each into options where the answer is a
   choice; leave free-text answers (an event name, a URL) to the text box, with the default
   from that skill's table as the first option.

If more than four are open, keep the key question and the ones with no safe default; use the
defaults for the rest and say which defaults you used in one line.

If the AskUserQuestion tool is not available (a non-interactive run, another host), fall back
to one typed message with each default in brackets, as in the example below, and accept
"defaults".

Use-case defaults:

| use case | tier | length and shape |
| --- | --- | --- |
| explainer | Standard | 60 s, 16:9 |
| launch | Standard | 45 to 55 s, 16:9 |
| jobhunt | Studio (a founder decides on it) | 60 s, 16:9 |
| hackathon | Quick if under an hour to the deadline, else Standard | 60 s or the rules' cap, 16:9 |
| shorts | Quick (or path A from an existing film) | 20 to 30 s, 9:16 |

Fallback typed message (only when the tool is unavailable):

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
audience, call to action, voice, limits, proof source). Never write a key, or any part of
one, into the brief. For "no narration", write
`voice: text (no narration)` and set `"voice": { "provider": "text" }` when the config is
written; every later render then uses it directly, with no key check and no fallback. Every later step reads the tier from
there and follows that tier's column above. In the delivery, name the tier used and, for Quick
or Standard, offer the next tier up in one line.

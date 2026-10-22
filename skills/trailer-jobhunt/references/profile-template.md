# The profile file

`.trailer/private/profile.md` is the only source of facts about the user. The template
is `${CLAUDE_PLUGIN_ROOT}/skills/trailer-jobhunt/assets/profile.template.md`.

## Setting it up

1. If `.trailer/private/profile.md` exists, read it and use it as it is.
2. If the user keeps a master profile somewhere else, copy it in only when they name the
   path. Never go looking for one, and never pull one from another project.
3. Otherwise copy the template there and tell the user, in one message, which sections the
   drafts need most: the name, the links, the signature, the credentials sentence and at
   least one experience block. Then carry on with the film, which doesn't need the profile.
4. Before you write anything into `private/`, confirm that `.trailer/.gitignore` lists
   `private/`. In a git repo, also run `git check-ignore -q .trailer/private/profile.md`.
   If the file isn't ignored, add the line to `.trailer/.gitignore` and tell the user.

The profile can live in each project, so every project can use different facts. It is
never committed, never rendered and never copied anywhere except quotes in the private
drafts.

## How each section is used

| section | used in | rule |
| --- | --- | --- |
| Identity: name | the film's `credit.text` ("Built by <name>"), the email signature, the job-board message sign-off | the credit appears only if the user agrees. If the name is missing, write `[FILL: name]`, which the frame review catches |
| Identity: headline, location, availability, work authorization | the email signature, and one optional line in the job-board message | only when it is filled in. Work authorization is mentioned only if the user wrote it down |
| Links | the link lines in every draft | full URLs only. The anchor text is the readable domain or "<repo> on GitHub" |
| Signature block | the email, exactly as written | never add a phone number or an address that isn't in the block |
| Credentials sentence | beat 4 of the email and the job-board message | word for word, or trimmed. Never extended, never "improved" with new claims |
| Experience and Projects | the one or two relevant-work sentences in beat 4 | pick by the "Relevant for" tags (below). Respect "OK to name this employer" |
| Other | only when it is directly relevant (a talk on the target's domain, for example) | at most one mention |
| Tone and words | every draft | add "Words I never use" to the humanizer ban list |
| Never claim | every draft | a hard limit. Check each draft against every line before delivery |

## Picking the about-me facts

Beat 4 has two parts, in this order:

1. **Credentials:** the profile's credentials sentence (one sentence, with numbers).
2. **Relevance:** one or two sentences about the specific work closest to the target's
   problem. Then stop. The portfolio link carries the rest, and a list of every past
   role reads as a resume, not a note.

To choose the relevance facts:

1. Write down the target's domain and the build's mechanism from the fit statement (for
   example "payables" and "fuzzy matching").
2. Score each Experience and Projects fact: 2 points if a "Relevant for" tag matches the
   domain, 2 if the fact names a similar mechanism, 1 if it has a number.
3. Take the top one or two. On a tie, prefer the more recent fact and the one with a number.
4. Rephrase only for length, and keep every noun and number. "Built the matching rules
   that flagged split payments" can't turn into "built an AI matching engine".

| target looks like | the facts that usually win |
| --- | --- |
| an agent or LLM infrastructure company | evals, tool-calling, guardrails, observability work |
| a data-heavy B2B tool | pipelines, schema or quality checks, reconciliation |
| a field or ops tool | offline-first work, reliability numbers, mobile |
| an early-stage startup (pre-seed or seed) | founder or first-engineer experience, shipping speed (hackathons, zero-to-one) |
| a devtools company | open source, CLIs, developer-experience work |

This table is a starting point. The profile's own tags always win.

## Missing facts

- Never fill a gap with a plausible guess. Write `[FILL: <what is needed, in plain words>]`,
  for example `[FILL: one sentence of relevant work with a number]`.
- Keep the placeholders visible in the drafts, and list each one at delivery with the
  profile section that would supply it.
- Count words with the placeholders left in. Expect the real text to be about the same
  length.
- If the credentials sentence is missing, don't compose one from the experience blocks.
  Leave a `[FILL: credentials sentence]` and suggest that the user write one.

## Things the skill never does with the profile

- Never combines it with outside information about the user (web search, LinkedIn, git
  history, earlier chats).
- Never puts profile facts in the film, the config, `brief.md`, `script.md`, the README or
  commit messages. The one exception is the credit name, and only if the user agreed.
- Never logs it, uploads it or sends it anywhere.

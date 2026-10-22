# Launch copy pack

After the film passes review, write one file, `.trailer/out/launch-copy.md`. It contains
every piece of text the user needs to post the film. These are **drafts only**. Never post,
schedule, publish a release, or create a draft in any app.

## Ground rules for every piece

- **Facts come only from `brief.md` and `script.md`:** the product, version, availability,
  link, numbers and sources. Anything missing becomes `[FILL: what is needed]`. Never guess
  a launch date, price, customer, user count or quote.
- **One story everywhere:** the film's hook (the pain), what shipped, one proof number, the
  link. The copy may carry more detail than the film, but never a different claim.
- **Voice:** the copy is the user's own voice, so first person is fine here (the narration
  lint applies to the film only). Ask once whether the post comes from a person or a company
  account if the brief does not say. Default to the person.
- **Humanize it:**
  - no em dashes (use commas, periods or parentheses);
  - none of these phrases: "excited to announce", "thrilled", "game-changer",
    "revolutionary", "seamless", "leverage", "unlock", "supercharge", "delve",
    "cutting-edge", "next-gen", "in today's fast-paced world";
  - no rhetorical question openers;
  - contractions are fine;
  - be specific rather than general: a moment and a number beat an adjective.
- **Numbers stay exact** as sourced. "4 times faster" stays "4 times faster", not "up to 5x".
- **Availability words** must match the brief exactly:

  | the brief says | the copy says | never |
  | --- | --- | --- |
  | tagged and deployed | "is live", "out today" | |
  | beta or preview flag | "in beta", "early access" | "launched", "available to everyone" |
  | waitlist | "join the waitlist" | "try it now" |
  | merged, not released | "coming in the next release" | "out now" |
  | self-host only | "open source, self-host it" | "sign up" |

## Template

Write the file in this order, with the character and word counts in brackets after each
heading, so the user can see that each piece fits its platform.

````markdown
# Launch copy: <Product> <version>

Film: .trailer/out/trailer-16x9.mp4 (<seconds> s) · captions: .trailer/out/trailer-16x9.srt
Poster: .trailer/out/poster-16x9.jpg · Link: <link.url>

## X / Bluesky post [<n> chars]
<hook line: the pain moment, ≤ 100 chars>
<what shipped + one proof number, ≤ 120 chars>
<link>

## LinkedIn post [<n> words]
<hook line, ≤ 12 words, must work before the "see more" fold>

<2-3 short paragraphs: the pain (1 concrete moment), what shipped and how it works (one
move), the proof number with its context>

<one line: who it is for / what to try first>

<link, or "Link in the first comment.">
<≤ 3 hashtags>

## Product Hunt
Tagline [<n>/60 chars]: <benefit, no product name, no emoji>
First comment [<n> words]:
<why it exists (the pain, 1-2 sentences) · what is in it (2-3 short lines, one per move) ·
who it is for · what feedback is wanted (one specific question)>

## Release notes intro [<n> words]
<2-4 sentences: what the release is about in user terms>

### Highlights
- <No. 1 beat, one line, (#PR)>
- <No. 2 beat>
- <No. 3 beat>

### Upgrade
<exact command or steps; breaking changes first>

Full changelog: https://github.com/<owner>/<repo>/compare/<FROM>...<TO>

## Video upload
Title [<n>/70 chars]: <Product> <version>: <benefit>
Description: <2 sentences + link>
Chapters:
0:00 <scene title>
0:<ss> <scene title>
...
Alt text for the poster [<n> chars ≤ 250]: <what the frame shows, plainly>
````

## Platform limits and habits

| piece | limit | notes |
| --- | --- | --- |
| X post | 280 characters; a link counts as 23 | Attach the MP4 natively (uploads play better than links) and upload the `.srt` where the platform allows it. Use 0 or 1 hashtag. |
| Bluesky post | 300 characters | Attach the video and put the link in the text. No hashtags needed. |
| LinkedIn post | 120 to 220 words works best; the first ~210 characters show before "see more" | Upload the video natively with the `.srt` caption file. Use 3 hashtags or fewer. Putting the link in the first comment is a common habit, so offer both forms. |
| Product Hunt tagline | 60 characters | Make it a benefit, not the name. Leave out "AI-powered" unless it is the point. |
| Product Hunt first comment | 80 to 180 words | It comes from the maker, in first person, and ends with one specific question. |
| Release notes intro | 40 to 90 words | User language. Link the compare URL. List breaking changes first in "Upgrade". |
| YouTube chapters | the first chapter at 0:00; at least 3 chapters, each at least 10 s | Build them from the `--json` `scenes` (`from` / 30 = seconds), merging scenes shorter than 10 s into their neighbour. |
| Video title | 70 characters or fewer | Product, version and benefit. |

Count the characters with the tools, not by eye: `printf '%s' "<text>" | wc -m`.

## Good and bad lines

| piece | bad | good |
| --- | --- | --- |
| X hook | "We're thrilled to announce Tinlark 1.0! 🚀🚀" | "Our nightly backup didn't run for 4 days. Nothing told us." |
| X body | "The best way to monitor cron jobs. Check it out!" | "Tinlark is live: one ping line per job, and a missed run is flagged within 2 minutes." |
| LinkedIn hook | "In today's fast-paced world, reliability matters more than ever." | "A backup that never starts leaves no error to catch." |
| PH tagline | "Tinlark: the revolutionary AI cron monitor" (42, but slop) | "Know when a scheduled job quietly didn't run" (44) |
| PH first comment ask | "Let me know what you think!" | "Which scheduler should get a one-click setup next: systemd timers or Kubernetes CronJobs?" |
| Release intro | "This release includes many improvements and bug fixes." | "2.0 is about fewer, better alerts. Job groups let one alert cover a whole batch, checks start 4 times faster, and daylight-saving weeks no longer shift your schedule." |
| Upgrade | "Just update!" | "Requires Node 20 or newer. Then `npm install tinlark@2`." |
| Alt text | "Video thumbnail" | "Tinlark jobs table with the nightly-backup row marked Late in red." |

## CTA lines for the film's outro, by availability

The outro line is narration, so it stays third person and short (5 to 10 words):

| availability | outro `say` | `link.text` |
| --- | --- | --- |
| live, free tier | "Tinlark is live today, free to start." | `tinlark.example` |
| live, paid | "Tinlark is live today." | `tinlark.example/pricing` |
| beta | "Tinlark is in open beta now." | `tinlark.example/beta` |
| waitlist | "The Tinlark waitlist is open." | `tinlark.example/waitlist` |
| open source | "Tinlark, free and open source on GitHub." | the repo URL (`repoUrl`) |
| release recap | "Update in one command. Tinlark 2.0." | `tinlark.example/changelog` |
| feature in an existing product | "Job groups are in Tinlark 2.0 today." | the docs page for the feature |

Write install commands in full on screen (`npm install`, not `npm i`): the first-person lint
reads a lone "i" as "I".

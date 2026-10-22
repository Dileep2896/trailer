# Brief: [Project name]

> The inventory behind the film. Every claim here points at a file or a URL. The film may only
> use what this brief can source. Replace every `[...]`.

## Intake

- **Tier:** [Quick | Standard | Studio] (see `references/intake.md`; every later step follows this tier's column)
- **Length and shape:** [30 | 45 | 60] s, [16:9 | 9:16 | 1:1]
- **Audience and call to action:** [who watches] -> [link, repo or "try the demo"]
- **Voice:** [Deepgram | system voice | own recording | captions and music only]
- **Off-limits:** [names, brands, numbers or data that must not appear, or "none"]
- **Proof source:** [the user's number and its source, or "repo only"]

## One-liner

[Project name] [does what] for [whom], so that [outcome].

## The problem

- **Who hurts:** [a role or one named person from the seed data]
- **What breaks:** [one concrete example, ideally a seed row: "record X says A, record Y says B"]
- **Why today's fix fails:** [the workaround and its cost: by eye, every time, slow, costly, misses some]
- **The moment:** [when and where it hurts: "Friday, 6 p.m., the deploy goes out"]

## The mechanism

[One sentence a 12-year-old follows.]

## Product moves (2 or 3)

| # | move | screen / component file | seed rows to show | the state change | cursor / spotlight / note target |
| --- | --- | --- | --- | --- | --- |
| 1 | [what it does] | `[path]` | [rows] | [row 2 flips to "Review"] | [deps.row1] |
| 2 | | | | | |
| 3 | | | | | |

## Proof

| number | what it measures | source (`file:line` or URL) | how it was measured |
| --- | --- | --- | --- |
| [3 of 40] | [updates needing review] | `[test/fixtures/week.json:12]` | [seed computation] |

If there is no measured number: [qualitative proof, or the one question asked of the user].

## Public evidence (optional)

| what people say | where (URL, kept here only) | generic attribution for the film |
| --- | --- | --- |
| [paraphrase or short quote] | [url] | ["a developer on a forum"] |

## UI tokens (`config.app`)

| token | value | original value | source file |
| --- | --- | --- | --- |
| font | [Inter] | [system-ui] | `[app/layout.tsx]` |
| mono | | | |
| bg | | | |
| surface | | | |
| subtle | | | |
| ink | | | |
| muted | | | |
| border | | | |
| accent | | | |
| onAccent | | | |
| good / bad / warn | | | |
| radius | | | |
| dark | | | |

Font mapping: [app font] -> [film font], because [closest available].

## Forbidden and banned terms

- `forbiddenTerms` (warn): [competitors, internal code names]
- `private/banned-terms.txt` (error, never committed): [names that must never appear]

## Assets the user owns

[logo of this project, music, recordings, screenshots] in `.trailer/assets/`.

## Open questions

[At most one, only if who hurts / what breaks / proof could not be found.]

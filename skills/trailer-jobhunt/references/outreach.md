# Outreach drafts

There are three private drafts, and all of them tell the same story. Write them after the
film renders, so the proof numbers in them match the film exactly. Every draft is a file the
user copies by hand. **Never send, post, schedule or create a draft in any mail or social
tool**, even when a connector for one is available.

| file | channel | names the target? | links |
| --- | --- | --- | --- |
| `.trailer/private/outreach/email.md` (+ `email.html`) | a cold email to a founder or the hiring team | yes, in both modes | Markdown hyperlinks (`email.html` keeps them clickable when pasted) |
| `.trailer/private/outreach/job-board-message.md` | the message box of a job board (e.g. YC Work at a Startup, Wellfound or LinkedIn Jobs), or any job-board DM | yes, in both modes | raw URLs on their own lines, at the end |
| `.trailer/private/outreach/linkedin-post.md` | a public LinkedIn post | **no**, unless the user asks explicitly | the link placeholder at the end, or in the first comment |

## Sources

| fact about | comes from | never from |
| --- | --- | --- |
| the user | `private/profile.md`, word for word or trimmed | memory, git config, web search about the user, earlier conversations |
| the target | `private/target.json`, things you read yourself on public pages | guesses, rumours, private or paywalled material |
| the build | `script.md`'s sources table (tests, seed data, benchmarks) | rounded or "about" versions of a measured number |

Copy numbers exactly as their source gives them. When a draft needs a fact that isn't
there, write `[FILL: what is needed]` and list it at delivery.

## The story spine

The same five beats appear in all three drafts. The email and the job-board message give each beat
one or two sentences.

1. **Why this company.** One specific, checkable thing about their product, users or a
   recent launch. It is an observation, not flattery.
2. **The problem.** The pain point with **one** concrete piece of evidence (from
   `target.json`, worded as the source worded it).
3. **The build.** What was built, why this feature over the obvious alternative, and **one**
   before → after number. Say plainly that it is a standalone demo on seed data.
4. **About me.** The profile's credentials sentence, then one or two sentences of the most
   relevant specific work (see profile-template.md, "Picking the about-me facts"). The
   portfolio link carries everything else.
5. **Links and the ask.** The code, the video and the portfolio, each on its own line, then
   one crisp ask ("Open to 20 minutes this week?").

## Humanizer rules (all three drafts)

- No em dashes or en dashes used as punctuation. Use a comma, a period or parentheses.
- Ban these phrases: "I hope this finds you well", "I came across", "passionate",
  "excited to", "thrilled", "leverage", "delve", "cutting-edge", "game-changer",
  "synergy", "seamless", "robust", "revolutionize", "unlock", "in today's fast-paced",
  "I'd love to pick your brain", and "rockstar" or "ninja". Also drop any word listed under
  the profile's "Words I never use".
- Contractions are fine. Specific beats general, and a verb beats an adjective.
- No bullet lists in the email or the job-board message. No paragraph runs longer than 2 sentences.
- Use one exclamation mark at most, and only in the LinkedIn post.
- Never overstate. "On the demo data" and "standalone demo" appear where they apply.
- Remove invisible characters (zero-width spaces, non-breaking spaces copied from the web).
- Don't flatter. "Your product is amazing" says nothing. "Your one-click approvals are why
  small teams pick you" proves that you looked.

## Counting words

Each draft puts its counted text between two lines that hold only `---`. Link lines
(`Code:`, `Video:`, `Portfolio:`, `Demo:`) are skipped, and so is everything outside the
markers. Count with:

```bash
awk '/^---$/{n++; next} n==1 && !/^(Code|Video|Demo|Portfolio|Repo|GitHub|LinkedIn):/' .trailer/private/outreach/email.md | wc -w
```

Use the same command for `job-board-message.md` and `linkedin-post.md`. Write the result into the
draft's `Words:` line, and redo it after every edit. If the count is outside the limit, cut
adjectives first, then whole clauses. Never cut the evidence or the number.

---

## 1. Cold email (`email.md`)

**Limits:** the body is **100 to 140 words** (it reads in 20 seconds on a phone). The
subject is **at most 8 words**. One ask.

**Subject:** name their problem or the build. Never "Job application", "Quick question",
"Opportunity" or the user's own name.

| bad subject | good subject |
| --- | --- |
| Software Engineer Application, Jane Doe | Catching resent invoices before payout |
| Quick question | A duplicate-payment check for your approvals |
| I built something for you! | Demo: holding twin invoices before the run |

**Template:**

```markdown
# Cold email: <Target> (draft, not sent)

To: [FILL: recipient address, which you look up and verify yourself]
Subject: <at most 8 words>
Words: <count> (body, limit 100 to 140)
Mode: named | independent

---
Hi <first name from target.json, else "there">,

<Beat 1: why this company, one sentence.> <Beat 2: the problem, with one piece of evidence.>

<Beat 3: what was built and why this feature, one or two sentences.> <One before → after number, on the demo data.>

<Beat 4: the credentials sentence from the profile.> <One or two sentences of the most relevant work.>

Code: [<repo name> on GitHub](<repo url>)
Video: [60-second demo]([VIDEO LINK])
Portfolio: [<portfolio domain>](<portfolio url>)

<One-line ask.>
---

<signature block from the profile, exactly as written>
```

`To:` is always the user's job. Never guess an address or infer a pattern from other
addresses. If the user hands you an address, put it in, and remind them to verify it.

**Also write `email.html`:** the same body (greeting through the ask) as minimal HTML, with
`<p>` paragraphs, `<a href>` links and no styles or scripts. Opened in a browser, copied
and pasted into a mail client, it keeps the links clickable. Leave out the To line, the
subject and the counts.

### Worked example (fictional target, fictional person, 118 words)

```markdown
# Cold email: Brindlepay (draft, not sent)

To: [FILL: recipient address, which you look up and verify yourself]
Subject: Catching resent invoices before payout
Words: 118 (body, limit 100 to 140)
Mode: named

---
Hi Ana,

Small finance teams pick Brindlepay for one-click approvals, so a thread on your community forum caught my eye. A vendor resent a paid bill with a "-B" suffix, and it went out twice.

I built Ledger Twins, a standalone demo on seed data. It matches new invoices on vendor, amount and line items instead of the number, and holds likely twins before the payment run. On the demo ledger it catches 6 of 6 planted duplicates with zero false holds.

I was the first engineer at a seed-stage fintech and took its reconciliation product from zero to 4 paying teams. There I wrote the matching rules that flagged split payments.

Code: [ledger-twins on GitHub](https://github.com/your-handle/ledger-twins)
Video: [60-second demo]([VIDEO LINK])
Portfolio: [janedoe.dev](https://janedoe.dev)

Open to 20 minutes this week?
---

Jane Doe
Full-stack engineer, fintech · Remote
janedoe.dev · github.com/your-handle
```

### The same email, done badly

> I hope this finds you well! I'm a passionate full-stack engineer excited to leverage my
> skills at an innovative company like Brindlepay. I came across your product and was
> blown away. I built a cutting-edge AI tool that could save your customers millions by
> detecting duplicate invoices seamlessly. I have 8 years of experience across many
> technologies and would love to pick your brain. Please let me know if you have any
> openings! (Links at the bottom of my resume.)

What's wrong with it: slop words, flattery, an invented number ("millions"), no evidence, no
mechanism, a vague credential that isn't in the profile, no links and an ask that's a demand.

---

## 2. Job-board message (`job-board-message.md`)

**Limits:** **120 to 170 words**, plain text (the box doesn't render Markdown). There is no
subject and no signature block beyond the short name from the profile. Raw URLs go on
their own lines at the very end. The same text works for other job-board DMs.

Compared with the email, this message has more room for beat 3 (the "why this feature over
the alternative" sentence) and for one line on why this stage or team fits the user's path.
That line has to come from the profile, never from a guess about what they want.

```markdown
# Job-board message: <Target> (draft, not sent)

Role: [FILL: role title from the job post, if there is one]
Words: <count> (limit 120 to 170)
Mode: named | independent

---
Hi <first name>,

<Beat 1.> <Beat 2, with the evidence.>

<Beat 3: what was built, why this over the obvious alternative, the number on demo data.>

<Beat 4: the credentials sentence and 1 or 2 relevant facts.> <Optional: one line on why this stage fits, from the profile.>

<One-line ask.>

<short name>

Code: <repo url>
Video: [VIDEO LINK]
Portfolio: <portfolio url>
---
```

---

## 3. LinkedIn post (`linkedin-post.md`)

The post is public, so it tells the story of the problem and the build, not of a pitch to
one company. **It never names the target**, in either mode, unless the user says so
explicitly. It never says "for <Target>", never tags their staff, and never implies
they asked for it.

**Hooks:** write **3 options**, each at most 12 words and each on a different pattern.
The user picks one.

| pattern | shape | example (fictional build) |
| --- | --- | --- |
| concrete moment | a scene with a time and an object | "Thursday, the same invoice came back with a new number." |
| contrarian or reversal | the common fix, then why it fails | "Duplicate checks match invoice numbers. That's exactly the problem." |
| result first | the measured outcome, scoped | "6 of 6 resent invoices caught before payout, on demo data." |

Avoid hooks like "I'm excited to share...", "Big news!", a question nobody asked,
"Unpopular opinion:" with nothing unpopular after it, and emoji walls.

**Body:** **120 to 220 words.** The pain in one or two short paragraphs, the mechanism in
one, the result with its honest scope, one line about what was learned or what's next, and
then the link line. Use short paragraphs and line breaks; a single numbered list of at most 3
lines is allowed. **At most 3 hashtags**, on the last line, specific to the domain
(`#accountspayable`, not `#tech`). Leave the link as `[VIDEO LINK]` / `[REPO LINK]`, and note
that the user may move the links to the first comment.

```markdown
# LinkedIn post (draft, not posted)

Words: <count> (body, limit 120 to 220)
Names the target: no

## Hook options (pick one, it becomes the first line)
1. <concrete moment>
2. <contrarian or reversal>
3. <result first>

---
<body: pain, mechanism, result with scope, what's next>

Video: [VIDEO LINK]
Code: [REPO LINK]
---

#<tag1> #<tag2> #<tag3>

Optional first comment: "Code and the 60-second film: [REPO LINK] [VIDEO LINK]"
```

If the user also wants a vertical cut for the post, hand off to trailer-shorts (the
`cuts.short` 9:16 at 30 s). A native video usually beats a link in the feed.

---

## Mode differences, at a glance

| | named mode | independence mode |
| --- | --- | --- |
| email and job-board message | name the target and their product freely | still name them (they are addressed to them and stay private) |
| evidence wording in the drafts | "a thread on your community forum" | the same (private) |
| evidence wording in the film | generic, with no URL on screen | generic, and banned terms are lint errors |
| repo link | the neutral repo | the neutral repo |
| LinkedIn post | no target name | no target name |

## Before you hand over the drafts

- [ ] Each `Words:` line comes from the count command and sits inside the limit.
- [ ] Each number appears in `script.md` sources, `target.json` or the profile.
- [ ] Each fact about the user appears in the profile, and nothing in "Never claim" is broken.
- [ ] No banned phrase and no em or en dash used as punctuation: grep for `—`, `–` and the
      phrase list.
- [ ] `[VIDEO LINK]` is present (the user replaces it after uploading), and every other link
      is a real URL from the profile or the repo.
- [ ] The email has one ask and no bullet list. The job-board message is plain text with the
      links last. The LinkedIn post has 3 hooks, at most 3 hashtags and no target name.
- [ ] The files are in `.trailer/private/outreach/`, and nothing was sent.

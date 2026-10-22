# Researching the target

This step finds what the target makes, the specific problem the build answers, and one to
three pieces of public evidence that the problem is real. Everything goes in
`.trailer/private/target.json`, which is gitignored. It takes about 10 minutes. It is
not a dossier.

## Ground rules

- Use **public sources only**: the company site, docs, changelog, pricing, the job post,
  public issues and discussions, launch posts, public talks or podcasts, and software
  review sites. Never use logged-in-only, paywalled, leaked or private material.
- **Read before you cite.** Only pages you actually opened in this session go into
  `evidence`. If a page won't load, leave it out. Don't cite it from memory.
- **People:** collect only first and last names and roles from a public team, about or job
  page, and only for the greeting. Don't collect personal emails, phone numbers, home
  locations or social profiles. Never guess an email address or infer an address pattern.
  The `To:` line is the user's job.
- If the user already gave you notes or links, start from those.
- Write down the date you read each page. Things change, and the drafts should say "a
  thread last month" only if that was true when you read it.

## What to collect

| field | what it holds | used in |
| --- | --- | --- |
| `company` | the name as they write it | the private drafts. In independence mode it also goes in `banned-terms.txt` |
| `product` | a one-line description of what they sell, and to whom | beat 1 |
| `users` | who uses it, at the domain level ("payables teams at 10 to 200 person companies") | the film's "who hurts" |
| `hook` | one specific, checkable thing worth noticing (a launch, a design choice, a metric they publish) | beat 1 of the email |
| `problem` | the specific problem the build addresses, in their users' words | the brief, the film's pain act and beat 2 |
| `evidence[]` | 1 to 3 entries, each `{ id, claim, quote, url, date, kind, generic }` | the film (as `generic`) and the drafts (specific) |
| `stack` | the languages and frameworks they use (from job posts or public repos) | build choices. Mirroring it is fine |
| `role` | the open role title and its link, if there is one | the job-board message |
| `people[]` | `{ first, last, role }` from public pages | the greeting only |
| `fit` | the one-sentence fit statement (below) | the brief, the script rationale and the drafts |
| `mode` | `named` or `independent` | every step |

```json
{
  "company": "Brindlepay",
  "product": "Invoice approvals and payouts for small finance teams",
  "users": "payables teams at small and mid-size companies",
  "hook": "One-click approvals from email, shown on their pricing page as the main feature",
  "problem": "A resent invoice with a changed number passes the exact-match duplicate check and is paid twice",
  "evidence": [
    {
      "id": "evidence-1",
      "claim": "A vendor resent a paid bill with a suffix and it was paid again",
      "quote": "The vendor just added -B and resent it. Nobody caught it until close.",
      "url": "https://community.example.com/t/duplicate-paid-twice/1234",
      "date": "2026-10-02",
      "kind": "forum thread",
      "generic": "an accounts payable lead on a forum"
    }
  ],
  "stack": ["TypeScript", "Postgres"],
  "role": { "title": "Founding Engineer", "url": "https://example.com/jobs/founding-engineer" },
  "people": [{ "first": "Ana", "last": "Okafor", "role": "Co-founder, CEO" }],
  "fit": "Brindlepay's users hit resent invoices that get paid twice; Ledger Twins shows matching on vendor, amount and line items, measured as 6 of 6 planted duplicates caught on demo data.",
  "mode": "named"
}
```

The example is fictional, and so is every URL in it.

## How strong is the evidence

Rank each candidate from strongest to weakest and keep the top one to three.

1. **The target's own public words** about the problem (their changelog, docs, issue
   tracker, a founder talk). They have already admitted the pain.
2. **Their users' public words** (forum threads, issues, reviews), especially ones with
   many replies or upvotes. Record the count.
3. **Domain-level data** from a credible public report, with a number and its scope.
4. **The build's own measurement** on seed data. This is proof, not evidence of pain, so it
   belongs in the proof act, never in the pain act.

Never use: an anonymous claim you can't open, your own guess at their metrics, competitor
marketing pages presented as fact, or anything about a named private customer of theirs.

## The fit statement

Write one sentence, in this form, and keep it in `target.json`, `brief.md` (in neutral
form) and the script rationale:

> "<Target>'s users hit <problem>; <project> shows <mechanism>, measured as <before → after on
> demo data>."

If you can't fill every slot, the build may not answer their problem yet. Say so to the
user before you make the film. That is more useful than a polished film of the wrong thing.

## Turning research into the film

- The **hook** and the **pain act** dramatize `problem` with fictional people and seed rows
  (a vendor called "Harbor Supply Co.", not one of their real customers).
- One `evidence` scene card per entry, at most 2 in the film, using the `generic` label as
  the `source`. The URL never appears on screen.
- The **turn** names the project, never the target.
- In named mode, the target may appear once, as text, on the outro ("An independent demo
  for teams like Brindlepay"). Never as a logo, and never in the narration's first 22 s.

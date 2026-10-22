# Independence mode

In independence mode, the build is presented as an independent project about a problem in
a domain, not as work for one company. Everything public stays neutral: the film, the
config, the brief, the script, the README, the code, the seed data, the commit messages, the
repo name and the LinkedIn post. Only three private files name the target:
`private/target.json`, `private/outreach/email.md` and `private/outreach/job-board-message.md`.

Turn it on with `--independent`, or when the user asks for it ("neutral", "don't name
them"), or when the decision table in SKILL.md picks it. Once it's on, it stays on for the
project, including every later re-render and cut.

## 1. Choose a neutral name

- The project name must not contain, abbreviate or pun on the target's company, product or
  feature names, and it must not echo their domain name.
- Coin a name that describes the mechanism ("Ledger Twins", "Drift Check"). Search it once,
  so you don't land on an existing product or trademark, and pick another if it collides.
- If the repo or package already carries a target-derived name, tell the user and suggest
  a rename. Don't rename a remote repo yourself.

## 2. Write `private/banned-terms.txt`

The file sits at `.trailer/private/banned-terms.txt` and is gitignored. Put one term on each
line; matching ignores case and respects word boundaries. Every hit in the config copy is a
**lint error** (exit 2). The file never goes into the config itself, which is why it lives
in `private/`.

Include:

- the company name and its legal and short forms ("Brindlepay", "Brindle Pay", "Brindlepay Inc")
- product and plan names, and feature names that are distinctive to them (not generic words
  such as "approvals")
- founder and team names (first and last names, as separate lines when they are
  distinctive)
- domains, subdomains and social handles ("brindlepay.com", "@brindlepay")
- repo and organization names on code hosts
- internal-sounding names you saw in their docs or job posts (codenames, team names)

Don't include generic domain words. Banning "invoice" would make the film impossible. If
a term is also an everyday word, keep it, but check its hits by hand rather than rewriting
every use.

```text
# .trailer/private/banned-terms.txt  (fictional example)
Brindlepay
Brindle Pay
brindlepay.com
@brindlepay
FastApprove
Ana Okafor
```

Lines that start with `#` are comments. Never remove a term to get the lint to pass:
rewrite the copy instead.

## 3. Neutral text everywhere

| place | rule |
| --- | --- |
| narration, on-screen text, bubbles, card text | describe the problem at the domain level: "payables teams", "AI note-takers", "memory layers for agents" |
| `meta.sources`, `script.md` sources, `brief.md` evidence | cite `private/target.json#evidence-N` and a generic label. No URLs that point to the target |
| seed data and UI copy in the app | fictional vendors, customers and people. Never the target's customers, staff or sample data |
| README, docs, code comments, package names | the domain problem and the build. No "built for <Target>", no links to their site, repos or issues |
| commit messages, branch names, PR and issue text | neutral. Suggest that the user check `git log` before pushing |
| `credit` | "Built by <name>", with no "for <Target>" |
| theme and app tokens | no copied brand colours, logos, mascots or product screenshots. Mirroring their **tech stack** is fine |
| `forbiddenTerms` (warnings) | the target's direct competitors, so the film doesn't name-drop |

## 4. Attribute evidence generically

The evidence stays true and specific about the problem, but leaves out who said it and
where.

| specific (private files only) | generic (film, brief, script) |
| --- | --- |
| "issue #812 on the target's GitHub, 54 comments" | "a public issue thread with 54 comments" |
| "their CEO on a podcast, March 2026" | "a founder in the space, speaking publicly" |
| "a review of the target on a software-review site" | "users of popular payables tools report..." |
| "their changelog says matching is exact-only" | "most checks only match the exact number" |

- Paraphrase distinctive quotes. A verbatim quote can be searched straight back to its
  source. Quote word for word only when the line is generic enough not to identify anyone.
- Numbers from public sources may stay ("54 comments", "a 32-day audit"), but leave out
  identifiers such as issue numbers, dates tied to one announcement, and unique product
  terms.
- The evidence `source` field on a card uses the generic label ("an accounts payable lead on
  a forum").

## 5. Verify (blocking before delivery)

Run all of these and expect no hits outside `.trailer/private/`.

1. **Engine lint:** `ENGINE <dir> --lint --json` returns `errors: []`.
2. **Repo text:** use the Grep tool, case-insensitive, for each banned term across the
   project, excluding `.trailer/private/`, `.trailer/out/`, `.trailer/voice/` and
   `node_modules/`. Pay attention to `README*`, `docs/`, `package.json`, the seed and fixture
   files, and `.trailer/brief.md` and `script.md`.
3. **Captions:** Grep the `.srt` and `.vtt` files in `.trailer/out/`.
4. **Commits:** run `git log --format='%H %s%n%b' | grep -i -F -f <(grep -v '^#' .trailer/private/banned-terms.txt)`.
   Report any hits to the user. Don't rewrite history yourself.
5. **Pixels:** on the contact sheet and the poster, read every visible word against the
   list, and look for logos or their brand palette.
6. **Remote names:** if `git remote -v` shows a repo or organization name that contains a
   banned term, tell the user.

## 6. If something leaked

| where | what to do |
| --- | --- |
| config, brief, script or app copy (not committed) | rewrite it, lint again and re-render. Only changed lines are re-voiced |
| a local commit that hasn't been pushed | tell the user which commits are affected, and suggest amending or an interactive rebase. Don't run it yourself |
| an already-pushed commit, a public repo, or an uploaded video | tell the user plainly. Rewriting public history or taking a video down is their call. Don't force-push |
| rendered pixels | fix the source and re-render. Delete the old `out/` file only if the user agrees |

## 7. What independence mode does not change

- The outreach email and the job-board message still name the target and their product, because
  they are private and addressed to them. They link the neutral repo and video.
- The film's quality bar is the same: concrete pain, a real metaphor, recreated UI and
  measured proof.
- It doesn't hide who built the project. The credit line and the repo owner stay.

# Release recap: from a tag range to 3 to 5 beats

A release recap is only as good as its beat list. This file turns `git log A..B`, merged PRs
and the CHANGELOG into 3 to 5 user-visible "shipped" beats, each with a source. Every count
the film says comes from a command in this file, and that command is written into the
sources table in `script.md`.

Run everything from the project root. Read-only git commands need no approval. The `gh`
commands need an authenticated `gh` (`gh auth status`). If it is not authenticated, skip
every `gh` step, because git alone is enough.

## 1. Find the range

### 1a. With tags

```sh
git tag --list --sort=-v:refname | head -n 10          # newest tags first (semver-aware)
git describe --tags --abbrev=0                         # newest tag reachable from HEAD
git describe --tags --abbrev=0 "v2.0.0^"               # the tag before v2.0.0
git tag --list 'web@*' --sort=-v:refname | head -n 5   # monorepo tags such as web@1.4.0
git rev-parse --is-shallow-repository                  # "true": ask before fetching history
```

Use the user's range when they give one (`recap v1.6.0..v2.0.0`). Otherwise use **the
previous tag up to the newest tag**. If HEAD is ahead of the newest tag, ask whether the film
should cover the release already made or what is unreleased on `main`. If it is the
unreleased work, the availability words must say "coming in the next release", not "out
now".

In a shallow clone, ask before running `git fetch --tags --unshallow`. It is a network call
and can be large.

### 1b. Without tags

```sh
git log -1 --format=%cs <ref>                          # commit date of a ref, YYYY-MM-DD
git log --no-merges --since=2026-09-01 --until=2026-10-01 --format='%h%x09%s'
```

Use a date range the user names ("September's changes"), or ask for the two refs. A
repository with no earlier release (its first tag, or no tags at all) gets a **product
launch** film, not a recap.

Below, `FROM` and `TO` are the two refs (for example `FROM=v1.6.0 TO=v2.0.0`).

## 2. Size the range (the tally numbers)

```sh
git rev-list --count --no-merges "$FROM..$TO"                                  # commits
git log --first-parent --format='%s' "$FROM..$TO" \
  | grep -cE 'Merge pull request #[0-9]+|\(#[0-9]+\)$'                         # merged PRs (merge and squash styles)
git shortlog -sn --no-merges "$FROM..$TO" | wc -l                              # contributors (a count only)
git diff --shortstat "$FROM" "$TO"                                             # files, insertions, deletions
git log -1 --format=%cs "$FROM"; git log -1 --format=%cs "$TO"                 # span, as dates
```

- Use at most **3 numbers** in the film. The usual best pair is merged PRs and contributors;
  the span in days is a good third. Lines of code are a poor number, so never lead with
  them.
- `git shortlog` lists names. Use the **count** in the film. Show names or handles only when
  the user asks for them, and never show emails (`-e`).
- If a GitHub release exists, its count of closed issues is also a usable source:
  `gh release view "$TO" --json body` and count the linked issues by hand. Do not guess the
  count.

## 3. List the changes

Prefer sources in this order, because each is closer to user language than the next:
**CHANGELOG entry > GitHub release notes > PR title and body > commit subject.**

```sh
# CHANGELOG section for one version (Keep a Changelog style "## [2.0.0]" or "## 2.0.0" / "## v2.0.0")
awk -v v="2.0.0" 'index($0, "## [" v "]") == 1 || index($0, "## " v) == 1 || index($0, "## v" v) == 1 || index($0, "## [v" v "]") == 1 {f=1; next} /^## /{f=0} f' CHANGELOG.md

# GitHub release notes, if published
gh release view "$TO" --json tagName,name,publishedAt,body,url
gh release list --limit 10

# Merged PRs in the range (dates from step 1; adjust the base branch)
gh pr list --state merged --base main --limit 200 \
  --search "merged:2026-09-01..2026-10-01" \
  --json number,title,labels,mergedAt,url,body

# git only: what landed on the main line (merge commits and squash-merged PRs)
git log --first-parent --format='%h%x09%s' "$FROM..$TO"

# every non-merge commit, and the breaking changes among them
git log --no-merges --format='%h%x09%s' "$FROM..$TO"
git log --no-merges --format='%h%x09%s%n%b' "$FROM..$TO" | grep -E 'BREAKING CHANGE|^[0-9a-f]+	[a-z]+(\([^)]*\))?!:'

# conventional-commit types at a glance
git log --no-merges --format='%s' "$FROM..$TO" | sed -nE 's/^([a-z]+)(\([^)]*\))?!?:.*/\1/p' | sort | uniq -c | sort -rn

# which areas changed (top-level directories with at least 5% of changed files)
git diff --dirstat=files,5 "$FROM" "$TO"

# monorepo: limit to one package
git log --no-merges --format='%h%x09%s' "$FROM..$TO" -- packages/web
```

## 4. From changes to beats

1. **Drop the noise:** `chore`, `ci`, `build`, `test`, `refactor` and `style` commits,
   dependency bumps (keep them only when they fix a security advisory, in the release notes,
   not the film), docs typos, bot authors (dependabot, renovate), reverts and their reverted
   commits, and anything behind a disabled feature flag.
2. **Cluster:** group what is left by conventional-commit scope, PR label, linked issue, or
   top-level path from `--dirstat`. Several PRs that build one feature count as one cluster.
3. **Score each cluster**, then sort:

   | signal | points | how to tell |
   | --- | --- | --- |
   | user-visible (UI, CLI flag, API or config surface) | 3 | touches routes, components, CLI parsing or public types |
   | measured (a number in a test, benchmark or PR body) | 2 | `grep` the PR body and the `bench/` or `test/` diff for the number, and keep the file and line |
   | asked for (closes issues, or an issue with many reactions) | 1 | "Closes #n" in PR bodies; optionally `gh issue view n --json reactionGroups` |
   | breadth (several PRs, or many files) | 1 | the cluster size |
   | breaking | flag | always goes in the release notes; in the film only when it changes what users do |

4. **Pick the beats:** 3 beats for 45 s, 4 for 50 to 55 s, 5 for 60 s. The highest score is
   **No. 1**: it gets recreated UI, `turn: true` and `poster: true`. Play the beats from the
   lowest rank up to No. 1.
5. **Translate each beat** into a before clause and an after clause, in 16 words or fewer, in
   the user's terms:

   | raw | beat line |
   | --- | --- |
   | `fix(sched): handle DST offset in tz calc (#412)` | "Around daylight saving, jobs used to show an hour late. Now the clock is right." |
   | `perf(agent): lazy-load probes, cold start 820ms -> 190ms (#428)` | "Checks start 4 times faster, so a new server is watched in seconds." |
   | `feat(groups): job groups with shared alert policy (#431, #436, #440)` | "Tag a batch of jobs once, and one alert covers all of them." |
   | `feat!: drop Node 18` | Release notes only: "Requires Node 20 or newer." Not a film beat. |

   A ratio such as "4 times faster" must follow from the source (820 ms to 190 ms is 4.3×,
   so "4 times" is honest, and "5 times" is not). Write the arithmetic into the sources
   table.
6. **Everything else** goes into the release notes as "and N more fixes", never into the film.

## 5. What goes into `brief.md` and `script.md`

In `brief.md`, under **Release mining**:

```markdown
Range: v1.6.0..v2.0.0 (2026-08-20 to 2026-10-01, 42 days)
| rank | beat | clusters / PRs | score | source |
| --- | --- | --- | --- | --- |
| 1 | Job groups | #431, #436, #440 | 3+1+1 | CHANGELOG.md "Added: Job groups"; src/groups/ |
| 2 | 4× faster start | #428 | 3+2 | PR #428 body: "820ms -> 190ms"; bench/start.bench.ts:31 |
| 3 | Daylight-saving fix | #412 | 3+1 | PR #412, closes #398 |
Dropped: 17 chore/ci/deps, 4 docs, 2 reverts. Breaking: Node 20 required (release notes only).
```

In the `script.md` sources table, give every spoken or shown number its command:

```markdown
| claim | source |
| --- | --- |
| 48 merged pull requests | `git log --first-parent --format='%s' v1.6.0..v2.0.0 \| grep -cE 'Merge pull request #[0-9]+\|\(#[0-9]+\)$'` → 48 (run 2026-10-02) |
| 9 contributors | `git shortlog -sn --no-merges v1.6.0..v2.0.0 \| wc -l` → 9 |
| 4 times faster start | PR #428: 820 ms → 190 ms = 4.3× (bench/start.bench.ts:31) |
```

Mirror the range and the beats into `meta.range` and `meta.sources` in the config.

## 6. Privacy in release data

- PR bodies and commit messages can name customers, internal codenames, private incidents or
  people. Never copy them into the film, the config or the copy pack. Describe the change
  generically and add those terms to `.trailer/private/banned-terms.txt`, where every hit is
  a lint error.
- In a private repository, treat internal ticket links, hostnames and staging URLs the same
  way. A recap film is usually public even when the repo is not.
- Never show `git log` output raw on screen. It carries author names and emails.

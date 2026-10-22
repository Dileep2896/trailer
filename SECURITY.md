# Security policy

## Supported versions

Trailer is young. Security fixes go into the latest release only.

| version | supported |
| --- | --- |
| 0.1.x | yes |
| older | no |

## Reporting a vulnerability

**Please don't report security problems in public issues, discussions or pull requests.**

Report them privately through GitHub's private vulnerability reporting:

1. Open https://github.com/Dileep2896/trailer/security/advisories/new (or go to the
   repository's **Security** tab and choose **Report a vulnerability**).
2. Describe the problem, the affected version or commit, and the steps or a minimal config
   that reproduce it. Say what an attacker could do with it.
3. Don't include real API keys or private data. Use placeholders.

You should get an acknowledgement within 7 days. We'll keep you updated as we confirm the
problem and work on a fix, and agree on a disclosure date with you, normally within 90 days of
the report or as soon as a fix is released. Reporters are credited in the advisory unless
they prefer not to be.

## What's in scope

Trailer runs on your own machine with your permissions, so these are the areas that matter
most:

- **Secrets:** any path by which `DEEPGRAM_API_KEY` could be logged, echoed, written into
  props, caches, outputs or `--json`, or sent anywhere other than Deepgram's API.
- **Untrusted configs and projects:** a `trailer.config.json`, `brief.md` or project file
  that makes the engine read or write outside the project's `.trailer/` folder and the
  engine's runtime folder (path traversal), run a command, or fetch an unexpected URL.
- **Capture:** the local static server (`engine/scripts/serve.mjs`) and the screenshot step,
  for example a server that binds beyond `localhost` or serves files outside the project.
- **The plugin:** a skill or command whose `allowed-tools` grants more than it needs, or
  instructions that would lead Claude to send, post or upload something without the user
  asking.
- **Supply chain:** the install step (`pnpm --frozen-lockfile` or `npm ci` into
  `TRAILER_HOME`) and the pinned dependency versions.

## What's out of scope

- Vulnerabilities in Remotion, Chrome Headless Shell, Playwright, ffmpeg, Node or other
  dependencies themselves. Report those upstream. We do want to hear about them if trailer
  uses a dependency in an unsafe way or pins a vulnerable version.
- Deepgram's service and account security.
- Problems that need an attacker who already controls your machine, your shell environment or
  your Claude Code settings.

## Good practice for users

- Keep `DEEPGRAM_API_KEY` in your environment or in a gitignored `.env`. `trailer init`
  writes a `.trailer/.gitignore` that excludes `.env`, `private/` and every generated folder.
- Never paste a key into a chat, an issue or a config file.
- Treat configs and projects from other people as untrusted code: read them before you render.
- Anything under `.trailer/private/` (profiles, outreach drafts, banned terms) stays local.
  Don't commit it.

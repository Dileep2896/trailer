# Characters and emoji

Every bundled asset is CC0 or MIT, cleared for commercial reuse without on-screen credit (the
full list with sources is in the engine's `public/characters/LICENSES.md` and the repo's
`THIRD_PARTY_NOTICES.md`). Use only these, or the code-drawn blobs. Never a company mascot,
never an asset you downloaded yourself unless it is CC0, MIT, Apache-2.0 or OFL **and** you
record it in both license files.

## Who exists

| `who` | what | moods | poses |
| --- | --- | --- | --- |
| `blob` | drawn in code, fully rigged (blinks, eyes look around, brows, mouth, squash and stretch) | `happy` `joy` `calm` `neutral` `sad` `worried` `angry` `surprised` `sleepy` `smug` `dizzy` `love` `determined` | n/a |
| `open-peeps/maya` `open-peeps/leo` `open-peeps/sam` `open-peeps/ivy` | CC0 hand-drawn people (busts) | `happy` `celebrating` `delighted` `confused` `suspicious` `frustrated` `angry` `stressed` `tired` `thinking` `calm` `awe` `fear` `cheeky` `serious` `driven` | n/a |
| `notionists/nia` `notionists/theo` | CC0 sketch busts with hands | `happy` `neutral` `confused` `frustrated` (subtle: mouth and brows) | `point` `wave` `ok` `phone` `hands-up` `idle` |
| `fluent/<emoji>` | MIT Fluent Emoji as a character or prop | n/a | n/a |

Looks: maya has a bun and headband (blue top), leo short hair and glasses (coral top), sam an
afro (teal top), ivy long curls (yellow top). theo wears glasses. Use notionists when a
character must **point at** a UI element or present.

### Blob options

- `shape`: `blob` `bot` `note` (sticky note) `cloud` `flame` (a spark) `doc` `dummy`
  (crash-test) `marble` `envelope` `sprout`
- `accessory`: `glasses` `chef-hat` `cap` `crown` `headset` `bowtie` `magnifier`
- `color`: any `#rrggbb` (default from the theme), `blush`

| job in the story | shape and accessory |
| --- | --- |
| a witness, a record, a stale fact | `doc` or `note` |
| an agent, a service, a pipeline | `bot` (+ `headset`) |
| a detective, an inspector | `bot` + `magnifier`, or `blob` + `glasses` |
| a chef, a host, a referee | `blob` + `chef-hat` / `bowtie` / `cap` |
| a test subject | `dummy` |
| a bug, a fault, a hidden problem | `flame` or `marble` |
| a message, a draft | `envelope` |
| growth, health, decay | `sprout` |
| the weather, a mood over the system | `cloud` |

## Emoji names

The same names work for `fluent/<name>`, `pops`, `props`, `emoji`, `avatar` and pin `emoji`.

- **Faces:** grinning-face-with-big-eyes, thinking-face, confused-face, face-with-steam-from-nose,
  persevering-face, weary-face, partying-face, star-struck, exploding-head, face-with-monocle,
  melting-face, smiling-face-with-sunglasses, face-with-spiral-eyes, face-screaming-in-fear,
  downcast-face-with-sweat, nerd-face, hugging-face, face-with-open-mouth, zany-face,
  smiling-face-with-hearts, sleeping-face, yawning-face, see-no-evil-monkey
- **People and hands:** person-facepalming, person-shrugging, person-raising-hand, technologist,
  backhand-index-pointing-right, clapping-hands, raising-hands, waving-hand, thumbs-up
- **Status:** check-mark-button, cross-mark, warning, no-entry, locked, sparkles, collision,
  light-bulb, hourglass-not-done, timer-clock, alarm-clock
- **Objects:** robot, rocket, party-popper, memo, books, envelope, receipt, ticket, luggage,
  airplane-departure, bellhop-bell, loudspeaker, satellite-antenna, television, round-pushpin,
  coin, money-bag, running-shirt
- **Kitchen:** cooking, pot-of-food, fork-and-knife-with-plate, spoon, salt
- **Weather and nature:** sun, sunrise, cloud, sun-behind-cloud, sun-behind-small-cloud,
  cloud-with-rain, cloud-with-lightning-and-rain, umbrella-with-rain-drops, rainbow, droplet,
  seedling, herb, potted-plant, blossom, sunflower, tulip, hibiscus, wilted-flower, bird, turtle

The authoritative list is the folder `public/characters/fluent-emoji/flat/` in the engine; the
lint fails on a name that is not there.

## A cast member

```json
{ "who": "blob", "shape": "bot", "accessory": "headset", "color": "#7c8cff",
  "x": 1320, "y": 860, "size": 300, "flip": false, "label": "THE PIPELINE",
  "mood": "smug", "at": "pipeline", "enter": "pop", "exit": { "at": "-0.5s", "kind": "fade" },
  "moods": [{ "at": "failed", "mood": "worried" }],
  "look": [{ "at": "blames", "dir": "left" }],
  "react": [{ "at": "failed", "kind": "shake" }],
  "move": [{ "at": "2s", "x": 1100, "dur": 0.6 }],
  "bubble": [{ "at": "pipeline", "until": "failed", "text": "Every job passed!", "kind": "shout", "side": "left" }],
  "pops": [{ "at": "failed", "emoji": "cross-mark" }],
  "sweat": "failed" }
```

| field | values |
| --- | --- |
| `x`, `y` | feet position in 1920x1080 author space (`y` defaults to the stage floor) |
| `size` | height in px (300 to 540 typical) |
| `enter` | `pop` `drop` `rise` `left` `right` `fade` `none` |
| `exit` | `{ at, kind? }` |
| `react[].kind` | `jump` `bounce` `shake` `tremble` `spin` `nod` `tilt` `shrink` `grow` `squash` `faint` |
| `look[].dir` | `left` `right` `up` `down` `center` |
| `bubble[].kind` | `speech` `thought` `shout`; `side` `left` `right`; `size` |
| `podium` | (cast scenes) a name plate under the character |

## Rules

- One job per character, at most 2 or 3 on stage (2 in portrait), fully inside the frame.
- Moods change on cue words, never randomly. A reaction lands on the word that causes it.
- Bubbles: 2 to 5 words, no real company or person names, linted like narration.
- A character's mood arc mirrors the story: worried in the pain, surprised at the turn,
  happy at the proof.
- Asset people (open-peeps, notionists) do not blink or emote beyond their mood files; use
  blobs when a character must react a lot.

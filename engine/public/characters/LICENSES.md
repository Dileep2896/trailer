# Character assets: sources and licenses

Every file under `public/characters/` is cleared for commercial reuse. None of it needs
on-screen attribution. Licenses were checked on 2026-10-21 against the source repo or the
license metadata that ships with each package.

| set | folder | license | source | files |
| --- | --- | --- | --- | --- |
| Open Peeps (art by Pablo Stanley), rendered with DiceBear | `open-peeps/` | **CC0 1.0** (public domain) | https://www.openpeeps.com, https://www.dicebear.com/styles/open-peeps/ (license metadata in `@dicebear/open-peeps@9.2.4` `lib/index.js`: `CC0 1.0`) | 4 characters x 16 expressions = 64 SVG |
| Notionists (art by Zoish), rendered with DiceBear | `notionists/` | **CC0 1.0** | https://www.dicebear.com/styles/notionists/ (license metadata in `@dicebear/notionists@9.2.4`: `CC0 1.0`) | 2 characters x 4 moods x 6 poses = 48 SVG |
| Microsoft Fluent Emoji | `fluent-emoji/3d/*.png`, `fluent-emoji/flat/*.svg` | **MIT** (Copyright (c) Microsoft Corporation) | https://github.com/microsoft/fluentui-emoji (LICENSE at repo root, `main` branch) | 86 emoji x 2 styles = 172 files |

DiceBear's own code is MIT. It was used only once, in a scratch install, to generate the
static SVGs. The engine has no runtime dependency on it.

Rejected: DiceBear `big-smile`, `micah`, `personas`, `adventurer` and `fun-emoji` (CC BY 4.0,
which requires attribution), OpenMoji (CC BY-SA 4.0), Humaaans and unDraw (custom licenses
with restrictions, not CC0 or MIT).

MIT requires keeping the copyright and permission notice with copies of the files. This file
and the repository's THIRD_PARTY_NOTICES.md cover that for the source. On-screen credit is not required.

## Contents

### `open-peeps/<who>/<mood>.svg` (bust, 704x704 viewBox, black line art with flat fills)

Characters: `maya` (bun and headband, blue top), `leo` (short hair and glasses, coral top),
`sam` (afro, teal top), `ivy` (long curls, yellow top).

Moods, the same 16 for each character, so a mood can be swapped mid-shot on the same head:
`happy` (smileBig), `celebrating` (smileLOL), `delighted` (lovingGrin1), `confused` (concerned),
`suspicious`, `frustrated` (rage), `angry` (veryAngry), `stressed` (hectic), `tired`,
`thinking` (explaining), `calm`, `awe`, `fear` (concernedFear), `cheeky`, `serious`, `driven`.

### `notionists/<who>/<mood>-<pose>.svg` (bust with hands, 1:1, black and white sketch)

Characters: `nia` and `theo` (glasses). Moods: `happy`, `neutral`, `confused`, `frustrated`.
The mood shows only in the mouth and brows, so it is subtle. Poses: `point` (one long arm up
and pointing), `wave`, `ok`, `phone` (looking at a phone), `hands-up` (two long arms, wave
and point), `idle` (no hands). Use these for pointing at a UI element, presenting and waving.

### `fluent-emoji/{3d,flat}/<name>.{png,svg}` (3D: 256x256 RGBA PNG; flat: SVG)

- Faces: grinning-face-with-big-eyes, thinking-face, confused-face, face-with-steam-from-nose,
  persevering-face, weary-face, partying-face, star-struck, exploding-head, face-with-monocle,
  melting-face, smiling-face-with-sunglasses, face-with-spiral-eyes,
  face-screaming-in-fear, downcast-face-with-sweat, nerd-face, hugging-face,
  face-with-open-mouth, zany-face, smiling-face-with-hearts, sleeping-face, yawning-face
- People and hands: person-facepalming, person-shrugging, person-raising-hand, technologist,
  backhand-index-pointing-right, clapping-hands, raising-hands, waving-hand, thumbs-up
- Objects: robot, party-popper, light-bulb, rocket, hourglass-not-done, warning,
  check-mark-button, sparkles
- Additional objects (same source and license, fetched from
  `assets/<Name>/3D/<name>_3d.png` and `assets/<Name>/Flat/<name>_flat.svg` on `main`):
  sun, cloud, sun-behind-cloud, sun-behind-small-cloud, cloud-with-rain,
  cloud-with-lightning-and-rain, umbrella-with-rain-drops, rainbow, satellite-antenna,
  television, round-pushpin, coin, turtle, alarm-clock, memo, cooking, pot-of-food, spoon,
  bellhop-bell, fork-and-knife-with-plate, money-bag, receipt, timer-clock,
  see-no-evil-monkey, locked, cross-mark, running-shirt, salt, luggage, airplane-departure,
  envelope, collision, no-entry, loudspeaker, ticket, bird, blossom, books, droplet, herb,
  hibiscus, potted-plant, seedling, sunflower, sunrise, tulip, wilted-flower

Fonts are not stored here: they load at render time through `@remotion/google-fonts` (each
family under the SIL Open Font License 1.1 or Apache 2.0, per Google Fonts).

## Animating them in Remotion

None of these sets has named, rigged parts. The SVGs are flat path groups, so animate the
whole figure: spring pop-in, squash and stretch, idle bob, head tilt (rotate around the
neck, about 50% x and 80% y), and shake for frustration. To change expression, cross-fade or
hard-cut between two mood files of the same character. A blink can be faked with a 2-frame
cut to `open-peeps/*/calm.svg`. Use `staticFile('characters/...')` with `<Img>`. The flat
Fluent SVGs take a CSS `filter` cleanly if one needs tinting to a video's palette. Keep the
3D PNGs at 256px or smaller on screen, or about 2x as a soft accent at most.

# Third-party notices

trailer's own code, skills, docs, example app, synthesized sound effects and music, and
code-drawn characters are released under the [MIT License](LICENSE), Copyright (c) 2026
Dileep Kumar Sharma.

This file lists everything trailer uses that someone else made, and the license each one is
under. Bundled assets are only accepted under CC0, MIT, Apache-2.0 or the SIL Open Font
License (see [CONTRIBUTING.md](CONTRIBUTING.md)). Licenses were checked on 2026-10-21.

## Remotion (separate license, not relicensed)

Trailer renders video with [Remotion](https://www.remotion.dev). Remotion is installed from
npm as a dependency when the engine first runs, and it is **not** distributed in this
repository. It is under its own license, the
[Remotion License](https://www.remotion.dev/license), **not** MIT:

- **Free License:** individuals, for-profit organizations with up to 3 employees, non-profit
  and not-for-profit organizations, and anyone evaluating whether Remotion fits, may use it
  for free, including commercially, to create videos and images.
- **Company License:** larger for-profit organizations need a paid Remotion company license
  ([remotion.dev/license](https://www.remotion.dev/license)).
- Copying or modifying Remotion's code to sell, rent, license, relicense or sublicense a
  derivative of Remotion is not allowed.

If you use trailer, you are a Remotion user and must comply with Remotion's license
yourself. trailer's MIT license applies only to trailer's own code. It does not grant any
rights to Remotion, and trailer is not affiliated with or endorsed by Remotion.

| package | version | license |
| --- | --- | --- |
| `remotion` | 4.0.534 | Remotion License |
| `@remotion/bundler` | 4.0.534 | Remotion License |
| `@remotion/cli` | 4.0.534 | Remotion License |
| `@remotion/renderer` | 4.0.534 | Remotion License |
| `@remotion/google-fonts` | 4.0.534 | Remotion License |
| `@remotion/layout-utils` | 4.0.534 | MIT |

On first render, Remotion downloads a headless Chrome build ("Chrome Headless Shell") from
Google, which is under its own terms. It is not part of this repository.

## Other npm dependencies

Installed at runtime from npm (pinned in `engine/package.json` and the lockfiles), not
vendored in this repository. Each package ships its own license file.

| package | version | license | copyright |
| --- | --- | --- | --- |
| `react`, `react-dom` | 19.2.0 | MIT | Meta Platforms, Inc. and affiliates |
| `playwright` | 1.64.0 | Apache-2.0 | Microsoft Corporation |
| `ajv` | 8.20.0 | MIT | Evgeny Poberezkin |
| `typescript` (dev) | 5.9.3 | Apache-2.0 | Microsoft Corporation |
| `@types/react` (dev) | 19.3.0 | MIT | Microsoft Corporation and DefinitelyTyped contributors |

Their transitive dependencies are listed in `engine/pnpm-lock.yaml` and
`engine/package-lock.json`.

## Character art (bundled in `engine/public/characters/`)

The per-file inventory is in
[`engine/public/characters/LICENSES.md`](engine/public/characters/LICENSES.md). None of these
sets needs on-screen attribution.

### Open Peeps (`open-peeps/`)

- Art by Pablo Stanley, [openpeeps.com](https://www.openpeeps.com), rendered to static SVG
  with [DiceBear](https://www.dicebear.com/styles/open-peeps/) (`@dicebear/open-peeps@9.2.4`).
- 4 characters (`maya`, `leo`, `sam`, `ivy`) x 16 expressions = 64 SVG files.
- License: **CC0 1.0 Universal** (public domain dedication).
  Legal code: https://creativecommons.org/publicdomain/zero/1.0/legalcode

### Notionists (`notionists/`)

- Art by Zoish, rendered to static SVG with
  [DiceBear](https://www.dicebear.com/styles/notionists/) (`@dicebear/notionists@9.2.4`).
- 2 characters (`nia`, `theo`) x 4 moods x 6 poses = 48 SVG files.
- License: **CC0 1.0 Universal** (public domain dedication).
  Legal code: https://creativecommons.org/publicdomain/zero/1.0/legalcode

DiceBear's own code is MIT. It was used once, outside this repository, to generate the static
SVGs above. Trailer has no dependency on it and does not include it.

### Microsoft Fluent Emoji (`fluent-emoji/3d/*.png`, `fluent-emoji/flat/*.svg`)

- From [github.com/microsoft/fluentui-emoji](https://github.com/microsoft/fluentui-emoji).
- 86 emoji in two styles (3D PNG and flat SVG) = 172 files.
- License: **MIT**. The license text, as required:

```text
MIT License

Copyright (c) Microsoft Corporation.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE
```

### Code-drawn characters

The rigged "blob" characters, speech bubbles and other shapes drawn in code
(`engine/src/v3/Character.tsx` and friends) are original to trailer, under MIT.

### Rendered media in this repository

These files are trailer renders of the fictional example app (made with Remotion, see
above). They contain frames drawn from the bundled art listed in this section (CC0 1.0 and
MIT, used under those licenses) and fonts from Google Fonts (below):

- `docs/media/driftcheck-16x9.gif`
- `docs/media/driftcheck-9x16.gif`
- `docs/media/driftcheck-poster.jpg`
- `examples/driftcheck/.trailer/assets/drift.png` (a capture of the example app's own page)

They are released with the rest of the repository under the MIT License; the bundled art
inside them stays under its own license.

## Fonts

No font files are stored in this repository. The engine loads fonts at render time from
[Google Fonts](https://fonts.google.com) through `@remotion/google-fonts`. Each family is
under the **SIL Open Font License 1.1** (https://openfontlicense.org) or the **Apache
License 2.0** (https://www.apache.org/licenses/LICENSE-2.0), as listed on that family's
Google Fonts page. Both allow use in videos, including commercial ones.

The engine's font registry (`engine/src/fonts.ts`) offers these families:

- **Sans:** Inter, Inter Tight, Geist, Sora, Space Grotesk, Manrope, DM Sans, Plus Jakarta
  Sans, Outfit, Archivo, Archivo Black, Syne, Unbounded, Bricolage Grotesque, Schibsted
  Grotesk, Hanken Grotesk, Familjen Grotesk, Work Sans, IBM Plex Sans, Lexend, Figtree, Onest,
  Chivo, Epilogue, Instrument Sans, Public Sans
- **Serif and slab:** Fraunces, Instrument Serif, Playfair Display, DM Serif Display,
  Newsreader, Source Serif 4, Libre Baskerville, Cormorant Garamond, EB Garamond, IBM Plex
  Serif, Literata, Lora, Gloock, Young Serif, Roboto Slab, Zilla Slab, Bitter
- **Condensed and display:** Bebas Neue, Anton, Oswald, Barlow Condensed, Archivo Narrow,
  Roboto Condensed, Saira Condensed, Teko
- **Mono:** JetBrains Mono, IBM Plex Mono, Space Mono, DM Mono, Fira Code, Geist Mono, Share
  Tech Mono, VT323
- **Rounded and hand:** Nunito, Quicksand, Fredoka, Rubik, Varela Round, M PLUS Rounded 1c,
  Baloo 2, Caveat, Permanent Marker, Kalam, Architects Daughter

The example film (`examples/driftcheck`) uses Space Grotesk, Inter and JetBrains Mono, all
under the SIL Open Font License 1.1.

## Sound and music

The sound effects (`engine/scripts/audio.mjs`, generated into the engine's runtime folder on
first run) and the music beds (generated per render) are synthesized by trailer's own code.
They are original and covered by trailer's MIT license. No third-party samples are included.

If you point a config at your own music or images, you are responsible for having the rights
to use them.

## Services

- **Deepgram** (optional): text-to-speech (Aura-2) and speech-to-text (Nova-3), used with your
  own API key and account. Audio you generate through Deepgram is subject to
  [Deepgram's terms](https://deepgram.com/terms). Trailer is not affiliated with or endorsed
  by Deepgram.
- **macOS `say`** and **`espeak-ng`** (optional fallbacks): system text-to-speech already on
  your machine, under their own terms. Trailer calls them; it does not include them.
- **ffmpeg** (required, system install or Remotion's bundled binary): under the LGPL or GPL
  depending on the build. Trailer calls it as a separate program and does not include it.

## Trademarks

Product names mentioned in the docs (Remotion, Deepgram, Claude Code, GitHub, Product Hunt,
TikTok, Instagram, YouTube, LinkedIn, X and others) belong to their owners. They are used only
to describe compatibility or a destination, and imply no endorsement.

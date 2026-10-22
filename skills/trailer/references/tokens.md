# Extracting the app's UI tokens

`config.app` makes recreated `ui` scenes read as **this app**. Pull every value from the app's
own source and record the file it came from in `brief.md`. Never copy another company's brand
colours, and never guess a colour that the source defines.

## The target shape

```json
"app": { "font": "Inter", "mono": "JetBrains Mono",
         "bg": "#0b0d10", "surface": "#13161a", "subtle": "#1b1f24", "ink": "#e8ecf1", "muted": "#9aa3ad",
         "border": "#262b31", "accent": "#5b8cff", "onAccent": "#ffffff",
         "good": "#3fbf7f", "bad": "#ef5b5b", "warn": "#e6a23c", "radius": 10, "size": 22, "dark": true }
```

| token | what it is | where it usually hides |
| --- | --- | --- |
| `bg` | page background | `body`, `--background`, `bg-background`, `colorScheme.surface` |
| `surface` | cards, panels | `--card`, `--popover`, `bg-white`/`bg-zinc-900`, `Paper` |
| `subtle` | hover rows, table stripes, inputs | `--muted`, `--secondary`, `--accent` (shadcn's "accent" is a subtle fill) |
| `ink` | primary text | `--foreground`, `text-gray-900`, `onSurface` |
| `muted` | secondary text | `--muted-foreground`, `text-gray-500` |
| `border` | hairlines | `--border`, `--input`, `divide-*` |
| `accent` | the brand action colour | `--primary`, `bg-primary`, `palette.primary.main`, `colorScheme.primary` |
| `onAccent` | text on the accent | `--primary-foreground`, `contrastText`, `onPrimary` |
| `good` `bad` `warn` | status colours | success / destructive / warning tokens, badge classes |
| `radius` | card corner radius in px | `--radius`, `rounded-lg`, `shape.borderRadius` |
| `size` | base text px | `html { font-size }`, `text-sm` on table rows (14 to 16 px in the app usually maps to 22 in a 1080p film) |
| `dark` | the app's default scheme | `class="dark"`, `prefers-color-scheme`, `ThemeMode.dark` |

If the app has both light and dark schemes, use the one its screenshots, README or default
`<html>` class use. If it has no tokens at all (plain HTML), sample the CSS it does have, and
fill gaps with neutral greys that match its mode.

## Where to look, by stack

### Tailwind CSS v4 (`@theme` in CSS)
`grep -rn "@theme" --include=*.css`. Tokens look like `--color-primary: oklch(0.62 0.19 259);`
and `--radius-lg: 0.75rem;`. Convert `oklch` and `rem` (below).

### Tailwind CSS v3 (`tailwind.config.{js,ts,cjs,mjs}`)
Read `theme.extend.colors`, `borderRadius` and `fontFamily`. Values are often
`hsl(var(--primary))`, so follow the variable into `globals.css`. If the app uses only stock
classes (`bg-indigo-600`), map the class to Tailwind's default palette value.

### shadcn/ui (CSS variables in `globals.css` / `app.css`)
`:root { --background: 0 0% 100%; --primary: 222.2 47.4% 11.2%; --radius: 0.5rem; }` and a
`.dark { ... }` block. The values are bare HSL triplets: wrap them as `hsl(H S% L%)` and convert.
Newer versions use `oklch(...)` directly.

### Plain CSS / CSS custom properties / Sass / CSS-in-JS
`grep -rn -- "--[a-z-]*:" --include=*.css --include=*.scss`, then `$primary:` in Sass,
`createGlobalStyle` or `theme = {` in styled-components and Emotion.

### MUI (`createTheme`)
`palette.primary.main`, `palette.background.default` / `.paper`, `palette.text.primary` /
`.secondary`, `palette.divider`, `palette.success/error/warning.main`, `shape.borderRadius`,
`typography.fontFamily`.

### Chakra UI (`extendTheme` / `createSystem`)
`colors.brand.500` (accent), `semanticTokens.colors`, `radii.md`, `fonts.body` / `.heading`.

### Mantine, Radix Themes, DaisyUI
Mantine: `createTheme({ primaryColor, colors, radius, fontFamily })`. Radix Themes:
`<Theme accentColor="..." radius="...">` (map the named scale to its step 9). DaisyUI:
`daisyui.themes` in the Tailwind config (`primary`, `base-100`, `base-content`...).

### SwiftUI / iOS
`Assets.xcassets/<Name>.colorset/Contents.json` (`components.red/green/blue` as 0 to 1 floats or
hex), `Color("AccentColor")`, and `extension Color { static let brand = ... }`. The system font
maps to Inter; SF Mono maps to JetBrains Mono.

### Android / Jetpack Compose
`res/values/colors.xml`, `themes.xml` (`colorPrimary`), Compose `lightColorScheme(primary = Color(0xFF...))`
(drop the `FF` alpha prefix). `Shapes(medium = RoundedCornerShape(12.dp))` gives the radius.

### Flutter
`ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Color(0xFF...)))` (the seed is the
accent), `ColorScheme(primary:, surface:, onSurface:, error:)`, `CardTheme(shape:
RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)))`, `GoogleFonts.<font>()`.

### Electron, Tauri, desktop and terminal apps
Read the renderer's CSS as above. For a CLI or TUI, the "app" is the terminal: use the
project's documented colour scheme (or a neutral dark terminal), `mono` everywhere, `radius` 6,
and `ui` scenes with `frame: "app"` holding `code` elements.

## Converting values

- **rem to px:** multiply by 16 (`0.5rem` is 8 px). Film radius = app radius (the film's UI is
  drawn at about 1.4x the app's CSS size, and the engine scales radius with it).
- **HSL, OKLCH, rgb() to hex:** compute it; do not eyeball it. These one-liners need nothing
  but Node (running them asks for permission once). Record the original value next to the hex
  in `brief.md`.

  ```sh
  # HSL: H S L (shadcn triplets work as-is). "222.2 47.4 11.2" prints #0f172a
  node -e 'const [h,s,l]=process.argv.slice(1).map(Number);const a=s/100*Math.min(l/100,1-l/100);const f=n=>{const k=(n+h/30)%12;const c=l/100-a*Math.max(-1,Math.min(k-3,9-k,1));return Math.round(255*c).toString(16).padStart(2,"0")};console.log("#"+f(0)+f(8)+f(4))' 222.2 47.4 11.2

  # OKLCH: L (0-1 or %) C H. "0.62 0.19 259" prints #3581f6
  node -e 'let [L,C,H]=process.argv.slice(1).map(Number);if(L>1)L/=100;const A=C*Math.cos(H*Math.PI/180),B=C*Math.sin(H*Math.PI/180);const l=(L+0.3963377774*A+0.2158037573*B)**3,m=(L-0.1055613458*A-0.0638541728*B)**3,s=(L-0.0894841775*A-1.291485548*B)**3;const g=x=>{x=Math.max(0,Math.min(1,x));x=x<=0.0031308?12.92*x:1.055*x**(1/2.4)-0.055;return Math.round(x*255).toString(16).padStart(2,"0")};console.log("#"+g(4.0767416621*l-3.3077115913*m+0.2309699292*s)+g(-1.2684380046*l+2.6097574011*m-0.3413193965*s)+g(-0.0041960863*l-0.7034186147*m+1.707614701*s))' 0.62 0.19 259
  ```
- **Alpha colours** (`rgba(255,255,255,0.08)` borders): blend over `bg` to get an opaque hex.
- **Flutter / Compose `0xFFRRGGBB`:** drop the leading `FF`.

## Mapping fonts to the available list

The engine loads a fixed set of Google Fonts (`config.md`). If the app's font is in the list,
use it. Otherwise pick the closest:

| app font | use |
| --- | --- |
| system-ui, -apple-system, SF Pro, Segoe UI | Inter |
| Helvetica, Arial | Inter Tight |
| Roboto, Noto Sans | Figtree or Inter |
| Poppins, Montserrat | Plus Jakarta Sans or Outfit |
| Open Sans, Source Sans | Public Sans or Work Sans |
| Lato, Nunito Sans | Hanken Grotesk or Nunito |
| Satoshi, General Sans | Manrope |
| Cal Sans, Clash Display | Bricolage Grotesque or Syne |
| Georgia, Times, Merriweather | Source Serif 4 or Lora |
| SF Mono, Menlo, Consolas, Courier | JetBrains Mono |
| Geist / Geist Mono | Geist / Geist Mono |

Record the mapping ("app uses Satoshi; film uses Manrope") in `brief.md`.

## Checks before you move on

- `ink` on `bg` and `ink` on `surface` reach at least 4.5:1; `onAccent` on `accent` at least 4.5:1.
- `good`, `bad` and `warn` are distinguishable from each other and from `accent`.
- The film's `theme.accent` differs from `app.accent` unless the world is meant to be the app.
- Every value has a source file in `brief.md`.

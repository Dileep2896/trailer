# Platforms

Which cut goes where, what each platform's interface covers, and how to write the post text
in `.trailer/out/short-captions.md`. The skill only writes files. It never uploads, posts,
schedules or logs in anywhere.

Platform limits change often. The numbers below are the practical targets this skill
designs to (late 2026), kept well inside each platform's current maximums. Before relying
on an exact maximum, check the platform's own help centre.

## Which cut for which platform

| platform | cut | aspect | length to aim for | why |
| --- | --- | --- | --- | --- |
| TikTok | `short` | 9:16 | 15 to 30 s | full-screen feed; the replay counts |
| Instagram Reels | `short` | 9:16 | 15 to 30 s | full-screen; the profile grid shows a 3:4 crop of the cover |
| YouTube Shorts | `short` | 9:16 | 20 to 30 s | the Shorts shelf; square uploads also count as Shorts |
| LinkedIn | `square` | 1:1 | 30 to 45 s | a square holds its full size in the feed on desktop and mobile; a slightly longer cut with a pain beat suits the audience |
| X | `square` | 1:1 | 20 to 40 s | square previews well in both timelines; vertical works on mobile but shows narrow on desktop |
| Bluesky, Threads, Mastodon | `square` | 1:1 | 20 to 40 s | square is the safest preview everywhere |

If the user only wants one file, make the 9:16 short. If they post mostly on LinkedIn or X,
make the square the main deliverable.

## Encoding

The engine renders H.264 video with AAC audio at 30 fps: 1080 x 1920 for 9:16 and
1080 x 1080 for 1:1, loudness-normalized. Every platform above accepts that file as it is,
so never re-encode or upscale it. Under 45 s, the file is far below every platform's size
limit.

## Interface overlays (why the safe box is shaped the way it is)

| zone in the 9:16 frame | covered by |
| --- | --- |
| top 220 px | status bar, the For You / Following tabs, search, the Reels camera icon |
| bottom 420 px | the username, the post text (first line or two), the sound or music line, the progress bar, and on YouTube the subscribe button and title |
| right 136 px | the like, comment, share, save and remix rail, and the spinning sound disc |
| left 64 px | margin only |

The 9:16 safe box covers the strictest of these overlays at once, so one render works on
TikTok, Reels and Shorts. Never make a platform-specific 9:16 render unless the user asks.

## Captions on the platform

- The video already carries burned-in captions. **Do not switch on the platform's
  auto-captions** (TikTok, Instagram and YouTube all offer them); doing so shows two sets of
  captions on top of each other.
- The engine also writes `.srt` and `.vtt` files. Upload the SRT only where captions stay off
  until the viewer turns them on, which is mainly YouTube (good for search and screen
  readers). On LinkedIn and X an uploaded caption file can show by default, which doubles
  the text. Skip it there, or render a clean cut for those platforms with
  `"captions": { "enabled": false }` in its cut and upload the SRT instead.
- Alt text: where the platform has a field for it (X, Bluesky, Mastodon, LinkedIn on some
  clients), write one plain sentence about what the video shows, in
  `short-captions.md`.

## Covers and crops

- The engine writes a poster per aspect, from the scene marked `poster: true`. For a short,
  mark the hook scene or the proof scene, never the outro.
- **Instagram's profile grid** crops a Reel cover to 3:4 around the centre: the middle
  1080 x 1440 of the 1080 x 1920 frame (y 240 to 1680). Keep the cover's key text inside it.
- **TikTok and YouTube** let the user pick a frame from the video as the cover. In
  `short-captions.md`, name the timestamp of the best frame (usually the hook at about
  0.8 s or the proof number at the end of its count).
- **LinkedIn and X** use the first frame until playback starts. In 9:16 and 1:1 the engine
  draws frame 0 as scene 1 settled, so make scene 1 read well as a still.

## Post text rules

All platforms:

- The first line is a hook, and it is not the same sentence as the video's spoken hook. It
  should add to the video, not repeat it.
- The same claims and numbers as the video, from the sources table in `script.md`. No
  engagement claims, no "viral", no invented user counts or stars.
- Say plainly what it is: "an open-source CLI", "a demo on sample data", "a weekend build".
  If the numbers come from the project's seed or demo data, say so.
- Humanized: no em dashes (use commas, periods or parentheses), no slop words
  ("revolutionary", "game-changer", "leverage", "delve", "unlock", "seamless",
  "cutting-edge", "supercharge"), contractions fine, no stack of emoji.
- One link, the repo or the product (`link.url` ?? `repoUrl`). On platforms that suppress
  posts with links (LinkedIn is the usual worry), offer the option of putting the link in
  the first comment, and let the user decide.
- No company names, people's names or handles that are not already in the config, the
  brief or the user's own instructions. Never tag anyone on the user's behalf.

Per platform:

| platform | text length to aim for | hashtags | notes |
| --- | --- | --- | --- |
| TikTok | 1 to 3 short lines, under 150 characters before the hashtags | 3 to 5, specific (#devtools, #opensource, the language) | the first line shows over the video; keep it short |
| Instagram Reels | 1 to 3 lines; the first 125 characters show before "more" | 3 to 5 | Instagram now caps hashtags at a small number; check the current limit |
| YouTube Shorts | title up to about 60 characters (the hard limit is 100); a 1 to 3 line description with the link | 1 to 3 in the description; #Shorts is optional | the title is what search sees; put the project's category in it |
| LinkedIn | 600 to 1,300 characters; the first 2 lines (about 200 characters) show before "see more" | 0 to 3 | a short story: the problem, what was built, one number, what it is (demo or product), the link; paragraph breaks every 1 or 2 sentences |
| X | under 280 characters, including the link (which counts as 23) | 0 or 1 | one line of hook, one line of proof, the link |
| Bluesky | under 300 characters | 0 or 1 | like X; add alt text |
| Threads | under 500 characters | 0 or 1 | like X |

## Template: `.trailer/out/short-captions.md`

Write only the sections for the platforms in `--platforms` (default: TikTok, Reels, Shorts,
LinkedIn, X). Fill every field; if a fact is unknown (the user's handle, a launch date), write
`[FILL: what is needed]` rather than inventing it.

```md
# Post copy for <projectName>

Files: <9:16 mp4 path> (TikTok, Reels, Shorts) · <1:1 mp4 path> (LinkedIn, X)
Captions are burned in: leave the platform's auto-captions off.
Numbers used: <each number and its source row in script.md>

## TikTok
Cover frame: <timestamp> (<what is on screen>)
<line 1: hook>
<line 2: what it is, plus the link or "link in bio">
#<tag> #<tag> #<tag>

## Instagram Reels
Cover frame: <timestamp>; key text stays inside the middle 1080 x 1440
<first 125 characters carry the hook>
<one or two more lines>
#<tag> #<tag> #<tag>

## YouTube Shorts
Title: <up to about 60 characters>
Description:
<one or two lines>
<link>
Captions file: <srt path> (upload; YouTube keeps it off until the viewer turns it on)

## LinkedIn
<hook line>
<the problem, one or two sentences>
<what was built and what it does, one or two sentences>
<one number, with what it was measured on>
<what it is: open source, a demo on sample data, a product>
<link, or "link in the first comment">
Alt text: <one sentence>

## X
<hook> <proof> <link>
Alt text: <one sentence>
```

Show the file's path to the user in the delivery. Never paste the copy into any platform,
never open a compose window and never send it anywhere.

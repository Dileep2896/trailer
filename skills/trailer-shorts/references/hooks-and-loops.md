# Hooks, arcs and loops

The first 1.5 s decide whether anyone watches, and the last 2 s decide whether they watch
again. This file covers both ends and the arc between them. Every example is fictional.
Pacing, explaining and kinetic type rules for all films are in
`${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/craft.md`; the format entries (F11, F17,
F18, F19, F20) are in `${CLAUDE_PLUGIN_ROOT}/skills/trailer/references/formats.md`.

## What a hook must do

- **Land by 1.5 s.** At 2.1 words a second, that is the first 3 or 4 spoken words. The rest
  of the sentence may run to about 3 s. The lint warns when the hook starts after 1 s, and
  when the first line runs over 8 words.
- **Be on screen at frame 0.** The same idea as type, a UI already mid-action, or a split
  already showing both sides. The muted viewer sees it before any word plays.
- **Be concrete.** A moment, a number or a contradiction, from the project's own seed data
  or the brief's sources. Never a category ("productivity", "developer experience").
- **Not name the project.** Nobody cares about the name yet. The name comes on the turn.
- **Match the payoff.** The hook asks or shows something the proof beat answers. A hook the
  short never pays off is clickbait, and viewers punish it by leaving.

## Hook library

| hook | shape | on screen at frame 0 | fictional line | best with |
| --- | --- | --- | --- | --- |
| **Contradiction** | two true things that cannot both be fine | kinetic: the first half, the second half punches in on its word | "Your tests passed. Prod is down." | Spot the Fake, Before/After Swipe |
| **The number** | one startling, sourced number | kinetic `count` or a `metric` already counting | "1 test failed 40 times this week." | any; needs a real number |
| **The after first** | show the clean end state, then rewind | the after half of a `split`, or the finished UI | "This queue was 40 deep this morning." | Before/After Swipe; a cut that moves the proof scene first |
| **The question** | a question the target viewer already asks | kinetic: the question, 5 words or fewer | "Which of these PRs is risky?" | One Question, Spot the Fake |
| **Already moving** | the product mid-action, cursor already travelling | `ui` with the cursor and a state change inside the first second | "Watch this one click." | Speedrun; visual products |
| **Callout** | names the viewer by their situation | kinetic: the situation | "If you review 40 PRs a week," | narrow audiences, LinkedIn |
| **The countdown** | a promise of N quick things | `countdown` or kinetic `3` | "3 things shipped this week." | Countdown Changelog |
| **The timer** | a running clock | `title` hud with a timer already running | "Zero to deployed. Clock's running." | Speedrun, hackathon cuts |

### Hooks that fail

| bad hook | why it fails | instead |
| --- | --- | --- |
| a logo sting or a title card with the project name | a stranger has no reason to care about a name | open on the pain or the payoff; name it on the turn |
| "Introducing...", "Meet...", "Say hello to..." | announces instead of showing | the contradiction or the number |
| "Have you ever wondered...", "What if I told you..." | a rhetorical question with no stakes | a specific question, or a number |
| "In today's fast-paced world..." | throat clearing; the first 1.5 s are gone | start at the moment of pain |
| a fade from black, or a `lead` on scene 1 | the first frame is blank, which is the thumbnail and the first impression | `lead: 0`, `transition: "cut"`, type visible at frame 0 |
| a hook spoken before anything is on screen | muted viewers see nothing | put the hook text in the picture too |
| a claim the short never proves | feels like bait | make the proof beat answer the hook |
| an invented or rounded-up number | breaks trust and the sources rule | use the sources table, or a qualitative hook |

## Arcs with timings

Every arc ends where it started, so it can loop.

### Default short (28 to 30 s)

| time | beat | words | typical scene |
| --- | --- | --- | --- |
| 0 to 1.5 s | hook lands | 3 or 4 of a 4 to 8 word line | `kinetic`, `title` or `split` |
| 1.5 to 6 s | stakes: why it hurts, or why today's fix fails | 6 to 10 | the same scene, or `evidence` with 1 card |
| 6 to 9 s | turn: the project is named (`turn: true`, the drums enter) | 3 to 6 | `kinetic` |
| 9 to 21 s | the move: one product action in recreated UI, cued to the cursor and states | 20 to 26 | `ui` |
| 21 to 26 s | proof: one number, before and after | 7 to 10 | `metric` or `split` |
| 26 to 30 s | loop: name or link, running on into the hook | 4 to 8 | `outro` with `loop: true` |

### Micro short (15 s)

| time | beat | words |
| --- | --- | --- |
| 0 to 1.5 s | hook | 4 to 6 |
| 1.5 to 9 s | turn and move together ("The project replays it and flags the fixture.") | 14 to 18 |
| 9 to 12.5 s | proof | 5 to 7 |
| 12.5 to 15 s | loop | 3 to 5 |

### Square long (40 to 45 s)

The default short plus a pain beat with one piece of evidence (6 to 14 s) and a second line
on the move. Still one product move, still at most two numbers.

### Format arcs for shorts

| format | 0 to 2 s | middle | end, looping to the start |
| --- | --- | --- | --- |
| F19 Before/After Swipe | the before state, divider at the edge | the divider swipes across on the turn word; the UI shows the one move that made the change | the divider parked at the edge again, before state peeking |
| F20 One Question | the question in kinetic type | a 3-beat answer in the UI (beat 1 what, beat 2 how, beat 3 the result) | the same question, now answered with a tick, cutting back to the question |
| F17 Countdown Changelog | "3" lands | one beat per shipped item, the top one in recreated UI | the scoreboard flips to FINAL; the last frame matches the opening digit's background |
| F11 Spot the Fake | two or three candidates side by side, "which one?" | half a second of silence, then the UI marks the bad one and says why | the candidates again, unmarked |
| F18 Speedrun | the timer HUD at 00:00, already ticking | splits per step | the final time; the HUD resets to 00:00 |

## Loop endings

Platforms replay a short automatically. A clean loop turns that replay into a second watch.

- **Run-on line.** The last line is the first half of a sentence that the hook completes.
  "Next time your tests pass," then the replay begins with "Your tests passed. Prod is
  down." Read the two lines aloud back to back; they should sound like one sentence.
- **Matching frames.** The outro takes `loop: true`: the engine fades its last 12 frames
  into frame 0 (scene 1 settled), so the last frame is frame 0. Giving the outro scene 1's
  `bg` keeps that fade calm. Check with stills at 0 s and at the final 0.1 s, side by side.
- **Return to the question.** One Question shorts end on the question itself.
- **Short end card.** The outro holds 1.5 to 2.5 s. The link pill shows, but a long "thanks
  for watching" card kills the loop. The link goes in the post text anyway.
- **No hard stop sound** on the last frame (a big impact or a gavel). Let the music bed run
  out under the hold, so the replay does not jolt.

## Line craft for shorts

- One clause per caption chunk where possible. With `maxWords: 3`, a line like "It flags
  the one shared fixture" reads as "It flags the" / "one shared fixture". Prefer word orders
  whose 3-word chunks each make sense: "It flags" / "one shared fixture".
- Digits, not words, for numbers ("40", not "forty"), so captions show digits.
- Every cue word is a word the line really says. When rewriting a film line shorter, keep
  the cue words or recue (prefixes of 4 or more letters match: `"flag"` matches "flagged").
- The turn line names the project once. After that, "it".
- No adjectives doing the work of evidence ("powerful", "blazing", "seamless"). Show it.
- Third person about the project, unless the config sets `narration.person`.

### Rewriting a film line into a short line

| film line (fictional, 60 s pace) | short line | what changed |
| --- | --- | --- |
| "Every night the suite runs 2,000 tests, and somewhere in there one of them fails for no reason at all." | "1 test failed 40 times this week." | the number moved to the front; the setup went |
| "The usual fix is to rerun the job and hope, which means nobody ever finds out which test is actually flaky." | "So everyone just reruns it." | one picture of the failing fix |
| "It replays every failing run side by side, then highlights the one fixture that all of them share." | "It replays the failures and flags the shared fixture." | one action, both cue words ("replays", "flags") kept |
| "Over two weeks on the demo data, reruns went from 40 a week down to just 3." | "Reruns dropped from 40 to 3." | same sourced numbers, fewer words |

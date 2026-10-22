# Formats library: F01 to F20

A **format** is a narrative device: how the film opens, how it explains, how the pain shows,
how the product shows, and how it ends. A new theme on the same structure is not a new format.
Two films in the same repo should never share a format (`.trailer/out/history.jsonl` lists the
ones already used).

Every example below is a **made-up project** to show the shape. None of them is a real product,
and no numbers here come from any real build. Take the structure, never the example's facts.

## How to choose

1. Write the problem in one sentence: "X happens to Y because Z."
2. Find its **shape** in the table below (two things disagree, one change spreads, work
   repeats, things vanish...).
3. Shortlist the 3 formats whose metaphor matches that shape best. Prefer the one where the
   metaphor also explains **the mechanism**, not only the pain (a checkpoint explains risk
   tiers; a courtroom explains weighing evidence).
4. Drop any format in `out/history.jsonl`, and any format whose metaphor would trivialize the
   domain (no game show about a medical incident).
5. Write "Why this fit" in `script.md`: what in the problem maps to what in the metaphor.

| # | format | problem shape | best use cases | default tone | length |
| --- | --- | --- | --- | --- | --- |
| F01 | The Courtroom | two records disagree; someone must decide which is true | explainer, jobhunt | formal, dry wit | 60 s |
| F02 | Instant Replay | two runs of the same thing diverge at one step | explainer, jobhunt | play-by-play, punchy | 60 s |
| F03 | The Forecast | one change spreads across many places | explainer, launch | warm forecaster | 60 s |
| F04 | The Loop | the same work repeats, piles up, hides the real issue | explainer, jobhunt | wry, rhythmic | 60 s |
| F05 | Crash-Test Lab | must be tested safely before real use | explainer, hackathon | clinical, light | 60 s |
| F06 | The Checkpoint | many items, sorted by risk: most pass, some checked, few stopped | explainer, jobhunt, launch | calm announcer | 60 s |
| F07 | Test Kitchen | tune a recipe (rule, prompt, threshold) by tasting samples | explainer, jobhunt | cheerful TV chef | 60 s |
| F08 | Chalkboard Lesson | a rule must be taught before the fix makes sense | explainer, jobhunt | friendly teacher | 60 s |
| F09 | POV Switch | two sides see the same data differently | explainer, jobhunt | empathetic | 60 s |
| F10 | Two Lanes, One Input | same input, different response, different outcome | explainer, jobhunt, shorts | grounded | 60 s / 30 s |
| F11 | Spot the Fake | an error hides in plain sight | explainer, jobhunt, shorts | bright host | 60 s / 30 s |
| F12 | Nature Documentary | slow decay nobody notices day to day | explainer | hushed, wonder | 60 s |
| F13 | Chain Reaction | one failure cascades through a system | explainer, hackathon | playful engineer | 60 s |
| F14 | Cold Open, Rewind | a late, confusing failure with an early cause | explainer, jobhunt, hackathon | tense, then relief | 60 s |
| F15 | Case File | things go missing silently; clues lead to a cause | explainer, jobhunt | playful noir | 60 s |
| F16 | Unboxing | a launch with 3 to 5 new things | launch | delighted | 45 to 60 s |
| F17 | Countdown Changelog | a release recap of many shipped changes | launch (release recap) | sports-desk energy | 45 to 60 s |
| F18 | Speedrun | speed is the point; a build or setup in record time | hackathon, launch | breathless commentary | 45 to 75 s |
| F19 | Before/After Swipe | one visible change on the same screen | shorts, launch | crisp | 15 to 30 s |
| F20 | One Question | one sharp question, a 3-beat answer | shorts | direct | 15 to 30 s |

### Opening and ending variety

Within one repo, rotate openers and closers too, not only formats:

| opener | formats | closer | formats |
| --- | --- | --- | --- |
| stamped case title | F01, F15 | folder shuts, stamp lands | F01, F15 |
| live broadcast bug | F02, F03, F17 | scoreboard flips to FINAL | F02, F17 |
| alarm clock, calendar flip | F04 | the calendar finally moves on | F04 |
| countdown 3, 2, 1 | F05, F18 | certificate stamped PASSED | F05 |
| departures board | F06 | boarding-pass ticket | F06 |
| cooking-show title | F07 | cloche lifts | F07 |
| chalk drawing | F08 | board wiped clean | F08 |
| HUD boot | F09 | same HUD, new verdict | F09 |
| hard split screen | F10, F19 | split collapses into one frame | F10 |
| game-show challenge | F11 | WINNER card | F11 |
| slow macro, dawn | F12 | wide shot, seed packet | F12 |
| marble release | F13 | the bell rings | F13 |
| mid-failure, no context | F14 | the same timestamp, calm | F14 |
| a box on a table | F16 | everything unpacked, ticket | F16 |
| a single question in type | F20 | the question again, answered (loop) | F20 |

### Signature type moves

Each format owns one signature type move. Do not reuse it in another format in the same repo.

| format | signature move | how to build it |
| --- | --- | --- |
| F01 | court transcript, typed with line numbers | `ui` with `frame: "none"` and a `code` element, or `kinetic` `fx: "type"` |
| F02 | stats slammed onto broadcast lower thirds | `scoreboard.lowerThird` |
| F03 | weather ticker plus big temperature numerals | `scoreboard.ticker`, `kinetic` `fx: "count"` |
| F04 | the same sentence re-typed, stacking up | `kinetic` `layout: "stack"`, repeated `fx: "type"` |
| F05 | stencilled lab labels (TEST 01, TEST 02) | `title` `layout: "hud"` or `stamp` beats, condensed font |
| F06 | split-flap departure letters | `outro` `layout: "scoreboard"`, `title` `layout: "marquee"` |
| F07 | handwritten recipe-card labels | hand font (`Caveat`, `Kalam`) on `side` titles |
| F08 | chalk equations that redraw | `chalkboard` text items with `erase` |
| F09 | mono HUD readouts vs warm sans | `title` `layout: "hud"`, two font roles |
| F10 | quote marks that draw on around verbatim lines | `card` with `quoted: true` |
| F11 | flashing game-show numerals, claim chips | `countdown` `style: "bold"`, `chips` |
| F12 | slow serif chapter titles | `title` `layout: "card"`, `motion: "calm"`, serif display |
| F13 | swinging dial numbers, labelled machine parts | `metric` `style: "gauge"`, `lanes` labels |
| F14 | timestamp slates ("FRI 18:02") | `rewind.slate`, mono font |
| F15 | typewritten labels on manila tabs | `casefile` pins, `outro` `layout: "folder"` |
| F16 | label-maker tape on each feature | `kinetic` `fx: "stamp"` on a slab (`theme.type: "stacked"`) |
| F17 | ranked numerals counting down | `countdown` then `kinetic` `fx: "count"` per rank |
| F18 | split timer HUD (RUN 00:41.2, SPLIT +3.1) | `scoreboard` with `clock`, `bug: "LIVE"` |
| F19 | a single word that swaps at the divider | `kinetic` `fx: "swap"` over a `split` `before-after` |
| F20 | the question mark that becomes the answer | `kinetic` `fx: "mask"`, `outro` returning to the question |

---

## F01 The Courtroom

- **Fits when:** two records, sources or versions contradict each other with equal confidence,
  and the product decides which one to trust, while keeping the record.
- **Arc (60 s):** 0–5 the case is called ("Staging v. Production"). 5–20 two witnesses
  testify and contradict each other; exhibits are entered (the evidence). 20–25 the gavel
  falls and the project is named as the clerk or the judge. 25–47 cross-examination: the
  product flags the conflict, shows why, and previews the outcome before and after. 47–55 the
  verdict: one proof number. 55–60 court adjourned, a case folder shuts on the name.
- **Opens:** a gavel slam and a stamped case title. **Ends:** a folder closes on the name.
- **Explanation style:** adversarial testimony. Each fact is a witness; the viewer is the jury.
- **Pain:** both witnesses are sure of themselves, and the wrong one is believed first.
- **Product:** recreated rows and a before/after preview, presented as exhibits.
- **Motion:** gavel shake, typed transcript lines, the camera whipping between witness stands.
- **Characters:** two witnesses (blobs `doc` or `note`, one sweaty and stale, one fresh), a
  sleepy juror (`bot`), a clerk with `glasses`.
- **Look and sound:** dark wood or parchment (`paper-grain`), serif display, mono transcript,
  `cut`/`dissolve` transitions, `type: "typewriter"`, music `warm` or `tense` 96–104 BPM.
- **Scene recipe:**
  1. `title` `layout: "stamp"` (case name, stamp at a spoken word)
  2. `cast` `stage: "spotlight"`, two witnesses on `podium`s with shout bubbles
  3. `ui` `frame: "none"`, a `code` element as the typed transcript, `highlight` on the key line
  4. `evidence` `layout: "wall"`, 2 or 3 exhibits, generic attribution
  5. `kinetic` `turn: true`, `fx: "punch"` on the name
  6. `ui` `frame: "browser"`: step 1 (the conflict flagged, `spotlight`, `notes`)
  7. `ui` `frame: "browser"`: step 2 (the before/after preview, `cursor` click)
  8. `split` `mode: "before-after"` (proof)
  9. `metric` `style: "ring"` or `"gauge"` with a `verdict`
  10. `outro` `layout: "folder"` with a `stamp`
- **Portrait notes:** witnesses stack top and bottom; keep at most 2 characters on stage; the
  transcript needs `variants["9:16"]` with a larger `size`.
- **Example (fictional):** *Twinconf* compares environment configs. Staging swears a flag is
  on, production swears it is off, and the deploy believes staging.

## F02 Instant Replay

- **Fits when:** two runs of the same thing (two test runs, two agent traces, two deploys)
  diverge, and the hard part is finding *where*.
- **Arc:** 0–6 a live broadcast: Run A and Run B on the same track. 6–20 Run B stumbles; the
  scoreboard drops; officials compare two long logs by eye. 20–25 the replay booth lights up
  and the project is named. 25–47 the telestrator replay: the runs align step by step, freeze
  on the first divergence, circle it, mark what it broke downstream. 47–55 the whistle: one
  click turns the failure into a regression test (or the proof number). 55–60 FINAL.
- **Opens:** a LIVE bug and a crowd swell. **Ends:** the scoreboard flips to FINAL.
- **Explanation style:** play-by-play commentary on the step where the play broke.
- **Pain:** the score says *that* it failed, not *where*.
- **Product:** a recreated aligned view (two columns of steps, the divergent row spotlit).
- **Motion:** scrub, freeze frame, telestrator circles, a two-lane wipe.
- **Characters:** two runner bots (`bot`), a tiny referee (`blob` with `cap`).
- **Look and sound:** broadcast navy or turf, condensed display (`Bebas Neue`, `Oswald`),
  `whip` transitions, `motion: "snappy"`, `motif: "scoreboard"`, music `driving` 116–128 BPM,
  `whistle` and `buzzer` SFX.
- **Scene recipe:**
  1. `title` `layout: "broadcast"` (`bug: "LIVE"`)
  2. `split` `mode: "versus"`, two runners, stats per side
  3. `scoreboard` (the score drops, `telestrator` on the gap)
  4. `cast` or `chat`: officials comparing by eye, or the team channel asking "where?"
  5. `kinetic` `turn: true`
  6. `ui`: the aligned view, `camera` push to the divergent step, `notes`
  7. `ui`: downstream effects marked (`highlight` rows), `cursor` on the one-click action
  8. `metric` `style: "flip"` or `bars`
  9. `outro` `layout: "scoreboard"`
- **Portrait notes:** the versus split stacks; the scoreboard rows stack; keep the ticker short.
- **Example:** *Rerun Lens* lines up two CI runs of the same end-to-end test and freezes on
  the first request that differs.

## F03 The Forecast

- **Fits when:** one upstream change (a spec, a token, a schema, a dependency) quietly spreads
  damage across many downstream places, and the product detects it before the storm.
- **Arc:** 0–6 "Tonight's forecast": a map of the system (pages, screens, services). 6–22 a
  front moves in (the change) and storm cells pop over the places it breaks; today's radar
  misses some or costs too much. 22–27 a new radar dish switches on: the name. 27–48 the sweep:
  every affected place pinned with its exact location, ranked by severity, a fix drafted.
  48–55 the five-day outlook: the proof number. 55–60 "clear skies ahead", the station ident.
- **Opens:** a weather sting and a map pan. **Ends:** a sunny outlook strip, then the name.
- **Explanation style:** a forecaster's map walkthrough with legends and fronts.
- **Pain:** a single change makes many places silently wrong.
- **Product:** recreated hit list and fix shown as map pins opening into app cards.
- **Motion:** radar sweep, map zoom from the whole system to one line, icons bouncing in.
- **Characters:** a `cloud` blob that darkens, rains, then smiles; weather emoji as `pops`.
- **Look and sound:** TV-studio blues, rounded or grotesk display, `motif: "radar-sweep"`,
  `push`/`zoom` transitions, music `warm` or `playful` 104–116 BPM, `chime` SFX.
- **Scene recipe:**
  1. `title` `layout: "broadcast"` with a `channel`
  2. `ui` `frame: "none"` with a `shapes` map (places as dots), cells `recolor` as the front passes
  3. `evidence` `layout: "row"`: why today's check misses or costs
  4. `cast`: the cloud character worrying
  5. `kinetic` `turn: true`
  6. `ui`: the hit list (`list` items with location chips), `spotlight` the worst one
  7. `ui`: the drafted fix (`diff`), `cursor` on apply
  8. `scoreboard` with `ticker` (the outlook) or `metric` `style: "bars"`
  9. `outro` `layout: "card"` with sun emoji, or `ticket`
- **Portrait notes:** the map needs `variants["9:16"]` (taller `view`); the ticker crawls fine.
- **Example:** *Tokenfront* shows which screens break contrast when a design token changes.

## F04 The Loop

- **Fits when:** the problem *is* repetition: the same report, promise, question or chore
  comes back again and again, and the copies bury the one that matters.
- **Arc:** 0–5 a weekday morning: the thing happens once. 5–22 the alarm rings: Monday again, the
  same thing again, one more copy each time, faster and faster, until the board is buried;
  meanwhile the real issue hides under the copies. 22–27 the loop breaks: the name. 27–48 the
  same loop replayed with the product on: repeats snap onto the original, the real issue
  pings. 48–55 the pile shrinks: the proof number. 55–60 the calendar finally moves on.
- **Opens:** a ringing alarm clock and a calendar flip. **Ends:** the calendar finally moves on.
- **Explanation style:** repetition as argument. Each loop adds one symptom.
- **Pain:** copies piling up visibly; the one stalled item invisible underneath.
- **Product:** recreated rows with "seen before" chips, a grouped view, one clean review.
- **Motion:** VHS loop resets, accelerating repetition, sticky notes piling, a match cut.
- **Characters:** a sticky-note blob (`note`) that multiplies and looks more tired each loop.
- **Look and sound:** office beige or night-shift dark, `type: "typewriter"`, `rewind` and
  `calendar` scenes, music `playful` or `driving` 108–120 BPM, `tick`/`rewind` SFX.
- **Scene recipe:**
  1. `countdown` or `title` `layout: "slate"` (the day and time)
  2. `calendar` with notes piling (`pileLabel: "{n} copies"`)
  3. `rewind` back to Monday, `ghosts` of the copies
  4. `kinetic` `layout: "stack"`: the same sentence re-typed three times
  5. `evidence`: how many copies, attributed generically
  6. `kinetic` `turn: true`
  7. `ui`: duplicates collapsing onto the original (`states` strike the copies), `notes`
  8. `ui`: the one real issue spotlit
  9. `metric` `style: "bars"` (before and after)
  10. `outro` `layout: "calendar"` (the day finally changes)
- **Portrait notes:** the calendar and rewind centre themselves; keep stacked type to 3 lines.
- **Example:** *Echo Desk* folds the same bug report, filed 30 ways, into one ticket.

## F05 Crash-Test Lab

- **Fits when:** something must be tried safely before it meets real people or real data
  (a migration, a policy, a release, a prompt), and failures are dramatic.
- **Arc:** 0–6 the lab: "Before it meets production, it meets the dummy." 6–22 the stakes:
  what goes wrong when it ships untested, shown as incident tiles. 22–27 the rig powers up:
  the name. 27–48 the run: the draft hits traps on a test track, each failure shows its cause;
  then the hardened version runs clean. 48–55 the score: the proof number, a report prints.
  55–60 the dummy gives a thumbs-up on a PASSED certificate.
- **Opens:** a slow-motion countdown with lab markings. **Ends:** a PASSED certificate.
- **Explanation style:** a test protocol: setup, run, result, retest.
- **Pain:** incident tiles of what broke when this went out untested.
- **Product:** recreated per-step results and the report, on a lab monitor.
- **Motion:** slow motion, glass shatter on a failure, a track dolly, a before/after replay.
- **Characters:** a crash-test dummy (`blob` `shape: "dummy"`).
- **Look and sound:** hazard yellow and black, condensed stencil display, `motif:
  "hazard-stripes"`, `background: "concrete"`, `glitch`/`flash` transitions, music `tense` or
  `driving` 112–124 BPM, `impact`/`shatter` SFX.
- **Scene recipe:**
  1. `countdown` `style: "crash"` with `then: { text: "TEST 01" }`
  2. `evidence` `layout: "grid"`: incident tiles
  3. `cast`: the dummy on the floor, sweating
  4. `kinetic` `turn: true`
  5. `lanes`: the draft rides the track, items sorted into pass / fail
  6. `ui`: the failing step and its cause (`spotlight`, `notes`)
  7. `ui`: the hardened run, every row green (`states`)
  8. `metric` `style: "gauge"`
  9. `outro` `layout: "certificate"` with `stamp: "PASSED"`
- **Portrait notes:** lanes become a top-to-bottom conveyor; the evidence grid becomes a stack.
- **Example:** *Migrasafe* rehearses a database migration on a snapshot and shows the rows it
  would have lost.

## F06 The Checkpoint

- **Fits when:** many items need screening by risk: most pass, some get a closer look, a few
  are stopped. Today the choice is "check everything" or "check nothing".
- **Arc:** 0–6 a terminal: items queue like travellers with bags. 6–22 only two lanes exist:
  open every bag (the queue backs up) or wave everyone through (a bag bursts). 22–27 a new
  scanner lights up: the name. 27–48 one bag's journey: scored, sorted, the risky one
  reviewed with its evidence, approved with one key, logged. 48–55 the departures board: the
  proof number. 55–60 planes take off; a boarding pass with the link.
- **Opens:** a PA chime and a departures board. **Ends:** a boarding-pass ticket.
- **Explanation style:** one item's journey through a system.
- **Pain:** both bad lanes shown literally, side by side.
- **Product:** the recreated review card as the X-ray monitor.
- **Motion:** a conveyor, an X-ray reveal, a split-flap board, three lanes branching.
- **Characters:** luggage-carrying bots (`bot` with `luggage` pops), one calm officer
  (`notionists/nia` or `theo`).
- **Look and sound:** airport grey and signage yellow, grotesk display, split-flap type,
  `slide-stack` transitions, music `calm` or `warm` 96–108 BPM, `beep`/`chime` SFX.
- **Scene recipe:**
  1. `title` `layout: "marquee"` (DEPARTURES)
  2. `split` `mode: "versus"`: "open every bag" vs "wave everyone through"
  3. `evidence`: the cost of each lane, generically attributed
  4. `kinetic` `turn: true`
  5. `lanes` with a `scanner` (auto / review / blocked)
  6. `ui`: the review card (score breakdown, diff), `cursor` approves
  7. `ui`: the audit log row appearing (`toast`)
  8. `scoreboard` or `metric` `style: "flip"` (the board)
  9. `outro` `layout: "ticket"`
- **Portrait notes:** lanes become bins at the bottom; keep three lanes, short labels.
- **Example:** *Gatepost* screens dependency updates: patches merge on their own, majors wait
  for a human, known-vulnerable versions are stopped.

## F07 Test Kitchen

- **Fits when:** the product helps someone tune a recipe (a rule, a prompt, a threshold, a
  query) by tasting it against labelled samples, instead of cooking blind.
- **Arc:** 0–6 a cooking-show title: "Today's recipe: an alert that doesn't burn." 6–22 the
  chef throws in version 1; the dish comes out wrong (false alarms and a missed one); every
  taste costs a full run. 22–27 the test kitchen opens: the name. 27–48 label tasting spoons
  (should / should not match), every change re-scores live, the dials move, version 2 is
  specific. 48–55 the judges' scorecard: the proof number. 55–60 the cloche lifts on the name.
- **Opens:** a title card and a kitchen-timer ding. **Ends:** a cloche reveal.
- **Explanation style:** a recipe in steps: ingredients, method, taste test, plating.
- **Pain:** the wrong dish shown as actual mis-sorted cards, then the blindfold.
- **Product:** recreated sample rows with match chips, a live score grid, a threshold slider.
- **Motion:** overhead shots, ingredients dropping with bounce, dials spinning, steam.
- **Characters:** a chef (`blob` with `chef-hat`), sample cards with faces (`doc`).
- **Look and sound:** warm cream and tomato, rounded display (`Fredoka`), a hand font for
  labels, `motion: "bouncy"`, music `playful` 112–124 BPM, `ding`/`pop` SFX.
- **Scene recipe:**
  1. `title` `layout: "card"` (today's recipe)
  2. `cast`: the chef adds version 1
  3. `split` `mode: "versus"`: what it should catch vs what it caught
  4. `evidence`: why tuning blind is slow
  5. `kinetic` `turn: true`
  6. `ui`: labelled samples (`list` with chips), `states` re-score as the rule changes
  7. `ui`: the score grid and threshold (`stat`, `progress`), `notes`
  8. `metric` `style: "ring"`
  9. `outro` `layout: "cloche"`
- **Portrait notes:** the versus split stacks; keep sample lists to 4 rows.
- **Example:** *Thresh* tunes an alert threshold against last month's incidents.

## F08 Chalkboard Lesson

- **Fits when:** the fix only makes sense after a rule is understood (geometry, a limit, a
  formula, an ordering), and the rule can be drawn in a few strokes.
- **Arc:** 0–6 a chalkboard: the setting drawn. 6–22 the lesson: the rule derived in one
  equation, drawn on; the case where it fails is circled; today's check is by eye. 22–27 the
  chalk drawing turns into the live app (a match cut): the name. 27–48 the app applies the
  rule everywhere, highlights each violation, fixes one in a click. 48–55 the proof number in
  chalk. 55–60 the board is wiped clean to show the name.
- **Opens:** chalk squeaking and a drawing. **Ends:** a wipe, then the name chalked on.
- **Explanation style:** a teacher's lesson. Derive the rule, then apply it.
- **Pain:** a failed check stamped across the drawing, and the manual review undoing the gain.
- **Product:** a recreated canvas (`shapes`) in the app's colours with violations glowing.
- **Motion:** stroke-by-stroke draw-on, a match cut chalk circle to UI ring, heatmap bloom.
- **Characters:** a cheeky `flame` or `marble` that hides where the rule fails.
- **Look and sound:** slate green, `Caveat` or `Kalam` in the chalk, a clean grotesk for the
  app, `motif: "chalk-underline"`, `wipe` transitions, music `warm` 100–112 BPM, `chalk` SFX.
- **Scene recipe:**
  1. `chalkboard`: the setting
  2. `chalkboard`: the rule as an equation, the failing case circled, `erase` and redraw
  3. `evidence` `layout: "stack"`: why manual checks miss it
  4. `kinetic` `turn: true` (or a `chalkboard` `wipe` into it)
  5. `ui` with `shapes`: violations glowing (`cells`, `recolor`)
  6. `ui`: one-click fix, `cursor`, `toast`
  7. `metric` `style: "bars"` or `chalkboard` numbers
  8. `outro` `layout: "chalk"`
- **Portrait notes:** every chalk item uses absolute coordinates, so write `variants["9:16"]`
  for each `chalkboard` scene (the lint warns otherwise).
- **Example:** *Tapzone* teaches the minimum touch-target size, then finds every button on the
  app's screens that is too small for a thumb.

## F09 POV Switch

- **Fits when:** the product lets one side see what the other side sees (a user and a system,
  a customer and support, a person and an assistive tool).
- **Arc:** 0–8 first-person view through one side (a HUD): it reads something and misjudges.
  8–22 reverse shot to the other side, who cannot see why. 22–27 a mirror appears: the name.
  27–48 the same data, now visible from both sides, each fix tied to what the other side
  sees. 48–55 back to the first POV: the proof number. 55–60 the HUD from the opening, now
  with the right verdict.
- **Opens:** a HUD boot. **Ends:** the same HUD, closing the loop.
- **Explanation style:** perspective swapping: the same data from two sides.
- **Pain:** the viewer feels the blindness from both sides.
- **Product:** recreated side-by-side panels with linked highlights.
- **Motion:** HUD scan lines, a whip-pan between points of view, highlight threads.
- **Characters:** a person (`open-peeps/<who>`) and a small scanner bot.
- **Look and sound:** HUD mono on dark vs warm sans on light (`rhythm: "alternate"`),
  `motif: "radar-sweep"` in HUD scenes, `whip` transitions, music `calm` 96–108 BPM.
- **Scene recipe:**
  1. `title` `layout: "hud"` with boot `lines`
  2. `ui` `frame: "none"`: what the system reads (redacted `kv` pairs)
  3. `cast`: the person on the other side, confused
  4. `chat` or `evidence`: what people on the other side say, generically attributed
  5. `kinetic` `turn: true`
  6. `split` `mode: "versus"` with `elements` on each side: the same record from both POVs
  7. `ui`: the fix, with a `highlight` thread from one side to the other
  8. `metric` `style: "flip"`
  9. `title` `layout: "hud"` again, then `outro`
- **Portrait notes:** the split stacks top and bottom; label each half clearly.
- **Example:** *Readaloud* shows a developer what a screen reader actually announces on their form.

## F10 Two Lanes, One Input

- **Fits when:** the same input produces different outcomes depending on one response, and the
  product finds or spreads the better response.
- **Arc:** 0–6 a hard split screen, mirrored, the same input arriving on both sides. 6–22 the
  left side responds one way and fails; the right side responds another way and wins. Then
  why nobody notices the difference (capacity, visibility). 22–27 the split merges into one
  view: the name. 27–48 the product compares every case, ranks the biggest gap, shows the
  winning response verbatim, hands it to the left side. 48–55 the left side tries it and the
  lanes re-sync: the proof number. 55–60 both lanes winning in one frame, the name.
- **Opens:** a hard split with mirrored framing. **Ends:** the split collapses into one shot.
- **Explanation style:** a controlled comparison: same input, different response, different outcome.
- **Pain:** shown through the parallel outcomes, then the limit that hides the difference.
- **Product:** a recreated comparison table and a phone card with the one thing to change.
- **Motion:** mirrored synced actions, the divider sliding, bar races.
- **Characters:** one figure per lane (`open-peeps`), reacting on the verdict word.
- **Look and sound:** warm paper, grotesk display, `type: "split-reveal"`, `push`
  transitions, music `warm` 96–104 BPM, `pop`/`ding` SFX.
- **Scene recipe:**
  1. `split` `mode: "versus"` `divider: "line"`: the same input on both sides
  2. `split` (continues with `enter: "none"`): the two responses, `verdict` stamps
  3. `calendar` or `evidence`: why the gap stays invisible
  4. `kinetic` `turn: true`
  5. `lanes`: every case sorted into types
  6. `ui`: the comparison table, `camera` push on the biggest gap, `notes`
  7. `ui`: the winning response, verbatim (`card` `quoted: true`)
  8. `ui` `frame: "phone"`: the one thing to try next
  9. `split`: next time, both sides win
  10. `metric` `style: "ring"` (`strike: false` for a comparison)
  11. `outro` `layout: "card"` with the cast
- **Portrait notes:** a natural short: the split stacks top and bottom; keep one figure per half.
- **Example:** *Pixelpress* uploads the same photo to two storefronts: one page loads at once,
  the other stalls on an oversized image.

## F11 Spot the Fake

- **Fits when:** the error hides in plain sight among correct details, and the product catches
  what a human skims past. The viewer plays first and probably misses it too.
- **Arc:** 0–6 the host's challenge: "One of these is made up. Five seconds." The artefact fills
  the screen; a countdown ticks. 6–22 the reveal; the pain of playing this game by eye every
  day; what one miss costs. 22–27 a buzzer: the name, "the player who never misses". 27–48
  each claim lights up verified / guess / unsupported; one key fixes the bad one; the queue
  sorts. 48–55 the scoreboard: the proof number. 55–60 confetti and WINNER.
- **Opens:** a game-show sting and a countdown. **Ends:** confetti and a WINNER card.
- **Explanation style:** participatory. The viewer plays, fails, then watches the tool play.
- **Pain:** the viewer feels it because they missed the fake.
- **Product:** a recreated artefact with claim highlights and an evidence panel.
- **Motion:** a countdown ring, highlight sweeps per claim, buzzer flashes, confetti.
- **Characters:** a host (`blob` with `bowtie`), a sweating `envelope` or `doc`.
- **Look and sound:** studio purple and bulbs, `Archivo Black` or `Unbounded`, `iris`
  transitions, `motion: "bouncy"`, music `playful` 120–132 BPM, `buzzer`/`ding` SFX.
- **Scene recipe:**
  1. `countdown` `style: "bold"` over the challenge
  2. `ui`: the artefact (`card` or `code`), no hints yet
  3. `ui`: the reveal, `spotlight` the fake, `notes`
  4. `evidence`: what one miss costs, generically attributed
  5. `kinetic` `turn: true`
  6. `ui`: every claim chipped (`chips`, `states`), `highlight` sweeps
  7. `ui`: one key fixes it (`cursor`, `toast`)
  8. `scoreboard` (`bug: "FINAL"`)
  9. `outro` `layout: "certificate"` (WINNER) or `card` with `party-popper` pops
- **Portrait notes:** a strong short: the artefact fills the frame, hook at 0 s, loop back to
  the challenge.
- **Example:** *Realcall* checks AI-written code against the SDK that is actually installed and
  flags the method that does not exist.

## F12 Nature Documentary

- **Fits when:** the problem is slow decay that nobody notices day to day (rot, drift, stale
  things, forgetting), which time-lapse makes visible.
- **Arc:** 0–8 a hushed open on a healthy habitat (the system). 8–24 a time-lapse: things
  quietly wilt while the dashboard still says "fine"; below the surface, one rotten root
  starves what grows above it. 24–28 an almanac opens: the name. 28–48 the product estimates
  decay for each thing, flags the blocking roots first, schedules the small fix. 48–55 the
  habitat recovers: the proof number. 55–60 a wide shot, a seed packet with the name.
- **Opens:** dawn, birdsong, a slow macro. **Ends:** a wide shot and a seed packet.
- **Explanation style:** a calm observational voice: patient, short sentences, wonder.
- **Pain:** the time-lapse wilt beside a sign that only ever counts up.
- **Product:** the recreated dashboard as the almanac page, in a tablet frame.
- **Motion:** time-lapse wilting, a cutaway below the soil line, a curve drawn on, slow drift.
- **Characters:** `sprout` blobs that droop and perk up; plant emoji (`seedling`, `wilted-flower`, `blossom`).
- **Look and sound:** greens and loam, serif display (`Fraunces`, `Young Serif`), `motion:
  "calm"`, `camera: "drift"`, `dissolve` transitions, music `calm` 90–98 BPM, `chime` SFX.
  The slowest pace of the library: aim for the low end of the word budget.
- **Scene recipe:**
  1. `title` `layout: "card"` (a chapter title)
  2. `cast` with plant `props`: healthy
  3. `calendar`: weeks pass, notes say "still fine"
  4. `ui` with `shapes`: a cutaway of roots, one `recolor`ed rotten
  5. `evidence`: what builders and users say, generically attributed
  6. `kinetic` `turn: true`
  7. `ui`: the almanac (decay per item, `progress` bars), `spotlight` the root
  8. `ui`: the scheduled fix, `cursor`
  9. `metric` `style: "ring"`
  10. `outro` `layout: "packet"` with plant emoji
- **Portrait notes:** the cutaway needs a taller `shapes.view` in `variants["9:16"]`.
- **Example:** *Flagweed* finds feature flags that were never cleaned up and are slowly
  overgrowing the codebase.

## F13 Chain Reaction

- **Fits when:** one small failure cascades through a system (retries, queues, timeouts,
  dependencies), and the product simulates or breaks the chain.
- **Arc:** 0–6 a Rube Goldberg machine of the system. 6–22 a marble labelled with the fault
  tips the first domino; everything downstream resets; counters tick up the cost. The usual
  advice is vague. 22–27 the machine freezes; a control panel slides in: the name. 27–48 each
  fault is weighed by its cost to the chain; parallel "what if" tracks fan out; the best
  setting is picked; the config prints. 48–55 the machine re-runs smoothly: the proof number.
  55–60 the last domino rings a bell.
- **Opens:** a marble gate, a tick, release. **Ends:** the bell rings; the name slides out.
- **Explanation style:** cause and effect, one physical link at a time, then "what if" in parallel.
- **Pain:** the reset cascade shown physically, with live counters.
- **Product:** a recreated simulator panel (scenario cards, a distribution chart).
- **Motion:** spring-chain dominoes, a tracking camera, tracks fanning out, a histogram growing.
- **Characters:** a mischievous `marble`, small engineer `bot`s with `headset`.
- **Look and sound:** blueprint blue (`preset: "blueprint"` re-accented), `motif:
  "measurement-ticks"`, `wipe` transitions, music `playful` 112–124 BPM, `click`/`thunk` SFX.
- **Scene recipe:**
  1. `title` `layout: "card"` or `countdown` (the marble gate)
  2. `ui` with `shapes`: the machine, dominoes as `rect`s `recolor`ed in sequence
  3. `scoreboard`: counters ticking up the cost
  4. `evidence`: the vague advice, generically attributed
  5. `kinetic` `turn: true`
  6. `ui`: each fault weighed (`table`, `chart`), `notes`
  7. `lanes` or `split`: what-if tracks
  8. `ui`: the chosen config (`code`), `cursor`
  9. `metric` `style: "gauge"`
  10. `outro` `layout: "card"` with a `bellhop-bell` pop
- **Portrait notes:** the machine drawing needs `variants["9:16"]`; lanes become vertical.
- **Example:** *Fusebox* simulates how one slow service's timeouts cascade, and picks
  circuit-breaker settings that stop the chain.

## F14 Cold Open, Rewind

- **Fits when:** the failure surfaces late and confusingly, far from its cause, and the
  product catches the cause early.
- **Arc:** 0–6 in the middle of the failure: a red error at a bad hour, a pager buzzing. 6–10
  the tape rewinds ("3 HOURS EARLIER"). 10–24 how it happened: a change that looked fine,
  review passed, the trap was set; flash other failures of the same class. 24–28 the timeline
  forks: the name. 28–48 the alternate timeline: the product reads the change, flags the exact
  line in plain words, applies a reviewable fix. 48–55 back to the bad hour: nothing happens;
  the proof number. 55–60 the laptop closes.
- **Opens:** mid-failure, no context. **Ends:** the same timestamp, now calm.
- **Explanation style:** nonlinear: effect, cause, then the timeline that never happens.
- **Pain:** the late, confusing failure, then its traced cause.
- **Product:** a recreated code pane with line highlights and a findings list; a terminal.
- **Motion:** VHS rewind distortion, a branching timeline, a code-line spotlight, a diff wipe.
- **Characters:** a small developer (`notionists/theo`), a pager blob that calms down.
- **Look and sound:** night-shift dark, mono slates (`JetBrains Mono`), `glitch` and `flash`
  transitions, `background: "scanlines"`, music `tense` 110–122 BPM then the drums at the
  fork, `rewind`/`glitch` SFX.
- **Scene recipe:**
  1. `ui` `frame: "app"`: the error (`code` with `highlight`, `tone: "bad"`)
  2. `chat` `style: "thread"`: the pager and the team channel
  3. `rewind` with a `slate`
  4. `ui`: the innocent-looking change (`diff`)
  5. `evidence` `layout: "stack"`: the same class of failure elsewhere, generically attributed
  6. `kinetic` `turn: true`
  7. `ui`: the finding on the exact line (`code` `highlight`, `notes`)
  8. `ui`: the fix (`diff`), `cursor` on apply, readiness `progress` `kind: "ring"`
  9. `title` `layout: "slate"`: the same timestamp, calm
  10. `outro` `layout: "card"`
- **Portrait notes:** code panes need larger `app.size` in `variants["9:16"]`; keep 8 lines max.
- **Example:** *Leakbeat* flags the line in a pull request that would leak memory until the
  service falls over at 3 a.m.

## F15 Case File

- **Fits when:** things go missing silently (records, events, messages, objects), leaving
  faint clues, and the cause is several things that must agree.
- **Arc:** 0–6 noir rain and a case file: "Wanted: 12 webhooks, sent and never delivered." 6–22
  the detective lays out the case: what must line up for the thing to arrive, the step that
  was skipped, the only witness a quiet log line; evidence pinned on the board. 22–27 the lamp
  flicks on: the name. 27–48 the investigation: checks sweep the scene, each finding explained
  with its evidence and fix plan; safe fixes in one click, risky ones wait. 48–55 the lineup:
  everything back; the proof number. 55–60 CASE CLOSED.
- **Opens:** rain, a desk lamp, a folder sliding in. **Ends:** a CLOSED stamp; the folder flips.
- **Explanation style:** deduction. Clues lead to a cause; the cause leads to a fix.
- **Pain:** missing-poster cards and red string between the things that must agree.
- **Product:** recreated findings and a fix plan pinned to the board as framed panels.
- **Motion:** red string drawing, a magnifier zoom, a flashlight vignette, a stamp impact.
- **Characters:** a detective (`bot` with `magnifier`), ghostly outlines that solidify.
- **Look and sound:** noir dark with amber (`Oswald` / `IBM Plex Sans`), `motion: "smooth"`,
  `redaction-bar` transitions, music `tense` 90–100 BPM, `thunk` SFX.
- **Scene recipe:**
  1. `title` `layout: "stamp"` (MISSING)
  2. `casefile`: what must agree, pinned, strings drawn
  3. `chat` or `ui` `frame: "app"`: the quiet log line as the only witness
  4. `evidence` `layout: "wall"`: user reports, generically attributed
  5. `kinetic` `turn: true`
  6. `ui`: the checks sweeping (`list` with `states` flipping to found)
  7. `ui`: the fix plan (`diff` or `code`), `cursor`, `notes`
  8. `casefile` with `stamp: { text: "SOLVED" }` or `metric`
  9. `outro` `layout: "folder"` with `stamp`
- **Portrait notes:** the cork board becomes a 2-column pin grid; keep 4 pins.
- **Example:** *Hookfinder* finds webhooks that were sent but never delivered, and why.

## F16 Unboxing (launch)

- **Fits when:** a launch or major version with 3 to 5 new things worth showing one by one.
- **Arc (45 to 60 s):** 0–5 a box on a table, a label ("v2"). 5–15 why it was needed: the one
  pain the release answers (still concrete, still before the UI). 15–19 the lid lifts: the
  name and version. 19–48 features unpack one by one, each a recreated UI beat with its own
  cue and a label-tape title. 48–55 the receipt: the proof number or the availability line.
  55–60 everything laid out on the table; a ticket with the link.
- **Opens:** a closed box with a shipping label. **Ends:** everything unpacked, a ticket outro.
- **Explanation style:** reveal by reveal; each feature answers "and this means...".
- **Pain:** shorter than in an explainer (10 s or more), but never skipped.
- **Product:** one `ui` scene per feature, at most 4; the top one gets the camera push.
- **Motion:** lid lift, items popping out with springs, each landing on a beat.
- **Characters:** optional; a delighted `open-peeps` figure reacting to each item.
- **Look and sound:** the product's own palette in the world, `motion: "bouncy"` or
  `"smooth"`, `slide-stack` transitions, music `driving` or `playful` 116–128 BPM, `pop` SFX.
- **Scene recipe:**
  1. `title` `layout: "card"` (the box, the version)
  2. `evidence` or `chat`: the pain this release answers
  3. `kinetic` `turn: true` with `fx: "stamp"`: the name and version
  4. `ui`: feature 1 (the headline feature, `camera`, `notes`)
  5. `ui`: feature 2
  6. `ui` or `split` `before-after`: feature 3
  7. `kinetic` `fx: "count"` or `metric`: the proof or availability
  8. `outro` `layout: "ticket"` with `fields` (VERSION, LICENSE, LINK)
- **Portrait notes:** for a launch short, keep the headline feature only and the outro.
- **Example:** *Paperkite 2.0* unpacks offline sync, shared notebooks and a command bar.

## F17 Countdown Changelog (release recap)

- **Fits when:** a release or a month of work with many shipped changes, grouped into 3 to 5
  beats. Built from `git log A..B`, merged PRs and the CHANGELOG.
- **Arc (45 to 60 s):** 0–5 a broadcast open: "This month in <project>: the top 5". 5–12 the
  one pain this release closes (or the user request behind it). 12–45 a countdown from 5 to 1,
  one scene per shipped beat, each with its rank numeral; the number-one beat gets the
  recreated UI and the camera push. 45–55 the scoreboard: totals (merged PRs, contributors),
  only if real. 55–60 FINAL, the link.
- **Opens:** a broadcast bug and a countdown. **Ends:** a FINAL scoreboard.
- **Explanation style:** a ranked countdown; each rank is one sentence of "what changed for you".
- **Pain:** one beat, short, ideally a real request from an issue (attributed generically).
- **Product:** rank 1 is a `ui` scene; lower ranks can be `kinetic`, `split` or `ui`.
- **Motion:** rank numerals slamming in, flip scores, a ticker of smaller fixes.
- **Characters:** optional; a commentator `blob` with `headset`.
- **Look and sound:** sports-desk navy and a bright accent, condensed display, `whip`
  transitions, `motif: "scoreboard"`, music `driving` 120–132 BPM, `whistle`/`tick` SFX.
- **Scene recipe:**
  1. `title` `layout: "broadcast"`
  2. `evidence` (the request behind the release)
  3. `countdown` `from: 5` with `then: { text: "#5" }`, or `kinetic` beats per rank
  4. `kinetic` or `ui`: ranks 5 to 3, one scene each
  5. `ui` or `split`: rank 2
  6. `ui`: rank 1 (`turn: true` on the first time the release is named, `camera`, `notes`)
  7. `scoreboard` with `ticker` listing the smaller fixes
  8. `outro` `layout: "scoreboard"`
- **Portrait notes:** cut to ranks 3, 2, 1 for a 30 s short.
- **Example:** *Ferrule CLI*'s spring release: plugins, a faster cold start, a new init wizard.

## F18 Speedrun (hackathon)

- **Fits when:** speed is the story: a demo-day build, an onboarding flow, a setup that used
  to take an afternoon and now takes a minute.
- **Arc (45 to 75 s):** 0–5 a run timer HUD starts: "Any% run: from repo to working app". 5–15
  the pain: the slow way, with its time. 15–20 the run starts: the name. 20–55 splits: each
  step of the core loop is a split with its time on the HUD, shown in recreated UI (at least
  40% of runtime for a hackathon). 55–65 how it works in one line plus a diagram; impact or
  what is next. 65–75 the personal-best card, the team and the repo.
- **Opens:** a timer HUD, LIVE. **Ends:** a personal-best card with the team and link.
- **Explanation style:** a speedrun commentary: each step named, timed, done.
- **Pain:** the slow way, timed honestly.
- **Product:** recreated UI for every split; one `metric` for the final time if measured.
- **Motion:** a running clock, split times sliding in, quick cuts on beats.
- **Characters:** optional; a runner `bot`.
- **Look and sound:** neon on black or arcade (`VT323`, `Share Tech Mono`, `Unbounded`),
  `motion: "snappy"`, `glitch` transitions, music `driving` 124–132 BPM, `beep`/`tick` SFX.
- **Scene recipe:**
  1. `title` `layout: "hud"` (the run starts)
  2. `calendar` or `split` `before-after`: the slow way
  3. `kinetic` `turn: true`
  4. `ui`: split 1, `scoreboard`-style split time as a `side` point
  5. `ui`: split 2
  6. `ui`: split 3, `cursor`, `toast` on done
  7. `chalkboard` or `ui` with `shapes`: how it works in one diagram
  8. `scoreboard` `bug: "FINAL"`: the final time
  9. `outro` `layout: "certificate"` (PERSONAL BEST) with a `credit` line for the team
- **Portrait notes:** a strong 9:16 cut: HUD on top, the UI below, splits as captions.
- **Example:** *Quickstrap*, built at a weekend hackathon, takes a fresh laptop to a running
  dev environment.

## F19 Before/After Swipe (shorts)

- **Fits when:** one change is visible on one screen: a redesign, a speed-up, a cleanup, a
  fixed bug. Built for 15 to 30 s vertical.
- **Arc (15 to 30 s):** 0–1.5 the "before" screen, already moving, with a one-line hook. 1.5–8
  why "before" hurts, on the screen itself (the slow spinner, the clutter). 8–10 the swipe
  divider crosses: the name. 10–22 the "after" in recreated UI, the key difference spotlit.
  22–28 the proof or the link. Last frame matches the first, for a clean loop.
- **Opens:** the "before" screen, moving at frame 0. **Ends:** the divider back at the start.
- **Explanation style:** one comparison, no detours.
- **Pain:** shown, not told: the actual clutter or wait.
- **Product:** the same screen recreated twice, `split` `mode: "before-after"`.
- **Motion:** one swipe divider, a word that swaps at the divider.
- **Characters:** none, or one reaction emoji.
- **Look and sound:** the app's own palette, big captions `center-low`, `cut` transitions,
  music `driving` 120–128 BPM.
- **Scene recipe:**
  1. `ui` (before), visible at frame 0 (`lead: 0`, `transition: "cut"`), hook in the first line
  2. `split` `mode: "before-after"` with `turn: true`: the divider crosses as the project is
     named; a panel `verdict` marks each side
  3. `ui` (after): the one move, `cursor`, `spotlight`, `notes`
  4. `metric`: the proof number, with its source in `script.md` (drop it in a 15 s cut and let
     the outro headline carry the number)
  5. `outro` `layout: "card"` with `loop: true` (matching scene 1's background)
- **Portrait notes:** designed portrait-first; for 16:9 the split runs left and right, and a
  launch can open on the finished "after" screen first (see the launch skill's
  `launch-formats.md`).
- **Example:** *Slimquery*'s results page, before (spinner) and after (instant table).

## F20 One Question (shorts)

- **Fits when:** the project answers one sharp question a developer actually asks. Built for
  15 to 30 s, loopable.
- **Arc (15 to 30 s):** 0–1.5 the question in big type ("Why is the build slow?"). 1.5–6 the
  usual non-answer. 6–8 the name. 8–24 a 3-beat answer in recreated UI: find, explain, fix.
  24–28 the question returns, answered; the last frame matches the first.
- **Opens:** a question mark and the question. **Ends:** the same question, answered (loop).
- **Explanation style:** question, answer in three beats, question again.
- **Pain:** the non-answer people get today, in one line.
- **Product:** one `ui` scene with three `states`, or three short `ui` scenes.
- **Motion:** the question mark morphing into the answer; tight cuts on each beat.
- **Characters:** optional; a `thinking-face` emoji pop.
- **Look and sound:** high-contrast, one accent, `Inter Tight` or `Syne` display, captions
  `center-low`, `flash` transitions, music `driving` 124 BPM.
- **Scene recipe:**
  1. `kinetic` (visible at frame 0): the question, `fx: "mask"`
  2. `kinetic` `turn: true`: the name
  3. `ui`: find (`highlight`), explain (`notes`), fix (`cursor` + `toast`) as `states`
  4. `outro` `layout: "card"` with `loop: true`, the headline restating the question
- **Portrait notes:** designed portrait-first; kinetic beats at most 3 words per line.
- **Example:** *Buildscope* answers "why is the build slow?" by naming the one step that eats
  the time.

---

## Bending a format

- Each format's timings are a default. Keep the order (hook, pain, turn, product, proof, end)
  and the pain's minimum length; stretch or compress acts to fit `targetSeconds`.
- One metaphor per film. Drop the metaphor as soon as it stops explaining: the product beats
  live inside the app's own UI, framed by the world, not replaced by it.
- A hackathon or jobhunt film may borrow any explainer format; the use-case skill adds its
  own structure on top (judge structure, outreach copy).
- Proposing a new format: give it every field above, a scene recipe that uses only existing
  scene types, and a "fits when" that no other format already covers.

# Example: Driftcheck

A small, made-up web app (one static page and its seed data) with a finished trailer
project in `.trailer/`. Use it to try the engine without writing a config first.

Driftcheck compares the config of every environment before a deploy. The app, the incident
and every number in `data/seed.json` are fictional.

| file | what |
| --- | --- |
| `index.html`, `app.css`, `app.js` | the app: a drift table rendered from the seed data |
| `data/seed.json` | the seed data; every number in the film comes from here |
| `.trailer/brief.md` | the inventory: problem, product moves, proof, UI tokens |
| `.trailer/script.md` | the format, scene table, narration and a source for every number |
| `.trailer/trailer.config.json` | the film (60 s, 16:9) and two cuts: `short` (9:16, 25 s) and `square` (1:1, 30 s) |
| `.trailer/assets/drift.png` | a capture of `index.html`, used by the `shot` scene |

## Try it

From the repository root:

```sh
node engine/trailer.mjs examples/driftcheck --lint --all
node engine/trailer.mjs examples/driftcheck --voice-engine none --frames 0-150   # a 5 s check, no key needed
node engine/trailer.mjs examples/driftcheck --cut short --stills scenes --safe-overlay --voice-engine none
node engine/trailer.mjs examples/driftcheck --all --review --gif                 # every render, with your voice setup
```

Outputs land in `.trailer/out/` (gitignored). To see the app itself, serve the folder:

```sh
node engine/scripts/serve.mjs examples/driftcheck 4173
```

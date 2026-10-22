#!/usr/bin/env node
// trailer: one command from a project's .trailer/trailer.config.json to a finished film.
//
//   lint -> capture -> voice (+ word timings) -> music -> render (Remotion) -> captions -> poster
//
// Run `node engine/trailer.mjs --help` for the commands and flags. Exit codes: 0 ok,
// 1 failure, 2 lint errors, 3 missing dependency.
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';
import { ASPECTS, aspectSlug } from './src/config.mjs';
import { FPS, buildTimeline } from './src/timeline.mjs';
import { captionChunks, toSrt, toVtt } from './src/captions.mjs';
import { USE_CASES, resolveCaptions, resolveMusic, resolveTheme } from './src/options.mjs';
import { EXIT, ENGINE, VERSION, durationOf, ffTools, ffprobe, importRuntime, missingFilters, playwrightShell, runtime, savedBrowser, trailerHome } from './scripts/runtime.mjs';
import { LEGACY_KEYS, bannedTerms, envKeySource, durationWindow, lintCopy, lintFormat, loadProject, parseJson, projectPaths, rel, resolveVoice, spokenWords, validate, wordBudget } from './scripts/lib.mjs';
import { SCHEMA_FILE } from './scripts/gen-schema.mjs';

const HELP = `trailer ${VERSION}: turn a project into a narrated, captioned film (16:9, 9:16 or 1:1)

Usage
  trailer <projectDir> [flags]            lint, voice, render .trailer/trailer.config.json
  trailer init <dir> [--use-case <name>] [--aspect <a>] [--force]
                                          start .trailer/ from a template
                                          (use cases: ${USE_CASES.join(', ')})
  trailer doctor [projectDir] [--json]    check Node, ffmpeg, browser, the install, and whether
                                          a Deepgram key is present for projectDir (default .)
  trailer schema                          print the path of the config JSON Schema
  trailer install                         install the engine's dependencies now

Render flags
  --config <path>        a config other than <projectDir>/.trailer/trailer.config.json
  --aspect 16:9|9:16|1:1 render at this aspect (default: the cut's, else the config's)
  --cut <name>           render one of config.cuts (e.g. short, square)
  --all                  render the film and every cut
  --lint                 only validate (schema + rules) and lint the copy; no voice, no render
  --no-render            stop after writing the props (for --studio or a later render)
  --voice-engine deepgram|say|none
                         override the voice provider (falls back deepgram > say > espeak-ng > none)
  --keep-voice           use your own recordings at .trailer/voice/line-N.wav
  --skip-capture         reuse the last capture (.trailer/.stage/shots.json)
  --stills scenes|cues|<seconds or scene ids, comma separated>
                         render stills instead of the film into .trailer/review/<aspect>[-<cut>]/
                         (one per scene at 60%, one per line, or e.g. 0,1.5,hook), plus sheet.jpg
  --review               after the film: a still per scene (at 60% of it) + sheet.jpg, a
                         contact sheet 4 across (outputs.sheet; outputs.review is the folder)
  --safe-overlay         draw the safe areas and caption band on stills
  --frames a-b           render only frames a to b (a quick check; written as *-frames.mp4)
  --gif                  also write a GIF (<= 4 MiB; a looping cut loops whole) next to the film
  --studio               open Remotion Studio on this render's props
  --json                 print a JSON summary on stdout (logs go to stderr)
  -h, --help             this help;  -v, --version  the version

Outputs (in <projectDir>/.trailer/out/)
  trailer-16x9.mp4, trailer-9x16-<cut>.mp4, .srt, .vtt, poster-16x9.jpg, *.gif,
  history.jsonl (one JSON line per finished render: format, useCase, seconds, outputs)

Environment
  DEEPGRAM_API_KEY       Deepgram key (else .trailer/.env, else <projectDir>/.env)
  TRAILER_VOICE          Aura-2 model override (default aura-2-hermes-en)
  TRAILER_VOICE_ENGINE   deepgram | say | none
  TRAILER_HOME           engine runtime + cache (default ~/.cache/trailer)
  REMOTION_BROWSER       a Chrome / headless shell executable to render with

Exit codes: 0 ok, 1 failure, 2 lint errors, 3 missing dependency.
Docs: https://github.com/Dileep2896/trailer (Remotion is licensed separately: see its license)`;

/* ------------------------------------------------------------------ args */

const argv = process.argv.slice(2);
const VALUE_FLAGS = new Set(['--config', '--aspect', '--cut', '--voice-engine', '--stills', '--frames', '--use-case']);
const flags = {};
const positional = [];
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === '-h') flags['--help'] = true;
  else if (a === '-v') flags['--version'] = true;
  else if (a.startsWith('--')) {
    const [k, inline] = a.split(/=(.*)/s);
    if (VALUE_FLAGS.has(k)) {
      const v = inline ?? argv[i + 1];
      if (inline === undefined) i += 1;
      if (v === undefined || (inline === undefined && v.startsWith('--'))) {
        console.error(`${k} needs a value`);
        process.exit(EXIT.fail);
      }
      flags[k] = v;
    } else flags[k] = true;
  } else positional.push(a);
}
const json = !!flags['--json'];
const log = (m) => console.error(m);
const warnLog = (m) => console.error(`warning: ${m}`);
const step = (s) => log(`\n== ${s}`);

const finish = (summary, code) => {
  if (json) process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  process.exit(code);
};

const die = (e) => {
  const code = e?.code === EXIT.missing ? EXIT.missing : EXIT.fail;
  log(`error: ${e?.message ?? e}`);
  if (process.env.TRAILER_DEBUG && e?.stack) log(e.stack);
  if (json) process.stdout.write(`${JSON.stringify({ ok: false, errors: [String(e?.message ?? e)], code }, null, 2)}\n`);
  process.exit(code);
};

/* ------------------------------------------------------------------ commands */

const cmdSchema = () => {
  process.stdout.write(`${SCHEMA_FILE}\n`);
  process.exit(EXIT.ok);
};

const cmdInstall = () => {
  const r = runtime({ install: true, log });
  log(`engine ready in ${r.dev ? 'the engine folder (dev mode)' : r.dir}`);
  process.exit(EXIT.ok);
};

const nodeOk = () => Number(process.versions.node.split('.')[0]) >= 20;

const cmdDoctor = async () => {
  const checks = [];
  let voiceInfo = null;
  const add = (name, ok, detail, fix) => checks.push({ name, ok, detail, ...(ok ? {} : { fix }) });
  add('node', nodeOk(), `v${process.versions.node}`, 'install Node 20 or newer');
  let rt = null;
  try {
    rt = runtime({ install: false, log });
    add('engine', true, rt.dev ? 'dev mode (engine/node_modules)' : `installed in ${rt.dir}`);
  } catch (e) {
    add('engine', false, 'not installed yet', `run: node ${relative(process.cwd(), resolve(ENGINE, 'trailer.mjs')) || 'engine/trailer.mjs'} install (once; the first render also does it)`);
  }
  try {
    const t = ffTools(rt?.dir ?? ENGINE);
    const missing = missingFilters(rt?.dir ?? ENGINE);
    add('ffmpeg', !missing.length, `${t.source}${missing.length ? `; missing filters: ${missing.join(', ')}` : ''}`, 'install a full ffmpeg build (brew install ffmpeg / apt install ffmpeg)');
  } catch (e) {
    add('ffmpeg', false, e.message, 'install ffmpeg (brew install ffmpeg / apt install ffmpeg)');
  }
  const b = savedBrowser();
  const shell = playwrightShell();
  add('browser', true, b ? `remembered: ${b}` : `Remotion's headless shell, downloaded on first render into TRAILER_HOME/browser (about 570 MB, once)${shell ? '; Playwright headless shell found as a fallback' : ''}`);
  // The voice key: the environment, else <projectDir>/.trailer/.env, else <projectDir>/.env (the
  // same lookup a render uses). Only "present" or "absent" is reported, never the value.
  const projectDir = positional[1] ? resolve(positional[1]) : process.cwd();
  const pp = projectPaths(projectDir);
  const { source } = envKeySource('DEEPGRAM_API_KEY', pp);
  const say = process.platform === 'darwin' && spawnSync('which', ['say'], { stdio: 'ignore' }).status === 0;
  const espeak = spawnSync('which', ['espeak-ng'], { stdio: 'ignore' }).status === 0;
  const fallback = say ? 'say' : espeak ? 'espeak-ng' : 'none';
  voiceInfo = { key: source ? 'present' : 'absent', source, fallback, project: positional[1] ?? '.' };
  add('voice', true, `DEEPGRAM_API_KEY ${source ? `present (${source})` : 'absent (checked the environment, .trailer/.env and .env)'}; ${source ? 'narrator: Deepgram' : `drafts use the local fallback: ${fallback === 'none' ? 'none (silent drafts only)' : fallback}`}`);
  add('home', true, trailerHome());
  const ok = checks.every((c) => c.ok);
  if (json) process.stdout.write(`${JSON.stringify({ ok, version: VERSION, voice: voiceInfo, checks }, null, 2)}\n`);
  else for (const c of checks) console.log(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name.padEnd(8)} ${c.detail}${c.fix ? `\n      fix: ${c.fix}` : ''}`);
  process.exit(ok ? EXIT.ok : checks.find((c) => !c.ok && (c.name === 'engine' || c.name === 'ffmpeg' || c.name === 'node')) ? EXIT.missing : EXIT.fail);
};

const cmdInit = () => {
  const dir = resolve(positional[1] ?? '.');
  const useCase = flags['--use-case'] ?? 'explainer';
  if (!USE_CASES.includes(useCase)) die(new Error(`--use-case must be one of ${USE_CASES.join(', ')}`));
  const p = projectPaths(dir);
  if (existsSync(p.file) && !flags['--force']) die(new Error(`${rel(p, p.file)} already exists (pass --force to overwrite)`));
  const tpl = parseJson(resolve(ENGINE, 'templates', `${useCase}.json`));
  let name = basename(dir);
  try {
    const pkg = JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8'));
    if (pkg.name) name = String(pkg.name).replace(/^@[^/]+\//, '');
  } catch {}
  name = name.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  // Every template is a worked example for a fictional product: its name (and the lowercase
  // forms in urls, e.g. "tinlark.example") becomes this project's name.
  const esc = (x) => JSON.stringify(x).slice(1, -1);
  const from = String(tpl.projectName ?? 'Projectname');
  const slug = (x) => x.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let text = JSON.stringify(tpl, null, 2).replaceAll(esc(from), esc(name)).replaceAll(esc(from.toUpperCase()), esc(name.toUpperCase()));
  if (slug(from)) {
    text = text.replaceAll(slug(from), esc(slug(name) || 'app'));
    if (slug(from).includes('-')) text = text.replaceAll(slug(from).replaceAll('-', ''), esc((slug(name) || 'app').replaceAll('-', '')));
  }
  const cfg = JSON.parse(text);
  if (flags['--aspect']) {
    if (!ASPECTS.includes(flags['--aspect'])) die(new Error(`--aspect must be one of ${ASPECTS.join(', ')}`));
    cfg.aspect = flags['--aspect'];
  }
  mkdirSync(p.assets, { recursive: true });
  writeFileSync(p.file, `${JSON.stringify(cfg, null, 2)}\n`);
  const gi = resolve(p.sr, '.gitignore');
  if (!existsSync(gi)) writeFileSync(gi, ['# trailer: generated and private files', 'out/', 'voice/', 'shots/', 'review/', '.stage/', 'private/', '.env', ''].join('\n'));
  for (const [f, body] of [
    ['brief.md', `# ${name}: brief\n\nUse case: ${useCase}\n\n## Audience\n\nWho watches this, and what they should do after.\n\n## The one thing\n\nThe single idea the film must land.\n\n## Proof\n\nNumbers and facts from the project, each with its source (file and line, README section, commit).\n\n## Format\n\nThe film format and why it fits this project.\n`],
    ['script.md', `# ${name}: script\n\n| Scene | Line | Source |\n| --- | --- | --- |\n${cfg.scenes.flatMap((s) => (Array.isArray(s.say) ? s.say : s.say ? [s.say] : []).map((l) => `| ${s.id ?? s.type} | ${typeof l === 'string' ? l : l.text} | |`)).join('\n')}\n`],
  ]) {
    const fp = resolve(p.sr, f);
    if (!existsSync(fp) || flags['--force']) writeFileSync(fp, body);
  }
  const out = { ok: true, config: rel(p, p.file), useCase, aspect: cfg.aspect ?? '16:9', files: ['.trailer/trailer.config.json', '.trailer/brief.md', '.trailer/script.md', '.trailer/.gitignore', '.trailer/assets/'] };
  if (json) process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  else console.log(`started ${rel(p, p.file)} from the ${useCase} template\nnext: edit it, then run: node ${rel(p, resolve(ENGINE, 'trailer.mjs'))} ${positional[1] ?? '.'} --lint`);
  process.exit(EXIT.ok);
};

/* ------------------------------------------------------------------ lint */

let ajvValidate;
const schemaCheck = async (raw, rtDir) => {
  if (!ajvValidate) {
    const mod = await importRuntime(rtDir, 'ajv/dist/2020.js');
    const Ajv2020 = mod.default?.default ?? mod.default ?? mod.Ajv2020;
    const ajv = new Ajv2020({ allErrors: true, strict: false, allowUnionTypes: true });
    ajvValidate = ajv.compile(JSON.parse(readFileSync(SCHEMA_FILE, 'utf8')));
  }
  const c = { ...raw };
  for (const k of LEGACY_KEYS) delete c[k];
  if (ajvValidate(c)) return [];
  // Hide the "if" noise ajv adds for every failing allOf branch; keep the real messages.
  return (ajvValidate.errors ?? [])
    .filter((e) => e.keyword !== 'if' && e.keyword !== 'oneOf')
    .map((e) => `schema: ${e.instancePath || '(root)'} ${e.message}${e.params?.allowedValues ? ` (${e.params.allowedValues.join(', ')})` : ''}${e.params?.additionalProperty ? ` ("${e.params.additionalProperty}")` : ''}`)
    .filter((m, i, a) => a.indexOf(m) === i)
    .slice(0, 25);
};

/** Validate and lint one render. With `media`, the caption chunks come from the real voice. */
const lintRender = async (p, rtDir, media) => {
  const { errors, warnings } = validate(p.config, p.raw);
  if (rtDir) {
    try {
      errors.push(...(await schemaCheck(p.raw, rtDir)));
    } catch (e) {
      warnings.push(`schema check skipped: ${e.message}`);
    }
  } else warnings.push('schema check skipped: the engine is not installed (run `trailer install`)');
  let tl = null;
  let chunks = [];
  if (!errors.length) {
    tl = buildTimeline(p.config, media ?? { lines: [] });
    chunks = captionChunks(tl, { maxWords: resolveCaptions(p.config).maxWords });
  }
  const copy = lintCopy(p.config, chunks.map((c, i) => ({ where: `caption ${i + 1}`, text: c.text })), { banned: bannedTerms(p) });
  errors.push(...copy.errors);
  warnings.push(...copy.warnings);
  if (!errors.length) warnings.push(...lintFormat(p.config, { captionChunks: chunks, tl }));
  const words = spokenWords(p.config);
  const budget = wordBudget(p.config);
  if (words < budget[0] || words > budget[1]) warnings.push(`${words} spoken words; ${p.config.targetSeconds} s wants ${budget[0]} to ${budget[1]} at a natural pace${words > budget[1] ? ' (cut words; never speed the voice up)' : ''}`);
  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)], tl, chunks, words, budget };
};

/* ------------------------------------------------------------------ render one */

const outName = (p, ext, suffix = '') => resolve(p.out, `${p.name}${suffix}.${ext}`);

const renderOne = async (target, opts, ctx) => {
  const p = loadProject(target, opts);
  const summary = {
    ok: false,
    aspect: p.config.aspect,
    cut: p.config.cut ?? null,
    seconds: null,
    voiceSeconds: null,
    words: 0,
    wordBudget: null,
    voice: null,
    scenes: [],
    outputs: {},
    warnings: [],
    errors: [],
  };
  step(`${p.name}: lint`);
  const pre = await lintRender(p, ctx.rtDir, null);
  summary.words = pre.words;
  summary.wordBudget = pre.budget;
  const report = (r) => {
    for (const w of r.warnings) warnLog(w);
    for (const e of r.errors) log(`error: ${e}`);
  };
  report(pre);
  summary.warnings.push(...pre.warnings);
  if (pre.errors.length) {
    summary.errors.push(...pre.errors);
    log(`\n${pre.errors.length} error(s) in ${rel(p, p.file)}${p.config.cut ? ` (cut "${p.config.cut}")` : ''}.`);
    return { summary, code: EXIT.lint };
  }
  const th = resolveTheme(p.config);
  const mu = resolveMusic(p.config);
  log(`theme ${th.preset ?? 'custom'} ${th.mode} | ${th.background} | cut ${th.transition} | motion ${th.motion} | type ${th.type} | fonts ${th.fonts.display}/${th.fonts.ui}/${th.fonts.mono} | music ${p.config.music === false ? 'off' : (mu.file ?? `${mu.bpm} BPM ${mu.mood}`)}`);
  log(`${pre.words} words (budget ${pre.budget[0]} to ${pre.budget[1]} for ${p.config.targetSeconds} s); copy ok`);
  const settings = resolveVoice(p.config, { engine: flags['--voice-engine'] });
  summary.voice = { engine: settings.provider, model: settings.model, speed: settings.speed, fallback: false };
  if (flags['--lint']) {
    summary.ok = true;
    summary.scenes = pre.tl.scenes.map((s) => ({ id: s.id, type: s.type, from: s.from, duration: s.duration, lines: s.lines.length }));
    summary.seconds = +(pre.tl.total / FPS).toFixed(2);
    return { summary, code: EXIT.ok, estimate: true };
  }

  // A bad --stills value fails here, before the capture and the voice spend any time.
  if (flags['--stills']) (await import('./scripts/render.mjs')).stillFrames(flags['--stills'], pre.tl);

  const dir = ctx.rtDir;
  mkdirSync(p.out, { recursive: true });
  mkdirSync(p.stage, { recursive: true });

  step('capture');
  const shotsFile = resolve(p.stageRoot, 'shots.json');
  let shots;
  if ((flags['--skip-capture'] || ctx.captured) && existsSync(shotsFile)) {
    shots = JSON.parse(readFileSync(shotsFile, 'utf8'));
    log('capture: reusing the last capture');
  } else {
    const { capture } = await import('./scripts/capture.mjs');
    shots = await capture(p, { dir, log });
    mkdirSync(p.stageRoot, { recursive: true });
    writeFileSync(shotsFile, `${JSON.stringify(shots, null, 2)}\n`);
    ctx.captured = true;
  }

  step('voice');
  const { voice } = await import('./scripts/voice.mjs');
  const media = await voice(p, { dir, keep: !!flags['--keep-voice'], settings, log, warn: warnLog });
  summary.voice = { engine: media.provider, model: media.provider === 'deepgram' ? media.model : null, speed: media.speed, fallback: media.fallback };
  if (media.fallback) summary.warnings.push(`voice fell back to "${media.provider}"; not for publishing`);
  summary.voiceSeconds = media.seconds;

  const post = await lintRender(p, null, media);
  const extra = post.warnings.filter((w) => !pre.warnings.includes(w) && !w.startsWith('schema check skipped'));
  for (const w of extra) warnLog(w);
  summary.warnings.push(...extra);
  if (post.errors.length) {
    report({ errors: post.errors, warnings: [] });
    summary.errors.push(...post.errors);
    return { summary, code: EXIT.lint };
  }
  const tl = post.tl;
  const seconds = tl.total / FPS;
  summary.seconds = +seconds.toFixed(2);
  summary.scenes = tl.scenes.map((s) => ({ id: s.id, type: s.type, from: s.from, duration: s.duration, lines: s.lines.length }));
  log(`\ntimeline ${tl.total} frames = ${seconds.toFixed(1)} s (voice ${media.seconds.toFixed(1)} s)`);
  for (const s of tl.scenes) log(`  ${s.id.padEnd(14)} ${String(s.from).padStart(5)} +${String(s.duration).padStart(4)}  ${s.lines.length} line(s)`);
  if (tl.fit) log(`fitSeconds ${p.config.fitSeconds}: slack scaled to ${tl.fit.scale}; ${tl.fit.met ? 'met' : 'NOT met (the voice alone is too long: cut words)'}`);
  const [lo, hi] = durationWindow(p.config);
  if (seconds < lo || seconds > hi) {
    const w = `${seconds.toFixed(1)} s is outside ${lo} to ${hi} s for targetSeconds ${p.config.targetSeconds}; ${seconds < lo ? 'add a line or some "breath"/"hold"' : 'cut words or set fitSeconds'}`;
    warnLog(w);
    summary.warnings.push(w);
  }
  const srt = outName(p, 'srt');
  const vtt = outName(p, 'vtt');
  writeFileSync(srt, toSrt(post.chunks));
  writeFileSync(vtt, toVtt(post.chunks));
  summary.outputs.srt = rel(p, srt);
  summary.outputs.vtt = rel(p, vtt);

  step('music');
  const { ensureSfx, music: makeMusic } = await import('./scripts/audio.mjs');
  ensureSfx(dir);
  const { stagePublic } = await import('./scripts/render.mjs');
  const publicDir = stagePublic(p, dir);
  const musicSrc = makeMusic(p, { dir, tl, publicDir, log });

  const props = { config: p.config, shots, media: { lines: media.lines }, music: musicSrc };
  const propsFile = resolve(p.stage, 'props.json');
  writeFileSync(propsFile, `${JSON.stringify(props, null, 2)}\n`);
  writeFileSync(resolve(p.stage, 'timeline.json'), `${JSON.stringify({ total: tl.total, fps: FPS, scenes: tl.scenes, lines: tl.lines.map(({ words, ...l }) => l) }, null, 2)}\n`);
  summary.outputs.props = rel(p, propsFile);

  if (flags['--studio']) {
    step('studio');
    const bin = resolve(dir, 'node_modules', '.bin', process.platform === 'win32' ? 'remotion.cmd' : 'remotion');
    spawnSync(bin, ['studio', 'src/index.ts', `--props=${propsFile}`, `--public-dir=${publicDir}`], { cwd: dir, stdio: 'inherit' });
    summary.ok = true;
    return { summary, code: EXIT.ok };
  }
  if (flags['--no-render']) {
    log(`props at ${rel(p, propsFile)}; preview with --studio`);
    summary.ok = true;
    return { summary, code: EXIT.ok };
  }

  const R = await import('./scripts/render.mjs');
  ctx.session ??= await R.openSession({ runtimeDir: dir, publicDir, log });
  const S = ctx.session;
  const overlayProps = { ...props, overlay: !!flags['--safe-overlay'] };
  const portrait = p.config.aspect === '9:16';

  if (flags['--stills']) {
    step('stills');
    // Validate the spec before clearing the folder: a bad --stills must not delete earlier stills.
    const list = R.stillFrames(flags['--stills'], tl).map((s) => ({ frame: s.frame, output: resolve(p.review, `${s.name}.png`) }));
    R.freshDir(p.review);
    const files = await S.stills(overlayProps, list);
    const sheet = R.contactSheet(dir, files, resolve(p.review, 'sheet.jpg'), p.config.aspect);
    summary.outputs.review = rel(p, p.review);
    summary.outputs.stills = files.map((f) => rel(p, f));
    if (sheet) summary.outputs.sheet = rel(p, sheet);
    log(`stills: ${files.length} in ${rel(p, p.review)}`);
    summary.ok = true;
    return { summary, code: EXIT.ok };
  }

  step('render');
  let frameRange = null;
  if (flags['--frames']) {
    const m = String(flags['--frames']).match(/^(\d+)-(\d+)$/);
    if (!m) throw new Error('--frames takes a range like 0-150');
    frameRange = [Number(m[1]), Math.min(Number(m[2]), tl.total - 1)];
  }
  const mp4 = outName(p, 'mp4', frameRange ? '-frames' : '');
  const t0 = Date.now();
  await S.film(props, mp4, { frameRange });
  const dur = durationOf(dir, mp4);
  log(`render: ${rel(p, mp4)} (${dur.toFixed(2)} s, ${((Date.now() - t0) / 1000).toFixed(0)} s to render)`);
  summary.outputs.mp4 = rel(p, mp4);

  if (!frameRange) {
    step('poster');
    const pf = R.posterFrame(p.config, tl);
    const poster = resolve(p.out, `poster-${aspectSlug(p.config.aspect)}${p.config.cut ? `-${p.config.cut}` : ''}.jpg`);
    // The poster is a thumbnail, so it carries no burned-in caption.
    const posterProps = { ...props, config: { ...props.config, captions: { ...(typeof props.config.captions === 'object' ? props.config.captions : {}), enabled: false } } };
    await S.stills(posterProps, [{ frame: pf, output: poster }]);
    summary.outputs.poster = rel(p, poster);
    log(`poster: ${rel(p, poster)} (frame ${pf})`);
    if (flags['--gif']) {
      step('gif');
      const loop = p.config.scenes.at(-1)?.loop === true;
      const g = R.makeGif(dir, mp4, outName(p, 'gif'), { seconds: dur, aroundSec: pf / FPS, portrait, loop });
      summary.outputs.gif = rel(p, g.file);
      summary.gifBytes = g.bytes;
      log(`gif: ${rel(p, g.file)} (${R.mib(g.bytes)}, ${g.bytes} bytes, ${g.seconds} s from ${g.start.toFixed(1)} s${loop && g.start === 0 && g.seconds >= dur - 0.05 ? ', the whole loop' : ''})${g.over ? ` (still over ${R.mib(R.GIF_MAX_BYTES)})` : ''}`);
    }
    if (flags['--review']) {
      step('review');
      R.freshDir(p.review);
      const list = R.stillFrames('scenes', tl).map((s) => ({ frame: s.frame, output: resolve(p.review, `${s.name}.png`) }));
      const files = await S.stills(overlayProps, list);
      const sheet = R.contactSheet(dir, files, resolve(p.review, 'sheet.jpg'), p.config.aspect);
      summary.outputs.review = rel(p, p.review);
      if (sheet) summary.outputs.sheet = rel(p, sheet);
      log(`review: ${files.length} stills and a contact sheet in ${rel(p, p.review)}`);
    }
    const probe = ffprobe(dir, ['-v', 'error', '-show_entries', 'stream=codec_name,width,height,r_frame_rate', '-of', 'json', mp4]);
    const streams = JSON.parse(probe).streams ?? [];
    const v = streams.find((s) => s.width);
    const a = streams.find((s) => !s.width);
    log(`check: ${v?.codec_name} ${v?.width}x${v?.height} @ ${v?.r_frame_rate}, audio ${a?.codec_name ?? 'none'}`);
    // One JSON object per line (JSON Lines). format and useCase come from config.meta, so the
    // skills can see which formats this project has already used.
    const meta = p.raw.meta ?? {};
    const entry = { at: new Date().toISOString(), render: p.name, aspect: p.config.aspect, cut: p.config.cut ?? null, format: meta.format ?? null, useCase: meta.useCase ?? null, seconds: summary.seconds, words: summary.words, voice: summary.voice, outputs: summary.outputs };
    const history = resolve(p.out, 'history.jsonl');
    appendFileSync(history, `${JSON.stringify(entry)}\n`);
    summary.outputs.history = rel(p, history);
  }
  summary.ok = true;
  return { summary, code: EXIT.ok };
};

/* ------------------------------------------------------------------ main */

const main = async () => {
  if (flags['--version']) {
    console.log(VERSION);
    process.exit(EXIT.ok);
  }
  const cmd = positional[0];
  if (flags['--help'] || !cmd) {
    (flags['--help'] ? console.log : console.error)(HELP);
    process.exit(cmd || flags['--help'] ? EXIT.ok : EXIT.fail);
  }
  if (!nodeOk()) die(Object.assign(new Error(`Node 20 or newer is needed (this is ${process.versions.node})`), { code: EXIT.missing }));
  if (cmd === 'schema') return cmdSchema();
  if (cmd === 'install') return cmdInstall();
  if (cmd === 'doctor') return cmdDoctor();
  if (cmd === 'init') return cmdInit();
  if (cmd === 'help') {
    console.log(HELP);
    process.exit(EXIT.ok);
  }
  const target = cmd;
  if (flags['--aspect'] && !ASPECTS.includes(flags['--aspect'])) die(new Error(`--aspect must be one of ${ASPECTS.join(', ')}`));
  // Which renders: one, or with --all the film and every cut.
  const base = loadProject(target, { config: flags['--config'] });
  const renders = flags['--all']
    ? [{ aspect: flags['--aspect'] }, ...Object.keys(base.raw.cuts ?? {}).map((cut) => ({ cut }))]
    : [{ aspect: flags['--aspect'], cut: flags['--cut'] }];
  if (flags['--cut'] && !base.raw.cuts?.[flags['--cut']]) die(new Error(`no cut "${flags['--cut']}" in this config (cuts: ${Object.keys(base.raw.cuts ?? {}).join(', ') || 'none'})`));
  // The engine runtime: --lint works without it (the schema pass is then skipped).
  let rtDir = null;
  try {
    rtDir = runtime({ install: !flags['--lint'], log }).dir;
  } catch (e) {
    if (!flags['--lint']) throw e;
  }
  if (rtDir && !flags['--lint']) ffTools(rtDir);
  const ctx = { rtDir, session: null, captured: false };
  const results = [];
  let code = EXIT.ok;
  try {
    for (const r of renders) {
      const res = await renderOne(target, { config: flags['--config'], aspect: r.aspect, cut: r.cut }, ctx);
      results.push(res.summary);
      if (res.code !== EXIT.ok) code = res.code;
    }
  } finally {
    await ctx.session?.close();
  }
  if (!json) {
    const done = results.filter((s) => s.outputs.mp4 || s.outputs.review);
    if (done.length) {
      log('\ndone:');
      for (const s of done) log(`  ${s.aspect}${s.cut ? ` (${s.cut})` : ''}: ${s.outputs.mp4 ?? s.outputs.review}  ${s.seconds} s  voice ${s.voice?.engine}${s.voice?.fallback ? ' (FALLBACK)' : ''}`);
    } else if (flags['--lint'] && code === EXIT.ok) log('\nlint ok');
  }
  const summary = results.length === 1 ? results[0] : { ok: results.every((s) => s.ok), renders: results };
  finish(summary, code);
};

main().catch(die);


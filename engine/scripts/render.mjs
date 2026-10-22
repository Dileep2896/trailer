// Rendering with the Remotion API: one bundle per run, then the film, stills, the poster, a
// GIF and the review sheet.
//
// The render's public folder is .trailer/.stage/public/: characters/ and sfx/ link to the
// engine runtime, vo/ to .trailer/voice, shots/ to .trailer/shots, assets/ to
// .trailer/assets; music/ holds the generated beds.
import { existsSync, lstatSync, mkdirSync, readdirSync, rmSync, statSync, symlinkSync, unlinkSync } from 'node:fs';
import { platform } from 'node:os';
import { resolve } from 'node:path';
import { FPS } from '../src/timeline.mjs';
import { browserCacheDir, ffmpeg, importRuntime, playwrightShell, rememberBrowser, savedBrowser } from './runtime.mjs';

/* ------------------------------------------------------------------ public dir */

const link = (target, at) => {
  try {
    const st = lstatSync(at);
    if (st.isSymbolicLink()) unlinkSync(at);
    else if (st.isDirectory()) rmSync(at, { recursive: true });
    else unlinkSync(at);
  } catch {}
  mkdirSync(target, { recursive: true });
  symlinkSync(target, at, platform() === 'win32' ? 'junction' : 'dir');
};

/** Build .trailer/.stage/public with links to the runtime's and the project's media. */
export const stagePublic = (p, runtimeDir) => {
  const pub = resolve(p.stageRoot, 'public');
  mkdirSync(pub, { recursive: true });
  link(resolve(runtimeDir, 'public', 'characters'), resolve(pub, 'characters'));
  link(resolve(runtimeDir, 'public', 'sfx'), resolve(pub, 'sfx'));
  link(p.voice, resolve(pub, 'vo'));
  link(p.shots, resolve(pub, 'shots'));
  link(p.assets, resolve(pub, 'assets'));
  mkdirSync(resolve(pub, 'music'), { recursive: true });
  return pub;
};

/* ------------------------------------------------------------------ browser */

/** Run fn with the working directory set to dir (Remotion resolves its download folder from it). */
const inDir = async (dir, fn) => {
  const prev = process.cwd();
  process.chdir(dir);
  try {
    return await fn();
  } finally {
    process.chdir(prev);
  }
};

/**
 * The browser executable to render with. Remotion's headless shell is downloaded once into
 * TRAILER_HOME/browser (never into the project) and remembered in TRAILER_HOME/browser.json;
 * where the download fails, Playwright's headless shell is used and remembered instead.
 */
export const ensureRenderBrowser = async (R, log) => {
  const saved = savedBrowser();
  if (saved) return { executable: saved, playwright: saved === playwrightShell() };
  try {
    const cache = browserCacheDir();
    log(`render: checking Remotion's headless browser in ${cache} (the first run downloads about 570 MB, once)`);
    const st = await inDir(cache, () => R.ensureBrowser({ logLevel: 'error' }));
    const executable = st?.path ?? null;
    if (executable) rememberBrowser(executable, 'remotion');
    return { executable, playwright: false };
  } catch (e) {
    const shell = playwrightShell();
    if (!shell) throw new Error(`no browser to render with: Remotion could not fetch its headless shell (${String(e.message).split('\n')[0]}) and no Playwright headless shell was found (npx playwright install chromium-headless-shell)`);
    log(`render: using the Playwright headless shell at ${shell}`);
    rememberBrowser(shell, 'playwright');
    return { executable: shell, playwright: true };
  }
};

/* ------------------------------------------------------------------ session */

// The bundle registers 70 Google font modules; on a busy machine the first page load can take
// longer than Remotion's 30 s default.
const TIMEOUT = Number(process.env.TRAILER_RENDER_TIMEOUT_MS ?? 120000);

/** Bundle once; returns helpers that render the film and stills from it. */
export const openSession = async ({ runtimeDir, publicDir, log = (m) => console.error(m) }) => {
  const R = await importRuntime(runtimeDir, '@remotion/renderer');
  const B = await importRuntime(runtimeDir, '@remotion/bundler');
  const picked = await ensureRenderBrowser(R, log);
  let browserExecutable = picked.executable;
  let onPlaywright = picked.playwright;
  log('render: bundling');
  const serveUrl = await B.bundle({
    entryPoint: resolve(runtimeDir, 'src', 'index.ts'),
    publicDir,
    symlinkPublicDir: platform() !== 'win32',
    enableCaching: true,
  });
  let browser = null;
  const getBrowser = async () => {
    browser ??= await R.openBrowser('chrome', { browserExecutable, logLevel: 'error', chromiumOptions: { gl: 'swangle' } });
    return browser;
  };
  const comp = async (inputProps) => R.selectComposition({ serveUrl, id: 'Trailer', inputProps, browserExecutable, puppeteerInstance: await getBrowser(), logLevel: 'error', timeoutInMilliseconds: TIMEOUT });
  const retryOnPlaywright = async (fn) => {
    try {
      return await fn();
    } catch (e) {
      // A browser that crashed or closed mid-render (seen on busy machines): reopen it once.
      if (/Target closed|Session closed|browser has disconnected/i.test(String(e?.message))) {
        log('render: the browser closed unexpectedly; reopening it and retrying once');
        await browser?.close({ silent: true }).catch(() => {});
        browser = null;
        return fn();
      }
      const shell = playwrightShell();
      if (onPlaywright || process.env.REMOTION_BROWSER || !shell) throw e;
      log(`render: Remotion's browser failed (${String(e.message).split('\n')[0]}); retrying on the Playwright headless shell`);
      browserExecutable = shell;
      onPlaywright = true;
      rememberBrowser(shell, 'playwright');
      await browser?.close({ silent: true }).catch(() => {});
      browser = null;
      return fn();
    }
  };

  return {
    /** The film (or a frame range of it) to mp4. */
    film: (inputProps, output, { frameRange = null, onProgress } = {}) =>
      retryOnPlaywright(async () => {
        const composition = await comp(inputProps);
        let last = -1;
        await R.renderMedia({
          composition,
          serveUrl,
          codec: 'h264',
          outputLocation: output,
          inputProps,
          crf: 18,
          imageFormat: 'jpeg',
          jpegQuality: 95,
          pixelFormat: 'yuv420p',
          audioCodec: 'aac',
          concurrency: '50%',
          frameRange,
          overwrite: true,
          browserExecutable,
          puppeteerInstance: await getBrowser(),
          logLevel: 'error',
          timeoutInMilliseconds: TIMEOUT,
          onProgress: ({ progress }) => {
            const pct = Math.floor(progress * 100);
            if (pct >= last + 10 || pct === 100) {
              last = pct;
              (onProgress ?? log)(`render: ${pct}%`);
            }
          },
        });
        return output;
      }),
    /** One still per frame, as png (or jpeg when the name ends .jpg). */
    stills: (inputProps, list) =>
      retryOnPlaywright(async () => {
        const composition = await comp(inputProps);
        for (const { frame, output } of list) {
          await R.renderStill({
            composition,
            serveUrl,
            output,
            frame: Math.max(0, Math.min(composition.durationInFrames - 1, Math.round(frame))),
            inputProps,
            imageFormat: output.endsWith('.jpg') ? 'jpeg' : 'png',
            ...(output.endsWith('.jpg') ? { jpegQuality: 92 } : {}),
            overwrite: true,
            browserExecutable,
            puppeteerInstance: await getBrowser(),
            logLevel: 'error',
            timeoutInMilliseconds: TIMEOUT,
          });
        }
        return list.map((s) => s.output);
      }),
    close: async () => {
      await browser?.close({ silent: true }).catch(() => {});
    },
  };
};

/* ------------------------------------------------------------------ picking frames */

/** The poster frame: a scene with poster: true, else the first ui/screenshot, else the turn. */
export const posterFrame = (config, tl) => {
  const pick = (fn) => tl.scenes.find((s, i) => fn(config.scenes[i] ?? {}, s));
  const sc = pick((c) => c.poster === true) ?? pick((c) => c.type === 'ui' || c.type === 'screenshot') ?? pick((c) => c.turn === true) ?? pick((c) => c.type === 'title' || c.type === 'kinetic') ?? tl.scenes[0];
  return Math.round(sc.from + sc.duration * 0.6);
};

/**
 * Frames for --stills: "scenes" (each scene at 60%), "cues" (12 frames after each line starts),
 * or a comma list of seconds and scene ids ("1.5,4,hook" : 1.5 s, 4 s and the hook scene at
 * 60%). Anything else is an error, so a typo never wipes the review folder for nothing.
 */
export const stillFrames = (spec, tl) => {
  const at60 = (s, i) => ({ frame: Math.round(s.from + s.duration * 0.6), name: `scene-${String(i + 1).padStart(2, '0')}-${s.id}` });
  if (spec === 'scenes' || spec === true) return tl.scenes.map(at60);
  if (spec === 'cues') return tl.lines.map((l, i) => ({ frame: l.from + 12, name: `line-${String(i + 1).padStart(2, '0')}-${l.scene}` }));
  const tokens = String(spec).split(',').map((x) => x.trim()).filter(Boolean);
  const bad = [];
  const out = [];
  for (const x of tokens) {
    const i = tl.scenes.findIndex((s) => s.id === x);
    if (i >= 0) out.push(at60(tl.scenes[i], i));
    else if (/^\d+(\.\d+)?s?$/.test(x)) {
      const sec = Number(x.replace(/s$/, ''));
      out.push({ frame: Math.round(sec * FPS), name: `t-${sec.toFixed(2).replace('.', '_')}s` });
    } else bad.push(x);
  }
  if (bad.length || !out.length) throw new Error(`--stills takes "scenes", "cues", or a comma list of seconds and scene ids (scenes: ${tl.scenes.map((s) => s.id).join(', ')}); not ${bad.length ? bad.map((b) => `"${b}"`).join(', ') : `"${spec}"`}`);
  return out;
};

/** Clear old pngs in a review folder before writing new ones. */
export const freshDir = (dir) => {
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) if (/\.(png|jpg)$/.test(f)) rmSync(resolve(dir, f));
};

/** A contact sheet of the stills (4 across) with ffmpeg. */
export const contactSheet = (runtimeDir, files, out, aspect = '16:9') => {
  if (!files.length) return null;
  const cols = Math.min(4, files.length);
  const rows = Math.ceil(files.length / cols);
  // Tiles keep the frame's shape: 480x270 (16:9), 270x480 (9:16), 360x360 (1:1).
  const portrait = aspect === true || aspect === '9:16';
  const square = aspect === '1:1';
  const w = square ? 360 : portrait ? 270 : 480;
  const h = square ? 360 : portrait ? 480 : 270;
  const inputs = files.flatMap((f) => ['-i', f]);
  const scaled = files.map((_, i) => `[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:-1:-1:black,setsar=1[s${i}]`).join(';');
  const order = files.map((_, i) => `[s${i}]`).join('');
  ffmpeg(runtimeDir, [...inputs, '-filter_complex', `${scaled};${order}concat=n=${files.length}:v=1:a=0,tile=${cols}x${rows}:padding=6:margin=6:color=black`, '-frames:v', '1', '-q:v', '3', out]);
  return out;
};

/**
 * A GIF of the film: 12 fps, 720 px on the long side, palette per clip. If it is over
 * `maxBytes`, a shorter window around the poster frame is used instead.
 */
/** The GIF size limit: 4 MiB (4 x 1024 x 1024 bytes). */
export const GIF_MAX_BYTES = 4 * 1024 * 1024;
export const mib = (bytes) => `${(bytes / 1048576).toFixed(2)} MiB`;

/**
 * A GIF of the film under maxBytes. A looping render (last scene loop: true) tries the whole
 * film first, so the GIF replays seamlessly from its last frame into its first; otherwise (or
 * when the whole film does not fit) it takes the opening, then a shorter window around the poster.
 */
export const makeGif = (runtimeDir, mp4, out, { seconds, aroundSec = 0, maxBytes = GIF_MAX_BYTES, portrait = false, loop = false }) => {
  const scale = portrait ? 'scale=-2:720' : 'scale=720:-2';
  const sz = (n) => (portrait ? `scale=-2:${n}` : `scale=${n}:-2`);
  const attempt = (start, dur, fps, sc) => {
    ffmpeg(runtimeDir, ['-ss', String(start), '-t', String(dur), '-i', mp4, '-filter_complex', `fps=${fps},${sc}:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`, '-loop', '0', out]);
    return statSync(out).size;
  };
  const whole = +seconds.toFixed(2);
  const tries = [
    ...(loop && seconds <= 40 ? [[0, whole, 12, sz(600)], [0, whole, 10, sz(540)], [0, whole, 10, sz(480)], [0, whole, 8, sz(420)], [0, whole, 8, sz(360)]] : []),
    [0, Math.min(seconds, 12), 12, scale],
    [Math.max(0, aroundSec - 4), 8, 12, scale],
    [Math.max(0, aroundSec - 3), 6, 10, portrait ? 'scale=-2:600' : 'scale=600:-2'],
    [Math.max(0, aroundSec - 2), 4, 10, portrait ? 'scale=-2:480' : 'scale=480:-2'],
  ];
  for (const [start, dur, fps, sc] of tries) {
    const size = attempt(start, dur, fps, sc);
    if (size <= maxBytes) return { file: out, bytes: size, start, seconds: dur };
  }
  return { file: out, bytes: statSync(out).size, start: tries.at(-1)[0], seconds: tries.at(-1)[1], over: true };
};

export const exists = existsSync;

// Where the engine runs from, and the external tools it needs (Node packages, ffmpeg, a browser).
//
// Dev mode: when engine/node_modules is installed (a git checkout after `pnpm install`), the
// engine runs in place. Otherwise (a plugin install, where the engine folder may be read-only
// and has no node_modules) the engine's source is synced into a runtime folder under
// TRAILER_HOME, keyed by the package version and a hash of package.json + lockfiles, and its
// dependencies are installed there once.
//
//   TRAILER_HOME = $TRAILER_HOME, else ${XDG_CACHE_HOME:-~/.cache}/trailer
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir, platform } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ENGINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PKG = JSON.parse(readFileSync(resolve(ENGINE, 'package.json'), 'utf8'));
export const VERSION = PKG.version;

/** Exit codes: 0 ok, 1 failure, 2 lint errors, 3 missing dependency. */
export const EXIT = { ok: 0, fail: 1, lint: 2, missing: 3 };

export class MissingDependency extends Error {
  constructor(msg) {
    super(msg);
    this.code = EXIT.missing;
  }
}

export const trailerHome = () => resolve(process.env.TRAILER_HOME || join(process.env.XDG_CACHE_HOME || join(homedir(), '.cache'), 'trailer'));

const LOCKS = ['package.json', 'pnpm-lock.yaml', 'package-lock.json'];
const SYNC = ['src', 'public/characters', 'remotion.config.ts', 'tsconfig.json', ...LOCKS];

const engineHash = () => {
  const h = createHash('sha256');
  for (const f of LOCKS) if (existsSync(resolve(ENGINE, f))) h.update(f).update(readFileSync(resolve(ENGINE, f)));
  return h.digest('hex').slice(0, 8);
};

/** A hash of the engine's source, so a synced runtime is refreshed when the source changes. */
const sourceHash = () => {
  const h = createHash('sha256');
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else h.update(p.slice(ENGINE.length)).update(readFileSync(p));
    }
  };
  walk(resolve(ENGINE, 'src'));
  return h.digest('hex').slice(0, 12);
};

export const devMode = () => existsSync(resolve(ENGINE, 'node_modules', 'remotion', 'package.json'));

const runtimePath = () => resolve(trailerHome(), `engine-${VERSION}-${engineHash()}`);

const installed = (dir) => existsSync(resolve(dir, 'node_modules', 'remotion', 'package.json')) && existsSync(resolve(dir, 'node_modules', '@remotion', 'renderer', 'package.json'));

const has = (cmd, args = ['--version']) => {
  try {
    return spawnSync(cmd, args, { stdio: 'ignore', shell: platform() === 'win32' }).status === 0;
  } catch {
    return false;
  }
};

/** Install the dependencies in `dir`: pnpm (frozen lockfile), else npm ci. */
const installDeps = (dir, log) => {
  const run = (cmd, args) => spawnSync(cmd, args, { cwd: dir, stdio: ['ignore', 'inherit', 'inherit'], shell: platform() === 'win32' }).status === 0;
  if (existsSync(resolve(dir, 'pnpm-lock.yaml')) && has('pnpm')) {
    log(`installing engine dependencies with pnpm in ${dir}`);
    if (run('pnpm', ['install', '--frozen-lockfile', '--ignore-workspace', '--config.confirmModulesPurge=false'])) return;
  }
  if (existsSync(resolve(dir, 'package-lock.json')) && has('npm')) {
    log(`installing engine dependencies with npm ci in ${dir}`);
    if (run('npm', ['ci', '--no-audit', '--no-fund'])) return;
  }
  throw new MissingDependency('could not install the engine dependencies: install pnpm (https://pnpm.io) or npm, check the network, then run `node engine/trailer.mjs install`');
};

/**
 * The folder the engine runs from, installed and in sync with the source. Never installs
 * unless `install` is true (the CLI passes true for commands that need the packages).
 */
export const runtime = ({ install = true, log = (m) => console.error(m) } = {}) => {
  if (devMode()) return { dir: ENGINE, dev: true };
  const dir = runtimePath();
  const stamp = resolve(dir, '.source');
  const src = sourceHash();
  if (!existsSync(stamp) || readFileSync(stamp, 'utf8') !== src) {
    mkdirSync(dir, { recursive: true });
    for (const f of SYNC) {
      const from = resolve(ENGINE, f);
      if (!existsSync(from)) continue;
      const to = resolve(dir, f);
      if (f === 'src') rmSync(to, { recursive: true, force: true });
      mkdirSync(dirname(to), { recursive: true });
      cpSync(from, to, { recursive: true });
    }
    writeFileSync(stamp, src);
  }
  if (!installed(dir)) {
    if (!install) throw new MissingDependency(`the engine is not installed yet; run \`node ${resolve(ENGINE, 'trailer.mjs')} install\``);
    installDeps(dir, log);
  }
  return { dir, dev: false };
};

/** import() a package installed in the runtime folder. */
export const importRuntime = async (dir, name) => {
  const req = createRequire(resolve(dir, 'package.json'));
  let entry;
  try {
    entry = req.resolve(name);
  } catch {
    throw new MissingDependency(`the package "${name}" is not installed in ${dir}; run \`node engine/trailer.mjs install\``);
  }
  return import(pathToFileURL(entry).href);
};

/* ------------------------------------------------------------------ ffmpeg */

const onPath = (bin) => (process.env.PATH ?? '').split(delimiter).some((d) => d && existsSync(join(d, platform() === 'win32' ? `${bin}.exe` : bin)));

let tools = null;

/**
 * ffmpeg and ffprobe: the system ones when on PATH (preferred), else Remotion's bundled
 * binaries (`remotion ffmpeg`), which cover what the engine needs.
 */
export const ffTools = (dir) => {
  if (tools) return tools;
  if (onPath('ffmpeg') && onPath('ffprobe')) tools = { ffmpeg: ['ffmpeg'], ffprobe: ['ffprobe'], source: 'system' };
  else {
    const bin = resolve(dir, 'node_modules', '.bin', platform() === 'win32' ? 'remotion.cmd' : 'remotion');
    if (!existsSync(bin)) throw new MissingDependency('ffmpeg is not installed and the engine is not installed either; install ffmpeg (brew install ffmpeg / apt install ffmpeg) or run `node engine/trailer.mjs install`');
    tools = { ffmpeg: [bin, 'ffmpeg'], ffprobe: [bin, 'ffprobe'], source: 'remotion' };
  }
  return tools;
};

export const ffmpeg = (dir, args, opts = {}) => {
  const t = ffTools(dir);
  return execFileSync(t.ffmpeg[0], [...t.ffmpeg.slice(1), '-y', '-loglevel', 'error', ...args], { maxBuffer: 1 << 26, ...opts });
};

export const ffprobe = (dir, args) => {
  const t = ffTools(dir);
  return execFileSync(t.ffprobe[0], [...t.ffprobe.slice(1), ...args], { maxBuffer: 1 << 26 }).toString();
};

/** Seconds of a media file. */
export const durationOf = (dir, file) => Number(ffprobe(dir, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).trim());

/** Filters the voice and music steps use; doctor checks every one is present. */
export const FILTERS = ['loudnorm', 'silenceremove', 'atempo', 'aevalsrc', 'anoisesrc', 'acrusher', 'aecho', 'amix', 'alimiter', 'areverse', 'amultiply', 'bandpass'];

export const missingFilters = (dir) => {
  const list = ffmpeg(dir, ['-hide_banner', '-filters']).toString();
  return FILTERS.filter((f) => !new RegExp(`\\s${f}\\s`).test(list));
};

/* ------------------------------------------------------------------ browser */

const browserFile = () => resolve(trailerHome(), 'browser.json');

/** Playwright's newest headless shell (or Chromium), for when Remotion's own browser is unavailable. */
export const playwrightShell = () => {
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, join(homedir(), 'Library/Caches/ms-playwright'), join(homedir(), '.cache/ms-playwright'), process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright')].filter(Boolean);
  for (const root of roots) {
    if (!existsSync(root)) continue;
    const dirs = readdirSync(root)
      .filter((d) => d.startsWith('chromium_headless_shell-'))
      .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
    for (const d of dirs) {
      for (const [arch, exe] of [
        ['chrome-headless-shell-mac-arm64', 'chrome-headless-shell'],
        ['chrome-headless-shell-mac-x64', 'chrome-headless-shell'],
        ['chrome-headless-shell-linux64', 'chrome-headless-shell'],
        ['chrome-headless-shell-win64', 'chrome-headless-shell.exe'],
        ['chrome-linux', 'headless_shell'],
      ]) {
        const p = join(root, d, arch, exe);
        if (existsSync(p)) return p;
      }
    }
  }
  return null;
};

/** The Remotion renderer version the engine pins; a remembered Remotion browser is only reused for it. */
export const REMOTION_VERSION = PKG.dependencies?.['@remotion/renderer'] ?? null;

/**
 * Where Remotion's own headless shell is downloaded: TRAILER_HOME/browser (about 570 MB, once).
 * Remotion puts its download next to the nearest package.json above the current directory, so
 * the engine runs that step from this folder (which has its own package.json) and never from
 * the user's project or home directory.
 */
export const browserCacheDir = () => {
  const dir = resolve(trailerHome(), 'browser');
  mkdirSync(dir, { recursive: true });
  const pkg = resolve(dir, 'package.json');
  if (!existsSync(pkg)) writeFileSync(pkg, `${JSON.stringify({ name: 'trailer-browser-cache', private: true, description: "Remotion's headless browser for trailer; safe to delete" }, null, 2)}\n`);
  return dir;
};

/**
 * The browser to render with: REMOTION_BROWSER, else the one remembered in
 * TRAILER_HOME/browser.json, else null (Remotion's own, fetched on first render). A remembered
 * Remotion download is skipped when the engine's Remotion version has changed since.
 */
export const savedBrowser = () => {
  if (process.env.REMOTION_BROWSER) return process.env.REMOTION_BROWSER;
  try {
    const saved = JSON.parse(readFileSync(browserFile(), 'utf8'));
    if (saved.source === 'remotion' && saved.remotion !== REMOTION_VERSION) return null;
    if (saved.executable && existsSync(saved.executable)) return saved.executable;
  } catch {}
  return null;
};

/** Remember the browser in TRAILER_HOME/browser.json. source: "remotion" or "playwright". */
export const rememberBrowser = (executable, source = 'playwright') => {
  mkdirSync(trailerHome(), { recursive: true });
  writeFileSync(browserFile(), `${JSON.stringify({ executable, source, ...(source === 'remotion' ? { remotion: REMOTION_VERSION } : {}) }, null, 2)}\n`);
};

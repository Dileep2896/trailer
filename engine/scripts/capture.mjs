// Captures the pages a video uses: one 2x PNG per page plus the boxes (page CSS px) of the
// elements the cursor clicks, the rings circle and the camera focuses.
//
// Three sources, per page:
//   capture.pages[].image   a ready-made screenshot (relative to the config), boxes given as
//                           rectangles. Needs no browser (what the example and CI use).
//   capture.serve           { dir, port? }: the engine serves a static folder (relative to
//                           the project) for the capture and stops it after.
//   capture.baseUrl/port    an app already running, else capture.startCmd is started in
//                           capture.cwd (relative to the project), waited for, and stopped.
//
// Output: .trailer/shots/<page>.png; returns { page: { src, width, height, view, boxes } }.
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { ffprobe, importRuntime, playwrightShell } from './runtime.mjs';
import { startStatic } from './serve.mjs';

export const capture = async (p, { dir, log = (m) => console.error(m) }) => {
  const cap = p.config.capture ?? {};
  const pages = cap.pages ?? [];
  mkdirSync(p.shots, { recursive: true });
  const out = {};

  for (const pg of pages.filter((x) => x.image)) {
    const src = resolve(p.configDir, pg.image);
    if (!existsSync(src)) throw new Error(`capture page "${pg.name}": image ${pg.image} not found (relative to the config)`);
    const [w, h] = ffprobe(dir, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src])
      .trim()
      .split(',')
      .map(Number);
    const scale = pg.scale ?? 2;
    copyFileSync(src, resolve(p.shots, `${pg.name}.png`));
    const boxes = {};
    for (const b of pg.boxes ?? []) boxes[b.name] = { x: b.x, y: b.y, width: b.width, height: b.height };
    out[pg.name] = { src: `shots/${pg.name}.png`, width: w / scale, height: h / scale, view: Math.min(h / scale, cap.height ?? 900), boxes };
    log(`capture: image ${pg.name} ${w / scale}x${h / scale}, ${Object.keys(boxes).length} boxes`);
  }

  const live = pages.filter((x) => !x.image);
  if (live.length) {
    const pw = await importRuntime(dir, 'playwright');
    const chromium = pw.chromium ?? pw.default?.chromium;
    let server = null;
    let base;
    if (cap.serve) {
      const root = resolve(p.projectDir, cap.serve.dir ?? '.');
      server = await startStatic(root, cap.serve.port ?? 0);
      base = `http://127.0.0.1:${server.port}`;
      log(`capture: serving ${cap.serve.dir ?? '.'} at ${base}`);
    } else {
      const port = cap.port ?? 3000;
      base = (cap.baseUrl ?? `http://localhost:${port}`).replace(/\/$/, '');
      server = await ensureApp(base, cap, p.appDir, port, log);
    }
    try {
      await shoot(chromium, live, base, cap, p.shots, out, log, dir);
    } finally {
      server?.stop();
    }
  }
  return out;
};

/** Launch Chromium: Playwright's own, else a headless shell on disk, else install it once. */
const launch = async (chromium, log, dir) => {
  try {
    return await chromium.launch();
  } catch (e) {
    const shell = playwrightShell();
    if (shell) return chromium.launch({ executablePath: shell });
    log('capture: no Playwright browser found; installing chromium-headless-shell (one time)');
    const cli = resolve(dirname(createRequire(resolve(dir, 'package.json')).resolve('playwright/package.json')), 'cli.js');
    const r = spawnSync(process.execPath, [cli, 'install', 'chromium-headless-shell'], { stdio: ['ignore', 'inherit', 'inherit'] });
    if (r.status === 0) return chromium.launch();
    throw new Error(`capture needs a browser: ${String(e.message).split('\n')[0]}; run \`npx playwright install chromium-headless-shell\``);
  }
};

const answers = async (url) => {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return r.status < 500;
  } catch {
    return false;
  }
};

/** Use the running app, or start it and return a handle that stops it. */
const ensureApp = async (base, cap, cwd, port, log) => {
  const ready = `${base}${cap.readyPath ?? '/'}`;
  if (await answers(ready)) {
    log(`capture: using the app already running at ${base}`);
    return null;
  }
  if (!cap.startCmd) throw new Error(`nothing answers at ${ready}; start the app, or set capture.startCmd (or capture.serve for a static folder)`);
  log(`capture: starting "${cap.startCmd}"`);
  const child = spawn('sh', ['-c', cap.startCmd], { cwd, detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port) } });
  let output = '';
  child.stdout.on('data', (d) => (output = (output + d).slice(-4000)));
  child.stderr.on('data', (d) => (output = (output + d).slice(-4000)));
  const stop = () => {
    if (child.exitCode !== null) return;
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {}
    setTimeout(() => {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {}
    }, 3000).unref();
    log('capture: stopped the app');
  };
  const deadline = Date.now() + (cap.readyTimeout ?? 120) * 1000;
  while (!(await answers(ready))) {
    if (child.exitCode !== null) throw new Error(`the app exited (${child.exitCode}) before answering:\n${output}`);
    if (Date.now() > deadline) {
      stop();
      throw new Error(`the app did not answer at ${ready} in time:\n${output}`);
    }
    await new Promise((r) => setTimeout(r, 700));
  }
  log(`capture: app is up at ${base}`);
  return { stop };
};

/**
 * 'tid:x' test id, 'text:x' visible text (substring, case-insensitive), 'exact:x' visible text
 * matched exactly, else any Playwright/CSS selector (e.g. button:text-is("Apply")); an '@n'
 * suffix picks the nth match.
 */
const find = (page, spec) => {
  const m = spec.match(/^(.*)@(\d+)$/);
  const s = m ? m[1] : spec;
  const loc = s.startsWith('tid:')
    ? page.getByTestId(s.slice(4))
    : s.startsWith('text:')
      ? page.getByText(s.slice(5), { exact: false })
      : s.startsWith('exact:')
        ? page.getByText(s.slice(6), { exact: true })
        : page.locator(s);
  return m ? loc.nth(Number(m[2])) : loc.first();
};

/** Hide the app's own toasts, banners and overlays (visibility only, so no layout moves). */
const hide = async (page, specs) => {
  for (const spec of specs) {
    const m = spec.match(/^(.*)@(\d+)$/);
    const s = m ? m[1] : spec;
    const loc = s.startsWith('tid:') ? page.getByTestId(s.slice(4)) : s.startsWith('text:') ? page.getByText(s.slice(5)) : s.startsWith('exact:') ? page.getByText(s.slice(6), { exact: true }) : page.locator(s);
    const target = m ? loc.nth(Number(m[2])) : loc;
    await target.evaluateAll((els) => els.forEach((e) => e.style.setProperty('visibility', 'hidden', 'important'))).catch(() => {});
  }
};

const act = async (page, a) => {
  if (a.wait) await page.waitForTimeout(a.wait);
  if (a.waitFor) await find(page, a.waitFor).waitFor({ timeout: a.timeout ?? 15000 });
  if (a.click) await find(page, a.click).click({ timeout: a.timeout ?? 10000 });
  if (a.hover) await find(page, a.hover).hover({ timeout: a.timeout ?? 10000 });
  if (a.fill) await find(page, a.fill).fill(a.value ?? '', { timeout: a.timeout ?? 10000 });
  if (a.press) await (a.selector ? find(page, a.selector).press(a.press) : page.keyboard.press(a.press));
  if (a.scroll !== undefined) await page.evaluate((y) => window.scrollTo(0, y), a.scroll);
};

const shoot = async (chromium, pages, base, cap, shotsDir, out, log, dir) => {
  const W = cap.width ?? 1440;
  const VIEW = cap.height ?? 900;
  const browser = await launch(chromium, log, dir);
  try {
    const ctx = await browser.newContext({ viewport: { width: W, height: VIEW }, deviceScaleFactor: 2, colorScheme: cap.colorScheme ?? 'light' });
    await ctx.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = 'nextjs-portal{display:none!important} *{caret-color:transparent!important} ::-webkit-scrollbar{display:none}';
        document.head.appendChild(style);
      });
    });
    const page = await ctx.newPage();
    for (const pg of pages) {
      await page.goto(`${base}${pg.path ?? '/'}`, { waitUntil: 'networkidle', timeout: 60000 });
      if (pg.waitFor) await find(page, pg.waitFor).waitFor({ timeout: 20000 });
      for (const a of pg.actions ?? []) await act(page, a);
      await page.mouse.move(0, 0);
      await page.waitForTimeout(pg.settle ?? 500);
      await hide(page, [...(cap.hideSelectors ?? []), ...(pg.hideSelectors ?? [])]);
      // Full-page shots start at the document top; viewport shots at the current scroll.
      const scrollY = pg.fullPage ? await page.evaluate(() => window.scrollY) : 0;
      const boxes = {};
      for (const b of pg.boxes ?? []) {
        if (b.selector === undefined) {
          boxes[b.name] = { x: b.x, y: b.y, width: b.width, height: b.height };
          continue;
        }
        const loc = find(page, b.selector);
        const r = (await loc.count()) ? await loc.boundingBox() : null;
        if (!r) {
          if (b.optional) continue;
          throw new Error(`page "${pg.name}": box "${b.name}" (${b.selector}) is not on the page`);
        }
        boxes[b.name] = { x: Math.round(r.x), y: Math.round(r.y + scrollY), width: Math.round(r.width), height: Math.round(r.height) };
      }
      const docH = await page.evaluate(() => document.documentElement.scrollHeight);
      const height = pg.fullPage ? Math.max(VIEW, Math.min(docH, pg.maxHeight ?? 1800)) : VIEW;
      const file = resolve(shotsDir, `${pg.name}.png`);
      if (pg.fullPage) await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y: 0, width: W, height } });
      else await page.screenshot({ path: file });
      out[pg.name] = { src: `shots/${pg.name}.png`, width: W, height, view: VIEW, boxes };
      log(`capture: page ${pg.name} ${W}x${height}, ${Object.keys(boxes).length} boxes`);
    }
  } finally {
    await browser.close();
  }
};


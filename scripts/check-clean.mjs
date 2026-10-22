#!/usr/bin/env node
// A generic privacy scan for the repository, run in CI and before every commit:
//   absolute home-directory paths, committed .env files, DEEPGRAM_API_KEY with a value,
//   32-64 character hex/base64 tokens (outside lockfiles), email addresses other than
//   noreply/example ones, phone-number patterns, and per-company slug folders.
//
//   node scripts/check-clean.mjs [dir]     exit 1 and list the hits when anything is found
//
// It scans the files git tracks (or would track), else every file outside node_modules and
// the generated .trailer folders.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(process.argv[2] ?? join(fileURLToPath(new URL('.', import.meta.url)), '..'));
const SELF = relative(root, fileURLToPath(import.meta.url));
const BINARY = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.mp4', '.mov', '.wav', '.mp3', '.woff', '.woff2', '.ttf', '.otf', '.pdf', '.zip']);
const LOCKFILES = new Set(['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'out', 'voice', 'shots', 'review', '.stage', 'private']);

const listFiles = () => {
  try {
    const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    const files = out.split('\0').filter(Boolean);
    if (files.length) return files;
  } catch {}
  const files = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(join(dir, e.name));
      } else files.push(relative(root, join(dir, e.name)));
    }
  };
  walk(root);
  return files;
};

const homeA = ['Us', 'ers'].join('');
const homeB = ['ho', 'me'].join('');
const RULES = [
  { name: 'absolute home path', re: new RegExp(`(?:^|[\\s"'\`(=:])/(?:${homeA}|${homeB})/[A-Za-z0-9._-]+/`, 'g') },
  { name: 'Windows home path', re: /[A-Za-z]:\\Users\\[A-Za-z0-9._-]+\\/g },
  { name: 'Deepgram key with a value', re: /DEEPGRAM_API_KEY\s*[=:]\s*["']?[A-Za-z0-9]{16,}/g },
  { name: 'email address', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g, allow: (m) => /noreply|no-reply|@example\.(com|org|net)$|^git@github\.com$|@users\.noreply\.github\.com$/i.test(m) },
  { name: 'phone number', re: /(?<![\w.:/-])(?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?![\w.:-])/g },
  { name: 'per-company slug folder', re: /\bcompanies\/[a-z0-9][a-z0-9-]*\//g },
];
const TOKEN = /(?<![A-Za-z0-9+/_=-])[A-Za-z0-9+/_=-]{32,64}(?![A-Za-z0-9+/_=-])/g;
const looksSecret = (t) => {
  if (t.includes('/') || /^[a-z-]+$/.test(t) || /^[A-Z_]+$/.test(t)) return false;
  if (/^[a-f0-9]{32,64}$/i.test(t)) return true;
  return /[a-z]/.test(t) && /[A-Z]/.test(t) && /\d/.test(t) && !/^[A-Za-z]+(?:[-_][A-Za-z0-9]+)+$/.test(t);
};

const hits = [];
for (const file of listFiles()) {
  if (file === SELF) continue;
  const name = basename(file);
  if (name === '.env' || (/^\.env\./.test(name) && name !== '.env.example')) {
    hits.push({ file, line: 0, rule: 'committed .env file', text: name });
    continue;
  }
  if (BINARY.has(extname(file).toLowerCase())) continue;
  if (file.split(sep).some((d) => d === 'node_modules')) continue;
  let text;
  try {
    if (statSync(join(root, file)).size > 5 * 1024 * 1024) continue;
    text = readFileSync(join(root, file), 'utf8');
  } catch {
    continue;
  }
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const r of RULES) {
      for (const m of line.matchAll(r.re)) {
        const s = m[0].trim();
        if (r.allow?.(s)) continue;
        hits.push({ file, line: i + 1, rule: r.name, text: s.slice(0, 80) });
      }
    }
    if (!LOCKFILES.has(name) && extname(file) !== '.svg') {
      for (const m of line.matchAll(TOKEN)) if (looksSecret(m[0])) hits.push({ file, line: i + 1, rule: 'token-like string', text: `${m[0].slice(0, 6)}...` });
    }
  });
}

if (hits.length) {
  for (const h of hits) console.error(`${h.file}:${h.line}  ${h.rule}: ${h.text}`);
  console.error(`\ncheck-clean: ${hits.length} finding(s)`);
  process.exit(1);
}
console.log('check-clean: no findings');

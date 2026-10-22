import type { CSSProperties, ReactNode } from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadNamed } from '../fonts';
import { contrast } from '../options.mjs';
import { cueFrame } from '../cues.mjs';
import { alpha, mixHex, useTrailer, usePal, useTheme } from '../theme';
import { Emoji, clamp, ease } from './prims';
import type { Box, TimelineScene } from '../types';
import { useFrame, type Frame } from '../frame';

// Recreated UI: the app's interface rebuilt as animated components in the app's own tokens
// (config.app), never a screen recording. A deterministic layout engine places every element,
// so the cursor, the camera, the spotlight, highlights and callouts can target an element by
// id, or one of its parts: "rules.row2" (a table row), "inbox.item1" (a list item),
// "patch.line3" (a diff or code line), "chart.bar0", "toggles.item0", "header.action0".
//
// config.app (all optional): { font, mono, bg, surface, subtle, ink, muted, border, accent,
//   good, bad, warn, radius, size (base text px, default 22), dark }
//
// Elements (each takes id?, at? (cue), h?, states?: [{ at, set: {...}, row?|item? }]):
//   header   { title, sub?, actions?: [label], active? (index of the highlighted action; default the last) }
//   text     { text, size?, tone?, weight? }
//   card     { title?, body?, meta?, badge?: text|{text,tone}, icon? (emoji), tone? }
//   table    { columns: [..], rows: [[cell..] | { cells, tone?, strike?, at? }], widths?: [fr] }
//            a cell is text or { text, tone?, badge?, mono?, strike?, bold? }
//   list     { items: [{ title, sub?, badge?, meta?, chips?: [..], icon?, tone?, strike?, at? }] }
//   diff     { file?, lines: [{ op: "+"|"-"|" ", text }] }
//   code     { file?, lines: [text], highlight?: [n] }
//   chips    { items: [text|{text,tone}] }
//   chart    { kind?: bar|line, series: [{ label, value, tone? }], max?, unit?, h? }
//   toggle   { items: [{ label, sub?, value }] } (or label + value)
//   stat     { label, value, from?, prefix?, suffix?, decimals?, delta?, tone? }
//   progress { label?, value (0-100), kind?: bar|ring, tone?, suffix? }
//   button   { label, tone?: primary|ghost|danger, align?: left|right|center }
//   input    { placeholder?, value?, typeAt? (cue), icon? }
//   kv       { pairs: [[k, v] | { k, v, tone?, redacted? }] }
//   row      { children: [elements], widths?: [fr] }
//   toast    { title, sub?, tone? }  (floats bottom-right of the window)
//   spacer   { h }
//   shapes   { view, items } (optional vector drawing: floor plans, maps; see shapesView below)
//   col      { children } (only as a row child: stacks its children in that column)

export type AppTokens = {
  font: string;
  mono: string;
  bg: string;
  surface: string;
  subtle: string;
  ink: string;
  muted: string;
  border: string;
  accent: string;
  onAccent: string;
  good: string;
  bad: string;
  warn: string;
  radius: number;
  size: number;
  dark: boolean;
};

export const useApp = (over?: Record<string, any>): AppTokens => {
  const { config, theme: T } = useTrailer();
  const a = { ...(config.app ?? {}), ...(over ?? {}) };
  const dark = a.dark ?? (a.bg ? contrast(a.bg, '#000000') < contrast(a.bg, '#ffffff') : false);
  const bg = a.bg ?? (dark ? '#0f1115' : '#f6f7f9');
  const surface = a.surface ?? (dark ? '#171a21' : '#ffffff');
  const ink = a.ink ?? (dark ? '#e8eaf0' : '#111827');
  const accent = a.accent ?? T.accent;
  return {
    font: a.font ? loadNamed(a.font, 'Inter', 300, 800) : T.ui,
    mono: a.mono ? loadNamed(a.mono, 'JetBrains Mono', 300, 700) : T.mono,
    bg,
    surface,
    subtle: a.subtle ?? mixHex(surface, ink, dark ? 0.06 : 0.035),
    ink,
    muted: a.muted ?? mixHex(ink, surface, 0.45),
    border: a.border ?? mixHex(surface, ink, dark ? 0.14 : 0.1),
    accent,
    onAccent: contrast(accent, '#ffffff') >= contrast(accent, '#111111') ? '#ffffff' : '#111111',
    good: a.good ?? (dark ? '#34d399' : '#15803d'),
    bad: a.bad ?? (dark ? '#f87171' : '#dc2626'),
    warn: a.warn ?? (dark ? '#fbbf24' : '#b45309'),
    radius: a.radius ?? 10,
    size: a.size ?? 22,
    dark,
  };
};

export const toneOf = (A: AppTokens, tone?: string) => {
  const c = tone === 'good' ? A.good : tone === 'bad' || tone === 'danger' ? A.bad : tone === 'warn' ? A.warn : tone === 'muted' ? A.muted : tone === 'ink' ? A.ink : A.accent;
  return { fg: c, bg: alpha(c, A.dark ? 0.18 : 0.1), line: alpha(c, 0.4) };
};

/* ------------------------------------------------------------------ layout */

export type Placed = { el: any; id: string; x: number; y: number; w: number; h: number; subs: Record<string, Box>; float?: boolean; order: number };

const lines = (text: string | undefined, w: number, size: number) => (text ? Math.max(1, Math.ceil((text.length * size * 0.52) / Math.max(40, w))) : 0);

/* shapes (optional element): a vector drawing in its own units, e.g. a floor plan or a map.
 *   { type: "shapes", view: [w, h] | [x, y, w, h], h?, bg?, frame?, items: [item..] }
 *   item: { kind: poly | rect | circle | dot | text | line | cells | sweep | grid, name? (target "id.name"),
 *     at?, until?, dur?, opacity?, fill?, stroke?, width?, dash?: [a, b], draw? (stroke draws on),
 *     poly/line: points [[x,y]..]; rect: x, y, w, h, rx?; circle: x, y, r, clip? (name of a poly/rect);
 *     dot: x, y, r, label?, labelColor?, pulse?, move?: [{ at, x, y }];
 *     text: x, y, text, size, anchor?, weight?, font?: ui | mono;
 *     cells: cells [[x,y]..], size?, from? [x,y] (bloom order), spread? (frames), outFrom? [[x,y]..], spreadOut?;
 *     sweep: at -> to (cue), a scan line across the view; grid: step, r;
 *     recolor?: [{ at, fill?, stroke? }] }
 *   Colours are #hex or the app tokens: accent, good, bad, warn, ink, muted, border, surface, bg, subtle. */
const shapesView = (el: any): number[] => {
  const v: number[] = el.view ?? [100, 60];
  return v.length >= 4 ? v : [0, 0, v[0] ?? 100, v[1] ?? 60];
};

const shapeBounds = (it: any): { x: number; y: number; w: number; h: number } | null => {
  const pts: number[][] | undefined = it.points ?? it.cells;
  if (pts && pts.length) {
    const xs = pts.map((p) => p[0]!);
    const ys = pts.map((p) => p[1]!);
    const pad = it.kind === 'cells' ? (it.size ?? 1) / 2 : 0;
    return { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + pad * 2, h: Math.max(...ys) - Math.min(...ys) + pad * 2 };
  }
  if (it.kind === 'rect') return { x: it.x, y: it.y, w: it.w, h: it.h };
  if (it.kind === 'circle' || it.kind === 'dot') {
    const r = it.r ?? 1;
    return { x: it.x - r, y: it.y - r, w: r * 2, h: r * 2 };
  }
  if (it.kind === 'text') {
    const size = it.size ?? 2;
    const tw = String(it.text ?? '').length * size * 0.55;
    const x = it.anchor === 'middle' ? it.x - tw / 2 : it.anchor === 'end' ? it.x - tw : it.x;
    return { x, y: it.y - size, w: tw, h: size * 1.3 };
  }
  return null;
};

const measure = (el: any, w: number, fs: number): { h: number; w?: number; subs: Record<string, Box> } => {
  const subs: Record<string, Box> = {};
  switch (el.type) {
    case 'header': {
      const acts: string[] = el.actions ?? [];
      let right = w;
      for (let i = acts.length - 1; i >= 0; i -= 1) {
        const bw = acts[i]!.length * fs * 0.58 + 44;
        right -= bw;
        subs[`action${i}`] = { x: right, y: 12, width: bw, height: 48 };
        right -= 12;
      }
      return { h: el.sub ? 84 : 72, subs };
    }
    case 'text': {
      const size = el.size ?? fs * 1.1;
      return { h: lines(el.text, w, size) * size * 1.35, subs };
    }
    case 'card': {
      const t = el.title ? fs * 1.25 * 1.35 : 0;
      const b = lines(el.body, w - 48 - (el.icon ? 70 : 0), fs) * fs * 1.42;
      return { h: 26 + t + (t && b ? 8 : 0) + b + (el.meta || el.badge ? fs * 2 : 0) + 26, subs };
    }
    case 'table': {
      const rowH = el.rowH ?? fs * 2.5;
      const head = fs * 2.2;
      (el.rows ?? []).forEach((_: unknown, i: number) => (subs[`row${i}`] = { x: 0, y: head + i * rowH, width: w, height: rowH }));
      return { h: head + (el.rows?.length ?? 0) * rowH, subs };
    }
    case 'list': {
      const items = el.items ?? [];
      const ih = (it: any) => (it.sub || it.chips ? fs * 3.5 + (it.chips && it.sub ? fs * 1.5 : 0) : fs * 2.7);
      let y = 0;
      items.forEach((it: any, i: number) => {
        subs[`item${i}`] = { x: 0, y, width: w, height: ih(it) };
        y += ih(it) + 10;
      });
      return { h: Math.max(0, y - 10), subs };
    }
    case 'diff':
    case 'code': {
      const lh = fs * 1.6;
      const head = el.file || el.title ? fs * 2.1 : 0;
      (el.lines ?? []).forEach((_: unknown, i: number) => (subs[`line${i}`] = { x: 0, y: head + 8 + i * lh, width: w, height: lh }));
      return { h: head + 16 + (el.lines?.length ?? 0) * lh, subs };
    }
    case 'chips':
      return { h: fs * 2.1, subs };
    case 'chart': {
      const h = el.h ?? 260;
      const n = el.series?.length ?? 0;
      const bw = w / Math.max(1, n);
      for (let i = 0; i < n; i += 1) subs[`bar${i}`] = { x: i * bw + bw * 0.18, y: 30, width: bw * 0.64, height: h - 30 - fs * 1.8 };
      return { h, subs };
    }
    case 'toggle': {
      const items = el.items ?? [{ label: el.label, sub: el.sub, value: el.value }];
      const ih = fs * (items.some((i: any) => i.sub) ? 3.4 : 2.7);
      items.forEach((_: unknown, i: number) => (subs[`item${i}`] = { x: 0, y: i * (ih + 8), width: w, height: ih }));
      return { h: items.length * (ih + 8) - 8, subs };
    }
    case 'stat':
      return { h: fs * 5.8, subs };
    case 'progress':
      return { h: el.kind === 'ring' ? (el.h ?? 230) : fs * 3.4, subs };
    case 'button': {
      const bw = Math.min(w, (el.label?.length ?? 6) * fs * 0.6 + 72);
      return { h: fs * 2.6, w: bw, subs };
    }
    case 'input':
      return { h: fs * 2.9, subs };
    case 'kv': {
      const n = el.pairs?.length ?? 0;
      (el.pairs ?? []).forEach((_: unknown, i: number) => (subs[`item${i}`] = { x: 0, y: 12 + i * fs * 1.95, width: w, height: fs * 1.95 }));
      return { h: 24 + n * fs * 1.95, subs };
    }
    case 'spacer':
      return { h: el.h ?? 20, subs };
    case 'toast':
      return { h: fs * 3.8, w: Math.min(w, 520), subs };
    case 'shapes': {
      const v = shapesView(el);
      const h = el.h ?? (w * v[3]) / v[2];
      const s = Math.min(w / v[2], h / v[3]);
      const ox = (w - v[2] * s) / 2;
      const oy = (h - v[3] * s) / 2;
      (el.items ?? []).forEach((it: any, i: number) => {
        const b = shapeBounds(it);
        if (!b) return;
        const box = { x: ox + (b.x - v[0]) * s, y: oy + (b.y - v[1]) * s, width: b.w * s, height: b.h * s };
        subs[`item${i}`] = box;
        if (it.name) subs[it.name] = box;
      });
      return { h, subs };
    }
    default:
      return { h: fs * 2, subs };
  }
};

/** Place elements in a column `width` wide; rows split their width. Content px, before scaling. */
export const layoutUI = (els: any[], width: number, fs: number, pad = 28, gap = 18) => {
  const placed: Placed[] = [];
  let order = 0;
  const place = (list: any[], x0: number, y0: number, w: number): number => {
    let y = y0;
    for (const el of list) {
      if (el.type === 'toast') {
        const m = measure(el, w, fs);
        placed.push({ el, id: el.id ?? `toast${order}`, x: 0, y: 0, w: m.w ?? w, h: m.h, subs: {}, float: true, order: order++ });
        continue;
      }
      if (el.type === 'row') {
        const kids: any[] = el.children ?? [];
        const fr: number[] = el.widths ?? kids.map(() => 1);
        const sum = fr.reduce((a, b) => a + b, 0) || 1;
        const g = el.gap ?? gap;
        const avail = w - g * (kids.length - 1);
        let x = x0;
        let maxH = 0;
        const start = placed.length;
        const stacked = new Set<number>();
        kids.forEach((k, i) => {
          const cw = (avail * (fr[i] ?? 1)) / sum;
          // Optional: a `col` child stacks its own children in that column (they keep their own heights).
          const before = placed.length;
          const h = place(k?.type === 'col' ? (k.children ?? []) : [k], x, y, cw) - y;
          if (k?.type === 'col') for (let j = before; j < placed.length; j += 1) stacked.add(j);
          maxH = Math.max(maxH, h);
          x += cw + g;
        });
        // Stretch cards and stats in a row to the row's height.
        for (let i = start; i < placed.length; i += 1) if (!stacked.has(i) && ['card', 'stat', 'progress', 'chart'].includes(placed[i]!.el.type) && !placed[i]!.el.h) placed[i]!.h = maxH;
        y += maxH + gap;
        continue;
      }
      const m = measure(el, w, fs);
      const bw = m.w ?? w;
      const align = el.align ?? 'left';
      const bx = el.type === 'button' ? (align === 'right' ? x0 + w - bw : align === 'center' ? x0 + (w - bw) / 2 : x0) : x0;
      placed.push({ el, id: el.id ?? `${el.type}${order}`, x: bx, y, w: bw, h: el.h ?? m.h, subs: m.subs, order: order++ });
      y += (el.h ?? m.h) + gap;
    }
    return y - gap;
  };
  const end = place(els, pad, pad, width - pad * 2);
  const height = end + pad;
  for (const p of placed.filter((q) => q.float)) {
    p.x = width - p.w - 24;
    p.y = height - p.h - 24;
  }
  return { placed, height };
};

/** A target ("id" or "id.part") as a box in content px. */
export const targetBox = (placed: Placed[], target?: string): Box | null => {
  if (!target) return null;
  const [id, part] = target.split('.');
  const p = placed.find((q) => q.id === id);
  if (!p) return null;
  if (!part) return { x: p.x, y: p.y, width: p.w, height: p.h };
  const s = p.subs[part!];
  return s ? { x: p.x + s.x, y: p.y + s.y, width: s.width, height: s.height } : { x: p.x, y: p.y, width: p.w, height: p.h };
};

/* ------------------------------------------------------------------ states and tweens */

type StateEntry = { at?: any; set?: Record<string, any>; row?: number; item?: number };

const asRow = (r: any) => (Array.isArray(r) ? { cells: r } : { ...r });

/** The element with every state up to frame f applied, plus when each part last changed. */
export const applyStates = (el: any, f: number, t: TimelineScene) => {
  const states: StateEntry[] = el.states ?? [];
  let cur = { ...el };
  const changed: Record<string, number> = {};
  for (const s of [...states].map((s) => ({ ...s, _f: cueFrame(t, s.at, 0) })).sort((a, b) => a._f - b._f)) {
    if (f < s._f) continue;
    const idx = s.row ?? s.item;
    if (idx !== undefined) {
      const key = s.row !== undefined ? 'rows' : 'items';
      const arr = [...(cur[key] ?? [])];
      arr[idx] = { ...(key === 'rows' ? asRow(arr[idx]) : arr[idx]), ...(s.set ?? {}) };
      cur = { ...cur, [key]: arr };
      changed[`${key === 'rows' ? 'row' : 'item'}${idx}`] = s._f;
    } else {
      cur = { ...cur, ...(s.set ?? {}) };
      changed.self = s._f;
    }
  }
  return { el: cur, changed };
};

/** A numeric field tweened between its states (22 frames). */
export const tweenNum = (el: any, key: string, f: number, t: TimelineScene, enter: number, fromKey = 'from') => {
  const pts: { f: number; v: number }[] = [{ f: enter, v: Number(el[fromKey] ?? el[key] ?? 0) }];
  if (el[fromKey] !== undefined) pts.push({ f: enter + 6, v: Number(el[key]) });
  for (const s of el.states ?? []) if (s.set && s.set[key] !== undefined && s.row === undefined && s.item === undefined) pts.push({ f: cueFrame(t, s.at, 0), v: Number(s.set[key]) });
  pts.sort((a, b) => a.f - b.f);
  let v = pts[0]!.v;
  for (let i = 1; i < pts.length; i += 1) {
    const p = pts[i]!;
    if (f >= p.f) v = pts[i - 1]!.v + (p.v - pts[i - 1]!.v) * ease(f, p.f, 26);
  }
  return v;
};

/* ------------------------------------------------------------------ elements */

const Badge: React.FC<{ b: any; A: AppTokens; size?: number }> = ({ b, A, size }) => {
  if (!b) return null;
  const o = typeof b === 'string' ? { text: b } : b;
  const c = toneOf(A, o.tone);
  const fs = size ?? A.size * 0.82;
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: `${fs * 0.22}px ${fs * 0.6}px`, borderRadius: 999, background: c.bg, color: c.fg, border: `1px solid ${c.line}`, fontFamily: A.font, fontWeight: 650, fontSize: fs, whiteSpace: 'nowrap', lineHeight: 1.2 }}>{o.text}</span>;
};

const flash = (f: number, since: number | undefined, A: AppTokens) => {
  if (since === undefined || f < since) return 0;
  return interpolate(f, [since, since + 4, since + 30], [0, 1, 0], clamp);
};

const UIEl: React.FC<{ p: Placed; A: AppTokens; t: TimelineScene; enter: number; clicks: number[] }> = ({ p, A, t, enter, clicks }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { el, changed } = applyStates(p.el, f, t);
  const fs = A.size;
  const e = ease(f, enter, 14);
  if (f < enter - 1) return null;
  const until = p.el.until !== undefined ? cueFrame(t, p.el.until, t.duration) : undefined;
  if (until !== undefined && f > until + 8) return null;
  const out = until !== undefined ? ease(f, until, 7) : 0;
  const press = clicks.some((c) => f >= c - 2 && f < c + 6) ? 0.965 : 1;
  const box: CSSProperties = { position: 'absolute', left: p.x, top: p.y, width: p.w, height: p.h, opacity: e * (1 - out), translate: `0 ${(1 - e) * 26}px`, scale: `${press}`, fontFamily: A.font, color: A.ink, boxSizing: 'border-box' };
  const selfFlash = flash(f, changed.self, A);
  const glow = selfFlash > 0 ? `0 0 0 ${3 + 6 * selfFlash}px ${alpha(A.accent, 0.35 * selfFlash)}` : undefined;
  const cardStyle: CSSProperties = { background: A.surface, border: `1px solid ${A.border}`, borderRadius: A.radius, boxShadow: [glow, A.dark ? '0 1px 0 rgba(255,255,255,0.03)' : '0 1px 2px rgba(16,24,40,0.06)'].filter(Boolean).join(', ') };
  const itemAt = (i: number, it?: any) => (it?.at !== undefined ? cueFrame(t, it.at, enter) : enter + 6 + i * 3);
  const itemIn = (i: number, it?: any) => ease(f, itemAt(i, it), 12);

  switch (el.type) {
    case 'header':
      return (
        <div style={{ ...box, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${A.border}`, paddingBottom: 10 }}>
          <div>
            <div style={{ fontSize: fs * 1.3, fontWeight: 700, letterSpacing: -0.3 }}>{el.title}</div>
            {el.sub && <div style={{ fontSize: fs * 0.85, color: A.muted, marginTop: 3 }}>{el.sub}</div>}
          </div>
          {(el.actions ?? []).map((a: string, i: number) => {
            const s = p.subs[`action${i}`]!;
            const pressed = clicks.some((c) => f >= c - 2 && f < c + 6);
            const on = i === (typeof el.active === 'number' ? el.active : el.actions.length - 1);
            return (
              <div key={i} style={{ position: 'absolute', left: s.x, top: s.y, width: s.width, height: s.height, display: 'grid', placeItems: 'center', borderRadius: A.radius, background: on ? A.accent : A.surface, color: on ? A.onAccent : A.ink, border: `1px solid ${on ? A.accent : A.border}`, fontWeight: 650, fontSize: fs * 0.85, scale: pressed ? '0.96' : '1' }}>
                {a}
              </div>
            );
          })}
        </div>
      );
    case 'text': {
      const c = el.tone ? toneOf(A, el.tone).fg : A.ink;
      return <div style={{ ...box, fontSize: el.size ?? fs * 1.1, fontWeight: el.weight ?? 500, color: c, lineHeight: 1.35 }}>{el.text}</div>;
    }
    case 'card': {
      const c = el.tone ? toneOf(A, el.tone) : null;
      return (
        <div style={{ ...box, ...cardStyle, padding: 24, display: 'flex', gap: 18, borderLeft: c ? `5px solid ${c.fg}` : cardStyle.border, background: c ? mixHex(A.surface, c.fg, A.dark ? 0.08 : 0.04) : A.surface }}>
          {el.icon && <Emoji name={el.icon} size={54} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            {el.title && <div style={{ fontSize: fs * 1.25, fontWeight: 700, lineHeight: 1.3, textDecoration: el.strike ? 'line-through' : undefined }}>{el.title}</div>}
            {el.body && <div style={{ fontSize: fs, color: A.muted, lineHeight: 1.42, marginTop: el.title ? 8 : 0 }}>{el.body}</div>}
            {(el.meta || el.badge) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, fontSize: fs * 0.8, color: A.muted }}>
                <Badge b={el.badge} A={A} />
                {el.meta && <span>{el.meta}</span>}
              </div>
            )}
          </div>
        </div>
      );
    }
    case 'table': {
      const cols: string[] = el.columns ?? [];
      const fr: number[] = el.widths ?? cols.map(() => 1);
      const sum = fr.reduce((a, b) => a + b, 0) || 1;
      const rowH = el.rowH ?? fs * 2.5;
      const head = fs * 2.2;
      const grid = fr.map((w) => `${(w / sum) * 100}%`).join(' ');
      return (
        <div style={{ ...box, ...cardStyle, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: grid, height: head, alignItems: 'center', background: A.subtle, borderBottom: `1px solid ${A.border}`, fontSize: fs * 0.72, fontWeight: 650, letterSpacing: 1.2, textTransform: 'uppercase', color: A.muted }}>
            {cols.map((c, i) => (
              <div key={i} style={{ padding: '0 20px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c}</div>
            ))}
          </div>
          {(el.rows ?? []).map((r0: any, i: number) => {
            const r = asRow(r0);
            const k = itemIn(i, r);
            const fl = flash(f, changed[`row${i}`], A);
            const tone = r.tone ? toneOf(A, r.tone) : null;
            return (
              <div key={i} style={{ position: 'relative', display: 'grid', gridTemplateColumns: grid, height: rowH, alignItems: 'center', borderBottom: i < el.rows.length - 1 ? `1px solid ${A.border}` : undefined, opacity: k * (r.dim ? 0.45 : 1), translate: `${(1 - k) * 30}px 0`, background: tone ? tone.bg : fl > 0 ? alpha(A.accent, 0.12 * fl) : undefined, boxShadow: tone ? `inset 4px 0 0 ${tone.fg}` : undefined }}>
                {(r.cells ?? []).map((c0: any, j: number) => {
                  const c = typeof c0 === 'object' && c0 !== null ? c0 : { text: String(c0) };
                  const ct = c.tone ? toneOf(A, c.tone) : null;
                  return (
                    <div key={j} style={{ padding: '0 20px', fontSize: fs * 0.92, fontFamily: c.mono ? A.mono : A.font, fontWeight: c.bold || j === 0 ? 600 : 450, color: ct && !c.badge ? ct.fg : r.strike ? A.muted : A.ink, textDecoration: r.strike || c.strike ? 'line-through' : undefined, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.badge ? <Badge b={{ text: c.text, tone: c.tone }} A={A} /> : c.text}
                    </div>
                  );
                })}
                {fl > 0 && <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 0 2px ${alpha(A.accent, fl)}`, pointerEvents: 'none' }} />}
              </div>
            );
          })}
        </div>
      );
    }
    case 'list':
      return (
        <div style={{ ...box, opacity: box.opacity, translate: undefined }}>
          {(el.items ?? []).map((it: any, i: number) => {
            const s = p.subs[`item${i}`] ?? { x: 0, y: 0, width: p.w, height: 60 };
            const k = itemIn(i, it);
            const fl = flash(f, changed[`item${i}`], A);
            const tone = it.tone ? toneOf(A, it.tone) : null;
            return (
              <div key={i} style={{ position: 'absolute', left: 0, top: s.y, width: s.width, height: s.height, boxSizing: 'border-box', ...cardStyle, display: 'flex', alignItems: 'center', gap: 18, padding: '0 22px', opacity: k * (it.dim ? 0.45 : 1), translate: `0 ${(1 - k) * 22}px`, borderLeft: tone ? `5px solid ${tone.fg}` : cardStyle.border, background: tone ? mixHex(A.surface, tone.fg, A.dark ? 0.1 : 0.05) : A.surface, boxShadow: fl > 0 ? `0 0 0 ${2 + 5 * fl}px ${alpha(A.accent, 0.4 * fl)}` : cardStyle.boxShadow }}>
                {it.icon ? <Emoji name={it.icon} size={fs * 1.8} /> : <span style={{ width: 12, height: 12, borderRadius: '50%', background: tone?.fg ?? A.border, flex: 'none' }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: fs, fontWeight: 620, textDecoration: it.strike ? 'line-through' : undefined, color: it.strike ? A.muted : A.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
                  {it.sub && <div style={{ fontSize: fs * 0.8, color: A.muted, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.sub}</div>}
                  {it.chips && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      {it.chips.map((c: any, j: number) => (
                        <Badge key={j} b={c} A={A} size={fs * 0.68} />
                      ))}
                    </div>
                  )}
                </div>
                {it.meta && <span style={{ fontSize: fs * 0.8, color: A.muted, fontFamily: A.mono, whiteSpace: 'nowrap' }}>{it.meta}</span>}
                <Badge b={it.badge} A={A} />
              </div>
            );
          })}
        </div>
      );
    case 'diff':
    case 'code': {
      const lh = fs * 1.6;
      const head = el.file || el.title ? fs * 2.1 : 0;
      const hl: number[] = el.highlight ?? [];
      return (
        <div style={{ ...box, ...cardStyle, overflow: 'hidden', background: A.dark ? mixHex(A.surface, '#000000', 0.25) : mixHex(A.surface, A.ink, 0.02) }}>
          {head > 0 && <div style={{ height: head, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${A.border}`, fontFamily: A.mono, fontSize: fs * 0.78, color: A.muted, background: A.subtle }}>{el.file ?? el.title}</div>}
          <div style={{ paddingTop: 8 }}>
            {(el.lines ?? []).map((l0: any, i: number) => {
              const l = typeof l0 === 'string' ? { op: ' ', text: l0 } : l0;
              const k = itemIn(i, l);
              const op = el.type === 'diff' ? l.op : ' ';
              const c = op === '+' ? A.good : op === '-' ? A.bad : null;
              const isHl = hl.includes(i + 1);
              return (
                <div key={i} style={{ display: 'flex', height: lh, alignItems: 'center', fontFamily: A.mono, fontSize: fs * 0.82, opacity: k, background: c ? alpha(c, 0.12) : isHl ? alpha(A.accent, 0.14) : undefined, boxShadow: isHl ? `inset 3px 0 0 ${A.accent}` : undefined }}>
                  <span style={{ width: 58, textAlign: 'right', paddingRight: 14, color: alpha(A.muted, 0.8), flex: 'none' }}>{el.type === 'diff' ? op : i + 1}</span>
                  <span style={{ whiteSpace: 'pre', color: c ?? A.ink, textDecoration: op === '-' ? 'line-through' : undefined, textDecorationColor: alpha(A.bad, 0.5) }}>{l.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    case 'chips':
      return (
        <div style={{ ...box, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {(el.items ?? []).map((c: any, i: number) => (
            <span key={i} style={{ opacity: itemIn(i), scale: `${0.8 + 0.2 * itemIn(i)}` }}>
              <Badge b={c} A={A} size={fs * 0.85} />
            </span>
          ))}
        </div>
      );
    case 'chart': {
      const series: any[] = el.series ?? [];
      const max = el.max ?? Math.max(1, ...series.map((s) => s.value)) * 1.12;
      const plotH = p.h - 30 - fs * 1.8;
      if (el.kind === 'line') {
        const pts = series.map((s, i) => `${(i / Math.max(1, series.length - 1)) * p.w},${30 + plotH - (s.value / max) * plotH}`);
        const draw = ease(f, enter + 4, 30);
        return (
          <div style={{ ...box }}>
            <svg width={p.w} height={p.h} style={{ overflow: 'visible' }}>
              <polyline points={pts.join(' ')} fill="none" stroke={A.accent} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
            </svg>
          </div>
        );
      }
      return (
        <div style={{ ...box }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 30 + plotH, height: 2, background: A.border }} />
          {series.map((s, i) => {
            const sb = p.subs[`bar${i}`]!;
            const st = (el.states ?? []).filter((x: any) => x.item === i);
            let v = s.value;
            let from = s.from ?? 0;
            let at0 = itemAt(i, s);
            for (const x of st) {
              const xf = cueFrame(t, x.at, 0);
              if (f >= xf && x.set?.value !== undefined) {
                from = v;
                v = x.set.value;
                at0 = xf;
              }
            }
            const cur = from + (v - from) * ease(f, at0, 24);
            const h = (cur / max) * plotH;
            const tone = toneOf(A, s.tone);
            return (
              <div key={i}>
                <div style={{ position: 'absolute', left: sb.x, width: sb.width, top: 30 + plotH - h, height: h, borderRadius: `${Math.min(10, A.radius)}px ${Math.min(10, A.radius)}px 2px 2px`, background: s.tone ? tone.fg : A.accent }} />
                <div style={{ position: 'absolute', left: sb.x - 20, width: sb.width + 40, top: 30 + plotH - h - fs * 1.5, textAlign: 'center', fontWeight: 700, fontSize: fs * 0.95, fontVariantNumeric: 'tabular-nums' }}>{`${Math.round(cur)}${el.unit ?? ''}`}</div>
                <div style={{ position: 'absolute', left: sb.x - 30, width: sb.width + 60, top: 30 + plotH + 10, textAlign: 'center', fontSize: fs * 0.78, color: A.muted, whiteSpace: 'nowrap' }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      );
    }
    case 'toggle': {
      const items = el.items ?? [{ label: el.label, sub: el.sub, value: el.value }];
      return (
        <div style={{ ...box }}>
          {items.map((it: any, i: number) => {
            const s = p.subs[`item${i}`]!;
            const st = (el.states ?? []).filter((x: any) => x.item === i || (items.length === 1 && x.item === undefined));
            let on = !!it.value;
            let since = -99;
            for (const x of st) {
              const xf = cueFrame(t, x.at, 0);
              if (f >= xf && x.set?.value !== undefined) {
                on = !!x.set.value;
                since = xf;
              }
            }
            const prevOn = !on;
            const k = since > -99 ? ease(f, since, 8) : 1;
            const pos = since > -99 ? (prevOn ? 1 - k : k) * (on ? 1 : 1) : on ? 1 : 0;
            const knob = on ? (since > -99 ? k : 1) : since > -99 ? 1 - k : 0;
            void pos;
            const tw = fs * 2.6;
            return (
              <div key={i} style={{ position: 'absolute', left: 0, top: s.y, width: s.width, height: s.height, ...cardStyle, display: 'flex', alignItems: 'center', padding: '0 22px', boxSizing: 'border-box', opacity: itemIn(i, it) }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: fs, fontWeight: 600 }}>{it.label}</div>
                  {it.sub && <div style={{ fontSize: fs * 0.78, color: A.muted, marginTop: 3 }}>{it.sub}</div>}
                </div>
                <div style={{ width: tw, height: fs * 1.45, borderRadius: 999, background: mixHex(A.border, A.accent, knob), position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 3, left: 3 + knob * (tw - fs * 1.45), width: fs * 1.45 - 6, height: fs * 1.45 - 6, borderRadius: '50%', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    case 'stat': {
      const v = tweenNum(el, 'value', f, t, enter + 4);
      const d = el.decimals ?? 0;
      const tone = el.tone ? toneOf(A, el.tone) : null;
      return (
        <div style={{ ...box, ...cardStyle, padding: '20px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: fs * 0.82, color: A.muted, fontWeight: 600 }}>{el.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 6 }}>
            <span style={{ fontSize: fs * 2.4, fontWeight: 750, letterSpacing: -1, fontVariantNumeric: 'tabular-nums', color: tone?.fg ?? A.ink }}>{`${el.prefix ?? ''}${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}${el.suffix ?? ''}`}</span>
            {el.delta && <Badge b={{ text: el.delta, tone: el.deltaTone ?? el.tone ?? 'good' }} A={A} />}
          </div>
        </div>
      );
    }
    case 'progress': {
      const v = tweenNum(el, 'value', f, t, enter + 4);
      const tone = toneOf(A, el.tone);
      if (el.kind === 'ring') {
        const r = Math.min(p.w, p.h) * 0.36;
        const C = 2 * Math.PI * r;
        return (
          <div style={{ ...box, display: 'grid', placeItems: 'center' }}>
            <svg width={r * 2 + 30} height={r * 2 + 30} style={{ rotate: '-90deg' }}>
              <circle cx={r + 15} cy={r + 15} r={r} fill="none" stroke={A.border} strokeWidth={18} />
              <circle cx={r + 15} cy={r + 15} r={r} fill="none" stroke={el.tone ? tone.fg : A.accent} strokeWidth={18} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - v / 100)} />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: r * 0.5, fontWeight: 750, fontVariantNumeric: 'tabular-nums' }}>{`${Math.round(v)}${el.suffix ?? '%'}`}</div>
              {el.label && <div style={{ fontSize: fs * 0.8, color: A.muted }}>{el.label}</div>}
            </div>
          </div>
        );
      }
      return (
        <div style={{ ...box }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs * 0.9, fontWeight: 600 }}>
            <span>{el.label}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{`${Math.round(v)}${el.suffix ?? '%'}`}</span>
          </div>
          <div style={{ marginTop: 12, height: fs * 0.7, borderRadius: 999, background: A.subtle, border: `1px solid ${A.border}`, overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(0, Math.min(100, v))}%`, height: '100%', background: el.tone ? tone.fg : A.accent, borderRadius: 999 }} />
          </div>
        </div>
      );
    }
    case 'button': {
      const tone = el.tone ?? 'primary';
      const bg = tone === 'primary' ? A.accent : tone === 'danger' ? A.bad : A.surface;
      const pressed = clicks.some((c) => f >= c - 2 && f < c + 6);
      const ripple = clicks.map((c) => f - c).find((d) => d >= 0 && d < 18);
      return (
        <div style={{ ...box, display: 'grid', placeItems: 'center', borderRadius: A.radius, background: pressed ? mixHex(bg, '#000000', 0.12) : bg, color: tone === 'ghost' ? A.ink : tone === 'danger' ? '#ffffff' : A.onAccent, border: `1px solid ${tone === 'ghost' ? A.border : bg}`, fontWeight: 650, fontSize: fs * 0.95, overflow: 'hidden', boxShadow: tone === 'primary' ? `0 6px 18px -8px ${alpha(A.accent, 0.8)}` : undefined }}>
          {el.label}
          {ripple !== undefined && <div style={{ position: 'absolute', left: '50%', top: '50%', width: p.w * 1.6 * (ripple / 18), height: p.w * 1.6 * (ripple / 18), translate: '-50% -50%', borderRadius: '50%', background: alpha('#ffffff', 0.35 * (1 - ripple / 18)) }} />}
        </div>
      );
    }
    case 'input': {
      const full: string = el.value ?? '';
      const ta = el.typeAt !== undefined ? cueFrame(t, el.typeAt, enter) : null;
      const n = ta === null ? full.length : Math.max(0, Math.min(full.length, Math.floor((f - ta) / 1.6)));
      const typing = ta !== null && f >= ta && n < full.length;
      return (
        <div style={{ ...box, ...cardStyle, display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', boxShadow: typing ? `0 0 0 3px ${alpha(A.accent, 0.3)}` : cardStyle.boxShadow, borderColor: typing ? A.accent : A.border }}>
          {el.icon && <Emoji name={el.icon} size={fs * 1.3} />}
          <span style={{ fontSize: fs, color: n ? A.ink : A.muted }}>
            {n ? full.slice(0, n) : (el.placeholder ?? '')}
            {(typing || (ta !== null && f >= ta && Math.floor(f / 10) % 2 === 0)) && <span style={{ display: 'inline-block', width: 2, height: fs * 1.1, background: A.accent, marginLeft: 2, verticalAlign: 'middle' }} />}
          </span>
        </div>
      );
    }
    case 'kv':
      return (
        <div style={{ ...box, ...cardStyle, padding: '12px 22px', fontFamily: A.mono, fontSize: fs * 0.86 }}>
          {(el.pairs ?? []).map((pr: any, i: number) => {
            const o = Array.isArray(pr) ? { k: pr[0], v: pr[1] } : pr;
            const tone = o.tone ? toneOf(A, o.tone).fg : A.ink;
            const k = itemIn(i, o);
            const fl = flash(f, changed[`item${i}`], A);
            return (
              <div key={i} style={{ display: 'flex', height: fs * 1.95, alignItems: 'center', gap: 16, opacity: k, background: fl > 0 ? alpha(A.accent, 0.15 * fl) : undefined }}>
                <span style={{ color: A.muted, minWidth: '34%' }}>{o.k}</span>
                {o.redacted ? <span style={{ display: 'inline-block', width: `${Math.min(60, 8 + String(o.v ?? '').length * 1.6)}%`, height: fs * 0.9, background: A.ink, borderRadius: 3, opacity: 0.85 }} /> : <span style={{ color: tone, fontWeight: 600 }}>{String(o.v)}</span>}
              </div>
            );
          })}
        </div>
      );
    case 'toast': {
      const sp = spring({ frame: f - enter, fps, config: { damping: 14, stiffness: 170 } });
      const tone = toneOf(A, el.tone ?? 'good');
      return (
        <div style={{ ...box, translate: `0 ${(1 - sp) * 40}px`, opacity: Math.min(1, sp * 1.6) * (1 - out), ...cardStyle, boxShadow: '0 24px 50px -18px rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px' }}>
          <div style={{ width: fs * 2, height: fs * 2, borderRadius: Math.min(12, A.radius), background: tone.fg, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: fs }}>✓</div>
          <div>
            <div style={{ fontSize: fs * 0.95, fontWeight: 650 }}>{el.title}</div>
            {el.sub && <div style={{ fontSize: fs * 0.78, color: A.muted, marginTop: 2 }}>{el.sub}</div>}
          </div>
        </div>
      );
    }
    case 'shapes':
      return (
        <div style={{ ...box, ...(el.frame ? cardStyle : {}), overflow: 'hidden' }}>
          <ShapesSvg el={el} A={A} t={t} enter={enter} w={p.w} h={p.h} uid={p.id} />
        </div>
      );
    default:
      return null;
  }
};

/** The optional `shapes` element: items draw, pop, bloom and recolour on their cues. */
const ShapesSvg: React.FC<{ el: any; A: AppTokens; t: TimelineScene; enter: number; w: number; h: number; uid: string }> = ({ el, A, t, enter, w, h, uid }) => {
  const f = useCurrentFrame();
  const v = shapesView(el);
  const items: any[] = el.items ?? [];
  const named: Record<string, any> = {};
  for (const it of items) if (it.name) named[it.name] = it;
  const tok = (c: any, fb: string): string => {
    if (!c) return fb;
    if (typeof c === 'string' && c.startsWith('#')) return c;
    const m: Record<string, string> = { accent: A.accent, good: A.good, bad: A.bad, warn: A.warn, ink: A.ink, muted: A.muted, border: A.border, surface: A.surface, bg: A.bg, subtle: A.subtle };
    return m[c] ?? fb;
  };
  const colorAt = (it: any, key: 'fill' | 'stroke', fb: string) => {
    let c = tok(it[key], fb);
    for (const r of it.recolor ?? []) {
      if (r[key] === undefined) continue;
      const rf = cueFrame(t, r.at, enter);
      const k = ease(f, rf, r.dur ?? 14);
      if (k > 0) c = mixHex(c, tok(r[key], c), k);
    }
    return c;
  };
  const sid = uid.replace(/[^a-zA-Z0-9_-]/g, '');
  const polyOf = (it: any): string | null => {
    if (it.points) return (it.points as number[][]).map((q) => `${q[0]},${q[1]}`).join(' ');
    if (it.kind === 'rect') return `${it.x},${it.y} ${it.x + it.w},${it.y} ${it.x + it.w},${it.y + it.h} ${it.x},${it.y + it.h}`;
    return null;
  };
  const clips = [...new Set(items.filter((it) => it.clip && named[it.clip]).map((it) => it.clip as string))];
  return (
    <svg width={w} height={h} viewBox={v.join(' ')} preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <defs>
        {clips.map((c) => {
          const pts = polyOf(named[c]);
          return pts ? (
            <clipPath key={c} id={`${sid}-clip-${c}`}>
              <polygon points={pts} />
            </clipPath>
          ) : null;
        })}
      </defs>
      {el.bg && <rect x={v[0]} y={v[1]} width={v[2]} height={v[3]} fill={tok(el.bg, A.surface)} />}
      {items.map((it, i) => {
        const a = it.at !== undefined ? cueFrame(t, it.at, enter) : enter + (it.delay ?? 0);
        const u = it.until !== undefined ? cueFrame(t, it.until, t.duration) : undefined;
        if (f < a - 1) return null;
        const out = u !== undefined && it.kind !== 'cells' ? ease(f, u, it.outDur ?? 8) : 0;
        if (out >= 1) return null;
        const k = ease(f, a, it.dur ?? 16);
        const op = (it.opacity ?? 1) * (1 - out);
        const stroke = colorAt(it, 'stroke', 'none');
        const fill = colorAt(it, 'fill', 'none');
        const sw = it.width ?? 0.3;
        const dash = it.dash ? (it.dash as number[]).join(' ') : undefined;
        const drawn = it.draw ? { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - k } : { strokeDasharray: dash };
        const clipPath = it.clip && named[it.clip] ? `url(#${sid}-clip-${it.clip})` : undefined;
        switch (it.kind) {
          case 'poly':
          case 'rect': {
            const pts = polyOf(it);
            if (!pts) return null;
            return <polygon key={i} points={pts} fill={fill} fillOpacity={it.draw ? k : 1} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" opacity={it.draw ? op : op * k} {...drawn} />;
          }
          case 'line':
            return <polyline key={i} points={polyOf(it) ?? ''} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" opacity={it.draw ? op : op * k} {...drawn} />;
          case 'circle':
            return (
              <g key={i} clipPath={clipPath}>
                <circle cx={it.x} cy={it.y} r={it.r} fill={fill} fillOpacity={(it.fillOpacity ?? 1) * k} stroke={stroke} strokeWidth={sw} opacity={op} {...(it.draw ? drawn : { strokeDasharray: dash, opacity: op * k })} />
              </g>
            );
          case 'dot': {
            let x = it.x;
            let y = it.y;
            for (const mv of it.move ?? []) {
              const mk = ease(f, cueFrame(t, mv.at, enter), mv.dur ?? 18);
              x += ((mv.x ?? x) - x) * mk;
              y += ((mv.y ?? y) - y) * mk;
            }
            const r = it.r ?? 1;
            const pop = spring({ frame: f - a, fps: 30, config: { damping: 10, stiffness: 190 } });
            const pulseK = it.pulse ? interpolate(f, [a, a + 30], [0, 1], clamp) : 1;
            return (
              <g key={i} transform={`translate(${x} ${y})`} opacity={op}>
                {it.pulse && pulseK < 1 && <circle r={r * (1 + 2.4 * pulseK)} fill="none" stroke={tok(it.pulseColor ?? it.stroke, A.accent)} strokeWidth={sw * 1.2} opacity={0.8 * (1 - pulseK)} />}
                <g transform={`scale(${Math.max(0, pop)})`}>
                  <circle r={r} fill={fill === 'none' ? A.surface : fill} stroke={stroke === 'none' ? A.ink : stroke} strokeWidth={sw} />
                  {it.label && (
                    <text y={r * 0.42} textAnchor="middle" fontFamily={A.mono} fontSize={r * 1.2} fontWeight={600} fill={colorAt(it, 'labelColor' as any, stroke === 'none' ? A.ink : stroke)}>
                      {it.label}
                    </text>
                  )}
                </g>
              </g>
            );
          }
          case 'text':
            return (
              <text key={i} x={it.x} y={it.y} textAnchor={it.anchor ?? 'start'} fontFamily={it.font === 'mono' ? A.mono : A.font} fontSize={it.size ?? 2} fontWeight={it.weight ?? 600} letterSpacing={it.tracking} fill={fill === 'none' ? A.ink : fill} opacity={op * k}>
                {it.text}
              </text>
            );
          case 'cells': {
            const cells: number[][] = it.cells ?? [];
            const size = it.size ?? 1;
            const gap = it.gap ?? 0.06;
            const n = cells.length;
            const order = (pts: number[][], src?: number[] | number[][]) => {
              if (!src) return pts.map((_, j) => j / Math.max(1, n - 1));
              const srcs = (Array.isArray(src[0]) ? src : [src]) as number[][];
              const d = pts.map((q) => Math.min(...srcs.map((s0) => Math.hypot(q[0]! - s0[0]!, q[1]! - s0[1]!))));
              const lo = Math.min(...d);
              const hi = Math.max(...d);
              return d.map((x) => (hi > lo ? (x - lo) / (hi - lo) : 0));
            };
            const inO = order(cells, it.from);
            const outO = u !== undefined ? order(cells, it.outFrom) : null;
            const spread = it.spread ?? 18;
            const spreadOut = it.spreadOut ?? 14;
            return (
              <g key={i} fill={fill === 'none' ? A.bad : fill}>
                {cells.map((q, j) => {
                  const ck = ease(f, a + inO[j]! * spread, 8);
                  const co = outO ? ease(f, u! + outO[j]! * spreadOut, 8) : 0;
                  const o = (it.opacity ?? 0.55) * ck * (1 - co);
                  if (o <= 0.001) return null;
                  return <rect key={j} x={q[0]! - size / 2 + gap / 2} y={q[1]! - size / 2 + gap / 2} width={size - gap} height={size - gap} opacity={o} />;
                })}
              </g>
            );
          }
          case 'sweep': {
            const to = it.to !== undefined ? cueFrame(t, it.to, a + 30) : a + 30;
            const sk = interpolate(f, [a, Math.max(a + 1, to)], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.55, 1) });
            const fade = 1 - ease(f, to, 10);
            if (fade <= 0) return null;
            const x = v[0]! + v[2]! * sk;
            const c = tok(it.fill ?? it.stroke, A.accent);
            return (
              <g key={i} opacity={fade}>
                <rect x={v[0]} y={v[1]} width={Math.max(0, x - v[0]!)} height={v[3]} fill={c} opacity={0.07} />
                <rect x={x - 3} y={v[1]} width={3} height={v[3]} fill={c} opacity={0.16} />
                <line x1={x} y1={v[1]} x2={x} y2={v[1]! + v[3]!} stroke={c} strokeWidth={it.width ?? 0.45} />
              </g>
            );
          }
          case 'grid': {
            const step = it.step ?? 4;
            return (
              <g key={i} opacity={op * k}>
                <defs>
                  <pattern id={`${sid}-grid-${i}`} width={step} height={step} patternUnits="userSpaceOnUse" x={v[0]} y={v[1]}>
                    <circle cx={0} cy={0} r={it.r ?? 0.12} fill={fill === 'none' ? A.border : fill} />
                  </pattern>
                </defs>
                <rect x={v[0]} y={v[1]} width={v[2]} height={v[3]} fill={`url(#${sid}-grid-${i})`} />
              </g>
            );
          }
          default:
            return null;
        }
      })}
    </svg>
  );
};

/* ------------------------------------------------------------------ window */

export type UISpec = {
  elements: any[];
  frame?: 'browser' | 'app' | 'phone' | 'panel' | 'none';
  url?: string;
  title?: string;
  sidebar?: (string | { label: string; icon?: string })[];
  active?: number;
  width?: number;
  minHeight?: number;
  tilt?: boolean;
  perspective?: 'left' | 'right';
  cursor?: { at?: any; to: string; click?: boolean }[];
  camera?: { at?: any; focus?: string; zoom?: number; reset?: boolean }[];
  spotlight?: { at?: any; until?: any; target: string }[];
  highlight?: { at?: any; until?: any; target: string }[];
  notes?: { at?: any; until?: any; target: string; text: string; side?: 'left' | 'right' | 'top' | 'bottom' }[];
  app?: Record<string, any>;
  enterAt?: number;
  /** Logical window width in 9:16 and 1:1 (content px before scaling); default 470 for a phone, 660 otherwise. */
  portraitWidth?: number;
};

const CHROME = (frame: string, k = 1) => ({ top: frame === 'browser' ? 56 * k : frame === 'app' ? 50 * k : frame === 'phone' ? 54 : 0 });

/**
 * Window geometry inside a box: pure, shared by the scene and its callouts. In 9:16 and 1:1
 * (`fr` not wide) the window is laid out at a narrow logical width and scaled up to fill the
 * box, so recreated UI text stays readable on a phone.
 */
export const uiGeometry = (spec: UISpec, fs: number, box: { x: number; y: number; w: number; h: number }, fr?: Frame) => {
  const frame = spec.frame ?? 'browser';
  const phone = frame === 'phone';
  const tall = !!fr && !fr.wide;
  const sidebarW = spec.sidebar && !phone ? 250 : 0;
  const winW = tall && frame !== 'panel' && frame !== 'none' ? Math.min(spec.portraitWidth ?? (phone ? 470 : 660), box.w) : phone ? 470 : Math.min(spec.width ?? 1480, box.w);
  const bezel = phone ? 16 : 0;
  const contentW = winW - sidebarW - bezel * 2;
  const { placed, height } = layoutUI(spec.elements ?? [], contentW, fs, phone ? 22 : 30);
  const top = CHROME(frame).top;
  const contentH = Math.max(height, (spec.minHeight ?? (phone && !tall ? 840 : 0)) - top);
  const winH = top + contentH + bezel * 2;
  const maxScale = tall && frame !== 'panel' && frame !== 'none' ? 1.8 : 1;
  const scale = Math.min(maxScale, (box.h - 8) / winH, box.w / winW);
  const x0 = box.x + (box.w - winW * scale) / 2;
  const y0 = box.y + (box.h - winH * scale) / 2;
  return { frame, placed, contentW, contentH, sidebarW, top, bezel, winW, winH, scale, x0, y0 };
};

/** The camera inside the window at frame f: zoom z centred on (fx, fy), clamped to the content. */
const camAt = (spec: UISpec, placed: Placed[], W: number, H: number, f: number, t: TimelineScene) => {
  let z = 1;
  let fx = W / 2;
  let fy = H / 2;
  for (const c of spec.camera ?? []) {
    const cf = cueFrame(t, c.at, 0);
    const k = ease(f, cf, 26, Easing.bezier(0.65, 0, 0.35, 1));
    if (k <= 0) continue;
    const b = c.reset ? null : targetBox(placed, c.focus);
    // Never zoom so far that the target itself is cropped.
    const tz = c.reset ? 1 : Math.min(c.zoom ?? 1.5, b ? Math.max(1, Math.min((W * 0.94) / b.width, (H * 0.9) / b.height)) : 9);
    const tx = b ? b.x + b.width / 2 : W / 2;
    const ty = b ? b.y + b.height / 2 : H / 2;
    z += (tz - z) * k;
    fx += (tx - fx) * k;
    fy += (ty - fy) * k;
  }
  const tx = Math.min(0, Math.max(W - W * z, W / 2 - fx * z));
  const ty = Math.min(0, Math.max(H - H * z, H / 2 - fy * z));
  return { z, tx, ty };
};

/** Where a content box lands on the film frame. */
export const toFrame = (g: ReturnType<typeof uiGeometry>, cam: { z: number; tx: number; ty: number }, b: Box): Box => ({
  x: g.x0 + (g.bezel + g.sidebarW + cam.tx + b.x * cam.z) * g.scale,
  y: g.y0 + (g.bezel + g.top + cam.ty + b.y * cam.z) * g.scale,
  width: b.width * cam.z * g.scale,
  height: b.height * cam.z * g.scale,
});

const Arrow: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ overflow: 'visible', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))' }}>
    <path d="M4 2 L4 19.6 L8.5 15.6 L11.5 22.4 L14.6 21 L11.7 14.4 L17.8 14.4 Z" fill="#0e1726" stroke="#fff" strokeWidth={1.7} strokeLinejoin="round" />
  </svg>
);

/** The app window: chrome, sidebar, the laid-out elements, camera, cursor, spotlight, highlights, notes. */
export const AppWindow: React.FC<{ spec: UISpec; t: TimelineScene; box: { x: number; y: number; w: number; h: number } }> = ({ spec, t, box }) => {
  const f = useCurrentFrame();
  const P = usePal();
  const T = useTheme();
  const A = useApp(spec.app);
  const fr = useFrame();
  const g = uiGeometry(spec, A.size, box, fr);
  const W = g.contentW;
  const H = g.contentH;
  const cam = camAt(spec, g.placed, W, H, f, t);
  const enterAt = spec.enterAt ?? 0;
  const e = ease(f, enterAt, 24);
  const firstZoom = (spec.camera ?? []).find((c) => !c.reset);
  const flatten = firstZoom ? ease(f, cueFrame(t, firstZoom.at, 999), 26) : 0;
  const persp = spec.perspective ? (1 - flatten) * (spec.perspective === 'left' ? 9 : -9) : 0;
  const tilt = spec.tilt !== false ? (1 - e) * 16 : 0;

  // Cursor path through its targets, with clicks.
  const moves = (spec.cursor ?? []).map((c) => ({ ...c, f: cueFrame(t, c.at, 20), b: targetBox(g.placed, c.to) })).filter((c) => c.b);
  const clicksFor = (id: string) => moves.filter((m) => m.click !== false && m.to && (m.to === id || m.to.split('.')[0] === id)).map((m) => m.f);
  let cursor: ReactNode = null;
  if (moves.length && f >= moves[0]!.f - 22) {
    const pts = [{ f: moves[0]!.f - 22, x: W * 0.92, y: H * 0.95 }, ...moves.map((m) => ({ f: m.f - 2, x: m.b!.x + m.b!.width * 0.55, y: m.b!.y + m.b!.height * 0.6 }))];
    let x = pts[pts.length - 1]!.x;
    let y = pts[pts.length - 1]!.y;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const start = Math.max(a.f, b.f - 18);
      if (f < b.f) {
        const k = interpolate(f, [start, b.f], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.15, 1) });
        const bow = Math.sin(k * Math.PI) * Math.min(50, Math.hypot(b.x - a.x, b.y - a.y) * 0.1);
        x = a.x + (b.x - a.x) * k + bow * 0.3;
        y = a.y + (b.y - a.y) * k - bow;
        break;
      }
    }
    const near = moves.filter((m) => m.click !== false).map((m) => f - m.f).find((d) => d >= -3 && d < 20);
    const size = 30 / cam.z;
    cursor = (
      <div style={{ position: 'absolute', left: x - size * 0.18, top: y - size * 0.1, zIndex: 50 }}>
        {near !== undefined && near >= 0 && <div style={{ position: 'absolute', left: size * 0.18 - size * 1.6 * (near / 20), top: size * 0.1 - size * 1.6 * (near / 20), width: size * 3.2 * (near / 20), height: size * 3.2 * (near / 20), borderRadius: '50%', border: `${3 / cam.z}px solid ${alpha(A.accent, 1 - near / 20)}` }} />}
        <div style={{ scale: near !== undefined && near >= -3 && near < 3 ? '0.85' : '1', transformOrigin: '18% 10%' }}>
          <Arrow size={size} />
        </div>
      </div>
    );
  }

  // Spotlight: dim everything but the target.
  const spots = (spec.spotlight ?? []).map((s) => {
    const a = cueFrame(t, s.at, 0);
    const u = s.until !== undefined ? cueFrame(t, s.until, t.duration) : t.duration + 99;
    const k = Math.min(ease(f, a, 12), 1 - ease(f, u, 10));
    const b = targetBox(g.placed, s.target);
    return k > 0 && b ? (
      <div key={s.target + a} style={{ position: 'absolute', left: b.x - 10, top: b.y - 10, width: b.width + 20, height: b.height + 20, borderRadius: A.radius + 6, boxShadow: `0 0 0 4000px ${alpha(A.dark ? '#000000' : '#0b1220', 0.55 * k)}, 0 0 0 ${3}px ${alpha(A.accent, k)}`, zIndex: 40, pointerEvents: 'none' }} />
    ) : null;
  });
  const rings = (spec.highlight ?? []).map((s) => {
    const a = cueFrame(t, s.at, 0);
    const u = s.until !== undefined ? cueFrame(t, s.until, t.duration) : t.duration + 99;
    const k = Math.min(ease(f, a, 10, Easing.bezier(0.34, 1.56, 0.64, 1)), 1 - ease(f, u, 8));
    const b = targetBox(g.placed, s.target);
    const breathe = (Math.sin((f - a) / 6) + 1) / 2;
    return k > 0 && b ? <div key={s.target + a} style={{ position: 'absolute', left: b.x - 8, top: b.y - 8, width: b.width + 16, height: b.height + 16, borderRadius: A.radius + 4, border: `3px solid ${A.accent}`, boxShadow: `0 0 0 ${4 + breathe * 8}px ${alpha(A.accent, 0.22)}`, opacity: k, scale: `${0.96 + 0.04 * k}`, zIndex: 41 }} /> : null;
  });

  const frame = g.frame;
  const R = frame === 'phone' ? 54 : frame === 'none' ? 0 : Math.max(10, A.radius + 6);
  const shadow = frame === 'none' ? undefined : `0 30px 80px -20px rgba(0,0,0,${P.dark ? 0.6 : 0.35}), 0 0 0 1px ${alpha(P.dark ? '#ffffff' : '#000000', 0.08)}`;
  const chromeBg = mixHex(A.surface, A.ink, A.dark ? 0.06 : 0.04);

  const notes = (spec.notes ?? []).map((n, i) => {
    const a = cueFrame(t, n.at, 0);
    const u = n.until !== undefined ? cueFrame(t, n.until, t.duration) : t.duration + 99;
    const k = Math.min(ease(f, a, 14), 1 - ease(f, u, 8));
    const b0 = targetBox(g.placed, n.target);
    if (!b0 || k <= 0) return null;
    const b = toFrame(g, cam, b0);
    const tallFrame = !fr.wide;
    // In 9:16 and 1:1 a note goes above or below its target (there is no room beside a full-width window).
    const side0 = n.side ?? (tallFrame ? (b.y + b.height / 2 > fr.H * 0.45 ? 'top' : 'bottom') : b.x + b.width / 2 > fr.W / 2 ? 'left' : 'right');
    const side = tallFrame && (side0 === 'left' || side0 === 'right') ? (b.y + b.height / 2 > fr.H * 0.45 ? 'top' : 'bottom') : side0;
    const noteW = tallFrame ? Math.min(560, fr.W - fr.safe.left - fr.safe.right - 20) : 420;
    const lo = (tallFrame ? fr.safe.left : 40) + (side === 'top' || side === 'bottom' ? noteW / 2 : 0);
    const hi = fr.W - (tallFrame ? fr.safe.right : 40) - (side === 'top' || side === 'bottom' ? noteW / 2 : 0);
    const cx = side === 'right' ? Math.min(fr.W - 40, b.x + b.width + 40) : side === 'left' ? Math.max(40, b.x - 40) : Math.max(lo, Math.min(hi, b.x + b.width / 2));
    const cy = side === 'top' ? b.y - 30 : side === 'bottom' ? b.y + b.height + 30 : b.y + b.height / 2;
    const anchor = side === 'right' ? { x: b.x + b.width, y: cy } : side === 'left' ? { x: b.x, y: cy } : { x: Math.max(b.x + 10, Math.min(b.x + b.width - 10, cx)), y: side === 'top' ? b.y : b.y + b.height };
    const tr = side === 'right' ? '0 -50%' : side === 'left' ? '-100% -50%' : side === 'top' ? '-50% -100%' : '-50% 0';
    return (
      <div key={i} style={{ position: 'absolute', inset: 0, opacity: k, pointerEvents: 'none', zIndex: 60 }}>
        <svg width={fr.W} height={fr.H} style={{ position: 'absolute', inset: 0 }}>
          <line x1={anchor.x} y1={anchor.y} x2={cx} y2={cy} stroke={P.fill} strokeWidth={3} strokeDasharray="6 6" />
          <circle cx={anchor.x} cy={anchor.y} r={7} fill={P.fill} />
        </svg>
        <div style={{ position: 'absolute', left: cx, top: cy, translate: tr, scale: `${0.9 + 0.1 * k}`, maxWidth: noteW, width: tallFrame ? 'max-content' : undefined, textAlign: tallFrame ? 'center' : undefined, padding: '14px 20px', borderRadius: Math.min(T.radius, 16), background: P.fill, color: P.onFill, fontFamily: T.ui, fontWeight: 700, fontSize: tallFrame ? 32 : 28, lineHeight: 1.2, boxShadow: '0 18px 40px -14px rgba(0,0,0,0.5)' }}>{n.text}</div>
      </div>
    );
  });

  return (
    <>
      <div style={{ position: 'absolute', left: g.x0, top: g.y0, width: g.winW, height: g.winH, scale: `${g.scale}`, transformOrigin: '0 0', perspective: 2400 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: R,
            overflow: 'hidden',
            background: frame === 'none' ? 'transparent' : frame === 'phone' ? '#0b0b0f' : A.bg,
            boxShadow: shadow,
            opacity: e,
            transform: `translateY(${(1 - e) * 60}px) rotateX(${tilt + Math.abs(persp) * 0.4}deg) rotateY(${persp}deg) scale(${0.94 + 0.06 * e})`,
            transformOrigin: '50% 60%',
            padding: g.bezel,
            boxSizing: 'border-box',
          }}
        >
          {frame === 'browser' && (
            <div style={{ height: g.top, background: chromeBg, borderBottom: `1px solid ${A.border}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px' }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: mixHex(A.border, A.ink, 0.18 + i * 0.06) }} />
              ))}
              <div style={{ marginLeft: 26, flex: 1, maxWidth: 640, height: 34, borderRadius: 9, background: A.surface, border: `1px solid ${A.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', fontFamily: A.font, fontSize: 17, color: A.muted }}>{spec.url ?? 'localhost:3000'}</div>
            </div>
          )}
          {frame === 'app' && (
            <div style={{ height: g.top, background: chromeBg, borderBottom: `1px solid ${A.border}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', position: 'relative' }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 13, height: 13, borderRadius: '50%', background: mixHex(A.border, A.ink, 0.2) }} />
              ))}
              <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: A.font, fontWeight: 600, fontSize: 18, color: A.muted }}>{spec.title}</div>
            </div>
          )}
          {frame === 'phone' && <div style={{ position: 'absolute', left: '50%', top: g.bezel + 10, width: 130, height: 32, translate: '-50% 0', borderRadius: 20, background: '#0b0b0f', zIndex: 5 }} />}
          <div style={{ position: 'relative', display: 'flex', height: frame === 'phone' ? g.top + g.contentH : g.contentH, borderRadius: frame === 'phone' ? 40 : 0, overflow: 'hidden', background: A.bg }}>
            {g.sidebarW > 0 && (
              <div style={{ width: g.sidebarW, flex: 'none', background: mixHex(A.bg, A.ink, A.dark ? 0.03 : 0.025), borderRight: `1px solid ${A.border}`, padding: '26px 16px', boxSizing: 'border-box', fontFamily: A.font }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px 22px', fontWeight: 750, fontSize: 20, color: A.ink }}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: A.accent }} />
                  {spec.title ?? ''}
                </div>
                {(spec.sidebar ?? []).map((s0, i) => {
                  const s = typeof s0 === 'string' ? { label: s0 } : s0;
                  const on = i === (spec.active ?? 0);
                  return (
                    <div key={i} style={{ padding: '11px 12px', borderRadius: 8, fontSize: 18, fontWeight: on ? 650 : 500, color: on ? A.ink : A.muted, background: on ? alpha(A.accent, 0.12) : undefined, marginBottom: 4, whiteSpace: 'nowrap' }}>
                      {s.label}
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ position: 'relative', width: W, height: frame === 'phone' ? g.top + H : H, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: frame === 'phone' ? g.top : 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.z})` }}>
                {g.placed.map((p, i) => (
                  <UIEl key={p.id + i} p={p} A={A} t={t} enter={p.el.at !== undefined ? cueFrame(t, p.el.at, enterAt + 10) : enterAt + 10 + p.order * 4} clicks={clicksFor(p.id)} />
                ))}
                {rings}
                {spots}
                {cursor}
              </div>
            </div>
          </div>
        </div>
      </div>
      {notes}
    </>
  );
};

// Config handling, shared by the node scripts and the video.
//
// A config lists its scenes in play order and each scene carries its own voice lines in `say`
// (a string, or a list of strings / { text, gap }). normalizeConfig() resolves what is being
// rendered and flattens it:
//
//   1. the cut (config.cuts[name]): its scene subset in its order, its per-scene overrides,
//      its aspect, targetSeconds, fitSeconds and captions;
//   2. the aspect (--aspect, else the cut's, else config.aspect, else 16:9), and each scene's
//      `variants[aspect]` deep-merged over the scene (objects merge, arrays replace);
//   3. the `say` lines flattened into a top-level `lines` array (scene order, then line
//      order) that the voice, timeline and caption code read.
//
// The result is idempotent: normalizing a normalized config returns it unchanged.

/** Scene types beyond the classic set (the classic ones still work: hook, problem, reveal, features, walkthrough, metric, payoff, end). */
export const V3_TYPES = [
  'kinetic', 'title', 'outro', 'cast', 'ui', 'screenshot', 'split', 'evidence',
  'casefile', 'scoreboard', 'chalkboard', 'chat', 'countdown', 'rewind', 'calendar', 'lanes',
];

export const ASPECTS = ['16:9', '9:16', '1:1'];

/** "16:9" -> "16x9", for file names. */
export const aspectSlug = (a) => String(a).replace(':', 'x');

export const sceneKey = (s) => s.id ?? s.type;

export const isV3 = (c) => c?.kit >= 3 || c?.version >= 1 || (c?.scenes ?? []).some((s) => s.say !== undefined || V3_TYPES.includes(s.type));

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

/** b deep-merged over a: objects merge key by key, arrays and scalars replace. */
export const deepMerge = (a, b) => {
  if (!isObj(a) || !isObj(b)) return b === undefined ? a : b;
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = isObj(v) && isObj(a[k]) ? deepMerge(a[k], v) : v;
  return out;
};

const sayList = (say) => (say === undefined || say === null ? [] : Array.isArray(say) ? say : [say]).map((l) => (typeof l === 'string' ? { text: l } : l)).filter((l) => l && typeof l.text === 'string');

/** The config with cut `name` applied: scene subset (in the cut's order), overrides, and the cut's own settings. */
export const applyCut = (c, name) => {
  const cut = c.cuts?.[name];
  if (!cut) throw new Error(`no cut "${name}" in this config (cuts: ${Object.keys(c.cuts ?? {}).join(', ') || 'none'})`);
  const byId = new Map((c.scenes ?? []).map((s) => [sceneKey(s), s]));
  let scenes = c.scenes ?? [];
  if (Array.isArray(cut.scenes) && cut.scenes.length) {
    scenes = cut.scenes.map((id) => {
      const s = byId.get(id);
      if (!s) throw new Error(`cut "${name}" names scene "${id}", which is not in "scenes"`);
      return s;
    });
  }
  const over = cut.overrides ?? {};
  scenes = scenes.map((s) => (over[sceneKey(s)] ? deepMerge(s, over[sceneKey(s)]) : s));
  const out = { ...c, scenes, cut: name, targetSeconds: cut.targetSeconds ?? 30 };
  if (cut.aspect) out.aspect = cut.aspect;
  // A film's fitSeconds belongs to the film; a cut sets its own.
  if (cut.fitSeconds !== undefined) out.fitSeconds = cut.fitSeconds;
  else delete out.fitSeconds;
  // What the cut itself says about captions (resolveCaptions keeps it over the aspect defaults).
  out._cutCaptions = cut.captions && typeof cut.captions === 'object' ? cut.captions : null;
  for (const k of ['captions', 'music', 'theme']) if (cut[k] !== undefined) out[k] = isObj(cut[k]) && isObj(c[k]) ? deepMerge(c[k], cut[k]) : cut[k];
  if (cut.voice !== undefined) out.voice = cut.voice;
  return out;
};

/**
 * Resolve a config for one render. opts.aspect overrides the aspect; opts.cut picks a cut.
 * Idempotent: an already normalized config is returned as is.
 */
export const normalizeConfig = (c, opts = {}) => {
  if (!c) return c;
  if (c._normalized && !opts.aspect && !opts.cut) return c;
  let out = { ...c };
  if (opts.cut) out = applyCut(out, opts.cut);
  else out.cut = out.cut ?? null;
  const aspect = opts.aspect ?? out.aspect ?? '16:9';
  if (!ASPECTS.includes(aspect)) throw new Error(`aspect "${aspect}" is not one of ${ASPECTS.join(', ')}`);
  out.aspect = aspect;
  out.kit = isV3(c) ? 3 : (c.kit ?? 2);
  out.version = out.version ?? 1;
  out.targetSeconds = out.targetSeconds ?? 60;
  out.scenes = (out.scenes ?? []).map((s) => (isObj(s.variants?.[aspect]) ? deepMerge(s, s.variants[aspect]) : s));
  // Legacy alias: voiceSpeed -> voice.speed.
  if (out.voiceSpeed !== undefined && !(isObj(out.voice) && out.voice.speed !== undefined)) {
    out.voice = isObj(out.voice) ? { ...out.voice, speed: out.voiceSpeed } : typeof out.voice === 'string' ? { model: out.voice, speed: out.voiceSpeed } : { speed: out.voiceSpeed };
  }
  const hasSay = out.scenes.some((s) => s.say !== undefined);
  if (hasSay) {
    const top = c.lines ?? [];
    const lines = [];
    for (const s of out.scenes) {
      const id = sceneKey(s);
      for (const l of top) if (l.scene === id) lines.push(l);
      for (const l of sayList(s.say)) lines.push({ scene: id, text: l.text, ...(l.gap !== undefined ? { gap: l.gap } : {}) });
    }
    out.lines = lines;
  } else {
    const ids = new Set(out.scenes.map(sceneKey));
    out.lines = (c.lines ?? []).filter((l) => ids.has(l.scene));
  }
  out._normalized = true;
  return out;
};

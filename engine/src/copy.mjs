// The copy a scene shows on screen, shared by the lint (scripts/lib.mjs) and, in the text mode,
// the captions: a caption phrase the scene already shows (a kinetic beat, the outro's tagline)
// is not burned in a second time.

// Keys whose strings are settings, not copy (never shown or spoken as text).
export const NOT_COPY = new Set(['type', 'id', 'who', 'mood', 'pose', 'page', 'image', 'src', 'color', 'tone', 'kind', 'style', 'layout', 'icon', 'emoji', 'transition', 'target', 'focus', 'to', 'shape', 'at', 'until', 'frame', 'chrome', 'bg', 'background', 'font', 'fonts', 'lang', 'op', 'sfx', 'enter', 'exit', 'fx', 'accessory', 'side', 'align', 'from', 'lane', 'mode', 'stage', 'position', 'captions', 'perspective', 'say', 'accent', 'swapFx', 'word', 'edge', 'tilt', 'path', 'variant', 'size', 'dir', 'when', 'react', 'provider', 'model', 'sayVoice', 'url', 'name']);

/** Walk a scene's strings: add(where, text, quoted) for each piece of copy. */
export const sceneStrings = (id, node, path, add, quoted = false) => {
  if (typeof node === 'string') {
    add(`${id}${path}`, node, quoted);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => sceneStrings(id, v, `${path}[${i}]`, add, quoted));
    return;
  }
  if (node && typeof node === 'object') {
    // Attributed quotes (evidence cards with a source) and in-world chat are dialogue, not narration.
    const q = quoted || (node.source !== undefined && (node.kind === 'quote' || node.kind === 'post' || node.kind === 'thread')) || node.quoted === true;
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('_') || NOT_COPY.has(k)) continue;
      sceneStrings(id, v, `${path}.${k}`, add, q || k === 'messages' || k === 'bubble');
    }
  }
};

const flat = (t) => ` ${String(t).toLowerCase().replace(/[^\p{L}\p{N}%$]+/gu, ' ').trim()} `;

/**
 * The text a scene puts on screen, flattened (lowercase, punctuation as spaces), one entry per
 * string. Outro and title scenes also show the project name, the tagline and the link.
 */
export const sceneScreenText = (scene, config = {}) => {
  const out = [];
  sceneStrings('', scene, '', (_, t) => out.push(flat(t)));
  if (scene?.type === 'outro' || scene?.type === 'title' || scene?.type === 'end') {
    for (const t of [config.projectName, config.tagline, config.link?.text]) if (typeof t === 'string' && t.trim()) out.push(flat(t));
  }
  return out;
};

/** Whether `phrase` appears whole (as consecutive words) in one of the scene's on-screen strings. */
export const shownOnScreen = (phrase, screen) => {
  const p = flat(phrase);
  return p.trim() !== '' && screen.some((t) => t.includes(p));
};

// Renders the drift table from data/seed.json (served by any static server).
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

fetch('data/seed.json')
  .then((r) => r.json())
  .then((d) => {
    const s = d.summary;
    const stats = [
      ['Keys compared', s.keys, ''],
      ['Environments', s.environments, ''],
      ['Drifted', s.drifted, 'bad'],
      ['Last check', d.checkedAt, ''],
    ];
    const box = document.getElementById('stats');
    for (const [label, value, cls] of stats) {
      const c = el('div', `stat ${cls}`);
      c.append(el('b', '', String(value)), el('span', '', label));
      box.append(c);
    }
    const head = document.getElementById('envs');
    head.replaceWith(...d.environments.map((e) => el('th', '', e)));
    const rows = document.getElementById('rows');
    for (const k of d.keys) {
      const tr = el('tr', k.status);
      tr.dataset.testid = `row-${k.key}`;
      tr.append(el('td', 'key', k.key), el('td', 'file', k.file));
      for (const v of k.values) tr.append(el('td', v === null ? 'v none' : 'v', v === null ? 'not set' : v));
      const st = el('td');
      st.append(el('span', `badge ${k.status}`, k.status));
      tr.append(st);
      rows.append(tr);
    }
  });

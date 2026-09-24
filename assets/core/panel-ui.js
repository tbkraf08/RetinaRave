// DOM helpers for part E of the help view (core/panel.js, v0.4.1) — split out of panel.js when the panel-legibility work
// pushed it past its 350-line cap. A leaf: it imports nothing at all (never panel.js, help.js or harness.js — core must
// stay an import DAG, the bundler cannot order a cycle), touches no state and knows no scene and no MS field: every name
// it shows is handed to it by panel.js. Element construction and formatting only.

export const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
export const up = (s) => String(s).toUpperCase();
export const focused = (e) => e && document.activeElement === e;
export const nums = (x) => (typeof x === 'number' && isFinite(x) ? (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(3)) : String(x));
export const short = (x) => String(+(+x).toPrecision(6));
export const clamp01 = (x) => Math.min(1, Math.max(0, +x || 0));
export const ID = (what, a, b) => 'pe-' + what + (a === undefined ? '' : '-' + a) + (b === undefined ? '' : '-' + b);

export function btn(id, label, fn, cls) {
  const b = el('button', cls ? 'pbtn ' + cls : 'pbtn', label);
  b.id = id;
  b.onclick = fn;
  return b;
}
export function opt(v, t) { const o = el('option', null, t); o.value = v; return o; }
export function mkSel(id, pairs, cur, fn) {
  const s = el('select');
  s.id = id;
  for (const [v, t] of pairs) s.appendChild(opt(v, t));
  s.value = cur;
  s.onchange = fn;
  return s;
}
export function numIn(id, def, step, min) {
  const i = el('input');
  i.type = 'number';
  i.step = step;
  if (min !== undefined) i.min = min;
  i.id = id;
  i.value = String(def);
  return i;
}
export function wrap(label, node, cls) { const w = el('label', cls || 'pnum'); if (label) w.appendChild(el('span', null, label)); w.appendChild(node); return w; }

// ---------------------------------------------------------------- the cells of one row, left to right
// What this input moves on this screen: bright when the line is the scene's own, dim when it is the schema's fallback;
// `note` (a bid-only field's) dims the whole row and says why.
export function drivesCell(tr, text, bright, note) {
  const td = el('td', 'hd' + (bright ? ' here' : ''), text);
  if (note) { td.appendChild(el('span', 'hnote', note)); tr.classList.add('pbid'); }
  tr.appendChild(td);
}
// The jack: the field's name, its kind under it in small type.
export function jackCell(tr, name, kind) {
  const td = el('td', 'hk', name);
  td.appendChild(el('div', 'pkind', kind));
  tr.appendChild(td);
}
// The transfer cell of a non-event row: c (shown only while a constant is the source), gain, offset, τ, invert.
export function transferCell(tr, R, id, on) {
  const td = el('td', 'pctl');
  R.c = numIn(id('c'), 0, '0.05');
  R.cw = wrap('c', R.c);
  R.k = numIn(id('k'), 1, '0.05');
  R.b = numIn(id('b'), 0, '0.05');
  R.tau = numIn(id('tau'), 0, '0.05', '0');
  R.inv = el('input');
  R.inv.type = 'checkbox';
  R.inv.id = id('inv');
  for (const w of [R.cw, wrap('×', R.k), wrap('+', R.b), wrap('τ', R.tau), wrap('', R.inv)]) td.appendChild(w);
  td.lastChild.appendChild(el('span', null, 'invert'));
  for (const i of [R.c, R.k, R.b, R.tau, R.inv]) i.onchange = on;
  tr.appendChild(td);
}
// The two-segment meter: source → routed. A value span each (a dot for an event) and, for a level, a 0..1 bar under it.
export function meterCell(tr, ev, bar) {
  const td = el('td', 'hl pmeter'), seg = () => {
    const s = { v: el('span', ev ? 'pdot' : 'hv'), fill: null }, box = el('span', 'pm');
    box.appendChild(s.v);
    if (bar) { const d = el('div', 'hbar'); s.fill = el('div', 'hfill'); d.appendChild(s.fill); box.appendChild(d); }
    td.appendChild(box);
    return s;
  };
  const m1 = seg();
  td.appendChild(el('span', 'parrow', '→'));
  const m2 = seg();
  tr.appendChild(td);
  return [m1, m2];
}

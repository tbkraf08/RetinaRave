// Part E of the help view — the routes control panel (v0.4 item 3, docs/workers/brief-panel.md). DOM only: no GL, no
// wall clock, no timer and no second requestAnimationFrame. The core calls exactly four things: buildE(section) once on
// the first open, markE() when the logical scene changes, refreshE(frameN) on the help view's tick (every 6th frame
// while open) and restore() at boot outside #test. Nothing here runs while the view is closed.
// Every word shown is data: the scene registry (names, ids, feats, help.feats, colour variants, post), the schema
// (FEATS) and route.js's sources() — no scene and no MS field is ever named as a literal (tools/check.js fails on one).
import { FEATS } from '../engine/feats.js';
import { MS } from '../engine/state.js';
import { SC, REG, SCENES, TRANSITIONS } from './scenes.js';
import { ROUTES, view, sources, setRoute, clearRoutes, routesJSON, loadRoutes, kindOf } from './route.js';
import { MANUAL, manual, clearPost, resetManual, POST_PARAMS } from './manual.js';
import { TEST } from './hash.js';

const KEY = 'ew.routes.v1';                 // the preset in localStorage (never touched under #test)
const EVENT = 'event', LEVEL = 'level', CONST = 'const';
const ID = (what, a, b) => 'pe-' + what + (a === undefined ? '' : '-' + a) + (b === undefined ? '' : '-' + b);

let rows = [], blocks = {}, posts = [], colours = [], holder = null, ta = null, err = null, store = null, mSel = null, tSel = null;

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const up = (s) => String(s).toUpperCase();
const focused = (e) => e && document.activeElement === e;
const sceneName = (E) => up(E.scene.name) + (E.variant ? ' / ' + up(E.variant.name) : '');
const nums = (x) => (typeof x === 'number' && isFinite(x) ? (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(3)) : String(x));
const short = (x) => String(+(+x).toPrecision(6));
const clamp01 = (x) => Math.min(1, Math.max(0, +x || 0));
function btn(id, label, fn) { const b = el('button', 'pbtn', label); b.id = id; b.onclick = fn; return b; }
function opt(v, t) { const o = el('option', null, t); o.value = v; return o; }
function mkSel(id, pairs, cur, fn) {
  const s = el('select');
  s.id = id;
  for (const [v, t] of pairs) s.appendChild(opt(v, t));
  s.value = cur;
  s.onchange = fn;
  return s;
}
function numIn(id, def, step, min) {
  const i = el('input');
  i.type = 'number';
  i.step = step;
  if (min !== undefined) i.min = min;
  i.id = id;
  i.value = String(def);
  return i;
}
function wrap(label, node, cls) { const w = el('label', cls || 'pnum'); if (label) w.appendChild(el('span', null, label)); w.appendChild(node); return w; }

// ---------------------------------------------------------------- one routable field of one scene
function segment(td, kind) {
  const seg = { v: el('span', kind === EVENT ? 'pdot' : 'hv'), fill: null };
  const box = el('span', 'pm');
  box.appendChild(seg.v);
  if (kind === LEVEL) { const b = el('div', 'hbar'); seg.fill = el('div', 'hfill'); b.appendChild(seg.fill); box.appendChild(b); }
  td.appendChild(box);
  return seg;
}

function rowFor(sc, k) {
  const kind = kindOf(k), R = { sc, f: k, kind, ev: kind === EVENT, tr: el('tr') };
  const name = el('td', 'hk', k);
  name.appendChild(el('div', 'pkind', kind));
  R.tr.appendChild(name);
  const own = sc.help && sc.help.feats && sc.help.feats[k];       // part A's rule: the scene's own line is bright
  R.tr.appendChild(el('td', 'hd' + (own ? ' here' : ''), own || FEATS[k].drives));
  const st = el('td');
  R.sel = mkSel(ID('src', sc.name, k), [['', '— (engine)'], ...sources(k).map((s) => [s, s])], '', () => push(R));
  st.appendChild(R.sel);
  R.err = el('div', 'herr');
  st.appendChild(R.err);
  R.tr.appendChild(st);
  const ct = el('td', 'pctl');
  if (!R.ev) {                                                    // an event routes as a boolean: no transfer at all
    R.c = numIn(ID('c', sc.name, k), 0, '0.05');
    R.cw = wrap('c', R.c);
    R.k = numIn(ID('k', sc.name, k), 1, '0.05');
    R.b = numIn(ID('b', sc.name, k), 0, '0.05');
    R.tau = numIn(ID('tau', sc.name, k), 0, '0.05', '0');
    R.inv = el('input');
    R.inv.type = 'checkbox';
    R.inv.id = ID('inv', sc.name, k);
    for (const w of [R.cw, wrap('×', R.k), wrap('+', R.b), wrap('τ', R.tau), wrap('', R.inv)]) ct.appendChild(w);
    ct.lastChild.appendChild(el('span', null, 'invert'));
    for (const i of [R.c, R.k, R.b, R.tau, R.inv]) i.onchange = () => push(R);
  }
  R.tr.appendChild(ct);
  const rt = el('td');
  rt.appendChild(btn(ID('r', sc.name, k), 'reset', () => set(R, null)));
  R.tr.appendChild(rt);
  const lt = el('td', 'hl pmeter');
  R.m1 = segment(lt, kind);
  lt.appendChild(el('span', 'parrow', '→'));
  R.m2 = segment(lt, kind);
  R.tr.appendChild(lt);
  rows.push(R);
  return R.tr;
}

const specOf = (R) => (R.sel.value === '' ? null : R.ev ? { src: R.sel.value }
  : { src: R.sel.value, c: +R.c.value, k: +R.k.value, b: +R.b.value, tau: +R.tau.value, inv: R.inv.checked });
const push = (R) => set(R, specOf(R));
function set(R, spec) {                                            // one row → the core; the controls then show what is in force
  try { setRoute(R.sc.name, R.f, spec); R.err.textContent = ''; }
  catch (e) { R.err.textContent = e.message; }
  syncRow(R);
  save();
}
function syncRow(R) {                                              // never trust the input: read ROUTES back
  const s = (ROUTES[R.sc.name] || {})[R.f] || null;
  if (!focused(R.sel)) R.sel.value = s ? s.src : '';
  if (!R.ev) {
    for (const [i, v] of [[R.c, s ? s.c : 0], [R.k, s ? s.k : 1], [R.b, s ? s.b : 0], [R.tau, s ? s.tau : 0]]) if (!focused(i)) i.value = short(v);
    R.inv.checked = !!(s && s.inv);
    R.cw.style.display = R.sel.value === CONST ? '' : 'none';
  }
  R.tr.classList.toggle('prouted', !!s);
}

// ---------------------------------------------------------------- one scene's block
function block(sc) {
  const box = el('div', 'hcast pblk');
  box.id = ID('blk', sc.name);
  box.appendChild(el('h3', null, up(sc.name) + ' · id ' + sc.id));
  const t = el('table', 'htab ptab'), hr = el('tr'), dead = [];
  for (const c of ['field', 'what it drives here', 'source', 'transfer', '', 'source → routed']) hr.appendChild(el('th', null, c));
  t.appendChild(hr);
  for (const k in FEATS) {                                         // FEATS order, as part A walks it
    if (!(sc.feats || []).includes(k)) continue;
    if (sources(k).length) t.appendChild(rowFor(sc, k));
    else dead.push(k + ' (' + kindOf(k) + ')');
  }
  box.appendChild(t);
  if (dead.length) box.appendChild(el('p', 'hnote', 'not routable: ' + dead.join(', ')));
  const bar = el('p', 'hnote pbar'), msg = el('span', 'pmsg');
  bar.appendChild(btn(ID('copy', sc.name), 'copy to all scenes', () => {
    const R = ROUTES[sc.name] || {};
    let n = 0;
    for (const o of SCENES) {
      if (o === sc) continue;
      for (const f in R) if ((o.feats || []).includes(f)) { try { setRoute(o.name, f, Object.assign({}, R[f])); n++; } catch (e) { msg.textContent = e.message; } }
    }
    msg.textContent = 'copied ' + n + ' route' + (n === 1 ? '' : 's') + ' to the other scenes';
    syncAll();
    save();
  }));
  bar.appendChild(btn(ID('rst', sc.name), 'reset scene', () => { clearRoutes(sc.name); msg.textContent = ''; syncAll(); save(); }));
  bar.appendChild(msg);
  box.appendChild(bar);
  return box;
}

// ---------------------------------------------------------------- manual overrides (what the keys already do)
function ownPost(sc, path) {                                       // the value the scene itself would use for one post param
  const cv = sc.colour && sc.colour.variants[sc.colour.cur], p = (cv && cv.post) || sc.post;
  if (typeof p === 'function') return p;
  if (!p) return undefined;
  const i = path.indexOf('.'), a = i < 0 ? path : path.slice(0, i), b = i < 0 ? null : path.slice(i + 1);
  return b ? (p[a] || {})[b] : p[a];
}
function ovPost(sc, path) {                                        // the override in force, if any
  const P = MANUAL.post[sc.name];
  if (!P) return undefined;
  const i = path.indexOf('.'), a = i < 0 ? path : path.slice(0, i), b = i < 0 ? null : path.slice(i + 1);
  return b ? (P[a] || {})[b] : P[a];
}
const isFlag = (path) => SCENES.some((s) => typeof ownPost(s, path) === 'boolean');

function postCtl(sc, path, box, msg) {
  const flag = isFlag(path), i = el('input'), P = { sc, path, i, flag };
  i.id = ID('post', sc.name, path);
  if (flag) {
    i.type = 'checkbox';
    i.onchange = () => apply(P, i.checked ? 1 : 0, msg);
    box.appendChild(wrap(path, i)).appendChild(btn(ID('postx', sc.name, path), '×', () => apply(P, null, msg)));
  } else {
    i.type = 'number';
    i.step = '0.05';
    i.onchange = () => apply(P, i.value.trim() === '' ? null : +i.value, msg);   // empty = the scene's own value
    box.appendChild(wrap(path, i));
  }
  posts.push(P);
}
function apply(P, v, msg) {
  try { manual('post', P.sc.name, P.path, v); msg.textContent = ''; }
  catch (e) { msg.textContent = e.message; }
  syncPosts();
  save();
}
function syncPosts() {
  for (const P of posts) {
    const own = ownPost(P.sc, P.path), o = ovPost(P.sc, P.path);
    if (P.flag) { P.i.checked = o === undefined ? own === true : !!o; P.i.indeterminate = o === undefined; }
    else if (!focused(P.i)) {
      P.i.value = o === undefined ? '' : short(o);
      P.i.placeholder = typeof own === 'function' ? 'fn' : typeof own === 'number' ? short(own) : own === undefined ? '—' : String(own);
    }
  }
  for (const C of colours) if (!focused(C.s)) C.s.value = C.sc.colour.cur;
}

function buildManual(sec) {
  sec.appendChild(el('h3', null, 'manual overrides — the same settings the number keys and the colour key reach'));
  const dl = el('dl', 'hdl'), msg = el('span', 'herr');
  const row = (label, node) => { dl.appendChild(el('dt', null, label)); dl.appendChild(el('dd')).appendChild(node); };
  mSel = mkSel(ID('scene'), [['', 'auto — the director chooses'], ...REG.filter((E) => E).map((E) => [String(E.id), E.id + ' · ' + sceneName(E)])],
    '', () => { try { manual('scene', mSel.value === '' ? -1 : +mSel.value); msg.textContent = ''; } catch (e) { msg.textContent = e.message; } syncManual(); save(); });
  row('forced scene', mSel);
  tSel = mkSel(ID('trans'), Object.keys(TRANSITIONS).map((n) => [n, n]), '',
    () => { try { manual('trans', tSel.value); msg.textContent = ''; } catch (e) { msg.textContent = e.message; } syncManual(); save(); });
  row('transition', tSel);
  for (const sc of SCENES) {
    if (!sc.colour) continue;
    const C = { sc };
    C.s = mkSel(ID('col', sc.name), Object.keys(sc.colour.variants).map((n) => [n, n]), sc.colour.cur,
      () => { try { manual('colour', sc.name, C.s.value); msg.textContent = ''; } catch (e) { msg.textContent = e.message; } syncPosts(); save(); });
    colours.push(C);
    row(up(sc.name) + ' colour', C.s);
  }
  for (const sc of SCENES) {
    const box = el('span', 'pctl');
    for (const path of POST_PARAMS) postCtl(sc, path, box, msg);
    box.appendChild(btn(ID('postc', sc.name), 'clear', () => { clearPost(sc.name); msg.textContent = ''; syncPosts(); save(); }));
    row(up(sc.name) + ' post', box);
  }
  sec.appendChild(dl);
  sec.appendChild(el('p', 'hnote', 'an empty post field means the scene\'s own value (shown as the placeholder; fn = the scene computes it from the music, — = unset)'));
  sec.appendChild(el('p', 'hnote')).appendChild(msg);
}
function syncManual() {
  const s = MANUAL.scene < 0 ? '' : String(MANUAL.scene), t = MANUAL.trans || '';
  if (mSel && !focused(mSel) && mSel.value !== s) mSel.value = s;
  if (tSel && !focused(tSel) && tSel.value !== t) tSel.value = t;
}

// ---------------------------------------------------------------- presets and storage
function buildPresets(sec) {
  sec.appendChild(el('h3', null, 'presets'));
  ta = el('textarea');
  ta.id = ID('json');
  ta.rows = 5;
  sec.appendChild(ta);
  const bar = el('p', 'hnote pbar');
  bar.appendChild(btn(ID('load'), 'load', () => {
    try { loadRoutes(ta.value); err.textContent = ''; syncAll(); save(); }
    catch (e) { err.textContent = e.message; }                      // nothing else changes: the core checks it all first
  }));
  bar.appendChild(btn(ID('copybtn'), 'copy', () => {
    try {
      if (navigator.clipboard) navigator.clipboard.writeText(ta.value).catch(() => ta.select());
      else ta.select();
    } catch (e) { ta.select(); }
  }));
  sec.appendChild(bar);
  err = el('p', 'herr');
  err.id = ID('err');
  sec.appendChild(err);
  store = el('p', 'hnote');
  store.id = ID('store');
  sec.appendChild(store);
}
const syncJSON = () => { if (ta && !focused(ta)) { const j = routesJSON(); if (ta.value !== j) ta.value = j; } };
function setStore(what) { if (store) store.textContent = 'localStorage[' + KEY + '] · ' + what; }
function save() {
  syncJSON();
  if (TEST) { setStore('under #test it is neither read nor written, so the harness shots stay deterministic'); return; }
  try { localStorage.setItem(KEY, routesJSON()); setStore('saved (' + routesJSON().length + ' chars) — every change made here is stored and loaded again at boot'); }
  catch (e) { setStore('not available here (' + e.message + ') — nothing is stored'); }
}
function syncAll() {
  for (const R of rows) syncRow(R);
  syncManual();
  syncPosts();
  syncJSON();
}

// ---------------------------------------------------------------- the four calls the core makes
export function buildE(section) {
  rows = [];
  blocks = {};
  posts = [];
  colours = [];
  section.replaceChildren();
  section.appendChild(el('h2', null, 'E · routes — which music feature drives which field, by hand'));
  section.appendChild(el('p', 'hnote', 'With nothing set here this page is a no-op: every scene reads the engine\'s own state, and every reference frame is '
    + 'unchanged. A route keeps the field\'s kind — a level stays 0..1 after the gain, offset and smoothing, an event stays a flag fed only by another '
    + 'event — and a constant source is simply a manual setting. Only the fields a scene declares it reads can be routed.'));
  const top = el('p', 'hnote pbar');
  top.appendChild(btn(ID('resetall'), 'reset everything', () => { clearRoutes(); resetManual(); syncAll(); save(); }));
  section.appendChild(top);
  holder = el('div');
  holder.id = ID('blocks');
  for (const sc of SCENES) holder.appendChild(blocks[sc.name] = block(sc));
  section.appendChild(holder);
  buildManual(section);
  buildPresets(section);
  syncAll();
  setStore(TEST ? 'under #test it is neither read nor written, so the harness shots stay deterministic'
    : 'read once at boot, written on every change made in this panel');
}

export function markE() {                                          // the scene on screen: marked, and first in the list
  const E = REG[SC.logical], name = E && E.scene.name;
  for (const n in blocks) blocks[n].classList.toggle('cur', n === name);
  if (holder && name && blocks[name] && holder.firstChild !== blocks[name]) holder.insertBefore(blocks[name], holder.firstChild);
}

export function refreshE(frameN, hot) {                            // meters and read-only readouts only — never a rebuild
  for (const R of rows) {
    const s = (ROUTES[R.sc.name] || {})[R.f] || null;
    const a = s ? (s.src === CONST ? s.c : MS[s.src]) : MS[R.f], b = view(R.sc)[R.f];
    if (R.ev) { // an event lasts one frame and this runs every 6th: help.js's per-frame latch says when each last fired (a routed event *is* its source's)
      const lit = (k) => hot && hot[k] !== undefined && frameN - hot[k] < 30;
      R.m1.v.textContent = '●';
      R.m2.v.textContent = '●';
      R.m1.v.classList.toggle('lit', lit(s ? s.src : R.f));
      R.m2.v.classList.toggle('lit', lit(s ? s.src : R.f));
      continue;
    }
    R.m1.v.textContent = nums(a);
    R.m2.v.textContent = nums(b);
    if (R.m1.fill) R.m1.fill.style.transform = 'scaleX(' + clamp01(a).toFixed(3) + ')';
    if (R.m2.fill) R.m2.fill.style.transform = 'scaleX(' + clamp01(b).toFixed(3) + ')';
  }
  syncManual();                                                    // the number keys move MANUAL.scene / .trans too
  syncPosts();                                                     // and &colour= / CARD.manual move the colour and post state
  syncJSON();
}

export function restore() {                                        // boot, outside #test: the stored preset, if it still parses
  if (TEST) return;
  let s = null;
  try { s = localStorage.getItem(KEY); } catch (e) { return; }
  if (!s) return;
  try { loadRoutes(s); } catch (e) { console.warn('panel: the stored preset no longer loads (' + e.message + ') — ignored'); }
}

export function closeE() {}                                        // v0.4.1: the core calls it when the view closes (a running preview ends here)

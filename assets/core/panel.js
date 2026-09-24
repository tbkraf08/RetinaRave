// Part E of the help view — the routes control panel (v0.4 item 3; v0.4.1 "the panel you can read": docs/workers/brief-panel-2.md).
// DOM only: no GL, no wall clock, no timer and no second requestAnimationFrame. The core calls exactly five things:
// buildE(section) once on the first open, markE() when the logical scene changes, refreshE(frameN, hot) on the help view's
// tick (every 6th frame while open), closeE() when the view closes (a running preview ends there) and restore() at boot
// outside #test. Nothing here runs while the view is closed; the cells themselves are built by the leaf core/panel-ui.js.
// Every word shown is data: the scene registry (names, ids, feats, help.feats, colour variants, post), the schema (FEATS)
// and route.js's sources() — no scene and no MS field is ever named as a literal (tools/check.js fails on one).
import { FEATS } from '../engine/feats.js';
import { MS } from '../engine/state.js';
import { SC, REG, SCENES, TRANSITIONS } from './scenes.js';
import { ROUTES, view, sources, setRoute, clearRoutes, routesJSON, loadRoutes, kindOf, pulse } from './route.js';
import { MANUAL, manual, clearPost, resetManual, POST_PARAMS } from './manual.js';
import { TEST } from './hash.js';
import { el, up, focused, nums, short, clamp01, ID, btn, mkSel, numIn, wrap, drivesCell, jackCell, transferCell, meterCell, startPreview, tickPreview, endPreviews, nPreviews } from './panel-ui.js';
import { buildP, refreshP, resetP, copyP, resetRows } from './panel-params.js';   // v0.5: the parameters table of each block

const KEY = 'ew.routes.v1';                 // the preset in localStorage (never touched under #test)
const EVENT = 'event', LEVEL = 'level', CONST = 'const';
const BID = /^the bid:/;                    // CONTRACTS §1.13: the line of a field its scene reads only in score()
const NOTE = 'bid only — moves nothing while the scene is forced; changes when the director picks it';
const FIRED = 30;                           // "fired" shows for half a second (a preview: panel-ui.js's PREV, 2 s of ticks)

let rows = [], blocks = {}, ons = {}, posts = [], colours = [], holder = null, ta = null, err = null, store = null, mSel = null, tSel = null;
let fLine = null, fTxt = null, fOn = null, fOff = null, lastF = 0;

const sceneName = (E) => up(E.scene.name) + (E.variant ? ' / ' + up(E.variant.name) : '');

// ---------------------------------------------------------------- one routable field of one scene
function rowFor(sc, k) {
  const kind = kindOf(k), R = { sc, f: k, kind, ev: kind === EVENT, tr: el('tr'), pv: null, fired: -1e9 };
  const id = (what) => ID(what, sc.name, k), own = sc.help && sc.help.feats && sc.help.feats[k], bid = BID.test(own || '');
  drivesCell(R.tr, own || FEATS[k].drives, own && !bid, bid && NOTE);   // what it moves on screen: first and wide
  jackCell(R.tr, k, kind);                                              // the jack it is plugged into
  const st = el('td');
  R.sel = mkSel(id('src'), [['', '— (engine)'], ...sources(k).map((s) => [s, s])], '', () => push(R));
  st.appendChild(R.sel);
  R.err = st.appendChild(el('div', 'herr'));
  R.tr.appendChild(st);
  if (R.ev) R.tr.appendChild(el('td', 'pctl'));                         // an event routes as a boolean: no transfer at all
  else transferCell(R.tr, R, id, () => push(R));
  const rt = el('td', 'pctl');
  rt.appendChild(btn(id('r'), 'reset', () => set(R, null)));
  previews(R, id, rt);
  R.msg = rt.appendChild(el('span', 'pprev-msg'));
  R.tr.appendChild(rt);
  [R.m1, R.m2] = meterCell(R.tr, R.ev, kind === LEVEL);
  R.ctl = R.ev ? [R.sel] : [R.sel, R.c, R.k, R.b, R.tau, R.inv];   // the preview protocol (panel-ui.js): what it greys out,
  R.get = () => (ROUTES[R.sc.name] || {})[R.f] || null;            // the spec in force before it, how to put one in force,
  R.set = (spec) => setRoute(R.sc.name, R.f, spec);
  R.done = () => { syncRow(R); syncJSON(); };                      // and the refresh once the user's own spec is back
  rows.push(R);
  return R.tr;
}

// What this row does at its extremes — the answer to "the dials seem to change nothing".
function previews(R, id, td) {
  if (R.ev) { td.appendChild(btn(id('fire'), 'fire', () => fire(R), 'pprev')); return; }
  const g = FEATS[R.f].range;
  for (const hi of [0, 1]) {
    const b = btn(id(hi ? 'p1' : 'p0'), String(hi), () => preview(R, hi), 'pprev');
    b.title = g ? 'a constant ' + short(g[hi]) + ' for 2 s' : hi ? 'twice the live value (raw field, no fixed range)' : '0';
    td.appendChild(b);
  }
}
const constFor = (R, hi) => {                                      // the extreme: the kind's range, or twice what is live
  const g = FEATS[R.f].range;
  return g ? +g[hi] : hi ? 2 * (+view(R.sc)[R.f] || 0) || 1 : 0;
};
const preview = (R, hi) => { const c = constFor(R, hi); startPreview(R, { src: CONST, c }, c, lastF); };   // 2 s of ticks
// A fire is one frame true on this scene's view — no route, no storage.
const fire = (R) => { try { pulse(R.sc.name, R.f); R.err.textContent = ''; R.fired = lastF; R.msg.textContent = 'fired'; } catch (e) { R.err.textContent = e.message; } };

const specOf = (R) => (R.sel.value === '' ? null : R.ev ? { src: R.sel.value }
  : { src: R.sel.value, c: +R.c.value, k: +R.k.value, b: +R.b.value, tau: +R.tau.value, inv: R.inv.checked });
const push = (R) => set(R, specOf(R));
function set(R, spec) {                                            // one row → the core; the controls then show what is in force
  try { setRoute(R.sc.name, R.f, spec); R.err.textContent = ''; } catch (e) { R.err.textContent = e.message; }
  syncRow(R);
  save();
}
function syncRow(R) {                                              // never trust the input: read ROUTES back
  if (R.pv) return;                                                // a row in preview is not fought over
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
  const box = el('div', 'hcast pblk'), h = el('h3', null, up(sc.name) + ' · id ' + sc.id);
  box.id = ID('blk', sc.name);
  ons[sc.name] = h.appendChild(el('span', 'pon'));
  ons[sc.name].id = ID('on', sc.name);
  box.appendChild(h);
  box.appendChild(el('p', 'hnote', 'each row is one input of this scene: the left column is what it moves on screen, '
    + 'the source is the music feature you plug into it'));
  const t = el('table', 'htab ptab'), hr = el('tr'), dead = [];
  for (const c of ['what it drives here', 'input', 'source', 'transfer', '', 'source → routed']) hr.appendChild(el('th', null, c));
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
    msg.textContent = 'copied ' + (n += copyP(sc, SCENES)) + ' route' + (n === 1 ? '' : 's') + ' to the other scenes';   // a parameter route travels to a scene declaring the same parameter
    syncAll();
    save();
  }));
  bar.appendChild(btn(ID('rst', sc.name), 'reset scene', () => { clearRoutes(sc.name); resetP(sc.name); msg.textContent = ''; syncAll(); save(); }));
  bar.appendChild(msg);
  box.appendChild(bar);
  buildP(sc, box, save);                                           // v0.5: the parameters table above the jacks, which fold
  return box;
}

// ---------------------------------------------------------------- which scene am I dialling (the director keeps switching)
function buildForce(section) {
  fLine = el('p', 'hnote');
  fLine.id = ID('force-line');
  fTxt = fLine.appendChild(el('span'));
  fOn = fLine.appendChild(btn(ID('force'), 'force', () => { manual('scene', SC.logical); syncManual(); syncForce(); save(); }));
  fOff = fLine.appendChild(btn(ID('release'), 'release', () => { manual('scene', -1); syncManual(); syncForce(); save(); }));
  section.appendChild(fLine);
}
function syncForce() {
  if (!fLine) return;
  const E = MANUAL.scene >= 0 ? REG[MANUAL.scene] : null;
  fTxt.textContent = E ? sceneName(E) + ' is forced — the director will not switch while you dial '
    : 'the director is choosing scenes — force this one while you dial ';
  fOn.style.display = E ? 'none' : '';
  fOff.style.display = E ? '' : 'none';
}

// ---------------------------------------------------------------- manual overrides (what the keys already do)
function pget(p, path) {                                           // one post param out of a post object, 'a' or 'a.b'
  if (typeof p === 'function' || !p) return typeof p === 'function' ? p : undefined;
  const i = path.indexOf('.'), a = i < 0 ? path : path.slice(0, i);
  return i < 0 ? p[a] : (p[a] || {})[path.slice(i + 1)];
}
const ownPost = (sc, path) => { const cv = sc.colour && sc.colour.variants[sc.colour.cur]; return pget((cv && cv.post) || sc.post, path); };
const ovPost = (sc, path) => pget(MANUAL.post[sc.name], path);     // the override in force, if any
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
  try { manual('post', P.sc.name, P.path, v); msg.textContent = ''; } catch (e) { msg.textContent = e.message; }
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
    '', () => { try { manual('scene', mSel.value === '' ? -1 : +mSel.value); msg.textContent = ''; } catch (e) { msg.textContent = e.message; } syncManual(); syncForce(); save(); });
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
    try { loadRoutes(ta.value); err.textContent = ''; syncAll(); save(); } catch (e) { err.textContent = e.message; }  // the core checks it all first
  }));
  bar.appendChild(btn(ID('copybtn'), 'copy', () => {
    try { if (navigator.clipboard) navigator.clipboard.writeText(ta.value).catch(() => ta.select()); else ta.select(); } catch (e) { ta.select(); }
  }));
  sec.appendChild(bar);
  err = sec.appendChild(el('p', 'herr'));
  err.id = ID('err');
  store = sec.appendChild(el('p', 'hnote'));
  store.id = ID('store');
}
// While a preview runs the textarea would show its constant as if it were the user's: skipped until the last one ends.
const syncJSON = () => { if (!nPreviews() && ta && !focused(ta)) { const j = routesJSON(); if (ta.value !== j) ta.value = j; } };
function setStore(what) { if (store) store.textContent = 'preset, saved in this browser · ' + what; } // the storage key itself is an implementation detail (v0.6)
function save() {
  syncJSON();
  if (TEST) { setStore('under #test it is neither read nor written, so the harness shots stay deterministic'); return; }
  try { localStorage.setItem(KEY, routesJSON()); setStore('saved (' + routesJSON().length + ' chars) — every change made here is stored and loaded again at boot'); } catch (e) { setStore('not available here (' + e.message + ') — nothing is stored'); }
}
function syncAll() {
  for (const R of rows) syncRow(R);
  syncManual();
  syncForce();
  syncPosts();
  syncJSON();
}

// ---------------------------------------------------------------- the five calls the core makes
export function buildE(section) {
  rows = []; blocks = {}; ons = {}; posts = []; colours = []; resetRows();
  section.replaceChildren();
  section.appendChild(el('h2', null, 'E · routes — which music feature drives which field, by hand'));
  section.appendChild(el('p', 'hnote', 'With nothing set here this page is a no-op: every scene reads the engine\'s own state, and every reference frame is '
    + 'unchanged. A route keeps the field\'s kind — a level stays 0..1 after the gain, offset and smoothing, an event stays a flag fed only by another '
    + 'event — and a constant source is simply a manual setting. Only the fields a scene declares it reads can be routed.'));
  buildForce(section);
  const top = el('p', 'hnote pbar');
  top.appendChild(btn(ID('resetall'), 'reset everything', () => { clearRoutes(); resetP(); resetManual(); syncAll(); save(); }));
  section.appendChild(top);
  holder = el('div');
  holder.id = ID('blocks');
  for (const sc of SCENES) holder.appendChild(blocks[sc.name] = block(sc));
  section.appendChild(holder);
  buildManual(section);
  buildPresets(section);
  markE();
  syncAll();
  setStore(TEST ? 'under #test it is neither read nor written, so the harness shots stay deterministic'
    : 'read once at boot, written on every change made in this panel');
}

export function markE() {                                          // the scene on screen: marked, said in words, first in the list
  const E = REG[SC.logical], name = E && E.scene.name;             // a variant on screen counts as its parent's block
  for (const n in blocks) blocks[n].classList.toggle('cur', n === name);
  for (const n in ons) ons[n].textContent = n === name ? ' · on screen' : ' · not on screen';
  if (holder && name && blocks[name] && holder.firstChild !== blocks[name]) holder.insertBefore(blocks[name], holder.firstChild);
  syncForce();
}

export function refreshE(frameN, hot) {                            // meters, previews and read-only readouts only — never a rebuild
  lastF = frameN;
  for (const R of rows) {
    if (R.pv) tickPreview(R, frameN);                              // 2 s counted on this tick, then the user's own spec is back
    else if (R.msg.textContent && frameN - R.fired >= FIRED) R.msg.textContent = '';
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
  refreshP(frameN, hot);                                           // v0.5: the parameters tables (meters, previews, the derived value)
  syncManual();                                                    // the number keys move MANUAL.scene / .trans too
  syncForce();                                                     // and with them the "which scene am I dialling" line
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

export function closeE() { endPreviews(); }   // v0.4.1: every running preview (a jack's, a parameter's) ends with the view

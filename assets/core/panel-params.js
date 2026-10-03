// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The parameters table of part E (v0.5, CONTRACTS §1.16) — the second level of the panel: part E's jacks re-wire the
// fields a scene *reads*, this table re-wires **what the eye sees** ("in FEIGEN, the filament sharpness is fed by the
// centroid"). One table per scene that declares `params`, above its jacks (which fold into a <details> once this table
// is there). DOM only: no GL, no wall clock, no timer, no second rAF, and nothing runs while the help view is closed.
// A leaf of the panel: it imports the parameter API, the schema and the DOM helpers — never panel.js, help.js,
// scenes.js or harness.js, so core stays an import DAG (the bundler cannot order a cycle); panel.js hands it the
// scene, the block, its save() and, for "copy to all scenes", the scene list. Every word shown is data — the scene's
// own `params` slot (name, eli5, range), paramDeps(), paramSources() and FEATS[src].kind: no scene and no MS field is
// ever a literal here (tools/check.js fails on one).
import { FEATS } from '../engine/feats.js';
import { PROUTES, setParam, clearParams, paramsOf, paramDeps, derived, paramSources, hasParams } from './params.js';
import { el, focused, nums, short, ID, btn, mkSel, drivesCell, jackCell, transferCell, meterCell,
  startPreview, tickPreview, endPreviews } from './panel-ui.js';

const CONST = 'const', EVENT = 'event', LIT = 30;                  // LIT: an event stays lit for half a second
const HEAD = 'what the eye sees on this scene, and what feeds it — the second level; the inputs behind these are below';
let rows = [], save = () => {}, lastF = 0;

// ---------------------------------------------------------------- one parameter of one scene
function prow(sc, p) {
  const d = sc.params[p], R = { sc, p, lo: +d.range[0], hi: +d.range[1], tr: el('tr'), pv: null };
  const id = (what) => ID('p' + what, sc.name, p), deps = paramDeps(sc, p);
  drivesCell(R.tr, d.eli5, true);                                  // what it moves: the eli5, first and wide
  jackCell(R.tr, p, '[' + short(R.lo) + ', ' + short(R.hi) + ']'); // the parameter itself, its range under it
  const st = el('td');
  R.sel = mkSel(id('src'), [['', 'derived: ' + (deps.join(', ') || 'constant')],
    ...paramSources().map((s) => [s, FEATS[s] ? s + ' · ' + FEATS[s].kind : s])], '', () => push(R));
  st.appendChild(R.sel);
  R.err = st.appendChild(el('div', 'herr'));
  R.tr.appendChild(st);
  transferCell(R.tr, R, id, () => push(R));                        // c (a constant, in the parameter's units) · k · b · τ · invert
  R.c.min = String(R.lo);
  R.c.max = String(R.hi);
  R.c.step = String(+((R.hi - R.lo) / 100).toPrecision(1));
  const rt = el('td', 'pctl');
  rt.appendChild(btn(id('rst'), 'reset', () => set(R, null)));
  for (const e of [0, 1]) {                                        // what this parameter looks like at its extremes
    const b = btn(id(e ? 'hi' : 'lo'), e ? 'hi' : 'lo', () => preview(R, e), 'pprev');
    b.title = 'a constant ' + short(e ? R.hi : R.lo) + ' for 2 s';
    rt.appendChild(b);
  }
  R.msg = rt.appendChild(el('span', 'pprev-msg'));
  R.tr.appendChild(rt);
  [R.m1, R.m2] = meterCell(R.tr, false, true);                     // derived → in force, both bars scaled to the range
  R.ctl = [R.sel, R.c, R.k, R.b, R.tau, R.inv];                    // the preview greys these out
  R.get = () => (PROUTES[sc.name] || {})[p] || null;
  R.set = (spec) => setParam(sc.name, p, spec);
  R.done = () => syncRow(R);
  rows.push(R);
  return R.tr;
}
const preview = (R, e) => startPreview(R, { src: CONST, c: e ? R.hi : R.lo }, e ? R.hi : R.lo, lastF);

// A constant is `c` in the parameter's own units and takes no transfer (§1.16); every other source takes k, b, invert.
const specOf = (R) => (R.sel.value === '' ? null : R.sel.value === CONST ? { src: CONST, c: +R.c.value, tau: +R.tau.value }
  : { src: R.sel.value, k: +R.k.value, b: +R.b.value, tau: +R.tau.value, inv: R.inv.checked });
const push = (R) => set(R, specOf(R));
function set(R, spec) {                                            // one row → the core; the controls then show what is in force
  try { setParam(R.sc.name, R.p, spec); R.err.textContent = ''; } catch (e) { R.err.textContent = e.message; }
  syncRow(R);
  save();
}
function syncRow(R) {                                              // never trust the input: read PROUTES back
  if (R.pv) return;                                                // a row in preview is not fought over
  const s = R.get(), isC = s ? s.src === CONST : false;
  if (!focused(R.sel)) R.sel.value = s ? s.src : '';
  for (const [i, v] of [[R.c, isC ? s.c : R.lo], [R.k, s ? s.k : 1], [R.b, s ? s.b : 0], [R.tau, s ? s.tau : 0]]) if (!focused(i)) i.value = short(v);
  R.inv.checked = !!(s && s.inv);
  const c = R.sel.value === CONST;
  R.cw.style.display = c ? '' : 'none';
  for (const i of [R.k, R.b, R.inv]) i.parentNode.style.display = c ? 'none' : '';
  R.tr.classList.toggle('prouted', !!s);
}

// ---------------------------------------------------------------- the table, and the fold the jacks go into
export function buildP(sc, box, saveFn) {
  save = saveFn;
  if (!hasParams(sc)) return;                                      // no parameters: the v0.4.1 block, untouched
  const jacks = box.querySelector('table'), kids = [...box.children], bar = kids[kids.length - 1];
  const det = el('details');                                       // closed at build: the parameters come first now
  det.id = ID('pdet', sc.name);
  det.appendChild(el('summary', null, 'the inputs behind these — ' + (jacks.rows.length - 1) + ' jacks'));
  det.append(...kids.slice(kids.indexOf(jacks) - 1, kids.length - 1));   // the sentence, the table, the "not routable" note
  const t = el('table', 'htab ptab pptab'), hr = el('tr');
  for (const h of ['what it moves', 'parameter', 'source', 'transfer', '', 'derived → in force']) hr.appendChild(el('th', null, h));
  t.appendChild(hr);
  for (const p in sc.params) t.appendChild(prow(sc, p));
  for (const R of rows) syncRow(R);                                // the controls say what is in force before the first tick
  box.insertBefore(el('p', 'hnote', HEAD), bar);
  box.insertBefore(t, bar);
  box.insertBefore(det, bar);
}

// ---------------------------------------------------------------- the tick (one call from panel.js, nothing while closed)
export function refreshP(frameN, hot) {
  lastF = frameN;
  for (const R of rows) {
    if (R.pv) tickPreview(R, frameN);
    const s = R.get(), V = paramsOf(R.sc), a = derived(R.sc, R.p), b = V ? V[R.p] : 0;
    R.m1.v.textContent = nums(a);                                  // what the music would do, live, routed or not
    R.m2.v.textContent = nums(b);                                  // what update() received last (the τ tail shows here)
    R.m1.fill.style.transform = 'scaleX(' + unit(R, a) + ')';
    R.m2.fill.style.transform = 'scaleX(' + unit(R, b) + ')';
    const ev = !!(s && FEATS[s.src] && FEATS[s.src].kind === EVENT);
    R.m1.v.classList.toggle('lit', ev && hot && hot[s.src] !== undefined && frameN - hot[s.src] < LIT);
  }
}
const unit = (R, v) => Math.min(1, Math.max(0, (v - R.lo) / (R.hi - R.lo))).toFixed(3);

// ---------------------------------------------------------------- what the block's own buttons reach
export function resetP(name) {                                     // "reset scene" (a name) · "reset everything" (none)
  clearParams(name);
  for (const R of rows) syncRow(R);
}
export function copyP(sc, all) {                                   // only a scene declaring a parameter of the same name
  const R = PROUTES[sc.name] || {};
  let n = 0;
  for (const o of all) {
    if (o === sc || !hasParams(o)) continue;
    for (const p in R) if (o.params[p]) { try { setParam(o.name, p, Object.assign({}, R[p])); n++; } catch (e) { void e; } }
  }
  for (const r of rows) syncRow(r);
  return n;
}
export function resetRows() { endPreviews(); rows = []; }          // buildE(): the panel is built once, but never twice over

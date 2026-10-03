// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// PARAMS (v0.5): per-scene *visual parameters* and the routes into them — "in FEIGEN, the filament sharpness is fed by the
// centroid". The second level of the routes panel: v0.4 re-wires the fields a scene reads (its jacks); this re-wires what
// the eye sees. A scene declares its parameters as a slot (CONTRACTS §1.16):
//
//   params: { sharp: { eli5: 'how sharp the filaments are', range: [0, 1], from: (S) => S.bass } }
//
// `from(S)` is the default derivation from the scene's MS view (a v0.4 field route still feeds it) — pure, reads only fields
// in `feats`, and *is* the documentation of what feeds the parameter (its reads are recorded once at registration with a
// Proxy; a read of an undeclared field throws there and in check.js). Every frame, before update(), the core fills the
// scene's value object (handed to update() as env.params) with exactly from(view) — identity by construction while no
// param route exists, so every reference md5 stays as scenes move their constants into params — or, for a routed
// parameter, PROUTES[scene][param] = { src | 'const', c, k, b, inv, tau }:
//   u = clamp01(k · x̃ + b) with x̃ = the source (a level as is, an event 1 on its frame else 0, raw / angle as is; inv = 1 − x̃
//   for a level or event, −x̃ otherwise) · value = ema(lo + (hi − lo) · u, tau) — the transfer works in the parameter's unit
//   interval, the range scales it; a constant is `c` in the parameter's own units (clamped to the range; tau allowed, no
//   k / b / inv). Sources: every level / raw / angle / event field of MS, or 'const' — a source need not be in the scene's
//   feats (it is the parameter that is the scene's, not the source). Leaf-ish: imports the schema, the state, the util and
//   route.js (view, BLOCKS, parseRoute) — scenes.js / loop.js / harness.js / panel.js import it without a cycle.
import { FEATS } from '../engine/feats.js';
import { MS } from '../engine/state.js';
import { ema, clamp } from '../math/util.js';
import { view, BLOCKS, parseRoute, serialiseRoute, kindOf } from './route.js';

export const PROUTES = {};                 // sceneName → { param → spec }
export const PROUTE = { n: 0 };            // param routes in force
const SCN = {};                            // sceneName → scene (registered by scenes.js through paramScene)
const VALS = {};                           // sceneName → the value object handed to update() as env.params (one per scene, refreshed in place)
const DEPS = {};                           // sceneName → { param → [fields from() read] } (recorded once at registration)
const Y = {};                              // sceneName → { param → ema state }
const DEF = { src: 'const', c: 0, k: 1, b: 0, inv: false, tau: 0 };
const SRC_KINDS = { level: 1, raw: 1, angle: 1, event: 1 };

export const paramSources = () => { const out = []; for (const f in FEATS) if (FEATS[f].kind in SRC_KINDS) out.push(f); out.push('const'); return out; };
export const hasParams = (scene) => !!(scene.params && Object.keys(scene.params).length);
const need = (name) => { const sc = SCN[name]; if (!sc) throw new Error('param: no scene named ' + name); return sc; };
const needP = (sc, p) => { const d = sc.params && sc.params[p]; if (!d) throw new Error('param: ' + sc.name + ' declares no parameter ' + p); return d; };

// Validate a scene's declaration (registration and check.js): every entry has a one-line eli5, a finite range [lo, hi] with
// lo < hi, and a `from` function whose reads are all fields the scene lists in feats (recorded through a Proxy of MS —
// the receiver's own values, so nested reads such as S.seed.a work). Returns { param → [fields read] }. Throws on a lie.
export function checkParams(scene) {
  const P = scene.params || {}, feats = scene.feats || [], deps = {};
  for (const p in P) {
    const d = P[p];
    if (!/^\w+$/.test(p)) throw new Error('param: ' + scene.name + '.' + p + ' is not an identifier');
    if (!(typeof d.eli5 === 'string' && d.eli5.trim())) throw new Error('param: ' + scene.name + '.' + p + ' has no eli5');
    if (!(Array.isArray(d.range) && d.range.length === 2 && d.range.every((x) => typeof x === 'number' && isFinite(x)) && d.range[0] < d.range[1])) throw new Error('param: ' + scene.name + '.' + p + ' range must be [lo, hi] with lo < hi');
    if (typeof d.from !== 'function') throw new Error('param: ' + scene.name + '.' + p + ' has no from(S)');
    const read = [];
    const probe = new Proxy(MS, { get(t, k) {
      if (typeof k === 'string' && !(k in FEATS)) throw new Error('param: ' + scene.name + '.' + p + ' from() reads ' + k + ', which is not an MS field');
      if (typeof k === 'string' && !feats.includes(k)) throw new Error('param: ' + scene.name + '.' + p + ' from() reads ' + k + ', which is not in feats');
      if (typeof k === 'string' && !read.includes(k)) read.push(k);
      return t[k];
    } });
    const v = d.from(probe);
    if (typeof v !== 'number' || !isFinite(v)) throw new Error('param: ' + scene.name + '.' + p + ' from() did not return a finite number');
    deps[p] = read;
  }
  return deps;
}

export function paramScene(scene) {          // scenes.js register(): validate once, record the reads, make the value object
  SCN[scene.name] = scene;
  DEPS[scene.name] = checkParams(scene);
  if (!hasParams(scene)) return; // no params: update() gets env.params null, paramsOf() null
  const V = {};
  for (const p in scene.params) V[p] = 0;
  VALS[scene.name] = V;
}
export const paramDeps = (scene, p) => (DEPS[scene.name] || {})[p] || [];
export const paramsOf = (scene) => VALS[scene.name] || null;   // the live values (what update() received last)

// Validate one param route without touching anything; returns the normalised spec (null clears).
export function checkParam(scene, p, spec) {
  const sc = typeof scene === 'string' ? need(scene) : scene;
  needP(sc, p);
  if (spec == null) return null;
  const s = Object.assign({}, DEF, spec);
  if (s.src !== 'const' && !(kindOf(s.src) in SRC_KINDS)) throw new Error('param: ' + s.src + ' (' + (kindOf(s.src) || 'unknown') + ') cannot feed a parameter');
  for (const k of ['c', 'k', 'b', 'tau']) if (typeof s[k] !== 'number' || !isFinite(s[k])) throw new Error('param: ' + k + ' must be a finite number');
  if (s.tau < 0) throw new Error('param: tau must be >= 0');
  s.inv = !!s.inv;
  if (s.src === 'const' && (s.k !== 1 || s.b !== 0 || s.inv)) throw new Error('param: a constant takes no transfer (its value is c, in the parameter\'s units)');
  return s;
}
export function setParam(scene, p, spec) {
  const name = typeof scene === 'string' ? scene : scene.name;
  spec = checkParam(scene, p, spec);
  const R = PROUTES[name] || (PROUTES[name] = {});
  if (spec) R[p] = spec;
  else { delete R[p]; if (Y[name]) delete Y[name][p]; }
  if (!Object.keys(R).length) { delete PROUTES[name]; delete Y[name]; }
  count();
  return spec;
}
export function clearParams(scene) {
  if (scene === undefined) { for (const n in PROUTES) clearParams(n); return; }
  const name = typeof scene === 'string' ? scene : scene.name;
  delete PROUTES[name]; delete Y[name];
  count();
}
function count() { PROUTE.n = 0; for (const n in PROUTES) PROUTE.n += Object.keys(PROUTES[n]).length; }

// One value through a spec (the transfer in the unit interval, the range scales it, the ema on dt; the first frame snaps).
function routed(name, p, d, s, dt) {
  const [lo, hi] = d.range;
  let x;
  if (s.src === 'const') x = clamp(s.c, lo, hi);
  else {
    const kind = FEATS[s.src].kind;
    let u = kind === 'event' ? (MS[s.src] ? 1 : 0) : MS[s.src];
    if (s.inv) u = kind === 'level' || kind === 'event' ? 1 - u : -u;
    u = clamp(s.k * u + s.b, 0, 1);
    x = lo + (hi - lo) * u;
  }
  if (s.tau > 0) {
    const y = (Y[name] || (Y[name] = {}))[p];
    x = y === undefined ? x : ema(y, x, dt, s.tau);
    Y[name][p] = x;
  }
  return x;
}
// The transfer's unit-interval input for the meter (what the panel shows between source and value): NaN for a constant.
export function paramU(s) {
  if (s.src === 'const') return NaN;
  const kind = FEATS[s.src].kind;
  let u = kind === 'event' ? (MS[s.src] ? 1 : 0) : MS[s.src];
  if (s.inv) u = kind === 'level' || kind === 'event' ? 1 - u : -u;
  return clamp(s.k * u + s.b, 0, 1);
}

// Before a scene's update(): its value object refreshed in place — exactly from(view) unless the parameter is routed.
export function refreshParams(scene, dt) {
  const V = VALS[scene.name];
  if (!V) return null;
  const P = scene.params, R = PROUTES[scene.name], S = view(scene);
  for (const p in P) V[p] = R && R[p] ? routed(scene.name, p, P[p], R[p], dt) : P[p].from(S);
  return V;
}
// The derived value alone (the panel's "derived" meter while a parameter is routed): from(view), never stored.
export const derived = (scene, p) => needP(scene, p).from(view(scene));

// Hash / preset grammar = route.js's: scene.param=src[*k][+b|-b][~tau][!] · scene.param=c:0.4[~tau] · several with ','
export function applyParams(str) {   // '&param=' value: all-or-nothing
  const rs = String(str).split(',').filter((x) => x.trim()).map((x) => parseRoute(x));
  for (const r of rs) checkParam(r.scene, r.field, r.spec);
  return rs.map((r) => setParam(r.scene, r.field, r.spec));
}
export function paramsString() {
  const out = [];
  for (const n in PROUTES) for (const p in PROUTES[n]) out.push(serialiseRoute(n, p, PROUTES[n][p]));
  return out.join(',');
}

// The preset block: { scene: { param: spec } } — replaces every param route (checked first, all-or-nothing).
BLOCKS.params = {
  get: () => { const o = {}; for (const n in PROUTES) { o[n] = {}; for (const p in PROUTES[n]) o[n][p] = Object.assign({}, PROUTES[n][p]); } return o; },
  set: (o) => {
    if (!o || typeof o !== 'object') return;
    for (const n in o) for (const p in o[n]) checkParam(n, p, o[n][p]);
    clearParams();
    for (const n in o) for (const p in o[n]) setParam(n, p, o[n][p]);
  },
};

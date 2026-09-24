// ROUTES (v0.4): per-scene, per-field routing of the music state — "in FEIGEN, `bass` is fed by `centroid`". The core hands
// each scene a *view* of MS: the same MS object while the scene has no routes (identity by construction, zero cost), or a
// per-scene object created once with Object.create(MS) whose routed fields are own properties refreshed every frame
// before update() (unrouted fields fall through the prototype). Scenes are not touched; the director, the transitions
// and the effects keep the real MS. No wall clock: the smoothing is an ema on dt. Leaf module: imports only the schema
// and the state, so scenes.js / loop.js / harness.js import it without a cycle (the bundler cannot order one).
//
// ROUTES[sceneName][field] = { src: '<MS field>' | 'const', c, k, b, inv, tau }   (defaults: c 0, k 1, b 0, inv false, tau 0)
//   routed = ema(clampKind(k · (inv ? flip(x) : x) + b), tau)  with x = MS[src] (or c); flip = 1 − x for a level, −x for
//   raw / angle; a level is clamped to 0..1 after the transfer (the kind's promise holds through a route).
//   Kinds (FEATS[k].kind): level / raw / angle route from a field of the same kind or a constant; an event only from
//   another event, no transfer; count / enum / vector / internal are not routable. A route names a field the scene
//   declares in `feats` (a route to a field nobody reads is a lie), so an unknown scene, field, source or kind mismatch
//   throws — a typo must not pass silently (&route= under #test, CARD.route, loadRoutes).
import { FEATS } from '../engine/feats.js';
import { MS } from '../engine/state.js';
import { ema, clamp } from '../math/util.js';

export const ROUTES = {};                 // sceneName → { field → spec }
export const ROUTE = { n: 0, ms: 0 };      // n routes in force · ms: an ema of refreshRoutes' cost while any exist (0 = none)
export const BLOCKS = {};                  // extra blocks of the preset JSON: BLOCKS.<key> = { get() → obj, set(obj) } (manual.js)
const SCN = {};                            // sceneName → scene object (registered by scenes.js)
const VIEWS = {};                          // sceneName → the routed view (present only while the scene has routes)
const Y = {};                              // sceneName → { field → smoothed value } (ema state)
const DEF = { src: 'const', c: 0, k: 1, b: 0, inv: false, tau: 0 };
const TRANSFER = { level: 1, raw: 1, angle: 1 };   // kinds that take a constant and the transfer; 'event' routes only from an event

export const routable = (k) => k in TRANSFER || k === 'event';
export const kindOf = (f) => (FEATS[f] ? FEATS[f].kind : null);
// The sources a field may be fed from: every field of its kind (itself included — an identity route), 'const' for the transfer kinds.
export function sources(field) {
  const kind = kindOf(field), out = [];
  if (!routable(kind)) return out;
  for (const f in FEATS) if (FEATS[f].kind === kind) out.push(f);
  if (kind in TRANSFER) out.push('const');
  return out;
}

export function routeScene(scene) { SCN[scene.name] = scene; }
export const sceneOf = (name) => SCN[name] || null;
const need = (name) => { const sc = SCN[name]; if (!sc) throw new Error('route: no scene named ' + name); return sc; };

// The MS a scene reads this frame: MS itself unless the scene has routes.
export const view = (scene) => VIEWS[scene.name] || MS;
export const isRouted = (scene) => scene.name in VIEWS;

// Validate one route without touching anything; returns the normalised spec (null clears).
export function checkRoute(scene, field, spec) {
  const sc = typeof scene === 'string' ? need(scene) : scene, name = sc.name;
  if (spec == null) return null;
  const kind = kindOf(field);
  if (!kind) throw new Error('route: ' + field + ' is not an MS field');
  if (!routable(kind)) throw new Error('route: ' + field + ' is a ' + kind + ' — not routable');
  if (!(sc.feats || []).includes(field)) throw new Error('route: ' + name + ' does not read ' + field);
  const s = Object.assign({}, DEF, spec);
  if (s.src === 'const') { if (!(kind in TRANSFER)) throw new Error('route: ' + field + ' is an event — no constant'); }
  else if (kindOf(s.src) !== kind) throw new Error('route: ' + s.src + ' (' + (kindOf(s.src) || 'unknown') + ') cannot feed ' + field + ' (' + kind + ')');
  for (const k of ['c', 'k', 'b', 'tau']) if (typeof s[k] !== 'number' || !isFinite(s[k])) throw new Error('route: ' + k + ' must be a finite number');
  if (s.tau < 0) throw new Error('route: tau must be >= 0');
  s.inv = !!s.inv;
  if (kind === 'event' && (s.k !== 1 || s.b !== 0 || s.inv || s.tau !== 0)) throw new Error('route: an event route takes no transfer');
  return s;
}

// Set (spec) or clear (null) one route. Returns the normalised spec, or null when cleared.
export function setRoute(scene, field, spec) {
  const name = typeof scene === 'string' ? scene : scene.name;
  spec = checkRoute(scene, field, spec);
  const R = ROUTES[name] || (ROUTES[name] = {});
  if (spec) R[field] = spec;
  else { delete R[field]; if (Y[name]) delete Y[name][field]; }
  rebuild(name);
  return spec;
}

export function clearRoutes(scene) {
  if (scene === undefined) { for (const n in ROUTES) clearRoutes(n); return; }
  const name = typeof scene === 'string' ? scene : scene.name;
  delete ROUTES[name]; delete Y[name];
  rebuild(name);
}

// The view exists exactly while the scene has routes; its own properties are exactly the routed fields.
function rebuild(name) {
  const R = ROUTES[name], fields = R ? Object.keys(R) : [];
  if (!fields.length) { delete ROUTES[name]; delete VIEWS[name]; }
  else {
    let V = VIEWS[name];
    if (!V) V = VIEWS[name] = Object.create(MS);
    if (!Y[name]) Y[name] = {};
    for (const k of Object.keys(V)) if (!R[k]) delete V[k];
    for (const k of fields) V[k] = routed(name, k, R[k], 0);   // in force at once (dt 0: a fresh route snaps, a kept one holds)
  }
  ROUTE.n = 0;
  for (const n in ROUTES) ROUTE.n += Object.keys(ROUTES[n]).length;
}

// One value through a spec: transfer, kind clamp, smoothing (the state is per scene.field; the first frame snaps).
function routed(name, field, spec, dt) {
  const kind = FEATS[field].kind;
  if (kind === 'event') return !!MS[spec.src];
  let x = spec.src === 'const' ? spec.c : MS[spec.src];
  if (spec.inv) x = kind === 'level' ? 1 - x : -x;
  x = spec.k * x + spec.b;
  if (kind === 'level') x = clamp(x, 0, 1);
  if (spec.tau > 0) {
    const y = Y[name][field];
    x = y === undefined ? x : ema(y, x, dt, spec.tau);
  }
  Y[name][field] = x;
  return x;
}

// Every frame, after the engine wrote MS and before any scene's update(): refresh every routed view's own fields.
export function refreshRoutes(dt) {
  if (!ROUTE.n) return;
  const t0 = performance.now();
  for (const name in VIEWS) {
    const V = VIEWS[name], R = ROUTES[name];
    for (const f in R) V[f] = routed(name, f, R[f], dt);
  }
  ROUTE.ms = ema(ROUTE.ms, performance.now() - t0, dt, 1);
}

// Hash / preset grammar, one route: scene.field=src[*k][+b|-b][~tau][!]  ·  a constant: scene.field=c:0.4[*k]…  ·  several: a,b,c
// (a `+` reaches us as a space through URLSearchParams; the parser reads both). Unknown names throw (setRoute).
const ONE = /^(\w+)\.(\w+)=(?:c:(-?[\d.]+(?:e-?\d+)?)|(\w+))(?:\*(-?[\d.]+(?:e-?\d+)?))?(?:([+\- ])([\d.]+(?:e-?\d+)?))?(?:~([\d.]+(?:e-?\d+)?))?(!?)$/;
export function parseRoute(str) {
  const m = ONE.exec(str.trim());
  if (!m) throw new Error('route: cannot parse "' + str + '" (scene.field=src[*k][+b][~tau][!] or scene.field=c:0.4)');
  const spec = { src: m[4] || 'const', c: m[3] !== undefined ? +m[3] : 0, k: m[5] !== undefined ? +m[5] : 1, b: m[7] !== undefined ? (m[6] === '-' ? -m[7] : +m[7]) : 0, tau: m[8] !== undefined ? +m[8] : 0, inv: m[9] === '!' };
  return { scene: m[1], field: m[2], spec };
}
export function serialiseRoute(scene, field, s) {
  const num = (x) => String(+(+x).toPrecision(6));
  return scene + '.' + field + '=' + (s.src === 'const' ? 'c:' + num(s.c) : s.src) + (s.k !== 1 ? '*' + num(s.k) : '') + (s.b ? (s.b > 0 ? '+' : '-') + num(Math.abs(s.b)) : '') + (s.tau ? '~' + num(s.tau) : '') + (s.inv ? '!' : '');
}
export function applyRoutes(str) {  // '&route=' value: all-or-nothing — every route is checked before any is set
  const rs = String(str).split(',').filter((p) => p.trim()).map((p) => parseRoute(p));
  for (const r of rs) checkRoute(r.scene, r.field, r.spec);
  return rs.map((r) => setRoute(r.scene, r.field, r.spec));
}
export function routesString() {
  const out = [];
  for (const n in ROUTES) for (const f in ROUTES[n]) out.push(serialiseRoute(n, f, ROUTES[n][f]));
  return out.join(',');
}

// The preset: { routes: ROUTES, <block>: … } as a JSON string; loadRoutes replaces everything (all-or-nothing: checked
// first, then the routes cleared and set, so a preset without a scene clears it). Extra blocks come from BLOCKS (manual.js).
export function routesJSON() {
  const o = { routes: {} };
  for (const n in ROUTES) o.routes[n] = Object.assign({}, ...Object.keys(ROUTES[n]).map((f) => ({ [f]: Object.assign({}, ROUTES[n][f]) })));
  for (const k in BLOCKS) o[k] = BLOCKS[k].get();
  return JSON.stringify(o);
}
export function loadRoutes(json) {
  const o = typeof json === 'string' ? JSON.parse(json) : json || {};
  const R = o.routes || {};
  for (const n in R) for (const f in R[n]) checkRoute(n, f, R[n][f]);
  clearRoutes();
  for (const n in R) for (const f in R[n]) setRoute(n, f, R[n][f]);
  for (const k in BLOCKS) if (o[k] !== undefined) BLOCKS[k].set(o[k]);
  return ROUTE.n;
}

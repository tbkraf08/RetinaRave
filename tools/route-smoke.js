// Route smoke (v0.4, node, no DOM): the grammar round-trips, the kind rules hold, the ema is the util's, a view falls
// through to MS for unrouted fields and is MS itself without routes, unknown names throw. usage: node tools/route-smoke.js
import { MS } from '../assets/engine/state.js';
import { FEATS } from '../assets/engine/feats.js';
import { ema } from '../assets/math/util.js';
import { ROUTES, ROUTE, routeScene, view, setRoute, clearRoutes, refreshRoutes, parseRoute, serialiseRoute, applyRoutes, routesString, routesJSON, loadRoutes, sources, routable, BLOCKS, pulse } from '../assets/core/route.js';

let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log('FAIL', m); } };
const throws = (fn, re, m) => { let e = null; try { fn(); } catch (x) { e = x; } ok(e && re.test(e.message), m + ' should throw ' + re + (e ? ' — got: ' + e.message : ' — did not throw')); };

const A = { name: 'alpha', feats: ['bass', 'high', 'onset', 'beat', 'flow', 'harmAngle', 'chroma', 'arc', 'beatCount'] };
const B = { name: 'beta', feats: ['bass', 'kick'] };
routeScene(A); routeScene(B);

// identity without routes
ok(view(A) === MS && view(B) === MS, 'view === MS without routes');
ok(ROUTE.n === 0, 'ROUTE.n 0');

// grammar round-trip
const cases = ['alpha.bass=centroid*1.5+0.1~0.2!', 'alpha.bass=c:0.4', 'alpha.high=high', 'alpha.flow=flowBass*2-1.5', 'alpha.onset=kick', 'alpha.bass=lvl~0.35', 'alpha.bass=c:0.25*2+0.5!'];
for (const c of cases) {
  let r; try { r = parseRoute(c); } catch (e) { ok(false, c + ' parse: ' + e.message); continue; }
  if (c === 'alpha.onset=kick') { ok(r.spec.src === 'kick', c); continue; } // (a kind error, caught below)
  const back = serialiseRoute(r.scene, r.field, r.spec);
  ok(back === c, 'round-trip ' + c + ' → ' + back);
}
ok(parseRoute('alpha.bass=centroid 0.1').spec.b === 0.1, "a space reads as '+' (URLSearchParams)");
ok(parseRoute('alpha.bass=centroid*1.5+0.1~0.2!').spec.inv === true && parseRoute('alpha.bass=centroid*1.5+0.1~0.2!').spec.tau === 0.2, 'parse fields');
throws(() => parseRoute('alpha.bass'), /cannot parse/, 'no source');
throws(() => parseRoute('alpha.bass=centroid^2'), /cannot parse/, 'bad transfer');

// kind rules
throws(() => setRoute('gamma', 'bass', { src: 'high' }), /no scene named gamma/, 'unknown scene');
throws(() => setRoute('alpha', 'nope', { src: 'high' }), /not an MS field/, 'unknown field');
throws(() => setRoute('alpha', 'bass', { src: 'nope' }), /cannot feed/, 'unknown source');
throws(() => setRoute('alpha', 'bass', { src: 'flow' }), /cannot feed/, 'raw → level');
throws(() => setRoute('alpha', 'onset', { src: 'kick' }), /cannot feed/, 'level → event');
throws(() => setRoute('alpha', 'onset', { src: 'const', c: 1 }), /no constant/, 'const → event');
throws(() => setRoute('alpha', 'onset', { src: 'beat', k: 2 }), /no transfer/, 'event transfer');
throws(() => setRoute('alpha', 'chroma', { src: 'bchroma' }), /not routable/, 'vector');
throws(() => setRoute('alpha', 'arc', { src: 'arc' }), /not routable/, 'enum');
throws(() => setRoute('alpha', 'beatCount', { src: 'kickCount' }), /not routable/, 'count');
throws(() => setRoute('alpha', 'kick', { src: 'bass' }), /does not read/, 'a field the scene does not read');
throws(() => setRoute('alpha', 'bass', { src: 'high', tau: -1 }), /tau/, 'negative tau');
throws(() => setRoute('alpha', 'bass', { src: 'high', k: 'x' }), /finite/, 'non-number gain');
ok(sources('bass').includes('centroid') && sources('bass').includes('const') && !sources('bass').includes('flow'), 'sources(level) = levels + const');
ok(sources('onset').includes('beat') && !sources('onset').includes('const'), 'sources(event) = events, no const');
ok(sources('chroma').length === 0 && sources('arc').length === 0, 'no sources for vector/enum');
ok(routable('level') && routable('raw') && routable('angle') && routable('event') && !routable('count') && !routable('vector') && !routable('enum') && !routable('internal'), 'routable kinds');
ok(Object.keys(FEATS).filter((k) => routable(FEATS[k].kind)).length > 60, 'most of the schema is routable');

// the view: own properties are the routed fields, everything else falls through; the transfer and the clamp
MS.bass = 0.3; MS.high = 0.8; MS.centroid = 0.5; MS.flow = 10; MS.flowBass = 4; MS.onset = false; MS.beat = true; MS.kick = 0.9;
setRoute('alpha', 'bass', { src: 'centroid', k: 1.5, b: 0.1 });
const V = view(A);
ok(V !== MS && Object.getPrototypeOf(V) === MS, 'a routed view is Object.create(MS)');
ok(Object.keys(V).join() === 'bass', 'own keys = the routed fields');
ok(Math.abs(V.bass - 0.85) < 1e-12, 'bass = 1.5·0.5 + 0.1 at once (rebuild)');
ok(V.high === 0.8 && V.flow === 10 && V.chroma === MS.chroma, 'unrouted fields fall through');
MS.high = 0.1; ok(V.high === 0.1, 'fall-through is live');
ok(view(B) === MS, 'the other scene keeps MS');
setRoute('alpha', 'bass', { src: 'centroid', k: 4 }); refreshRoutes(1 / 60);
ok(V.bass === 1, 'a level is clamped to 1');
setRoute('alpha', 'bass', { src: 'centroid', inv: true }); refreshRoutes(1 / 60);
ok(Math.abs(V.bass - 0.5) < 1e-12 && (MS.centroid = 0.2, refreshRoutes(1 / 60), Math.abs(V.bass - 0.8) < 1e-12), 'inv = 1 − x on a level');
setRoute('alpha', 'flow', { src: 'flowBass', inv: true, k: 2, b: 1 }); refreshRoutes(1 / 60);
ok(V.flow === -7, 'raw: inv = −x, then k·x + b (2·−4 + 1), no clamp');
setRoute('alpha', 'harmAngle', { src: 'harmAngle', inv: true }); MS.harmAngle = 0.7; refreshRoutes(1 / 60);
ok(Math.abs(V.harmAngle + 0.7) < 1e-12, 'angle: inv = −x');
setRoute('alpha', 'onset', { src: 'beat' }); refreshRoutes(1 / 60);
ok(V.onset === true && MS.onset === false, 'an event routes as a boolean');
MS.beat = false; refreshRoutes(1 / 60); ok(V.onset === false, 'event follows its source');
setRoute('alpha', 'bass', { src: 'const', c: 0.4 }); refreshRoutes(1 / 60);
ok(V.bass === 0.4, 'a constant');
ok(ROUTE.n === 4, 'ROUTE.n counts routes (' + ROUTE.n + ')');

// the ema: y += (x − y)(1 − e^{−dt/τ}) on dt, first frame snaps
MS.centroid = 1; setRoute('alpha', 'high', { src: 'centroid', tau: 0.5 });
ok(V.high === 1, 'first frame snaps');
MS.centroid = 0;
let y = 1;
for (let i = 0; i < 30; i++) { refreshRoutes(1 / 60); y = ema(y, 0, 1 / 60, 0.5); }
ok(Math.abs(V.high - y) < 1e-12 && Math.abs(y - Math.exp(-0.5 / 0.5)) < 1e-9, 'ema over 30 frames = e^{−1} (' + V.high.toFixed(6) + ')');
refreshRoutes(0); ok(V.high === y, 'dt 0 holds');

// clear: per route, per scene, global — identity comes back
setRoute('alpha', 'high', null); ok(!('high' in ROUTES.alpha) && V.high === MS.high, 'clear one route');
setRoute('beta', 'bass', { src: 'high' }); ok(view(B) !== MS, 'beta routed');
clearRoutes('alpha'); ok(view(A) === MS && ROUTES.alpha === undefined, 'clear a scene → identity');
clearRoutes(); ok(view(B) === MS && ROUTE.n === 0 && Object.keys(ROUTES).length === 0, 'global clear');

// the &route= string and the JSON preset
applyRoutes('alpha.bass=centroid*1.5+0.1~0.2!,beta.bass=c:0.4,alpha.onset=beat');
ok(ROUTE.n === 3 && ROUTES.alpha.bass.tau === 0.2 && ROUTES.beta.bass.c === 0.4, 'applyRoutes');
const str = routesString();
ok(str === 'alpha.bass=centroid*1.5+0.1~0.2!,alpha.onset=beat,beta.bass=c:0.4', 'routesString ' + str);
throws(() => applyRoutes('alpha.bass=high,alpha.bass=flow'), /cannot feed/, 'a bad route in a list throws');
ok(ROUTES.alpha.bass.src === 'centroid' && ROUTE.n === 3, 'and nothing of the list was applied');
BLOCKS.extra = { get: () => ({ x: 1 }), set: (o) => { BLOCKS.extra.got = o; } };
const j = routesJSON(), o = JSON.parse(j);
ok(o.routes.alpha.bass.k === 1.5 && o.routes.beta.bass.src === 'const' && o.extra.x === 1, 'routesJSON carries routes + blocks');
clearRoutes();
ok(loadRoutes(j) === 3 && routesString() === str && BLOCKS.extra.got.x === 1, 'loadRoutes round-trips and dispatches blocks');
throws(() => loadRoutes('{"routes":{"alpha":{"bass":{"src":"flow"}}}}'), /cannot feed/, 'a bad preset throws');
ok(ROUTE.n === 3 && routesString() === str, 'and the routes in force stayed');
clearRoutes();

// v0.4.1 pulse: one event field true on the scene's view for exactly the next frame, never a route, never stored
ok(view(A) === MS, 'pulse: unrouted before');
pulse(A, 'onset');
ok(view(A) === MS, 'pulse: nothing until the next refresh');
refreshRoutes(0.016);
ok(view(A) !== MS && view(A).onset === true && view(A).bass === MS.bass && ROUTE.n === 0, 'pulse: the view for one frame, the event true, everything else falls through, no route counted');
refreshRoutes(0.016);
ok(view(A) === MS, 'pulse: MS itself again on the frame after');
setRoute(A, 'bass', { src: 'const', c: 0.5 }); pulse('alpha', 'onset'); refreshRoutes(0.016);
ok(view(A).onset === true && view(A).bass === 0.5, 'pulse on a routed scene rides its view');
refreshRoutes(0.016);
ok(!Object.prototype.hasOwnProperty.call(view(A), 'onset') && view(A).bass === 0.5 && ROUTE.n === 1, 'and leaves the routes alone');
throws(() => pulse(A, 'bass'), /not an event/, 'pulse of a level throws');
throws(() => pulse(A, 'dropEvt'), /does not read/, 'pulse of an unlisted event throws');
clearRoutes();

console.log(`route smoke: ${n} checks · ${fails} fail`);
process.exit(fails ? 1 : 0);

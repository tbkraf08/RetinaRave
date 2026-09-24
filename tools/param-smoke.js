// Params smoke (v0.5, node, no DOM): the declaration checks (eli5 / range / from reads ⊂ feats), identity (values = from(view)
// exactly while unrouted, a v0.4 field route still feeds from()), the transfer in the unit interval scaled by the range,
// events and constants as sources, the ema on dt, the grammar (route.js's) and the preset block, unknown names throw.
// usage: node tools/param-smoke.js
import { MS } from '../assets/engine/state.js';
import { ema } from '../assets/math/util.js';
import { routeScene, setRoute, clearRoutes, refreshRoutes, routesJSON, loadRoutes, BLOCKS } from '../assets/core/route.js';
import { PROUTES, PROUTE, checkParams, paramScene, paramDeps, paramsOf, checkParam, setParam, clearParams, refreshParams, derived, applyParams, paramsString, paramSources, paramU } from '../assets/core/params.js';

let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log('FAIL', m); } };
const throws = (fn, re, m) => { let e = null; try { fn(); } catch (x) { e = x; } ok(e && re.test(e.message), m + ' should throw ' + re + (e ? ' — got: ' + e.message : ' — did not throw')); };

const A = { name: 'alpha', feats: ['bass', 'high', 'tension', 'onset', 'seed'], params: {
  sharp: { eli5: 'how sharp the filaments are', range: [0, 1], from: (S) => S.bass },
  width: { eli5: 'how wide the view is', range: [0.5, 4], from: (S) => 3.2 * (1 + 0.25 * S.tension - 0.1 * S.high) },
  fixed: { eli5: 'a constant knob', range: [0, 10], from: () => 2.5 },
  nest: { eli5: 'reads a nested field', range: [0, 1], from: (S) => (S.seed.a || 0) * 0 + 0.3 },
} };
const B = { name: 'beta', feats: ['bass'] }; // no params
routeScene(A); routeScene(B); paramScene(A); paramScene(B);

// declaration checks
ok(paramDeps(A, 'sharp').join() === 'bass' && paramDeps(A, 'width').join() === 'tension,high' && paramDeps(A, 'fixed').length === 0 && paramDeps(A, 'nest').join() === 'seed', 'deps recorded: ' + JSON.stringify([paramDeps(A, 'sharp'), paramDeps(A, 'width'), paramDeps(A, 'fixed'), paramDeps(A, 'nest')]));
throws(() => checkParams({ name: 'x', feats: ['bass'], params: { p: { eli5: 'a', range: [0, 1], from: (S) => S.mid } } }), /not in feats/, 'from reads an undeclared field');
throws(() => checkParams({ name: 'x', feats: ['bass'], params: { p: { eli5: 'a', range: [0, 1], from: (S) => S.nope } } }), /not an MS field/, 'from reads a non-field');
throws(() => checkParams({ name: 'x', feats: [], params: { p: { range: [0, 1], from: () => 1 } } }), /no eli5/, 'no eli5');
throws(() => checkParams({ name: 'x', feats: [], params: { p: { eli5: 'a', range: [1, 1], from: () => 1 } } }), /lo < hi/, 'bad range');
throws(() => checkParams({ name: 'x', feats: [], params: { p: { eli5: 'a', range: [0, 1] } } }), /no from/, 'no from');
throws(() => checkParams({ name: 'x', feats: [], params: { p: { eli5: 'a', range: [0, 1], from: () => 'z' } } }), /finite number/, 'from returns a string');
ok(paramsOf(B) === null && refreshParams(B, 1 / 60) === null, 'a scene without params gets null');

// identity: exactly from(view) while unrouted
MS.bass = 0.37; MS.high = 0.2; MS.tension = 0.6;
const V = refreshParams(A, 1 / 60);
ok(V === paramsOf(A), 'the value object is the scene\'s, refreshed in place');
ok(V.sharp === MS.bass && V.width === 3.2 * (1 + 0.25 * 0.6 - 0.1 * 0.2) && V.fixed === 2.5, 'unrouted values = from(MS) exactly: ' + JSON.stringify(V));
ok(PROUTE.n === 0 && Object.keys(PROUTES).length === 0, 'no param routes');
// a v0.4 field route feeds from()
setRoute(A, 'bass', { src: 'high', k: 2 });
refreshRoutes(1 / 60);
ok(refreshParams(A, 1 / 60).sharp === 0.4, 'a field route (bass ← high*2 = 0.4) feeds from(view): ' + paramsOf(A).sharp);
clearRoutes();
ok(refreshParams(A, 1 / 60).sharp === 0.37, 'and MS again once cleared');

// param routes: the transfer in the unit interval, the range scales it
ok(setParam(A, 'width', { src: 'bass' }).k === 1, 'set returns the normalised spec');
ok(PROUTE.n === 1 && PROUTES.alpha.width.src === 'bass', 'PROUTES filled');
ok(Math.abs(refreshParams(A, 1 / 60).width - (0.5 + 3.5 * 0.37)) < 1e-12, 'width ← bass: lo + (hi−lo)·bass = ' + paramsOf(A).width);
ok(paramsOf(A).sharp === 0.37, 'the other parameter stays derived');
ok(derived(A, 'width') === 3.2 * (1 + 0.25 * 0.6 - 0.1 * 0.2), 'derived() = from(view) while routed');
setParam(A, 'width', { src: 'bass', k: 2, b: -0.5, inv: true });
ok(Math.abs(refreshParams(A, 1 / 60).width - (0.5 + 3.5 * Math.min(1, Math.max(0, 2 * (1 - 0.37) - 0.5)))) < 1e-12, 'k, b, inv on a level');
setParam(A, 'width', { src: 'bass', k: 9 });
ok(refreshParams(A, 1 / 60).width === 4, 'clamped to hi');
setParam(A, 'width', { src: 'bass', k: -9 });
ok(refreshParams(A, 1 / 60).width === 0.5, 'clamped to lo');
ok(paramU({ src: 'bass', k: 1, b: 0, inv: false }) === 0.37 && isNaN(paramU({ src: 'const', c: 1 })), 'paramU');
// raw and angle sources
MS.rms = 0.3; setParam(A, 'sharp', { src: 'rms', k: 2 }); // rms is a raw field (centroid is a level)
ok(Math.abs(refreshParams(A, 1 / 60).sharp - 0.6) < 1e-12, 'a raw source through k: ' + paramsOf(A).sharp);
setParam(A, 'sharp', { src: 'rms', inv: true, b: 1 });
ok(Math.abs(refreshParams(A, 1 / 60).sharp - 0.7) < 1e-12, 'inv on raw = −x: ' + paramsOf(A).sharp);
// an event source: 1 on its frame, else 0; with tau a decaying pulse
setParam(A, 'sharp', { src: 'onset', tau: 0.5 });
MS.onset = true; refreshParams(A, 1 / 60);
ok(paramsOf(A).sharp === 1, 'event frame: snaps to hi (first frame snaps)');
MS.onset = false; refreshParams(A, 1 / 60);
ok(Math.abs(paramsOf(A).sharp - ema(1, 0, 1 / 60, 0.5)) < 1e-12, 'then decays by the util ema: ' + paramsOf(A).sharp);
setParam(A, 'sharp', { src: 'onset', inv: true });
ok(refreshParams(A, 1 / 60).sharp === 1, 'inv on an event: 1 while it is not firing');
// constants in the parameter's units, clamped to the range, no transfer
setParam(A, 'width', { src: 'const', c: 2.2 });
ok(refreshParams(A, 1 / 60).width === 2.2, 'a constant in parameter units');
setParam(A, 'width', { src: 'const', c: 9 });
ok(refreshParams(A, 1 / 60).width === 4, 'a constant clamped to the range');
throws(() => setParam(A, 'width', { src: 'const', c: 1, k: 2 }), /no transfer/, 'a constant with k');
throws(() => setParam(A, 'width', { src: 'chroma' }), /cannot feed/, 'a vector source');
throws(() => setParam(A, 'width', { src: 'nope' }), /cannot feed/, 'an unknown source');
throws(() => setParam(A, 'nope', { src: 'bass' }), /declares no parameter/, 'an unknown parameter');
throws(() => setParam('gamma', 'width', { src: 'bass' }), /no scene/, 'an unknown scene');
throws(() => setParam(A, 'width', { src: 'bass', tau: -1 }), /tau/, 'a negative tau');
throws(() => setParam(B, 'width', { src: 'bass' }), /declares no parameter/, 'a scene without params');
ok(checkParam(A, 'width', null) === null, 'null clears');
setParam(A, 'width', null);
ok(!PROUTES.alpha.width && PROUTE.n === 1, 'cleared one, one left');
clearParams(A);
ok(PROUTE.n === 0 && !PROUTES.alpha, 'cleared the scene');
ok(refreshParams(A, 1 / 60).sharp === MS.bass, 'identity again after clearing');
ok(paramSources().includes('bass') && paramSources().includes('onset') && paramSources().includes('centroid') && !paramSources().includes('chroma') && paramSources().at(-1) === 'const', 'paramSources: levels, events, raw, no vectors, const last');

// grammar (route.js's) and the preset block
applyParams('alpha.sharp=centroid*1.5+0.1~0.2!,alpha.width=c:2.2');
ok(PROUTE.n === 2 && PROUTES.alpha.sharp.k === 1.5 && PROUTES.alpha.sharp.inv && PROUTES.alpha.width.c === 2.2, 'applyParams');
ok(paramsString() === 'alpha.sharp=centroid*1.5+0.1~0.2!,alpha.width=c:2.2', 'paramsString round-trip: ' + paramsString());
throws(() => applyParams('alpha.sharp=bass,alpha.nope=bass'), /declares no parameter/, 'all-or-nothing: a bad one throws');
ok(PROUTE.n === 2 && PROUTES.alpha.sharp.src === 'centroid', 'and nothing was applied');
const j = JSON.parse(routesJSON());
ok(j.params && j.params.alpha.sharp.src === 'centroid' && j.params.alpha.width.c === 2.2, 'the preset carries a params block');
clearParams();
loadRoutes(j);
ok(PROUTE.n === 2 && PROUTES.alpha.sharp.tau === 0.2, 'loadRoutes restores the params block');
throws(() => BLOCKS.params.set({ alpha: { nope: { src: 'bass' } } }), /declares no parameter/, 'a bad block throws');
ok(PROUTE.n === 2, 'and leaves the routes in force');
clearParams();

console.log(`param-smoke: ${n} checks, ${fails} fail`);
process.exit(fails ? 1 : 0);

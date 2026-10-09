// Manual-override smoke (v0.4, node, no DOM): the five post params (fb.advect since §105), the merge over a scene's post (identity when nothing is
// set, nested fn slots resolved against a routed view), the &post= grammar, the preset block. usage: node tools/manual-smoke.js
import { MS } from '../assets/engine/state.js';
import { SC, REG, register, addTransition, postParams, MANUAL_POST } from '../assets/core/scenes.js';
import { MANUAL, manual, setPost, clearPost, applyPosts, postString, POST_PARAMS } from '../assets/core/manual.js';
import { setRoute, clearRoutes, routesJSON, loadRoutes } from '../assets/core/route.js';

let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log('FAIL', m); } };
const throws = (fn, re, m) => { let e = null; try { fn(); } catch (x) { e = x; } ok(e && re.test(e.message), m + ' should throw ' + re + (e ? ' — got: ' + e.message : ' — did not throw')); };

const POST_A = { fb: { decay: (S) => 0.5 + 0.2 * S.eM }, bloom: { thr: 0.35 }, kaleido: 1 };
const A = { name: 'alpha', id: 7, feats: ['eM', 'bass'], score: () => 0, init() {}, update() {}, draw() {}, post: POST_A, colour: { default: 'v2', variants: { v2: {}, oklch: { post: { bloom: { thr: 0.6 } } } } } };
const B = { name: 'beta', id: 8, feats: ['bass'], score: () => 0, init() {}, update() {}, draw() {}, post: (S) => ({ fb: { decay: 0.9 }, bloom: { thr: 0.3 + S.bass }, kaleido: 0, exposure: { on: true } }) };
register(A); register(B);
addTransition({ name: 't1', init() {}, run() {} }, {});
addTransition({ name: 't2', init() {}, run() {} }, {});
SC.cur = 7; SC.next = -1;
MS.eM = 0.5; MS.bass = 0.2;

// identity: nothing set → the scene's own post object, untouched
ok(postParams(MS) === POST_A, 'postParams returns the scene\'s own post object when nothing is set');
ok(postParams(MS).fb.decay(MS) === 0.6, 'nested fn kept for the effect');
ok(POST_PARAMS.join() === 'bloom.thr,fb.decay,fb.advect,kaleido,exposure.on', 'the five params (fb.advect since §105)');
ok(MANUAL.post === MANUAL_POST, 'MANUAL.post is scenes.js MANUAL_POST');

// the four params, set / clear, merge
ok(setPost('alpha', 'bloom.thr', 2) === 2, 'setPost returns the value');
let p = postParams(MS);
ok(p !== POST_A && p.bloom.thr === 2 && p.kaleido === 1 && p.fb === POST_A.fb, 'merge: bloom.thr over, kaleido and fb untouched');
setPost('alpha', 'fb.decay', 0.1); setPost('alpha', 'kaleido', 0); setPost('alpha', 'exposure.on', 1);
p = postParams(MS);
ok(p.fb.decay === 0.1 && p.kaleido === 0 && p.exposure.on === true && p.bloom.thr === 2, 'all four merged (' + JSON.stringify(p) + ')');
ok(postString() === 'alpha.bloom.thr=2,alpha.fb.decay=0.1,alpha.kaleido=0,alpha.exposure.on=1', 'postString ' + postString());
setPost('alpha', 'fb.advect', 0); ok(postParams(MS).fb.advect === 0 && postParams(MS).fb.decay === 0.1, 'fb.advect merges beside fb.decay'); setPost('alpha', 'fb.advect', null);
ok(postParams(MS).fb.advect === undefined && postParams(MS).fb.decay === 0.1, 'fb.advect cleared, fb.decay stays');
setPost('alpha', 'bloom.thr', null);
ok(postParams(MS).bloom.thr === 0.35 && !('bloom' in MANUAL_POST.alpha), 'clear one param → the scene\'s value, the key gone');
setPost('alpha', 'exposure.on', '0'); ok(postParams(MS).exposure.on === false, "exposure.on '0' → false");
clearPost('alpha');
ok(postParams(MS) === POST_A && MANUAL_POST.alpha === undefined, 'clearPost → identity again');
throws(() => setPost('alpha', 'bloom.k', 1), /not one of/, 'unknown param');
throws(() => setPost('gamma', 'kaleido', 1), /no scene named/, 'unknown scene');
throws(() => setPost('alpha', 'kaleido', 'x'), /finite/, 'non-number');

// a colour variant's post, then the manual over it
A.colour.cur = 'oklch'; ok(postParams(MS).bloom.thr === 0.6, 'the variant\'s post');
setPost('alpha', 'bloom.thr', 0.9); ok(postParams(MS).bloom.thr === 0.9, 'manual over the variant\'s post'); clearPost(); A.colour.cur = 'v2';

// a post fn scene: resolved against the view, then merged
SC.cur = 8;
ok(postParams(MS).bloom.thr === 0.5, 'post fn(MS)');
setRoute('beta', 'bass', { src: 'const', c: 0.4 });
ok(postParams(MS).bloom.thr === 0.7, 'post fn reads the routed view');
setPost('beta', 'bloom.thr', 0.1); ok(postParams(MS).bloom.thr === 0.1 && postParams(MS).kaleido === 0, 'manual over a post fn'); clearPost();
clearRoutes();
// a nested fn slot resolved against the view while routed (the effect would otherwise call it with the real MS)
SC.cur = 7; setRoute('alpha', 'eM', { src: 'const', c: 1 });
p = postParams(MS);
ok(typeof p.fb.decay === 'number' && Math.abs(p.fb.decay - 0.7) < 1e-12 && p.bloom.thr === 0.35, 'nested fn resolved against the view (' + p.fb.decay + ')');
clearRoutes(); ok(postParams(MS) === POST_A, 'unrouted again → identity');

// scene / trans / colour through MANUAL and manual()
ok(MANUAL.scene === -1 && MANUAL.trans === 't1', 'live views: forced −1, first transition');
manual('scene', 8); ok(SC.forced === 8 && MANUAL.scene === 8, 'manual scene = SC.forced');
manual('scene', null); ok(SC.forced === -1, 'null → auto');
throws(() => manual('scene', 99), /no scene id/, 'unknown id');
manual('trans', 't2'); ok(MANUAL.trans === 't2', 'manual trans');
throws(() => manual('trans', 'nope'), /not registered/, 'unknown transition');
ok(manual('colour', 'alpha', 'oklch') === 'oklch' && A.colour.cur === 'oklch' && MANUAL.colour.alpha === 'oklch', 'manual colour per scene');
throws(() => manual('colour', 'beta', 'oklch'), /no colour variant/, 'a scene without the variant');
throws(() => manual('colour', 'alpha', 'nope'), /no colour variant/, 'unknown variant');
throws(() => manual('what', 1), /unknown target/, 'unknown target');
A.colour.cur = 'v2';

// the &post= grammar (all-or-nothing)
applyPosts('alpha.bloom.thr=0.3,beta.kaleido=0,beta.exposure.on=false,alpha.fb.decay=5e-1');
ok(MANUAL_POST.alpha.bloom.thr === 0.3 && MANUAL_POST.beta.kaleido === 0 && MANUAL_POST.beta.exposure.on === false && MANUAL_POST.alpha.fb.decay === 0.5, 'applyPosts');
ok(postString() === 'alpha.bloom.thr=0.3,alpha.fb.decay=0.5,beta.kaleido=0,beta.exposure.on=0', 'postString ' + postString());
throws(() => applyPosts('alpha.bloom.thr=0.4,gamma.kaleido=1'), /no scene named/, 'a bad one in a list');
ok(MANUAL_POST.alpha.bloom.thr === 0.3, 'and nothing of the list applied');
throws(() => applyPosts('alpha.bloom=0.4'), /cannot parse/, 'bad path');
applyPosts('beta.fb.advect=0.5'); ok(MANUAL_POST.beta.fb.advect === 0.5, '&post= parses fb.advect'); setPost('beta', 'fb.advect', null);

// the preset block through routesJSON / loadRoutes
manual('scene', 7); manual('trans', 't1'); manual('colour', 'alpha', 'oklch');
const j = routesJSON(), o = JSON.parse(j);
ok(o.manual.scene === 7 && o.manual.trans === 't1' && o.manual.colour.alpha === 'oklch' && o.manual.post.beta.kaleido === 0, 'routesJSON carries the manual block');
clearPost(); manual('scene', null); manual('trans', 't2'); A.colour.cur = 'v2';
loadRoutes(j);
ok(SC.forced === 7 && MANUAL.trans === 't1' && A.colour.cur === 'oklch' && postString() === 'alpha.bloom.thr=0.3,alpha.fb.decay=0.5,beta.kaleido=0,beta.exposure.on=0', 'loadRoutes restores it');
throws(() => loadRoutes('{"manual":{"post":{"alpha":{"bloom":{"k":1}}}}}'), /unknown post param/, 'a bad block throws');
ok(postString() === 'alpha.bloom.thr=0.3,alpha.fb.decay=0.5,beta.kaleido=0,beta.exposure.on=0', 'and the overrides in force stayed');
loadRoutes('{"routes":{}}'); ok(postString() === 'alpha.bloom.thr=0.3,alpha.fb.decay=0.5,beta.kaleido=0,beta.exposure.on=0' && SC.forced === 7, 'a preset without a manual block leaves the manual alone');
loadRoutes('{"manual":{"post":{}}}'); ok(postString() === '', 'an empty post block clears the overrides');
clearPost(); manual('scene', null); A.colour.cur = 'v2';
ok(REG[7] && REG[8], 'ids 7/8 were free');

console.log(`manual smoke: ${n} checks · ${fails} fail`);
process.exit(fails ? 1 : 0);

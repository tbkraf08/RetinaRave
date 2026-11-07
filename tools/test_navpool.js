// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// NAVPOOL (DECISIONS §149) — the node smoke of NAV3's dancing set with FLUID2's pool inside it. (1) the files the pool leaves untouched
// are byte copies of nav3/'s; (2) the registration (id 7, key 8, forced-only, no shared-substrate slot since unit 2, the np* hooks, none another scene owns);
// (3) every uniform the pool adds is declared and fetched; (4) the stirring (pool.js) on a fake fluid: on screen it splats inside the
// frame along the critical orbit, never more than ORB_MAX a frame from the orbit, a kick bursts, a drop rings; off screen it never splats;
// (5) unit 2, the set's edge as the wall: the scene's own solver (pool-sim.js) — the core's tier tables and pass order, the mask is the
// Julia escape test with the picture's uniforms, Neumann pressure at the wall, the wall's velocity from the mask's change, no core import.
// node tools/test_navpool.js
import fs from 'node:fs';
import scene from '../assets/scenes/navpool/index.js';
import nav3 from '../assets/scenes/nav3/index.js';
import { POOL, PK, stepPool } from '../assets/scenes/navpool/pool.js';
import { SIM, KS } from '../assets/scenes/navpool/pool-sim.js';
import { ROLL, idleGate } from '../assets/scenes/navpool/knobs.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } else console.log('  ok   ' + m); };
const rd = (d, f) => fs.readFileSync('assets/scenes/' + d + '/' + f);

console.log('1. the byte copies (the files the pool does not touch)');
for (const f of ['move2.js', 'green.js', 'shaders.js'])   // as test_nav3.js pins nav3's against nav2's; implode.js / look2.js are copies too but NAV3 is still being tuned; nav.js / knobs.js diverged for the silence idle (§149: idleGate) ok(rd('nav3', f).equals(rd('navpool', f)), `navpool/${f} is a byte copy of nav3/${f}`);

console.log('2. the registration');
ok(scene.name === 'navpool' && scene.id === 7 && nav3.id === 6, `name ${scene.name} id ${scene.id} (key 8); nav3 still id 6`);
ok(scene.home === false && scene.always === false, 'home false, always false');
ok(scene.score({ buildLive: 1 }) === 0 && scene.score({}) === 0, 'score() 0 (forced-only, out of the director rotation)');
ok(scene.fluid === undefined, 'no `fluid` slot (unit 2: its pool is its own solver; the shared substrate idles under it)');
ok(scene.card && scene.card.title === 'NAVPOOL' && scene.card.blurb.length > 0, 'card NAVPOOL with a blurb');
ok(scene.state !== nav3.state && scene.rt.label === 'navpool', 'its own NAV object (not nav3\'s), rt.label navpool');
const H = Object.keys(scene.hooks), H3 = Object.keys(nav3.hooks);
ok(H.every((k) => !H3.includes(k)), 'no hook name shared with nav3 (hooks are global by name): ' + H.join(' '));
ok(['nproll', 'npinfo', 'greenp', 'babyp', 'npkey', 'nppin', 'npwall', 'npsim'].every((k) => typeof scene.hooks[k] === 'function') && scene.hooks.npkey !== scene.hooks.nppin, 'hooks nproll / npinfo / greenp / babyp + npkey (the hue-drift knob) and nppin (the key pin), distinct');
{
  const src = fs.readFileSync('assets/scenes/navpool/index.js', 'utf8'), hb = src.slice(src.indexOf('  hooks: {'), src.indexOf('  help: {'));
  const keys = [...hb.matchAll(/^ {4}(\w+):/gm)].map((m) => m[1]).filter((k) => k !== 'hooks'), dup = keys.filter((k, i) => keys.indexOf(k) !== i);
  ok(dup.length === 0 && keys.length === Object.keys(scene.hooks).length, `the hooks literal has no duplicate key (${keys.length} keys${dup.length ? ', dup ' + dup.join(' ') : ''})`);
}
ok(Object.keys(scene.help.feats).every((k) => scene.feats.includes(k)) && scene.feats.every((k) => k in scene.help.feats), 'help.feats ⊆ feats and a line for every feats entry');
ok(['pool', 'trace', 'relief', 'spec', 'stir'].every((k) => k in scene.params) && scene.params.trace.from() === 0.25, 'params pool / trace (.25) / relief / spec / stir');
ok(scene.post.fb.advect === undefined || scene.post.fb.advect === 0, 'post.fb.advect 0 (nav3\'s trail)');

console.log('3. the uniforms the pool adds are declared and fetched');
{
  const sh = rd('navpool', 'shaders-v2.js').toString(), ix = rd('navpool', 'index.js').toString();
  ok(!/engineTex\s*\.\s*(dye|vel)/.test(fs.readdirSync('assets/scenes/navpool').map((f) => rd('navpool', f).toString()).join('\n')), 'no engineTex.dye / .vel anywhere in the folder');
  for (const u of ['uDye', 'uDyeTexel', 'uPool']) ok(new RegExp('uniform \\w+ ' + u + ';').test(sh) && ix.includes('\'' + u + '\''), `${u} declared in shaders-v2.js and fetched in index.js`);
  ok(/poolSh\(vUv\);col\*=uPool\.w/.test(sh) && /col\+=pc\*pk/.test(sh), 'the interior is the pool over uPool.w × the old interior');
  ok(/'juliap-v2'/.test(ix) && /'mandelp-v2'/.test(ix) && /'ptp'/.test(ix), 'program names juliap-v2 / mandelp-v2 / ptp');
}

console.log('4. the stirring on a fake fluid');
const Q = [];
const F = { on: true, params: { radius: 0.0025 }, floor: [0, 0, 0], splat: (x, y, dx, dy, rgb, r) => Q.push({ x, y, dx, dy, rgb, r }) };
const S = { presence: 1, kickEvt: false, kickAmp: 0, dropLiveEvt: false, mapDropEvt: false, shiftEvt: false };
const SC = { cur: 7, next: -1, m: 0 }, V = [0, 0, 1.42, 0.3], c = [-0.12, 0.65];
let maxOrb = 0, inFrame = true, finite = true;
for (let f = 0; f < 600; f++) {
  S.kickEvt = f % 30 === 0;
  S.kickAmp = 0.8;
  Q.length = 0;
  stepPool(1 / 60, S, SC, 7, F, c, V, 16 / 9, 0.4, 0.6);
  maxOrb = Math.max(maxOrb, Q.length);
  for (const s of Q) {
    if (!(s.x > 0 && s.x < 1 && s.y > 0 && s.y < 1)) inFrame = false;
    if (![s.x, s.y, s.dx, s.dy, ...s.rgb, s.r].every(Number.isFinite)) finite = false;
  }
}
ok(POOL.total > 300 && POOL.kicks === 20, `on screen: ${POOL.total} splats in 10 s, ${POOL.kicks} kicks`);
ok(maxOrb <= PK.ORB_MAX, `at most ${PK.ORB_MAX} orbit splats a frame (max ${maxOrb})`);
ok(inFrame && finite, 'every splat inside the frame, finite');
Q.length = 0;
S.kickEvt = false;
S.dropLiveEvt = true;
stepPool(1 / 60, S, SC, 7, F, c, V, 16 / 9, 0.4, 0.6);
ok(Q.length >= PK.RING_N && POOL.ring === 1, `the drop rings: ${Q.length} splats`);
S.dropLiveEvt = false;
const t0 = POOL.total;
for (let f = 0; f < 60; f++) stepPool(1 / 60, S, { cur: 6, next: -1, m: 0 }, 7, F, c, V, 16 / 9, 0.4, 0.6);
ok(POOL.total === t0 && POOL.vis === 0, 'off screen: no splat (the pool is one under every scene)');
F.on = false;
for (let f = 0; f < 60; f++) stepPool(1 / 60, S, SC, 7, F, c, V, 16 / 9, 0.4, 0.6);
ok(POOL.total === t0 && POOL.on === 0, 'substrate off: no splat');

ok(F.floor.every(Number.isFinite) && F.floor.some((x) => x > 0), 'the ink floor is set on screen (the mid band, × presence)');

console.log('5. unit 2: the scene\'s own solver, the set\'s edge its wall');
{
  const sim = rd('navpool', 'pool-sim.js').toString(), sh = rd('navpool', 'pool-shaders.js').toString(), ix = rd('navpool', 'index.js').toString();
  ok(!/from '[^']*core\//.test(sim + sh), 'pool-sim.js / pool-shaders.js import nothing from core');
  ok(KS.SIM.join() === '64,96,128,128' && KS.DYE.join() === '256,384,512,512' && KS.ITER.join() === '10,14,20,20', 'the core\'s tier tables (sim, dye, Jacobi sweeps)');
  const order = ['P.mask', 'P.splat', 'P.curl', 'P.vort', 'P.wallv', 'P.div', 'P.jacobi', 'P.grad', 'P.advect'].map((k) => sim.indexOf('pass(' + k));
  ok(order.every((x, i) => x > 0 && (i === 0 || x > order[i - 1])), 'step order: mask → splat → curl → vort → wall → div → Jacobi → grad → advect');
  ok(/stepSim\(\{ c: N\.c, view: N\.view, it, itLo/.test(ix), 'the mask is drawn with the picture\'s own c / view / budgets / chart');
  const mk = sh.slice(sh.indexOf('export const MASK'), sh.indexOf('export const SPLAT'));
  ok(['uC', 'uView', 'uIter', 'uIterLo', 'uLam', 'uZs', 'uEps2'].every((u) => new RegExp('uniform \\w+ ' + u + ';').test(mk) && sim.includes("'" + u + "'")), 'MASK declares and is fed uC uView uIter uIterLo uLam uZs uEps2');
  ok(sh.includes('float pn(vec2 q,float c){return texture(uM,q).x>WALL?texture(uP,q).x:c;}'), 'Neumann at the wall: a solid neighbour\'s pressure reads the centre');
  ok(sh.includes('-(m-texture(uMp,vUv).x)') && KS.WALL_K === 1, 'the wall moves at the mask\'s own change (WALL_K 1)');
  ok(SIM.qn === 0 && typeof SIM.splat === 'function' && SIM.dye === null, 'SIM before init: no queue, no dye target (node)');
  SIM.splat(0.5, 0.5, 0, 0, [1, 0, 0]);
  SIM.splat(0.4, 0.5, 0, 0, [0, 1, 0]);
  const o0 = SIM.queue[0];
  SIM.qn = 0;
  SIM.splat(0.3, 0.5, 0, 0, [0, 0, 1]);
  ok(SIM.queue[0] === o0 && SIM.queue[0].b === 1 && SIM.qn === 1, 'the splat queue reuses its objects (no allocation per splat)');
  SIM.qn = 0;
  ok(/stepSim\(\{[^\n]*\n\s*const pr = this\.colour/.test(ix), 'the solver steps BEFORE the Julia pass (the mask and the picture share the frame)');
  ok(sh.includes('return a+(1.-ws)*own;') && KS.SQUEEZE === 1 && KS.INK_CAP > 0, 'the dye is conservative at the wall: solid taps read the texel\'s own ink, the swept ink lands on the rim (SQUEEZE 1), capped');
}

console.log('6. silence idles the pool\'s confinement and the dance (§149: knobs.js idleGate)');
{
  const sim = rd('navpool', 'pool-sim.js').toString(), ix = rd('navpool', 'index.js').toString(), nv = rd('navpool', 'nav.js').toString();
  ok(Number.isFinite(ROLL.IDLE_W) && ROLL.IDLE_W > 0, `ROLL.IDLE_W ${ROLL.IDLE_W} finite > 0`);
  ok(idleGate(ROLL.IDLE + ROLL.IDLE_W) === 1 && idleGate(0.5) === 1 && idleGate(1) === 1, 'idleGate === 1 (strict) at IDLE + IDLE_W, .5, 1: the identity under music');
  ok(idleGate(ROLL.IDLE) === 0 && idleGate(0) === 0, 'idleGate === 0 at IDLE and 0');
  ok(idleGate(NaN) === 1 && idleGate(undefined) === 1 && idleGate(Infinity) === 1, 'idleGate of a non-finite presence is 1 (uCurlK never NaN)');
  let mono = true;
  for (let i = 1; i <= 100; i++) if (idleGate(i / 100) < idleGate((i - 1) / 100)) mono = false;
  ok(mono, 'idleGate monotone non-decreasing on a 101-point 0..1 sweep');
  ok(KS.CURL === 30 && SIM.gate === 1, `KS.CURL ${KS.CURL} (unchanged), SIM's initial gate ${SIM.gate} (the BENCH / first-draw path uploads 30·1)`);
  ok(sim.includes("gl.uniform1f(pr.u('uCurlK'), KS.CURL * SIM.gate);") && /export function armSim\(dt, on, gate\) \{\n\s*SIM\.gate = gate;/.test(sim) && (sim.match(/SIM\.gate = /g) || []).length === 1, 'uCurlK = KS.CURL × SIM.gate; armSim\'s 3rd argument is the one write');
  ok(ix.includes('armSim(dt, ctx.fluid && ctx.fluid.on, idleGate(S.presence));') && (ix.match(/armSim\(/g) || []).length === 1, 'index.js passes idleGate(S.presence) unconditionally (one call)');
  ok(nv.includes('idleGate(S.presence)') && nv.includes('N.turn += ps * g * DANCE.TURN') && nv.includes('ps * (g * DANCE.SWAY * Math.sin(') && nv.includes('ROLL.BREATH * M2.breath * N.g') && nv.includes('ema(N.cLo, c0, dt * g, SWELL.CENT_TAU)') && nv.includes('ema(N.cHi, c0, dt * g, SWELL.CENT_TAU)') && nv.indexOf('idleGate(S.presence)') < nv.indexOf('ema(N.cLo, c0, dt * g'), 'nav.js gates the bar turn, the sway, the breath as read and the centroid\'s running range by idleGate (g computed before its first use)');
  const I = scene.hooks.npinfo();
  ok('g' in I && 'breathG' in I && 'breath' in I && 'trapA' in I, 'npinfo exposes g / breathG / breath / trapA (read-only)');
}

console.log(fails ? `test_navpool: ${fails} FAIL` : 'test_navpool: all ok');
process.exit(fails ? 1 : 0);
